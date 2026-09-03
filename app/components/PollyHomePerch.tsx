import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';
import { POLLY_POSES, pollyPoseScale } from '../ui/pollyPoses';
import { homePerch } from '../ui/pwHomeMaterials';
import { resolveHomePollyMoment } from '../game/pollyMemory';
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

type DozeStage = 'awake' | 'dozing' | 'asleep';

export default function PollyHomePerch() {
  const memory = useGameStore(s => s.pollyMemory);
  const rememberLine = useGameStore(s => s.rememberPollyLine);
  const isFocused = useIsFocused();
  const isEntrance = !enteredThisSession;
  const [moment] = useState(() => resolveHomePollyMoment(memory));
  // isEntrance flips false the instant the entrance effect below runs, so a
  // later re-render (e.g. the poseT settle) would see the wrong value —
  // freeze it once at mount, same as `moment`.
  const [wasEntrance] = useState(isEntrance);
  const settledPose = memory.playerWinStreak > 0
    ? POLLY_POSES.sulk
    : memory.pollyWinStreak > 0
    ? POLLY_POSES.smug
    : POLLY_POSES.idle;
  const [pose, setPose] = useState<ImageSourcePropType>(
    isEntrance ? POLLY_POSES.fly : settledPose,
  );
  const showRig = POLLY_PERCH_RIG_ENABLED && (pose === POLLY_POSES.idle || pose === POLLY_POSES.smug);
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
  const outgoingPoseRef = useRef<{ showRig: boolean; pose: ImageSourcePropType } | null>(null);
  const usedGreetingBaseline = useRef(false);
  const dozeTransitionActive = useRef(false);
  const dozeAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const dozeOutOpacity = useRef(new Animated.Value(1)).current;
  const dozeSettleY = useRef(new Animated.Value(0)).current;

  const slideY = useRef(new Animated.Value(isEntrance ? 300 : 0)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const { translateX: breatheX, translateY: breatheY, reduceMotion } =
    usePollyAmbientMotion('home', isFocused);

  // Entrance + one greeting (setTimeout between phases, per animation rules).
  useEffect(() => {
    if (!isEntrance || reduceMotion === null) return;
    enteredThisSession = true;
    rememberLine(moment.lineId, 'home');

    if (reduceMotion) {
      slideY.setValue(0);
      setPose(settledPose);
    }

    if (!reduceMotion) {
      Animated.spring(slideY, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }).start();
    }
    const poseT = setTimeout(() => setPose(settledPose), reduceMotion ? 0 : 650);
    const showT = setTimeout(() => {
      Animated.timing(bubbleOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    }, 900);
    const hideT = setTimeout(() => {
      Animated.timing(bubbleOpacity, { toValue: 0, duration: 260, useNativeDriver: true }).start();
    }, 4900);
    return () => {
      clearTimeout(poseT);
      clearTimeout(showT);
      clearTimeout(hideT);
    };
    // This entrance is deliberately keyed only to the resolved accessibility
    // preference. Recording the line updates memory immediately; depending on
    // that object here would cancel the entrance timers on the same frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

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
    const dozeDelay = DOZE_DELAY_MS + (includeGreetingBaseline ? GREETING_FADE_END_MS : 0);

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
        showRig: POLLY_PERCH_RIG_ENABLED && (settled === POLLY_POSES.idle || settled === POLLY_POSES.smug),
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
  }, [isFocused, reduceMotion, wasEntrance]);

  const isAsleep = dozeStage === 'asleep';
  const isDozing = dozeStage === 'dozing';
  // Only consulted while actually dozing — once back to 'awake' (a
  // subsequent focus session) this must fall through to the live values,
  // never a stale frozen frame from a previous doze.
  const outgoing = isDozing && outgoingPoseRef.current ? outgoingPoseRef.current : { showRig, pose };

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
            source={POLLY_POSES.asleep}
            style={[styles.pollyImage, { transform: [{ scale: pollyPoseScale(POLLY_POSES.asleep) }] }]}
            resizeMode="contain"
          />
        </View>

        {/* Awake layer — the SAME element across 'awake' and 'dozing' so it
            never remounts mid-fade (a remount was the actual one-frame blink:
            switching render branches tore the rig down and rebuilt it fresh
            right as the opacity animation started, so nothing was actually
            fading — there was just nothing to fade). Only its opacity
            animates, and only while dozing does it read the frozen
            `outgoing` snapshot instead of the live pose. Dropped once fully
            asleep so the rig isn't left running behind an opaque image. */}
        {!isAsleep && (
          <Animated.View style={[styles.dozeLayer, { opacity: dozeOutOpacity }]}>
            {outgoing.showRig ? (
              <PollyPerchRig size={homePerch.pollySize} reduceMotion={reduceMotion} />
            ) : (
              <Image
                source={outgoing.pose}
                style={[styles.pollyImage, { transform: [{ scale: pollyPoseScale(outgoing.pose) }] }]}
                resizeMode="contain"
              />
            )}
          </Animated.View>
        )}
      </Animated.View>

      {/* Greeting bubble — to her right, tail points left at her */}
      <Animated.View style={[styles.bubbleWrap, { opacity: bubbleOpacity }]}>
        <PollySpeechBubble line={moment.line} />
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
  dozeLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: homePerch.pollySize,
    height: homePerch.pollySize,
  },
  bubbleWrap: {
    position: 'absolute',
    left: 150,
    bottom: 128,
  },
});
