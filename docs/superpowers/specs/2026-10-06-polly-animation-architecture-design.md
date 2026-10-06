# Polly Hybrid Animation Architecture

Date: 2026-10-06
Status: Locked by Pete
Branch: play-screen-overhaul

## Goal

Create a production animation system that keeps Polly visually identical to the approved master while supporting believable perched life, flight, and strong gameplay reactions in Hunt and Daily.

## Locked Architecture

POLYWORDS will use a hybrid Polly animation system rather than one universal rig.

### 1. Perched Puppet

Use the approved sharp perched Polly master as the absolute visual authority.

Primary uses:
- idle life
- blink, pupil glance, brow motion
- beak/talk/laugh articulation
- crown follow
- small head/body weight shifts
- branch hops/scoots
- ordinary Hunt/Daily reactions while perched

Do not over-rig. Preserve the still image so neutral Polly is visually indistinguishable from the approved master.

### 2. Keyed Flight Cycle

Flight will not be produced by deforming the perched master or by trusting a single AI-generated flight image as the production rig.

Create a normalized keyed flight cycle with the same Polly identity across all keys:
- F1 wing up
- F2 mid/down transition
- F3 wing down
- F4 mid/up return

Optional breakdown frames may be added only if the four-key cycle is not smooth enough.

Across all flight keys, lock:
- head and beak proportions
- crown proportions and jewels
- eye/brow proportions
- torso scale
- bandana/PW scale
- tail scale/color language
- overall character scale and visual center

Use the keyed cycle for entrances, exits, fly-bys and airborne gameplay beats.

### 3. Limited Bespoke Reaction Poses

Use a small number of purpose-built keyed poses only where puppet deformation looks worse than a redraw.

Likely candidates:
- big wiseass laugh
- shocked recoil
- pointing taunt
- angry/Haunted pose

Every bespoke pose must be normalized against the Polly model sheet and must not introduce new character proportions.

## AI Role

AI is an art assistant, not the final character animator.

Use AI for:
- candidate key poses
- hidden-edge reconstruction
- alternate wing positions
- rough reaction concepts

Every generated asset must be compared against the master, corrected, normalized, cleaned, approved, then exported for production.

Do not use unconstrained text-to-video output as a shipping Polly animation source.

## Production Pipeline

Master reference -> model sheet -> key poses / separated parts -> consistency correction -> cleanup -> normalized exports -> in-game timing/motion.

## First Three Proofs

1. Neutral perch life: blink, glance, slight head/crown settle, small weight shift.
2. Flight loop: 4-key cycle with stable character scale and identity.
3. Wiseass laugh: puppet plus limited keyed alternates as needed.

## Technical Direction

Current preferred implementation:
- React Native articulation for subtle perched motion where practical.
- Normalized sprite/frame sequences for flight and extreme keyed reactions.
- Do not add a new animation runtime until these proofs show React Native + frame sequences are insufficient.

## Acceptance Criteria

- Neutral perched Polly is visually indistinguishable from the approved master when still.
- No visible seams during face/head/crown articulation.
- Feet/branch anchor does not drift.
- Flight keys read as the same Polly when flipped rapidly.
- Head/body/crown scale never jumps between flight keys or reaction poses.
- Hunt and Daily can consume the same approved Polly asset families.
- Reduce Motion remains authoritative.
- No production-wide Polly replacement until the three proofs pass on device.
