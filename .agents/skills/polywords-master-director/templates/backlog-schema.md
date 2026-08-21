# Canonical Backlog Schema

Use one authoritative backlog.

## Required Fields

- Issue ID: `PW-####`
- Title
- Product area
- Source
- Date discovered
- Project stage
- Evidence
- Finding
- Player impact
- Product impact
- Formal audit failure risk
- Priority: P0-P4
- Confidence: Confirmed / Strong inference / Hypothesis / Unknown
- Recommended action
- Alternatives considered
- Alternatives rejected and why
- What must be preserved
- Effort: XS-XL
- Dependencies
- Acceptance criteria
- Status
- Owner or executor
- Decision record
- Verification evidence
- Regression checks
- Last updated

## Status Values

- Discovered
- Triaged
- Investigating
- Proposed
- Approved
- Implementing
- Verifying
- Locked
- Rejected
- Deferred
- Experimenting
- Reopened
- Killed

## Example

### PW-0001: Swipe result blocks the next decision too long

- Product area: Game feel
- Source: Hunt-session recording
- Project stage: Alpha
- Evidence: Control remains unavailable during the entire result animation.
- Player impact: Rhythm breaks and repeated rounds feel slower than the actual decision-making warrants.
- Product impact: Session fatigue and reduced replayability.
- Formal failure risk: “This takes too long.”
- Priority: P1
- Confidence: Strong inference
- Recommended action: Separate emotional impact from input blocking; restore control after the readable result beat while non-blocking flourish continues.
- What must be preserved: Mastered and Haunted outcome drama.
- Effort: M
- Acceptance criteria:
  - Result is understandable before control returns.
  - Control returns within the approved timing budget.
  - Overlay continuation cannot create double input.
  - Sound, visual, and haptic impact remain synchronized.
- Status: Proposed
