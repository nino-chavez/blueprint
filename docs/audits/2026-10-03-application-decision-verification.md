# Human decisions bind to the exact application and review

Verification record: implemented and tested locally before source publication.
The user subsequently authorized push and merge on October 3, 2026. This adds
the host verification interface. It does not install a chat authentication
provider or activate an Aisles phase gate.

An approval must identify the document version, review version, person, role,
and permitted action. The new decision library checks those bindings against a
fresh decision from a trusted host. It rejects mismatches, expired or revoked
decisions, and changes made while the host answers. A verified decision still
leaves application readiness pending and grants no action by itself.

## The host owns proof of who made the decision

The research contract already delegates authority to a host callback. Existing
review-loop submissions are explicitly untrusted observations; they cannot
supply that callback or authenticate a person. The new library preserves this
boundary. It never discovers a provider in YAML, imports one from a project
path, or reads an approval file as authority.

| Candidate | Check against the current system | Decision |
|---|---|---|
| Trust a local receipt or exported chat role | Project files can be authored by an agent. The desktop chat lookup returns message text and IDs, without direct-human origin evidence. | Reject. |
| Add signing keys and a decision service | No protected host signer is installed. A key available to the agent would not establish a human decision. | Outside this slice. |
| Require a host-supplied canonical decision lookup | Matches the existing prototype boundary and permits exact matching, freshness and revocation checks. | Select. |

Keep source references and exact fingerprints from the receipt option. Keep the
external trust boundary from the service option. Do not add a signer or claim
that labels such as `userMessage` authenticate a person.

Nino and this chat are the working pilot reviewer/source following the user's
continuation. That identifies where an explicit decision should come from.
It does not prove a specific approval or install its verification mechanism.
Today's “Go” authorizes the implementation work. No application baseline,
concept selection, freeze, or build decision was recorded.

## The request binds source, review, model and method

`applicationDecisionRequest` reads the existing document inspector and selected
stage model. It binds their fingerprints, the exact stage/phase, draft-definition
review kind, and concepts action. The selected phase must own the
`application-definition-source` check. The trusted host supplies its expected
provider, actor, role and method hash, plus the current substantive review's
input hash, method hash and completion time.

Those review fields bind a decision to a review. They do not establish that the
review passed or was substantively adequate. The host must derive them from the
current review evidence. This API does not read arbitrary reviewer receipts.

`inspectApplicationDecision` asks the host for the current canonical decision by
ID on every call. The host authenticates the account and direct-human origin
before returning a record. The library checks its version, source record and
revision, identity, role, scope, action, fingerprint, chronology and expiry.
Revoked and superseded decisions refuse. Host failures and bounded lookup
timeouts refuse. Source, model and host-policy changes during lookup refuse.

Only a draft-definition review for concepts is supported. Selection, freeze,
and build need their own candidate/baseline bindings and remain unimplemented.
Even a matching decision returns `state: pending` and `allowed_actions: []`.
The existing source phase remains blocked; this API does not complete it.

## The current chat API cannot provide the missing authentication

A live desktop `read_thread` call returned this turn's user-message ID, text,
and item type. Its user-message object contained `type`, `id` and `content`.
It did not expose a verified human principal or direct-human origin attestation.
The app also supports agent-sent prompts to other chats. Message placement alone
therefore does not distinguish a person from an agent.

Operator's dispatch receipt records routing and execution evidence for a worker.
It does not authenticate a product decision. No supported decision provider was
found in the checked Blueprint, Operator and exposed desktop interfaces. This is
a scoped finding about those interfaces, not a claim about every possible host.

A real provider must supply authenticated provenance and current revocation
state through its own trusted channel. An unrestricted caller can inject a
lying callback; this library is not a sandbox against that caller. There is no
CLI switch that turns the synthetic test host into a real approval source.

## Verification

The first test run failed because the decision API did not exist. After its
implementation, the parent executed the real library against synthetic hosts.
The final focused run passed 31 checks. These cover exact matching, forged local
receipts, absent providers, wrong identity/role/provider, agent-origin messages,
wrong scope/kind/action/fingerprint, revocation and supersession, rejection,
chronology and expiry, malformed records, provider errors/timeouts, current
lookups, model/review/host-method drift, and changes during asynchronous lookup.

A fresh stamp imports the new library. A verified synthetic decision still
leaves the real source phase unable to advance or write stage state. Earlier
source and phase implementation files match their saved baseline hashes.

One independent review flagged an existing selection/freeze phase being accepted
as a definition-review target. The parent reproduced the finding: the new test
failed with “Missing expected exception.” The API now requires the selected
phase to own the definition-source check. The focused controls for existing
selection and freeze phases pass after the fix. This is a structural binding to
the source check, not an inference from a phase's display name.

The review was static: its read-only sandbox denied temporary-fixture creation.
Runtime evidence comes from the parent's tests. Its dispatch receipt requested
Sol/high but contains no observed model or effort, so those remain unverified.
The parent verified the fix with focused tests; no second broad review ran.

`npm run test:core` runs 25 registered steps. `npm run manifest:check` exits 0
with existing human outcomes still pending. `git diff --check` is clean. Local
branch refs are unchanged and main is clean. No consumer was edited or activated.

Receipts, the live host-schema observation, the pilot working choice and the
review report are saved in the ignored research `.local/decision-integration-20261003/`
directory. No real approval was issued, no message was sent externally, and no
secret, host setting, package version, CI configuration or deployment changed.
