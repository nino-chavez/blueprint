# Initiative contract — amber

Treat this packet as the governing steering contract for the assessment. The
consumer's legacy files remain available as compatibility/source evidence.

```yaml
schema: blueprint-compact/0
profiles: k1-research-0
initiative: film-room
operator: maintainer
current_charter_revision: 2
intent: Prepare an assisted design-partner beta in which a second operator can install the signed package and reach first value without developer intervention; payment and self-service distribution remain outside the charter.
scope: {product_mode: assisted-design-partner-beta, environment: supported-clean-workstation, assistance: scheduled-operator-support, self_serve: false, commercial_validation: false}

claims:
  founder-live-workflow:
    charter: 1
    requires: observed-task-run by maintainer as operator
  distribution-artifacts-present:
    requires: all-files-exist for the release profile and build/sign/verify programs
  signed-package-inspects-cleanly:
    depends_on: distribution-artifacts-present
    requires: package-inspection of a current signed assisted-beta package
  second-operator-first-value:
    depends_on: signed-package-inspects-cleanly
    requires: observed-task-run by an independent second operator on a supported clean workstation
  actor-output-contract-has-no-blocking-error:
    requires: current actor-output structural gate

checkpoints:
  founder-operated-ready: [founder-live-workflow]
  assisted-beta-ready: [distribution-artifacts-present, signed-package-inspects-cleanly, second-operator-first-value]
  current-actor-output-contract-resolves: [actor-output-contract-has-no-blocking-error]
```

Current derived view at source
`7ed37ae6bb49f72233aacbf16c078c60915b3d85+dirty-c71fd6e72d6b`:

| Boundary | State | Exact reason |
|---|---|---|
| founder live workflow | open | no compatible receipt |
| distribution artifacts | satisfied | four declared files present |
| signed package inspection | open | no compatible package-inspection receipt |
| second-operator first value | open | package-inspection dependency open; no second-operator receipt |
| actor-output structural claim | satisfied | current gate executed with zero blocking errors |
| actor-output manifest view | PENDING | three human-validation obligations pending |

Imported actor-output detail: the boot-packet receipt is stale at the current
source version; portal simulated-walk receipts are incompatible with the human
outcomes they appear beside. Generated state is a view; inspect the consumer
sources before relying on it.
