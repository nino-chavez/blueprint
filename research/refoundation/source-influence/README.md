# Source-influence experiment

This root-only experiment makes a source's permitted influence explicit. It is
not part of `template/`, the public CLI, or the semantic kernel.

The contract was preregistered in
`research/refoundation/23-adaptive-pilot-promotion-preregistration.md`,
evaluated in
`research/refoundation/24-adaptive-pilot-promotion-results.md`, and retained as
root research by Decision 09.

`blueprint-source-influence/0` defines four roles:

| Role | May influence |
|---|---|
| `definition-input` | definition through verification |
| `prior-art` | research through verification, never original definition |
| `holdout` | post-unseal comparison or challenge only |
| `receipt-only` | verification and operation only |

A holdout requires two exact revisions: the independent baseline and pinned
external source. It also requires a preregistered comparison protocol, exact
unseal decision, status/revision, and contamination disclosure. Artifacts
declare both their initiative phase and whether they precede or follow the
holdout boundary.

Run the fixture:

```sh
node research/refoundation/source-influence/source-influence.mjs \
  research/refoundation/source-influence/fixtures/adaptive-holdout.json
```

Run the adversarial suite:

```sh
node research/refoundation/source-influence/test-source-influence.mjs
```

The linter proves declared influence rules. It cannot prove that an agent never
saw a source through another channel; contamination disclosure and repository
history remain part of the evidence.
