# Browser Legibility Pattern

**Use when:** a Blueprint initiative needs to validate a rendered page or observed interaction.
**Purpose:** make the application inspectable without changing the host's browser policy or another task's session.

## Select the route from its owner

Read the configured host or workspace browser policy first. It chooses the tool for a local preview, an external site, an authenticated session, or a device. Use the project's own test runner for automated suites. A browser screenshot and a passing test establish different things.

If no host policy exists, choose an available tool that can observe the behavior under review. Read that tool's current documentation before using it. Do not install another browser integration simply because an initiative lacks one.

The original May 2026 version of this pattern preferred browse-tool to reduce always-loaded tool schemas. That preference and its historical cost comparison are not a current host routing rule.

## Separate application instances, not login profiles

A worktree isolates source files. Parallel browser tasks also need their own tab or lease, preview hostname, port, and test identity where cookies or data can collide. Declare those values in the dispatch brief before starting work. A browser review of an existing remote page does not require a local server.

Use the persistent profile selected by the host or workspace policy. Do not derive it from a project or worktree name, create a task profile, or reseed a shared profile. Changing a profile can replace login state. Bootability comes from separate application instances, not from copying credentials or browser profiles.

When browse-tool is the configured route, its current README owns its commands and profile behavior. In this workspace that source is `~/Workspace/dev/tools/browse-tool/README.md`. It currently uses a configured persistent profile and tab leases; set the brief's `BROWSE_SESSION` for each independent worker. A distinct hostname is needed for cookie isolation: changing only the port does not separate cookies.

## Validate the observed result

1. Start the project's preview only when needed, using the assigned hostname and port. Confirm the intended source state is being served.
2. Open the assigned page in the selected browser tool and verify the URL before any write.
3. Exercise the changed interaction. Record actual behavior and the state used.
4. Capture the relevant viewport or region. For visual judgment, also inspect the whole screen in its representative state on the target device or viewport.
5. Record the source version, URL, state, expected result, observed result, and unresolved limits. Do not equate HTTP 200 with working UI, or source code with appearance.
6. Close only this task's tabs and stop only its servers. Do not stop the shared browser or modify its profile.

For a browse-tool route, navigation and capture use the assigned session and preview origin:

```text
BROWSE_SESSION=<assigned-session> browse-nav <assigned-page-url> --wait
BROWSE_SESSION=<assigned-session> browse-screenshot --out <receipt-path>.png
```

The commands illustrate that route; they do not override the host's tool choice. Read the current tool README for startup, tab ownership, capture bounds, and cleanup.

## Escalate for an observation the current tool cannot make

Network events, console output, performance traces, computed accessibility trees, and device behavior may require different capabilities. Check what the chosen tool currently supports before adding another. Route any switch through the same host policy. Old tool comparisons are not evidence that a capability is absent today.

Persistent login state belongs to the configured profile. If the required session is missing there, use the host's sign-in route. Copying or reseeding a profile is not a validation step.

Backend observability is project-specific. Add it when the behavior being judged needs logs, metrics, or traces; do not scaffold a separate telemetry stack for a static page by default.

## Origin

The pattern began with the application-legibility section of OpenAI's February 2026 Codex harness engineering discussion and the local browse-tool workflow. This revision preserves observable validation while moving tool and profile selection to their configured owner.
