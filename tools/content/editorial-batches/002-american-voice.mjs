import fs from 'node:fs';

const dataPath = 'assets/data/huntData.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const rewrites = {
  COPY: {
    reals: [
      'ORIGINAL GETS A PERFECT TWIN',
      'HEADLINE HAS THREE SECONDS TO SELL YOU',
      "MOM'S FACE SHOWS UP ONE GENERATION LATER",
      'RADIO CHECK ENDS WITH THIS WORD',
    ],
    traps: [
      'FORGER PRACTICES THE SIGNATURE',
      'PRINTER RUNS OUT OF BLACK INK',
      'PLAGIARISM COMMITTEE MEETS AGAIN',
      'CARBON PAPER LEAVES BLUE FINGERS',
    ],
  },
  CORD: {
    reals: [
      "LAMP'S LAST MILE TO THE WALL",
      'KNOTS TURN THIS INTO A HANDLE',
      'FIRST CONNECTION GETS CUT AT BIRTH',
    ],
    traps: [
      'SAILOR TESTS THE ROPE KNOT',
      'BUNGEE JUMPER CHECKS THE CARABINER',
      'POWER STRIP RUNS THE WHOLE SETUP',
      'SPARKS ESCAPE FROM CRACKED INSULATION',
      'PLUG MISSES THE SOCKET IN THE DARK',
    ],
  },
  CORNER: {
    reals: [
      'THE ROOM MAKES A NINETY',
      'EVERY EXIT JUST GOT BLOCKED',
      'BETWEEN ROUNDS, THE BOXER COMES HOME',
      'ONE BUYER OWNS THE WHOLE SUPPLY',
    ],
    traps: [
      'SHORTCUT CUTS ACROSS THE INTERSECTION',
      'DEFENDER FORCES A BAD PASS',
      'TRAFFIC CONE GUARDS THE TURN',
      'BELL SENDS THE BOXER BACK TO HIS STOOL',
    ],
  },
  COURT: {
    reals: [
      'TWELVE STRANGERS WEIGH ONE STORY',
      "EVERYONE LAUGHS AT THE KING'S JOKES",
      'SNEAKERS SQUEAK BETWEEN WHITE LINES',
      'COMPLIMENTS ARRIVE WITH AN AGENDA',
      'APARTMENTS FACE ONE SHARED PATCH OF SKY',
    ],
    traps: [
      'JURY ROOM WAITS FOR A VERDICT',
      'PALACE GUARD STANDS PERFECTLY STILL',
      'TENNIS NET SAGS IN THE MIDDLE',
    ],
  },
  CROWN: {
    reals: [
      'ROYAL HEADACHE MADE OF GOLD',
      'BALD SPOT CLAIMS THIS FIRST',
      'ONE FINAL JUDGE MAKES HER QUEEN',
      'ROOT CANAL ENDS WITH NEW ARMOR',
    ],
    traps: [
      'JEWELS WAIT ON A VELVET PILLOW',
      'SCEPTER RISES BESIDE THE THRONE',
      "DENTIST SHAPES WHAT'S LEFT OF THE MOLAR",
      'TEMPORARY FILLING BUYS ANOTHER WEEK',
    ],
  },
  CRUST: {
    reals: [
      'SANDWICH KIDS LEAVE THIS BEHIND',
      "WE LIVE ON THE PLANET'S THIN SHELL",
      "BOOTS BREAK THE SNOW'S MORNING SEAL",
      'THE NERVE TO ASK FOR A RAISE',
    ],
    traps: [
      'DOUGH WAITS FOR THE OVEN',
      'TOAST CRUMBS COVER THE COUNTER',
      'MANTLE MOVES UNDER THE PLATES',
      'FILLING HIDES UNDER THE PIE',
    ],
  },
  CURRENT: {
    reals: [
      "TOMORROW HASN'T REPLACED THIS YET",
      'SWIMMER MOVES WITHOUT TAKING A STROKE',
      'ELECTRONS START THEIR COMMUTE',
    ],
    traps: [
      "YESTERDAY'S HEADLINE",
      'RIVERBANK CATCHES FLOATING DEBRIS',
      'METER SHOWS VOLTS INSTEAD OF AMPS',
      'TREND ALREADY PEAKED',
      'WIND PUSHES AGAINST YOUR FACE',
      'TINY FRUIT HIDES IN THE SCONE',
    ],
  },
  DATE: {
    reals: [
      'DESSERT WAITS WHILE BOTH STUDY THE MENU',
      'WRINKLED FRUIT HIDES A CARAMEL CENTER',
      'ANCIENT BONE GETS A BIRTH YEAR',
      'ONE SQUARE GETS CIRCLED IN RED',
      'THAT HAIRCUT ADMITS WHICH DECADE WON',
    ],
    traps: [
      'BIRTH CERTIFICATE HIDES IN A DRAWER',
      "RAISIN'S RICHER STICKIER RIVAL",
      'NEWSPAPER YELLOWS IN THE ATTIC',
    ],
  },
  DIGEST: {
    removeMaskIds: ['digest_r2'],
    wordType: 'Triple',
    reals: [
      'LUNCH GETS TAKEN APART IN PRIVATE',
      'WHOLE REPORT FITS ON ONE PAGE',
      'BAD NEWS NEEDS A MINUTE TO LAND',
    ],
    traps: [
      'ENZYME WAITS IN THE GUT',
      'BAD NEWS SITS HEAVY ALL NIGHT',
      'STOMACH GROWLS TWO HOURS LATER',
      'EDITOR CUTS THREE PAGES BEFORE PRINT',
    ],
  },
  DIRECT: {
    reals: [
      'NO CONNECTIONS, NO DETOURS',
      'EVERYONE WAITS FOR ACTION',
      'THE ANSWER ARRIVES WITHOUT BUBBLE WRAP',
    ],
    traps: [
      'LAYOVER ADDS THREE HOURS',
      'MANAGER FLOATS A POLITE SUGGESTION',
      'MAP OFFERS THE SCENIC ROUTE',
    ],
  },
  DISCHARGE: {
    reals: [
      'WRISTBAND COMES OFF BEFORE THE IV',
      'STORED POWER FINDS A WAY OUT',
      'ONE TRIGGER PULL BREAKS THE SILENCE',
      'PIPE GIVES THE RIVER EVERYTHING IT CARRIED',
    ],
    traps: [
      'VISITOR LEAVES BEFORE QUIET HOURS',
      'BREAKER TRIPS IN THE BASEMENT',
      'TASK FINALLY GETS A CHECKMARK',
      'WOOL SWEATER CLINGS AFTER THE DRYER',
      'WOUND GETS DRESSED BEFORE RELEASE',
    ],
  },
  DISPATCH: {
    reals: [
      'TRACKING NUMBER FINALLY STARTS MOVING',
      'TO-DO LIST LOSES THREE ITEMS BEFORE LUNCH',
      'DATELINE ARRIVES FROM THE WAR ZONE',
      'VILLAIN LASTS LESS THAN ONE SCENE',
    ],
    traps: [
      'WAREHOUSE SHELVES WAIT FOR THE ORDER',
      'MEETING ENDS BECAUSE THE ROOM IS BOOKED',
      'TELEGRAPH TAPS OUT THE NIGHT SHIFT',
      'RADIO CRACKLES WITH COORDINATES',
      'OPERATOR WRITES DOWN THE CALL TIME',
    ],
  },
  DOCK: {
    reals: [
      'BOAT SPENDS THE NIGHT TIED HERE',
      "BEING LATE SHRINKS FRIDAY'S CHECK",
      'PUPPY WAKES UP WITH LESS TAIL',
      'LAPTOP GAINS PORTS WITHOUT GROWING',
    ],
    traps: [
      'TIMECARD SHOWS TEN MINUTES MISSING',
      "JUDGE'S GAVEL ENDS THE ARGUMENT",
      'GANGPLANK LOWERS TO THE PIER',
      'CARGO CRANE SWINGS OVERHEAD',
    ],
  },
  DOUBLE: {
    reals: [
      'ONE BECOMES TWO WITHOUT SHARING',
      'STAR STAYS SAFE WHILE THIS FACE WORKS',
      'PAPER MEETS ITSELF AT THE CREASE',
      'LOSING BET GETS TWICE AS BRAVE',
    ],
    traps: [
      'BARISTA ADDS ONE EXTRA SHOT',
      'IDENTICAL TWIN SHARES YOUR BIRTHDAY',
      'PRINTER MAKES ONE MORE PAGE',
      'SECOND CUP ARRIVES BEFORE NOON',
    ],
  },
  DOWN: {
    reals: [
      'EVERY FALLING THING VOTES THIS WAY',
      "PILLOW BORROWS THE DUCK'S SOFTEST LAYER",
      'EVEN GETTING DRESSED FEELS TOO HARD',
      'WALL STREET NUMBERS TURN RED',
      'OFFENSE GETS FOUR CHANCES TO MOVE TEN',
    ],
    traps: [
      'ELEVATOR DOORS SLIDE SHUT',
      'BROKER REFRESHES THE SCREEN',
      'PILLOW FIGHT WAITS FOR LIGHTS OUT',
      'TEARS LAND IN COLD COFFEE',
    ],
  },
  DRAIN: {
    reals: [
      'SHOWER WATER KNOWS THE WAY OUT',
      'THAT MEETING TOOK MORE THAN AN HOUR',
      'SAVINGS LEAVE ONE PURCHASE AT A TIME',
    ],
    traps: [
      'CLOG HIDES UNDER THE SUDS',
      'PIPES CARRY CLEAN WATER IN',
      'PLUNGER LEANS AGAINST THE WALL',
    ],
  },
  DRIFT: {
    reals: [
      'NO PADDLE, STILL MOVING DOWNSTREAM',
      'WIND BUILDS A WALL ACROSS THE DRIVEWAY',
      "YOU GET WHAT I'M SAYING",
      'REAR TIRES DRAW THE TURN SIDEWAYS',
    ],
    traps: [
      'LIFEGUARD WAVES THE SWIMMER BACK',
      'ANCHOR DROPS ONE MINUTE TOO LATE',
      'PLOW PILES EVERYTHING BY THE CURB',
      'THE WHOLE POINT GOES MISSING',
    ],
  },
  DRILL: {
    reals: [
      'WEEKEND PROJECT MAKES THE WALL SCREAM',
      'FIRE ALARM WITHOUT THE FIRE',
      'CHICAGO RAP GETS DARKER AND HARDER',
    ],
    traps: [
      'SANDER SMOOTHS THE CABINET',
      'HAMMER PUNCHES THROUGH DRYWALL',
      "COACH SAVES THE SPEECH FOR HALFTIME",
      'FIRST ATTEMPT FINDS THE NET',
    ],
  },
  DROP: {
    reals: [
      'GRAVITY STEALS THE KEYS',
      'FORECAST LOSES TWENTY DEGREES OVERNIGHT',
      'ONE FORM ERASES THE WHOLE SEMESTER',
      'EYEDROPPER HOLDS EXACTLY ONE',
      'THROAT GETS A TINY WRAPPED PEACE OFFER',
    ],
    traps: [
      'PUDDLE STARTS UNDER THE LEAK',
      'RESIGNATION LETTER SITS UNSENT',
      'ROLLER COASTER REACHES THE FIRST HILL',
      'SHOT GLASS HITS THE COUNTER EMPTY',
      'RAIN SOAKS STRAIGHT THROUGH THE JACKET',
    ],
  },
};

for (const [word, rewrite] of Object.entries(rewrites)) {
  const entry = data[word];
  if (!entry) throw new Error(`Missing word: ${word}`);

  if (rewrite.removeMaskIds) {
    entry.masks = entry.masks.filter((mask) => !rewrite.removeMaskIds.includes(mask.id));
  }
  if (rewrite.wordType) entry.wordType = rewrite.wordType;

  const reals = entry.masks.filter((mask) => mask.isReal);
  const traps = entry.masks.filter((mask) => !mask.isReal);

  if (reals.length !== rewrite.reals.length) {
    throw new Error(`${word}: expected ${reals.length} REAL rewrites, received ${rewrite.reals.length}`);
  }
  if (traps.length !== rewrite.traps.length) {
    throw new Error(`${word}: expected ${traps.length} trap rewrites, received ${rewrite.traps.length}`);
  }

  reals.forEach((mask, index) => {
    mask.phrase = rewrite.reals[index];
  });
  traps.forEach((mask, index) => {
    mask.phrase = rewrite.traps[index];
  });
}

fs.writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log(`Applied editorial batch 002 to ${Object.keys(rewrites).length} words.`);
