from pathlib import Path

path = Path('app/components/MaskBoard.tsx')
text = path.read_text()


def replace_once(old: str, new: str, label: str):
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 match, found {count}')
    text = text.replace(old, new, 1)

replace_once(
    "import HeroBook, { type HeroBookVariant } from './ui/HeroBook';\n",
    "import HeroBook, { type HeroBookVariant } from './ui/HeroBook';\nimport RematchOutcomePlaque from './ui/RematchOutcomePlaque';\n",
    'shared plaque import',
)

replace_once(
    "const [bookVariant, setBookVariant] = useState<HeroBookVariant>('neutral');",
    "const [bookVariant, setBookVariant] = useState<HeroBookVariant>(\n    step.isMasteryRematch === true ? 'mastered' : 'neutral'\n  );",
    'rematch gold book initializer',
)

old_loss = """        if (step.isMasteryRematch === true) {
          // MASTER'S REMATCH lost: nothing haunts the player, so the book stays
          // the regular neutral rig and simply rests closed. No gray rig, no
          // haunted slam sound, no board shake. BusterOutcomeOverlay owns the
          // reveal and its single punch. Boss outcome music stays silent, as
          // for every other boss outcome.
          setBossOutcomeMusicSilenced(true);
          bookOpenAnimationRef.current?.stop();
          bookOpenAnim.stopAnimation();
          bookIntakeGlowAnim.stopAnimation();
          bookOpenAnim.setValue(0);
          bookIntakeGlowAnim.setValue(0);
          return;
        }
"""
new_loss = """        if (step.isMasteryRematch === true) {
          // MASTER'S REMATCH lost: the word stays mastered, but the visible
          // hero book is demoted from the gold Master rig back to the regular
          // purple book before the BUSTER plaque arrives. This is a visual
          // demotion only; mastery persistence is intentionally untouched.
          setBossOutcomeMusicSilenced(true);
          bookOpenAnimationRef.current?.stop();
          bookOpenAnim.stopAnimation();
          bookIntakeGlowAnim.stopAnimation();
          bookOpenAnim.setValue(0);
          bookIntakeGlowAnim.setValue(0);
          if (reduceMotion) {
            setBookVariant('neutral');
            return;
          }
          bookOpenAnimationRef.current = Animated.sequence([
            Animated.timing(bookOpenAnim, {
              toValue: 0.55,
              duration: 220,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(bookOpenAnim, {
              toValue: 0,
              duration: 260,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]);
          setTimeout(() => setBookVariant('neutral'), 260);
          bookOpenAnimationRef.current.start();
          return;
        }
"""
replace_once(old_loss, new_loss, 'buster book demotion')

old_reveal = """      onOutcomeReveal(outcome) {
        if (!isBoss) playSfx(resolveOutcomeRevealSfx(outcome));
        setShowOutcomeCard(false);
        setTimeout(() => setShowOutcomeCard(true), 350);
      },
"""
new_reveal = """      onOutcomeReveal(outcome) {
        if (!isBoss) playSfx(resolveOutcomeRevealSfx(outcome));
        setShowOutcomeCard(false);
        const revealDelayMs = isBoss && step.isMasteryRematch === true && outcome === 'haunted'
          ? 520
          : 350;
        setTimeout(() => setShowOutcomeCard(true), revealDelayMs);
      },
"""
replace_once(old_reveal, new_reveal, 'rematch reveal timing')

old_feedback = """  useEffect(() => {
    const outcome = mechanics.wordOutcome;
    if (!isBoss || !showOutcomeCard || outcome === 'none') return;
    // A lost MASTER'S REMATCH has no haunted plaque sound; BusterOutcomeOverlay
    // plays its own punch as BU lands.
    if (outcome === 'haunted' && step.isMasteryRematch === true) return;
    const feedback = resolveBossOutcomePlaqueFeedback(outcome);
"""
new_feedback = """  useEffect(() => {
    const outcome = mechanics.wordOutcome;
    if (!isBoss || !showOutcomeCard || outcome === 'none') return;
    // Shared rematch plaque owns KING/BUSTER feedback in both production and DEV.
    if (step.isMasteryRematch === true) return;
    const feedback = resolveBossOutcomePlaqueFeedback(outcome);
"""
replace_once(old_feedback, new_feedback, 'rematch feedback ownership')

old_render = """      {mechanics.wordOutcome === 'mastered' && showOutcomeCard && (
        <MasteredOutcomeOverlay
          word={step.word}
          headline={isHaunt ? 'BANISHED' : 'MASTERED'}
          bonusLabel={mechanics.outcomeBonusLabel}
          onContinue={continueOutcome}
          isBoss={isBoss}
          isRematch={isBoss && step.isMasteryRematch === true}
        />
      )}

      {mechanics.wordOutcome === 'haunted' && showOutcomeCard && (
        isBoss && step.isMasteryRematch === true ? (
          <BusterOutcomeOverlay word={step.word} onContinue={continueOutcome} />
        ) : (
          <HauntedOutcomeOverlay
            word={step.word}
            detail={mechanics.outcomeDetail}
            onContinue={continueOutcome}
            isBoss={isBoss}
          />
        )
      )}
"""
new_render = """      {mechanics.wordOutcome === 'mastered' && showOutcomeCard && (
        isBoss && step.isMasteryRematch === true ? (
          <RematchOutcomePlaque
            word={step.word}
            kind=\"king\"
            onContinue={continueOutcome}
          />
        ) : (
          <MasteredOutcomeOverlay
            word={step.word}
            headline={isHaunt ? 'BANISHED' : 'MASTERED'}
            bonusLabel={mechanics.outcomeBonusLabel}
            onContinue={continueOutcome}
            isBoss={isBoss}
            isRematch={false}
          />
        )
      )}

      {mechanics.wordOutcome === 'haunted' && showOutcomeCard && (
        isBoss && step.isMasteryRematch === true ? (
          <RematchOutcomePlaque
            word={step.word}
            kind=\"buster\"
            onContinue={continueOutcome}
          />
        ) : (
          <HauntedOutcomeOverlay
            word={step.word}
            detail={mechanics.outcomeDetail}
            onContinue={continueOutcome}
            isBoss={isBoss}
          />
        )
      )}
"""
replace_once(old_render, new_render, 'production KING/BUSTER renderer')

path.write_text(text)
print('production rematch wiring applied')
