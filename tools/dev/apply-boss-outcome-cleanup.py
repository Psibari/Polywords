from pathlib import Path
import re


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 match, found {count}')
    return text.replace(old, new, 1)


# Player-facing boss copy: keep internal scoring, remove retired score framing.
mechanics_path = Path('app/hooks/useBoardMechanics.ts')
mechanics = mechanics_path.read_text()
mechanics = replace_once(
    mechanics,
    "import { recordPlaytestEvent, resolveHuntTelemetryPhase } from '../game/playtestTelemetry';\n",
    "import { recordPlaytestEvent, resolveHuntTelemetryPhase } from '../game/playtestTelemetry';\nimport { resolveBossEventKicker } from '../game/huntOutcomeFeedback';\n",
    'boss event kicker import',
)
mechanics = replace_once(
    mechanics,
    '''function eventKicker(step: WordStep): string | null {
  // Reward-only framing let the boss round's stakes go unsignaled on every
  // repeat visit, not just a player's first — this always-visible badge is
  // the persistent half of that fix; BossIntroOverlay is the one-time half.
  if (step.eventType === 'bossWord' && step.isMasteryRematch) return "MASTER'S REMATCH · 2×";
  if (step.eventType === 'bossWord')  return "POLLY'S WORD · 2× OR HAUNTED";
  if (step.eventType === 'slangDrop') return 'SLANG DROP';
  return null;
}
''',
    '''function eventKicker(step: WordStep): string | null {
  // Boss labels identify the event only. The old multiplier/score framing is
  // retired from the player-facing game while internal run math remains intact.
  if (step.eventType === 'bossWord') return resolveBossEventKicker(step.isMasteryRematch === true);
  if (step.eventType === 'slangDrop') return 'SLANG DROP';
  return null;
}
''',
    'boss event kicker copy',
)
mechanics = replace_once(
    mechanics,
    "            { bonusLabel: `BOSS MASTERY +${masteryPoints}` },\n",
    "            {},\n",
    'resumed boss score label',
)
old_bonus = '''          bonusLabel: isHaunt
            ? 'HAUNT BROKEN'
            : isBoss
              ? `BOSS MASTERY +${masteryPoints}`
              : undefined,
'''
new_bonus = '''          bonusLabel: isHaunt ? 'HAUNT BROKEN' : undefined,
'''
mechanics = replace_once(mechanics, old_bonus, new_bonus, 'live boss score label')
mechanics_path.write_text(mechanics)


# Shared physical lettering on all illustrated outcome plaques.
board_path = Path('app/components/MaskBoard.tsx')
board = board_path.read_text()
board = replace_once(
    board,
    "import RematchOutcomePlaque from './ui/RematchOutcomePlaque';\n",
    "import RematchOutcomePlaque from './ui/RematchOutcomePlaque';\nimport PlaqueText from './ui/PlaqueText';\n",
    'PlaqueText import',
)

board = replace_once(
    board,
    '''              <Text style={[styles.plaqueHeadline, styles.banishedPlaqueHeadline]}>{headline}</Text>
              <Text
                style={[styles.plaqueWord, styles.banishedPlaqueWord]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {word}
              </Text>
''',
    '''              <PlaqueText
                text={headline}
                material="goldPlaque"
                fontSize={33}
                fontFamily={FONTS.label}
                textStyle={[styles.plaqueHeadline, styles.banishedPlaqueHeadline]}
              />
              <PlaqueText
                text={word}
                material="goldPlaque"
                fontSize={41}
                textStyle={[styles.plaqueWord, styles.banishedPlaqueWord]}
                minimumFontScale={0.6}
              />
''',
    'banished plaque lettering',
)

board = replace_once(
    board,
    '''                <Text style={[styles.plaqueHeadline, styles.masteredPlaqueHeadline]}>{headline}</Text>
              )}
              <Text
                style={[styles.plaqueWord, styles.masteredPlaqueWord]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {word}
              </Text>
''',
    board.split('                <Text style={[styles.plaqueHeadline, styles.masteredPlaqueHeadline]}>{headline}</Text>\n              )}\n              <Text\n                style={[styles.plaqueWord, styles.masteredPlaqueWord]}\n                numberOfLines={1}\n                adjustsFontSizeToFit\n                minimumFontScale={0.6}\n              >\n                {word}\n              </Text>\n')[0][-0:] if False else '''                <PlaqueText
                  text={headline}
                  material="goldPlaque"
                  fontSize={33}
                  fontFamily={FONTS.label}
                  textStyle={[styles.plaqueHeadline, styles.masteredPlaqueHeadline]}
                />
              )}
              <PlaqueText
                text={word}
                material="goldPlaque"
                fontSize={41}
                textStyle={[styles.plaqueWord, styles.masteredPlaqueWord]}
                minimumFontScale={0.6}
              />
''',
    'mastered plaque lettering',
)

board = replace_once(
    board,
    '''              <Text style={[styles.plaqueHeadline, styles.hauntedPlaqueHeadline]}>HAUNTED</Text>
              <Text
                style={[styles.plaqueWord, styles.hauntedPlaqueWord]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {word}
              </Text>
''',
    '''              <PlaqueText
                text="HAUNTED"
                material="stonePlaque"
                fontSize={33}
                fontFamily={FONTS.label}
                textStyle={[styles.plaqueHeadline, styles.hauntedPlaqueHeadline]}
              />
              <PlaqueText
                text={word}
                material="stonePlaque"
                fontSize={41}
                textStyle={[styles.plaqueWord, styles.hauntedPlaqueWord]}
                minimumFontScale={0.6}
              />
''',
    'haunted plaque lettering',
)
board_path.write_text(board)


material_path = Path('app/ui/plaqueTextMaterial.ts')
material = material_path.read_text()
material = replace_once(
    material,
    "export type PlaqueTextMaterialName = 'goldPlaque' | 'purplePlaque';",
    "export type PlaqueTextMaterialName = 'goldPlaque' | 'purplePlaque' | 'stonePlaque';",
    'stone material type',
)
material = replace_once(
    material,
    '''  purplePlaque: {
    face: '#F5C842',
    depth: '#8A5400',
    highlight: '#FFF1A6',
    shadow: 'rgba(53, 28, 0, 0.72)',
  },
''',
    '''  purplePlaque: {
    face: '#F5C842',
    depth: '#8A5400',
    highlight: '#FFF1A6',
    shadow: 'rgba(53, 28, 0, 0.72)',
  },
  stonePlaque: {
    face: '#1A1830',
    depth: '#080711',
    highlight: '#655F87',
    shadow: 'rgba(5, 4, 15, 0.72)',
  },
''',
    'stone material palette',
)
material_path.write_text(material)

print('boss outcome cleanup applied')
