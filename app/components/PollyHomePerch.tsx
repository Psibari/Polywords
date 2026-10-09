import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
} from 'react-native';
import {
  PollyHomePoseName,
  POLLY_HOME_Z_ART,
  POLLY_HOME_Z_START_CANVAS,
  homeMasterCanvasToBox,
  pollyHomePoseArt,
  pollyHomePoseUsesRig,
} from '../ui/pollyHomePoses';
import { resolveHomeRestingPose } from '../game/pollyHomeRestingPose';
import { homePerch } from '../ui/pwHomeMaterials';
import { resolveHomePollyMoment } from '../game/pollyMemory';
import {
  derivePollyRelationshipContext,
  resolvePollyRelationshipBeat,
  resolvePollyRelationshipPresentation,
} from '../game/pollyRelationship';
import { resolvePollyLifeProfile } from '../game/pollyLifeProfile';
import { useGameStore } from '../store/useGameStore';
import { useIsFocused } from '@react-navigation/native';
import { usePollyAmbientMotion } from '../hooks/usePollyAmbientMotion';
import { PollyPerchRig, POLLY_PERCH_RIG_ENABLED } from './PollyPerchRig';
import { PollySpeechBubble } from './PollySpeechBubble';

// Once per app session: fly-in + one greeting. Navigating away re-mounts
// Home, but Polly is already at her post — no re-entrance, no re-greeting.
let enteredThisSession = false;

// Idle-screen doze: how long she waits, once still, before nodding off.
const DOZE_DELAY_MS = 8000;
// Matches the entrance greeting's own hideT (4900ms) + fade duration
// (260ms) — an entrance visit's doze clock starts once that bubble is gone.
const GREETING_FADE_END_MS = 5160;
// Reveal + sink from awake to asleep. The sink is what sells it as her
// nodding off rather than two pictures dissolving into each other.
const DOZE_TRANSITION_MS = 450;
const DOZE_SETTLE_Y = 6;
const FIRST_HOME_LINES = [
  'Who are you?',
  'What do you want?',
  'You think you know words?',
  'You don’t look ready.',
] as const;
const FIRST_HOME_LINE_MS = 1450;

type DozeStage = 'awake' | 'dozing' | 'asleep';

// Sleeping Z's (fully asleep only). Small, medium and large leave her head one
// after another, each on its own copy of the same loop started HOME_Z_STAGGER_MS
// after the last, so they stay a third of a cycle apart. Each rises and drifts
// right, growing from HOME_Z_START_SCALE to full size, fading in over the first
// HOME_Z_FADE_IN of the cycle and out from HOME_Z_FADE_OUT_FROM. Tune here.
const HOME_Z_CYCLE_MS = 3600;
const HOME_Z_STAGGER_MS = 1200;
const HOME_Z_RISE = 70;
const HOME_Z_DRIFT = 25;
const HOME_Z_START_SCALE = 0.6;
const HOME_Z_FADE_IN = 0.2;
const HOME_Z_FADE_OUT_FROM = 0.7;
// Size of every Z relative to its natural size on her canvas.
const HOME_Z_SCALE = 1.0;
// Where the Z's leave her head, in the perch box, and their drawn sizes: the
// asleep art's own canvas mapping, so they stay put on her if she is resized.
const HOME_Z_START = homeMasterCanvasToBox(
  POLLY_HOME_Z_START_CANVAS.x,
  POLLY_HOME_Z_START_CANVAS.y,
  homePerch.pollySize,
);
const HOME_Z_LAYERS = POLLY_HOME_Z_ART.map(z => {
  const width = z.width * HOME_Z_START.ptPerPx * HOME_Z_SCALE;
  const height = z.height * HOME_Z_START.ptPerPx * HOME_Z_SCALE;
  // Bottom-left corner on the start point.
  return { source: z.source, width, height, left: HOME_Z_START.x, top: HOME_Z_START.y - height };
});

// Every awake pose gets one stacked layer that stays mounted for the life of
// the perch; only the current pose is visible (opacity 1, the rest 0). Swapping
// by mount/unmount made each switch create a fresh image view, which draws
// empty for a frame or two. To give a new awake pose a layer, add it here.
const HOME_AWAKE_LAYER_POSES: readonly PollyHomePoseName[] = [
  'idle', 'smug', 'fly', 'angry', 'embarrassed',
];
// Poses the face rig draws (idle, smug) share the one rig layer.
const HOME_AWAKE_IMAGE_POSES = HOME_AWAKE_LAYER_POSES.filter(
  p => !(POLLY_PERCH_RIG_ENABLED && pollyHomePoseUsesRig(p)),
);

export default function PollyHomePerch() {
  const memory = useGameStore(s => s.pollyMemory);
  const progress = useGameStore(s => s.progress);
  const rememberLine = useGameStore(s => s.rememberPollyLine);
  const onboardingHome = useGameStore(s => s.onboarding.home);
  const setOnboardingHomeStep = useGameStore(s => s.setOnboardingHomeStep);
  const completeOnboardingHome = useGameStore(s => s.completeOnboardingHome);
  const markOnboardingAbandoned = useGameStore(s => s.markOnboardingAbandoned);
  const isFocused = useIsFocused();
  const firstHomeBeat = !onboardingHome.completed;
  const [wasFirstHomeBeat] = useState(firstHomeBeat);
  const isEntrance = firstHomeBeat || !enteredThisSession;
  // The greeting is chosen once, when the perch loads, and never replaced:
  // no new line and no re-recorded line on later visits.
  const [moment] = useState(() => {
    const context = derivePollyRelationshipContext({
      memory,
      recent: progress.recentHuntPerformance ?? [],
      runsCompleted: progress.runsCompleted,
      masteredCount: progress.masteredWords.length,
      now: Date.now(),
    });
    const relationshipDecision = resolvePollyRelationshipBeat({ context, surface: 'home' });
    const relationshipPresentation = resolvePollyRelationshipPresentation({
      decision: relationshipDecision,
      recentLineIds: memory.recentLineIds,
      lineRoll: Math.random(),
    });
    return relationshipPresentation?.moment ?? resolveHomePollyMoment(memory);
  });
  // The life profile follows the LIVE memory and progress. Home stays mounted
  // under the Hunt (and is not frozen while hidden), so a finished Hunt
  // updates her profile, and with it her resting pose, rig face, breathing and
  // doze delay, while she is out of sight.
  const lifeProfile = useMemo(() => {
    const context = derivePollyRelationshipContext({
      memory,
      recent: progress.recentHuntPerformance ?? [],
      runsCompleted: progress.runsCompleted,
      masteredCount: progress.masteredWords.length,
      now: Date.now(),
    });
    const relationshipDecision = resolvePollyRelationshipBeat({ context, surface: 'home' });
    return resolvePollyLifeProfile({ context, decision: relationshipDecision });
  }, [memory, progress.recentHuntPerformance, progress.runsCompleted, progress.masteredWords.length]);
  const [firstHomeLineIndex, setFirstHomeLineIndex] = useState(() =>
    Math.min(onboardingHome.step, FIRST_HOME_LINES.length - 1)
  );
  // isEntrance flips false the instant the entrance effect below runs, so a
  // later re-render (e.g. the poseT settle) would see the wrong value —
  // freeze it once at mount, same as `moment`.
  const [wasEntrance] = useState(isEntrance);
  const homeCompletedRef = useRef(onboardingHome.completed);
  homeCompletedRef.current = onboardingHome.completed;
  // Same priority as before the master swap: rattled > player win streak >
  // Polly's win streak or cocky > idle (see resolveHomeRestingPose).
  const settledPose = resolveHomeRestingPose({
    lifeProfileName: lifeProfile.name,
    playerWinStreak: memory.playerWinStreak,
    pollyWinStreak: memory.pollyWinStreak,
  });
  const [pose, setPose] = useState<PollyHomePoseName>(
    isEntrance ? 'fly' : settledPose,
  );
  // False only while the entrance is still flying in. Once she has settled,
  // her pose follows settledPose whenever its inputs change (below).
  const entranceSettledRef = useRef(!isEntrance);
  const showRig = POLLY_PERCH_RIG_ENABLED && pollyHomePoseUsesRig(pose);
  const [dozeStage, setDozeStage] = useState<DozeStage>('awake');
  // Mirrors `settledPose` on every render (a plain ref write, not an effect,
  // so there is no lag) so the doze timer — set up once inside an effect
  // keyed on [isFocused, reduceMotion, wasEntrance], not on pose — can read
  // the CURRENT settled look when it finally fires, instead of whatever
  // `pose` was closed over back when that effect last ran (on an entrance
  // visit, that is almost always mid-flight, while pose is still `fly`).
  const settledPoseRef = useRef(settledPose);
  settledPoseRef.current = settledPose;
  // Frozen the instant the doze fade starts, so the fading top layer
  // renders a snapshot rather than reacting to the live `pose`/`showRig`
  // values. A ref, not state: the write must be visible to the very next
  // render synchronously, with no tick where it could still read stale.
  // Null means "no snapshot" — never pre-seeded with a pose.
  const outgoingPoseRef = useRef<{ showRig: boolean; pose: PollyHomePoseName } | null>(null);
  const usedGreetingBaseline = useRef(false);
  const dozeTransitionActive = useRef(false);
  const dozeAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const dozeOutOpacity = useRef(new Animated.Value(1)).current;
  const dozeSettleY = useRef(new Animated.Value(0)).current;
  // One 0 -> 1 progress per Z (small, medium, large); 0 is fully transparent.
  const zProgress = useRef(HOME_Z_LAYERS.map(() => new Animated.Value(0))).current;
  // Built once so the native-driven animation keeps the same nodes.
  const zMotion = useMemo(() => zProgress.map(progress => ({
    opacity: progress.interpolate({
      inputRange: [0, HOME_Z_FADE_IN, HOME_Z_FADE_OUT_FROM, 1],
      outputRange: [0, 1, 1, 0],
    }),
    transform: [
      { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, HOME_Z_DRIFT] }) },
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -HOME_Z_RISE] }) },
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [HOME_Z_START_SCALE, 1] }) },
    ],
  })), [zProgress]);

  const slideY = useRef(new Animated.Value(isEntrance ? 300 : 0)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const { translateX: breatheX, translateY: breatheY, reduceMotion } =
    usePollyAmbientMotion('home', isFocused, lifeProfile.ambientIntensity);

  useEffect(() => () => {
    if (wasFirstHomeBeat && !homeCompletedRef.current) {
      markOnboardingAbandoned('home');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Entrance + one greeting (setTimeout between phases, per animation rules).
  useEffect(() => {
    if (!isEntrance || reduceMotion === null) return;
    enteredThisSession = true;
    if (!wasFirstHomeBeat) rememberLine(moment.lineId, 'home');

    if (reduceMotion) {
      slideY.setValue(0);
      setPose(settledPoseRef.current);
      entranceSettledRef.current = true;
    }

    if (!reduceMotion) {
      Animated.spring(slideY, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }).start();
    }
    // Settles to the resting pose as of NOW (live), not the one captured
    // when the entrance started.
    const poseT = setTimeout(() => {
      setPose(settledPoseRef.current);
      entranceSettledRef.current = true;
    }, reduceMotion ? 0 : 650);
    const showDelay = reduceMotion ? 0 : 900;
    const showT = setTimeout(() => {
      Animated.timing(bubbleOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      if (wasFirstHomeBeat) setOnboardingHomeStep(firstHomeLineIndex);
    }, showDelay);
    const lineTimers: ReturnType<typeof setTimeout>[] = [];
    if (wasFirstHomeBeat) {
      for (let index = firstHomeLineIndex + 1; index < FIRST_HOME_LINES.length; index += 1) {
        lineTimers.push(setTimeout(() => {
          setFirstHomeLineIndex(index);
          setOnboardingHomeStep(index);
        }, showDelay + FIRST_HOME_LINE_MS * (index - firstHomeLineIndex)));
      }
    }
    const hideDelay = wasFirstHomeBeat
      ? showDelay + FIRST_HOME_LINE_MS * (FIRST_HOME_LINES.length - firstHomeLineIndex)
      : 4900;
    const hideT = setTimeout(() => {
      Animated.timing(bubbleOpacity, { toValue: 0, duration: 260, useNativeDriver: true }).start();
      if (wasFirstHomeBeat) completeOnboardingHome();
    }, hideDelay);
    return () => {
      clearTimeout(poseT);
      clearTimeout(showT);
      clearTimeout(hideT);
      lineTimers.forEach(clearTimeout);
    };
    // This entrance is deliberately keyed only to the resolved accessibility
    // preference. Recording the line updates memory immediately; depending on
    // that object here would cancel the entrance timers on the same frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  // After the entrance, her pose follows the live resting pose: a Hunt that
  // changes the streaks or the profile updates her while Home is hidden.
  useEffect(() => {
    if (!entranceSettledRef.current) return;
    setPose(settledPose);
  }, [settledPose]);

  // Hard-resets the crossfade to its pre-doze rest state — used on blur,
  // where waking is instant with no reverse transition.
  const resetDozeVisuals = () => {
    dozeTransitionActive.current = false;
    dozeAnimation.current?.stop();
    dozeAnimation.current = null;
    dozeOutOpacity.setValue(1);
    dozeSettleY.setValue(0);
    outgoingPoseRef.current = null;
  };

  // Idle-screen doze: once the screen has been still for a while, she nods
  // off. Two starting points land here as one delay — the entrance
  // greeting's own fade finishing, or plain mount for a return visit with
  // no bubble at all. reduceMotion only gates *when* it's safe to start
  // counting (the same `=== null` guard the entrance effect uses); once
  // known, she dozes on the same clock either way. With motion allowed she
  // crosses into 'dozing' for a ~450ms reveal + sink before landing on
  // 'asleep': the asleep pose sits underneath at constant full opacity and
  // only the awake layer on top fades out, so a fully opaque Polly is
  // present in every frame — a true crossfade dips both layers toward 0.5
  // at once, which composites translucent and briefly shows the background
  // through her. With reduceMotion she jumps straight there. Losing focus
  // wakes her instantly (no reverse transition) and re-arms for next time.
  useEffect(() => {
    if (!isFocused) {
      setDozeStage('awake');
      resetDozeVisuals();
      return;
    }
    if (reduceMotion === null) return;

    const includeGreetingBaseline = wasEntrance && !usedGreetingBaseline.current;
    usedGreetingBaseline.current = true;
    const firstHomeGreetingMs = (reduceMotion ? 0 : 900) +
      FIRST_HOME_LINE_MS * FIRST_HOME_LINES.length + 260;
    const dozeDelay = Math.round(DOZE_DELAY_MS * lifeProfile.dozeDelayMultiplier) + (includeGreetingBaseline
      ? wasFirstHomeBeat ? firstHomeGreetingMs : GREETING_FADE_END_MS
      : 0);

    const dozeT = setTimeout(() => {
      if (reduceMotion) {
        setDozeStage('asleep');
        return;
      }
      dozeTransitionActive.current = true;
      // Always the settled look, read fresh off the ref rather than the
      // `pose`/`showRig` this closure captured back when the effect last
      // ran — see the ref declarations above for why that distinction
      // matters. Never the transient entrance `fly` pose, even if a doze
      // could somehow be scheduled before she settles.
      const settled = settledPoseRef.current;
      outgoingPoseRef.current = {
        showRig: POLLY_PERCH_RIG_ENABLED && pollyHomePoseUsesRig(settled),
        pose: settled,
      };
      setDozeStage('dozing');
      const anim = Animated.parallel([
        Animated.timing(dozeOutOpacity, {
          toValue: 0,
          duration: DOZE_TRANSITION_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(dozeSettleY, {
          toValue: DOZE_SETTLE_Y,
          duration: DOZE_TRANSITION_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]);
      dozeAnimation.current = anim;
      anim.start(() => {
        if (dozeTransitionActive.current) {
          setDozeStage('asleep');
          outgoingPoseRef.current = null;
        }
      });
    }, dozeDelay);

    return () => {
      clearTimeout(dozeT);
      dozeTransitionActive.current = false;
      dozeAnimation.current?.stop();
    };
  }, [isFocused, lifeProfile.dozeDelayMultiplier, reduceMotion, wasEntrance, wasFirstHomeBeat]);

  const isAsleep = dozeStage === 'asleep';

  // Z loop: runs only while she is fully asleep on a focused Home with motion
  // allowed. Anything else (dozing, awake, blurred, unmount) stops it and puts
  // every Z back to its start, which is fully transparent.
  const zLoopOn = isAsleep && isFocused && reduceMotion === false;
  useEffect(() => {
    if (!zLoopOn) return;
    const loops = zProgress.map((progress, i) => {
      progress.setValue(0);
      return Animated.sequence([
        Animated.delay(i * HOME_Z_STAGGER_MS),
        Animated.loop(
          Animated.timing(progress, {
            toValue: 1,
            duration: HOME_Z_CYCLE_MS,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ),
      ]);
    });
    loops.forEach(loop => loop.start());
    return () => {
      loops.forEach(loop => loop.stop());
      zProgress.forEach(progress => {
        progress.stopAnimation();
        progress.setValue(0);
      });
    };
  }, [zLoopOn, zProgress]);
  const isDozing = dozeStage === 'dozing';
  // Only consulted while actually dozing — once back to 'awake' (a
  // subsequent focus session) this must fall through to the live values,
  // never a stale frozen frame from a previous doze.
  const outgoing = isDozing && outgoingPoseRef.current ? outgoingPoseRef.current : { showRig, pose };
  // The rig only runs while it is the visible awake pose and she is not asleep;
  // hidden, it gets reduceMotion so its blink timer rests.
  const rigVisible = outgoing.showRig && !isAsleep;
  // Master asleep has no Z's yet (the old zzz.png had them drawn in); they
  // come as a separate layer later.
  const asleepArt = pollyHomePoseArt('asleep');

  return (
    <Animated.View style={[styles.root, { transform: [{ translateY: slideY }] }]}>
      {/* Polly — whole-image motion only; her branch is part of the pose art,
          rooted off the left edge */}
      <Animated.View
        style={[
          styles.pollyWrap,
          { transform: [{ translateX: breatheX }, { translateY: breatheY }, { translateY: dozeSettleY }] },
        ]}
      >
        {/* Asleep pose — mounted from first render so it's already decoded by
            the time the doze needs it, at 0 opacity until then. Snaps to full
            opacity the instant dozing starts (no animation, no fade-in); the
            fade above is the only thing that moves. */}
        <View style={[styles.dozeLayer, { opacity: dozeStage === 'awake' ? 0 : 1 }]}>
          <Image
            source={asleepArt.source}
            style={[styles.pollyImage, { transform: [{ scale: asleepArt.scale }] }]}
            resizeMode="contain"
          />
        </View>

        {/* Awake layer — the SAME element across 'awake' and 'dozing' so it
            never remounts mid-fade (a remount was the actual one-frame blink:
            switching render branches tore the rig down and rebuilt it fresh
            right as the opacity animation started, so nothing was actually
            fading — there was just nothing to fade). Only its opacity
            animates, and only while dozing does it read the frozen
            `outgoing` snapshot instead of the live pose. Once fully asleep it
            is hidden at opacity 0 (a plain wrapper, so
            the animated fade value is never swapped for a number) and the rig
            rests, rather than unmounted — rebuilding it on wake drew empty
            frames. Inside, every awake pose is a mounted layer (see
            HOME_AWAKE_LAYER_POSES); only the current one is at opacity 1. */}
        <View style={[styles.dozeLayer, { opacity: isAsleep ? 0 : 1 }]}>
          <Animated.View style={[styles.dozeLayer, { opacity: dozeOutOpacity }]}>
            {POLLY_PERCH_RIG_ENABLED && (
              <View style={[styles.dozeLayer, { opacity: outgoing.showRig ? 1 : 0 }]}>
                <PollyPerchRig
                  size={homePerch.pollySize}
                  reduceMotion={rigVisible ? reduceMotion : true}
                  crownTilt={lifeProfile.crownTilt}
                  angryBrow={lifeProfile.angryBrow}
                  eye={lifeProfile.eye}
                  mouth={lifeProfile.mouth}
                />
              </View>
            )}
            {HOME_AWAKE_IMAGE_POSES.map(layerPose => {
              const art = pollyHomePoseArt(layerPose);
              return (
                <Image
                  key={layerPose}
                  source={art.source}
                  style={[
                    styles.pollyImage,
                    styles.dozeLayer,
                    {
                      opacity: !outgoing.showRig && layerPose === outgoing.pose ? 1 : 0,
                      transform: [{ scale: art.scale }],
                    },
                  ]}
                  resizeMode="contain"
                />
              );
            })}
          </Animated.View>
        </View>

        {/* Sleeping Z's — mounted from the first render (so they are loaded)
            and invisible unless she is fully asleep. The wrapper's opacity is
            a plain number, so the animated values inside are never swapped. */}
        <View style={[styles.dozeLayer, { opacity: zLoopOn ? 1 : 0 }]}>
          {HOME_Z_LAYERS.map((z, i) => {
            return (
              <Animated.Image
                key={i}
                source={z.source}
                resizeMode="contain"
                style={[
                  styles.zLayer,
                  {
                    left: z.left,
                    top: z.top,
                    width: z.width,
                    height: z.height,
                  },
                  zMotion[i],
                ]}
              />
            );
          })}
        </View>
        {/* Reduce Motion: one still medium Z beside her head while asleep. */}
        <Image
          source={HOME_Z_LAYERS[1].source}
          resizeMode="contain"
          style={[
            styles.zLayer,
            {
              left: HOME_Z_LAYERS[1].left,
              top: HOME_Z_LAYERS[1].top,
              width: HOME_Z_LAYERS[1].width,
              height: HOME_Z_LAYERS[1].height,
              opacity: isAsleep && reduceMotion === true ? 1 : 0,
            },
          ]}
        />
      </Animated.View>

      {/* Greeting bubble — to her right, tail points left at her */}
      <Animated.View style={[styles.bubbleWrap, { opacity: bubbleOpacity }]}>
        <PollySpeechBubble line={wasFirstHomeBeat ? FIRST_HOME_LINES[firstHomeLineIndex] : moment.line} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    bottom: homePerch.bottomOffset,
    width: 260,
    height: homePerch.pollySize,
    pointerEvents: 'none',
    zIndex: 2,
  },
  pollyWrap: {
    position: 'absolute',
    left: -66,
    bottom: 0,
    width: homePerch.pollySize,
    height: homePerch.pollySize,
  },
  pollyImage: {
    width: homePerch.pollySize,
    height: homePerch.pollySize,
  },
  // Every stacked layer (asleep, the awake wrapper, the rig and each awake
  // pose) sits at the box's top-left at full box size, where the single image
  // and the rig used to sit, so stacking them moves nothing.
  dozeLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: homePerch.pollySize,
    height: homePerch.pollySize,
    pointerEvents: 'none',
  },
  zLayer: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  bubbleWrap: {
    position: 'absolute',
    left: 150,
    bottom: 128,
  },
});
