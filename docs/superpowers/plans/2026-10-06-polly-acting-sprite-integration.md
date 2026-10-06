# Polly Acting Sprite Integration Plan

## Goal

Integrate the approved 1038x1515 Polly acting sprites without disturbing the device-approved Home idle/smug micro-rig or its blink behavior.

## Locked architecture

- Keep `PollyPerchRig` as the Home neutral/smug subtle-life system.
- Keep `BROW_FOLLOW = 0.33` unchanged.
- Register the new full-pose PNGs separately as acting sprites.
- Use full sprites for strong expressions/reactions.
- Keep point/victory/flight work deferred.

## First proof

1. Add a typed acting-sprite registry for all 13 approved PNGs.
2. Add a deterministic `laugh01 -> laugh02 -> laugh03` sequence.
3. Extend the existing Settings Polly Motion Lab so all 13 sprites can be inspected and the laugh sequence can be played on-device.
4. Include a side-by-side neutral comparison with the existing Home rig so scale/alignment drift is visible before any production remapping.
5. Do not change Hunt/Daily/Home production reaction mapping in this patch.

## Verification

- Every approved PNG path is registered.
- Laugh order is deterministic.
- Existing Home rig source and blink constants are untouched.
- Existing Settings development entry point remains the way to open the viewer.
- `npm run typecheck`, `npm test`, and content quality CI pass on the integration PR.

## Acceptance gate

Pete can open Settings -> Polly Motion Lab on-device, inspect the complete new acting set, play the laugh sequence, and compare the new neutral sprite against the current animated Home rig with no production behavior changed yet.
