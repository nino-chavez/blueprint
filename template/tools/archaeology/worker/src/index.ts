/**
 * Archaeology Worker — append-only event log + query surface.
 *
 * Source of truth: docs/methodology/archaeology-substrate-design.md
 *
 * Endpoints:
 *   POST /events        — batched ingest (idempotent by source+source_id+type+source_ts)
 *   GET  /timeline      — event stream for a subject (?subject=<source>:<source_id>)
 *   GET  /derive        — RAG synthesis (?question=...) — stub returning retrieval only
 *   GET  /health        — liveness
 */

interface Env {
  DB: D1Database;
  BLOBS: R2Bucket;
  INDEX: VectorizeIndex;
  AI: Ai;
  ARCHAEOLOGY_INGEST_TOKEN: string;
  ALLOWED_PROJECTS: string;
  ANTHROPIC_API_KEY?: string;   // optional — if set, /derive returns full synthesis
  ANTHROPIC_MODEL?: string;     // optional — defaults to claude-sonnet-4-6
}

interface IncomingEvent {
  project_id: string;
  source: string;
  source_id: string;
  source_ts: string;
  type: string;
  actor?: string;
  payload: unknown;        // serialized to payload_json
  blob_content?: string;   // if set, stored in R2 and referenced via blob_key
  refs?: Array<{ kind: string; target: string }>;
}

const SOURCES = new Set([
  "session", "git", "github", "hive", "adr", "memory",
  // Phase-3 canonical surfaces added after the design doc was written:
  "inputs", "iterations", "audits",
]);

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    try {
      if (req.method === "GET" && url.pathname === "/health") return json({ ok: true });
      if (req.method === "POST" && url.pathname === "/events") return await ingest(req, env);
      if (req.method === "POST" && url.pathname === "/embed")  return await embedBatch(req, env);
      if (req.method === "GET"  && url.pathname === "/embed/stats") return await embedStats(env);
      if (req.method === "GET" && url.pathname === "/timeline") return await timeline(url, env);
      if (req.method === "GET" && url.pathname === "/derive") return await derive(url, env);
      return json({ error: "not_found" }, 404);
    } catch (err) {
      return json({ error: "internal", message: (err as Error).message }, 500);
    }
  },
};

// ---------- /events ----------

async function ingest(req: Request, env: Env): Promise<Response> {
  const token = req.headers.get("X-Archaeology-Token");
  if (!token || token !== env.ARCHAEOLOGY_INGEST_TOKEN) return json({ error: "unauthorized" }, 401);

  const body = (await req.json()) as { events: IncomingEvent[] };
  if (!Array.isArray(body?.events)) return json({ error: "bad_request", message: "events[] required" }, 400);

  const allowed = new Set(env.ALLOWED_PROJECTS.split(",").map((s) => s.trim()));
  const stats = { received: body.events.length, inserted: 0, skipped: 0, errors: 0 };

  for (const ev of body.events) {
    try {
      if (!allowed.has(ev.project_id)) { stats.skipped++; continue; }
      if (!SOURCES.has(ev.source)) { stats.skipped++; continue; }

      const eventId = ulid();
      const ingestTs = new Date().toISOString();

      let blobKey: string | null = null;
      if (ev.blob_content) {
        blobKey = `${ev.project_id}/${ev.source}/${ev.source_id}/${eventId}.json`;
        await env.BLOBS.put(blobKey, ev.blob_content);
      }

      // Idempotent insert — ON CONFLICT IGNORE via the UNIQUE constraint
      const insert = await env.DB
        .prepare(`INSERT INTO events
          (event_id, project_id, source, source_id, source_ts, ingest_ts, type, actor, payload_json, blob_key)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(source, source_id, type, source_ts) DO NOTHING`)
        .bind(eventId, ev.project_id, ev.source, ev.source_id, ev.source_ts, ingestTs,
              ev.type, ev.actor ?? null, JSON.stringify(ev.payload), blobKey)
        .run();

      if (insert.meta.changes === 0) { stats.skipped++; continue; }
      stats.inserted++;

      // Refs land alongside the event
      if (ev.refs?.length) {
        const stmts = ev.refs.map((r) =>
          env.DB.prepare(`INSERT INTO refs (from_event_id, kind, target) VALUES (?, ?, ?)`)
            .bind(eventId, r.kind, r.target));
        await env.DB.batch(stmts);
      }
    } catch (e) {
      stats.errors++;
    }
  }

  return json(stats);
}

// ---------- /timeline ----------

async function timeline(url: URL, env: Env): Promise<Response> {
  const subject = url.searchParams.get("subject");
  if (!subject) return json({ error: "bad_request", message: "?subject= required" }, 400);

  // Two-direction lookup:
  //   1. events whose source+source_id matches the subject
  //   2. events that reference the subject in refs
  const [source, sourceId] = subject.split(":", 2);

  const direct = await env.DB.prepare(
    `SELECT * FROM events WHERE source = ? AND source_id = ? ORDER BY source_ts ASC`)
    .bind(source, sourceId).all();

  const referencing = await env.DB.prepare(
    `SELECT e.* FROM events e
     JOIN refs r ON r.from_event_id = e.event_id
     WHERE r.target = ? ORDER BY e.source_ts ASC`)
    .bind(subject).all();

  return json({
    subject,
    direct_events: direct.results,
    referencing_events: referencing.results,
  });
}

// ---------- /embed ----------

// Event types we embed into Vectorize. Everything else stays in D1 as metadata.
const EMBEDDABLE_TYPES = [
  "user_turn", "assistant_turn",
  "audit_filed",
  "external_input", "gap_declared",
  "decision_logged", "adr_superseded",
];

// bge-base-en-v1.5 has a 512-token input limit; ~3.5 chars/token English avg.
// 1500-char windows with 150-char overlap keep us comfortably under the limit.
const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 150;

function extractText(type: string, payload: any): string {
  // Each event type has a different shape; we pull the human-readable surface area.
  if (type === "user_turn" || type === "assistant_turn") {
    return payload?.text ?? "";
  }
  if (type === "audit_filed") {
    const parts: string[] = [];
    if (payload?.title) parts.push(payload.title);
    if (payload?.category) parts.push(`category: ${payload.category}`);
    if (payload?.excerpt) parts.push(payload.excerpt);
    return parts.join("\n\n");
  }
  if (type === "external_input" || type === "gap_declared") {
    const parts: string[] = [];
    if (payload?.title) parts.push(payload.title);
    if (payload?.category) parts.push(`category: ${payload.category}`);
    if (payload?.included_why) parts.push(`included because: ${payload.included_why}`);
    if (payload?.excluded_why) parts.push(`excluded because: ${payload.excluded_why}`);
    if (payload?.notes) parts.push(payload.notes);
    if (Array.isArray(payload?.influenced) && payload.influenced.length) {
      parts.push(`influenced: ${payload.influenced.join(", ")}`);
    }
    return parts.join("\n\n");
  }
  if (type === "decision_logged") {
    const parts: string[] = [];
    if (payload?.title) parts.push(payload.title);
    if (payload?.lineage) parts.push(`lineage: ${payload.lineage}`);
    if (payload?.proposals_raw) parts.push(`proposals: ${payload.proposals_raw}`);
    return parts.join("\n\n");
  }
  if (type === "adr_superseded") {
    const parts: string[] = [];
    if (payload?.title) parts.push(payload.title);
    if (payload?.proposed) parts.push(`proposed: ${payload.proposed}`);
    if (payload?.ruled_out_because) parts.push(`ruled out because: ${payload.ruled_out_because}`);
    return parts.join("\n\n");
  }
  return "";
}

function chunkText(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return text.trim() ? [text] : [];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

async function embedStats(env: Env): Promise<Response> {
  const pending = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM events WHERE embedded = 0 AND type IN (${EMBEDDABLE_TYPES.map(() => "?").join(",")})`
  ).bind(...EMBEDDABLE_TYPES).first<{ n: number }>();
  const done = await env.DB.prepare(
    `SELECT COUNT(*) AS n, COALESCE(SUM(chunk_count),0) AS chunks FROM events WHERE embedded = 1`
  ).first<{ n: number; chunks: number }>();
  return json({
    pending_events: pending?.n ?? 0,
    embedded_events: done?.n ?? 0,
    chunks_upserted: done?.chunks ?? 0,
  });
}

async function embedBatch(req: Request, env: Env): Promise<Response> {
  const token = req.headers.get("X-Archaeology-Token");
  if (!token || token !== env.ARCHAEOLOGY_INGEST_TOKEN) return json({ error: "unauthorized" }, 401);

  const url = new URL(req.url);
  const batchSize = Math.min(parseInt(url.searchParams.get("batch") ?? "20", 10), 50);

  // Priority order: curated artifacts (inputs/iterations/audits) embed FIRST so
  // /derive becomes useful as early as possible — these are the highest-signal,
  // smallest-volume surfaces. Session turns embed last because they're the bulk
  // and individual turns carry diluted signal vs. a curated audit entry.
  const rows = await env.DB.prepare(
    `SELECT event_id, source, source_id, source_ts, type, payload_json
     FROM events
     WHERE embedded = 0 AND type IN (${EMBEDDABLE_TYPES.map(() => "?").join(",")})
     ORDER BY
       CASE source
         WHEN 'inputs'     THEN 0
         WHEN 'iterations' THEN 1
         WHEN 'audits'     THEN 2
         ELSE 3
       END,
       source_ts ASC
     LIMIT ?`
  ).bind(...EMBEDDABLE_TYPES, batchSize).all();

  const stats = { events_processed: 0, chunks_upserted: 0, events_empty: 0, events_failed: 0 };
  if (!rows.results.length) return json({ ...stats, done: true });

  for (const row of rows.results as any[]) {
    try {
      const payload = JSON.parse(row.payload_json);
      const text = extractText(row.type, payload).trim();
      if (!text) {
        stats.events_empty++;
        await env.DB.prepare(`UPDATE events SET embedded = 1, embedded_at = ?, chunk_count = 0 WHERE event_id = ?`)
          .bind(new Date().toISOString(), row.event_id).run();
        continue;
      }
      const chunks = chunkText(text);
      if (chunks.length === 0) {
        stats.events_empty++;
        await env.DB.prepare(`UPDATE events SET embedded = 1, embedded_at = ?, chunk_count = 0 WHERE event_id = ?`)
          .bind(new Date().toISOString(), row.event_id).run();
        continue;
      }

      // Embed all chunks in one AI call — bge-base-en-v1.5 accepts an array.
      const embedRes = await env.AI.run("@cf/baai/bge-base-en-v1.5", { text: chunks }) as { data: number[][] };
      const vectors = embedRes.data;

      const upserts = vectors.map((vec, idx) => ({
        id: `${row.event_id}:${idx}`,
        values: vec,
        metadata: {
          event_id: row.event_id,
          source: row.source,
          source_id: row.source_id,
          source_ts: row.source_ts,
          type: row.type,
          chunk_idx: idx,
        },
      }));
      await env.INDEX.upsert(upserts);

      await env.DB.prepare(`UPDATE events SET embedded = 1, embedded_at = ?, chunk_count = ? WHERE event_id = ?`)
        .bind(new Date().toISOString(), chunks.length, row.event_id).run();

      stats.events_processed++;
      stats.chunks_upserted += chunks.length;
    } catch (e) {
      stats.events_failed++;
      // Leave embedded=0 so the next batch retries
    }
  }

  return json({ ...stats, done: false });
}

// ---------- /derive ----------

async function derive(url: URL, env: Env): Promise<Response> {
  const question = url.searchParams.get("question");
  if (!question) return json({ error: "bad_request", message: "?question= required" }, 400);

  const topK = Math.min(parseInt(url.searchParams.get("k") ?? "20", 10), 50);

  // Step 1: embed the question
  const embedRes = await env.AI.run("@cf/baai/bge-base-en-v1.5", { text: [question] }) as { data: number[][] };
  const vector = embedRes.data[0];

  // Step 2: Vectorize top-k semantic search. Chunk ids are `<event_id>:<idx>`.
  const matches = await env.INDEX.query(vector, { topK, returnMetadata: true });

  // Step 3: fetch source events for retrieved chunk IDs. Strip the `:idx` suffix
  // because we store per-chunk vectors but want the parent event row from D1.
  const eventIds = Array.from(new Set(matches.matches.map((m) => String(m.id).split(":")[0])));
  let chunkEvents: any[] = [];
  if (eventIds.length) {
    const placeholders = eventIds.map(() => "?").join(",");
    const res = await env.DB.prepare(
      `SELECT event_id, source, source_id, source_ts, type, actor, payload_json
       FROM events WHERE event_id IN (${placeholders})`)
      .bind(...eventIds).all();
    chunkEvents = res.results as any[];
  }

  // Attach the per-match score so the synthesis prompt can weight sources.
  const eventById = new Map(chunkEvents.map((e) => [e.event_id, e]));
  const ranked = matches.matches.map((m) => {
    const eid = String(m.id).split(":")[0];
    return { score: m.score, chunk_id: m.id, event: eventById.get(eid) ?? null };
  }).filter((x) => x.event != null);

  // Step 4: If ANTHROPIC_API_KEY is set, ask Claude to synthesize an answer with
  // citations back to event_ids. Otherwise return retrieval only — the substrate's
  // correctness is already testable from the chunk list.
  if (!env.ANTHROPIC_API_KEY) {
    return json({
      question,
      retrieval: { match_count: matches.matches.length, ranked },
      synthesis: null,
      note: "ANTHROPIC_API_KEY not set; returning retrieval-only. Set the secret via `wrangler secret put ANTHROPIC_API_KEY` to enable synthesis.",
    });
  }

  try {
    const synthesis = await synthesizeWithClaude(question, ranked, env);
    return json({ question, retrieval: { match_count: matches.matches.length, ranked }, synthesis });
  } catch (e) {
    return json({
      question,
      retrieval: { match_count: matches.matches.length, ranked },
      synthesis: null,
      note: `synthesis failed: ${(e as Error).message}`,
    });
  }
}

async function synthesizeWithClaude(
  question: string,
  ranked: Array<{ score: number; chunk_id: string; event: any }>,
  env: Env,
): Promise<{ answer: string; citations: string[]; model: string }> {
  const model = env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

  // Build a citation-friendly source block. Each chunk shows event_id, source, type,
  // ts, and the relevant payload text. The system prompt requires Claude to cite
  // event_ids inline as [E:<id>] so the answer is auditable.
  const sources = ranked.slice(0, 20).map((r, i) => {
    const ev = r.event;
    const payload = JSON.parse(ev.payload_json);
    const text = extractText(ev.type, payload);
    return `[#${i + 1}] event_id=${ev.event_id}
source=${ev.source} type=${ev.type} source_id=${ev.source_id} ts=${ev.source_ts}
score=${r.score.toFixed(3)}
---
${text.slice(0, 1500)}
---`;
  }).join("\n\n");

  const system = `You answer archaeological questions about the bc-subscriptions project by reasoning from a retrieval result of historical events (sessions, ADRs, audits, inputs manifest, iterations register).

Rules:
- Cite every load-bearing claim with [E:<event_id>] inline. event_ids are listed beside each source below.
- If the sources don't answer the question, say so explicitly. Do NOT invent facts.
- Prefer specific source surfaces (file paths, ADR numbers, manifest entry ids, hive issue numbers) over generic prose.
- Keep the answer to 8 sentences or fewer unless the question explicitly asks for depth.
- Conclude with a "Citations:" line listing the event_ids you used, comma-separated.`;

  const user = `Question: ${question}

Retrieved sources (top ${ranked.length}, ordered by semantic score):

${sources}

Answer the question, citing event_ids inline as [E:<id>].`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`anthropic api ${res.status}: ${errBody.slice(0, 300)}`);
  }

  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  const answer = data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");

  // Extract citation event_ids from inline [E:...] markers.
  const citationSet = new Set<string>();
  for (const m of answer.matchAll(/\[E:([0-9A-Z]+)\]/g)) {
    citationSet.add(m[1]);
  }

  return { answer, citations: Array.from(citationSet), model };
}

// ---------- helpers ----------

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// Minimal ULID — Crockford base32, time-sortable. Not cryptographically perfect.
function ulid(): string {
  const enc = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const t = Date.now();
  let time = "";
  let n = t;
  for (let i = 0; i < 10; i++) { time = enc[n % 32] + time; n = Math.floor(n / 32); }
  let rand = "";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  for (let i = 0; i < 16; i++) rand += enc[bytes[i] % 32];
  return time + rand;
}
