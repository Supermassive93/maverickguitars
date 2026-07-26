export interface ModelData {
  model: string
  series: string
  description: string
  specs: { key: string; value: string }[]
  rarity?: string
  notes?: string
}

export const STANDARD_SPEC_KEYS = [
  'Body style',
  'Pickup config',
  'Bridge',
  'Headstock',
  'Frets',
  'Fretboard',
  'Body wood',
  'Potentiometers',
  'Switch',
] as const

export const MODEL_CATALOGUE: ModelData[] = [
  // ── Evolution ────────────────────────────────────────────────────────────
  {
    model: 'F1',
    series: 'Evolution',
    description: 'The flagship superstrat. Dual humbucker configuration with Floyd Rose locking tremolo. The highest volume model in the range — the guitar most associated with the Maverick name.',
    specs: [
      { key: 'Body style', value: 'Superstrat' },
      { key: 'Pickup config', value: 'HH' },
      { key: 'Bridge', value: 'Maverick Floyd Rose - Licensed' },
      { key: 'Body wood', value: 'Basswood' },
    ],
  },
  {
    model: 'F2',
    series: 'Evolution',
    description: 'The sophisticated hybrid. Gibson neck geometry married to a low Fender-style hardtail. Gen 1 examples carry a ~1° neck pitch requiring ~8mm body packing — PRS-equivalent geometry producing exceptionally low action potential. Confirmed available in Tobacco Burst and Fireburst per the 2002 catalogue.',
    specs: [
      { key: 'Body style', value: 'Superstrat' },
      { key: 'Pickup config', value: 'HH' },
      { key: 'Bridge', value: 'Maverick/Wilkinson Hardtail' },
    ],
    rarity: 'Low production',
  },
  {
    model: 'F3',
    series: 'Evolution',
    description: 'The versatile workhorse. HSH pickup configuration with Floyd Rose locking tremolo. Highest production numbers of any Maverick model — the most commercially successful guitar in the catalogue.',
    specs: [
      { key: 'Body style', value: 'Superstrat' },
      { key: 'Pickup config', value: 'HSH' },
      { key: 'Bridge', value: 'Maverick Floyd Rose - Licensed' },
      { key: 'Body wood', value: 'Basswood' },
    ],
  },
  {
    model: 'F4',
    series: 'Evolution',
    description: 'HSS configuration with Synchronised Tremolo. Features a composite neck profile morphing from vintage V at the nut to D-shape at the body join — delivering a dynamic playing feel across the full range.',
    specs: [
      { key: 'Body style', value: 'Semi-Superstrat' },
      { key: 'Pickup config', value: 'HSS' },
      { key: 'Bridge', value: 'Synchronised Tremolo - Fender Style' },
    ],
    rarity: 'Registry Derived',
  },
  {
    model: 'SF-1',
    series: 'Evolution',
    description: 'Commonly known as the Streetfighter. The rarest Maverick guitar — a retailer-commissioned limited run featuring a reverse headstock, fret vents, and Wilkinson hardware throughout. As few as 4 known examples in certain colourways. Exceptionally collectible.',
    specs: [
      { key: 'Body style', value: 'Superstrat' },
      { key: 'Bridge', value: 'Wilkinson' },
      { key: 'Headstock', value: 'Reverse 6-aside' },
    ],
    rarity: 'Extremely rare',
  },
  {
    model: 'SF-3',
    series: 'Evolution',
    description: 'A premium Streetfighter prototype reviewed in Guitarist Winter 2001 that never entered mass production. The F-series body shape in special-reserve swamp ash — two-piece bookmatched — paired with DiMarzio Air Zone and Air Norton Airbuckers and a 5-way lever switch offering split-coil single-coil tones in positions 2 and 4. Available in Honeyburst only. Approximately 50% UK assembly. One of the most spec-complete Maverick prototypes documented.',
    specs: [
      { key: 'Body style', value: 'Superstrat' },
      { key: 'Body wood', value: 'Special Reserve Swamp Ash' },
      { key: 'Pickup config', value: 'HH + 5-way coil split' },
      { key: 'Bridge', value: 'Maverick Floyd Rose — Licensed' },
      { key: 'Fretboard', value: 'Grade AA Indian Rosewood' },
    ],
    rarity: 'Pre-production prototype — never entered mass production',
  },
  {
    model: 'X1',
    series: 'Evolution',
    description: 'Explorer/Mockingbird-influenced body with aggressive angular styling. Available in both 6 and 7-string configurations. Used by Mindstorms and American Headcharge. The heaviest-looking guitar Maverick produced.',
    specs: [
      { key: 'Body style', value: 'Explorer / Mockingbird' },
    ],
  },
  {
    model: 'Matrix',
    series: 'Evolution',
    description: 'A standalone model occupying its own classification in the Maverick catalogue. Distinct from both the superstrat and angular X family.',
    specs: [],
  },
  {
    model: 'X-Treme',
    series: 'Evolution',
    description: 'Extreme Explorer/Mockingbird body with decorative lines routed through the paint into bare wood — on the body face behind the tremolo and on the headstock face between the tuners. Zebra pickups and a split Rosewood & Maple fingerboard complete a look found nowhere else in the range.',
    specs: [
      { key: 'Body style', value: 'Extreme Explorer / Mockingbird' },
      { key: 'Bridge', value: 'Tremolo' },
      { key: 'Fretboard', value: 'Split Rosewood & Maple' },
    ],
    rarity: 'Rare',
  },
  {
    model: 'G1',
    series: 'Evolution',
    description: 'Maverick\'s take on the Les Paul format. Single-cut body with Evolution roller pots, set-neck construction, and wraparound bridge. Rarer than the F-series models.',
    specs: [
      { key: 'Body style', value: 'Single Cut - LP style' },
      { key: 'Pickup config', value: 'HH' },
      { key: 'Bridge', value: 'Wraparound' },
      { key: 'Headstock', value: '3-aside' },
      { key: 'Frets', value: '22' },
    ],
    rarity: 'Low production',
  },
  {
    model: 'G2',
    series: 'Evolution',
    description: 'Second variant in the G-Series. Complements the G1 within the single-cut, humbucker-driven side of the Evolution catalogue.',
    specs: [
      { key: 'Body style', value: 'Single Cut - LP style' },
      { key: 'Pickup config', value: 'HH' },
      { key: 'Bridge', value: 'Wraparound' },
      { key: 'Headstock', value: '3-aside' },
      { key: 'Frets', value: '22' },
    ],
    rarity: 'Low production',
  },
  // ── Century ───────────────────────────────────────────────────────────────
  {
    model: 'Chaos 1',
    series: 'Century',
    description: 'Entry model in the Chaos range. A more affordable route into the Maverick catalogue while retaining the core construction philosophy.',
    specs: [],
  },
  {
    model: 'Chaos 2',
    series: 'Century',
    description: 'Upgraded Chaos variant with improved specification over the Chaos 1.',
    specs: [],
  },
  {
    model: 'Species 1',
    series: 'Century',
    description: 'The entry model in the Species range. A distinctive sub-series with its own body styling and identity separate from the core superstrat platform. All known Species examples have been observed in Gloss Black only.',
    specs: [
      { key: 'Body style', value: 'Species' },
    ],
  },
  {
    model: 'Species 2',
    series: 'Century',
    description: 'Mid-range Species variant. Builds on the Species 1 platform with a different pickup or hardware configuration.',
    specs: [
      { key: 'Body style', value: 'Species' },
    ],
  },
  {
    model: 'Species 3',
    series: 'Century',
    description: 'A pre-production single-cut prototype that predates the G-Series. Never commercially released. The only known Maverick single-cut that pre-dates the G1/G2, making it one of the most historically significant models in the catalogue.',
    specs: [
      { key: 'Body style', value: 'Single Cut - LP style' },
      { key: 'Pickup config', value: 'HH' },
      { key: 'Bridge', value: 'Tune-o-matic - String Through' },
      { key: 'Headstock', value: '3-aside' },
      { key: 'Frets', value: '24' },
      { key: 'Potentiometers', value: 'Factory Standard Through Body Pots' },
      { key: 'Switch', value: 'Factory 5 Way Blade Switch' },
    ],
    rarity: 'Pre-production — never in commercial production',
  },
  {
    model: 'Species 7 String',
    series: 'Century',
    description: 'Seven-string variant within the Species line. One of the few extended-range instruments Maverick offered alongside the X1.',
    specs: [
      { key: 'Body style', value: 'Species' },
    ],
    rarity: 'Rare',
  },
  // ── D-Tox ─────────────────────────────────────────────────────────────────
  {
    model: 'FD-Tox',
    series: 'D-Tox',
    description: 'F-platform variant within the D-Tox series. Shares the core superstrat construction approach with its own distinct identity.',
    specs: [
      { key: 'Body style', value: 'Superstrat' },
    ],
  },
  {
    model: 'XD-Tox',
    series: 'D-Tox',
    description: 'X-platform variant within the D-Tox series. Angular body platform of the X1 family carried into the D-Tox line.',
    specs: [
      { key: 'Body style', value: 'Explorer / Mockingbird' },
    ],
    rarity: 'Limited',
  },
  // ── Artist Signature ──────────────────────────────────────────────────────
  {
    model: 'JR4',
    series: 'Artist Signature',
    description: 'A limited production guitar with a direct tie to Jim Root of Stone Sour and Slipknot. Maverick provided Root with several prototypes to test, and he played them live — including at the 2002 Reading Festival. The signature relationship was never formalised and Root moved on, but Maverick went ahead and produced a limited run for the market regardless. Superstrat body with full Maverick contouring, no pickup surrounds, and a hardtail bridge. 24-fret rosewood fingerboard with centralised inlays. Controls are a single through-body pot (likely push-pull volume/tone) and a 5-way blade switch mounted below the bridge.',
    specs: [
      { key: 'Body style', value: 'Superstrat' },
      { key: 'Pickup config', value: 'HH' },
      { key: 'Bridge', value: 'Maverick/Wilkinson Hardtail' },
      { key: 'Headstock', value: 'Standard 6-aside (body-matched colour)' },
      { key: 'Frets', value: '24' },
      { key: 'Fretboard', value: 'AAA Indian Rosewood' },
      { key: 'Potentiometers', value: '1x push-pull' },
      { key: 'Switch', value: '5-way blade' },
    ],
    rarity: 'Limited production',
    notes: 'Not an official signature — Jim Root tested prototypes and played them live (2002 Reading Festival) but did not pursue the endorsement. One of the most historically significant models in the Maverick catalogue.',
  },
  // ── Nemesis (bass) ────────────────────────────────────────────────────────
  {
    model: 'B1',
    series: 'Nemesis',
    description: 'Maverick\'s first bass guitar, featured in the 2001 catalogue. Brought the same British-designed ethos and Korean manufacturing to the low end.',
    specs: [
      { key: 'Body style', value: 'Bass guitar' },
    ],
    rarity: 'Rarely seen',
  },
  {
    model: 'Z-47',
    series: 'Nemesis',
    description: 'A 4-string bass built on the Explorer/Mockingbird body platform — the only known Maverick bass to use this angular body shape. Features the Evolution Roller Pot complement in a straight-line configuration beneath the bridge. Bolt-on two-piece scarf joint neck with skunk stripe, 24-fret Indian Rosewood fingerboard, 4-aside headstock.',
    specs: [
      { key: 'Body style', value: 'Explorer-Mockingbird' },
      { key: 'Headstock', value: '4-aside' },
      { key: 'Frets', value: '24' },
      { key: 'Fretboard', value: 'AAA Indian Rosewood' },
      { key: 'Potentiometers', value: 'Factory Patented Evolution Roller Pots' },
    ],
    rarity: 'Rarely seen',
  },
  {
    model: 'S4',
    series: 'Nemesis',
    description: 'Maverick\'s 4-string bass, confirmed in the 2002 catalogue. Complemented the guitar range for full-band setups.',
    specs: [
      { key: 'Body style', value: 'Bass guitar (4-string)' },
    ],
  },
  {
    model: 'S5',
    series: 'Nemesis',
    description: 'The 5-string bass, introduced alongside the S4 in the 2002 catalogue. Extended low-end reach for players needing the additional low B string.',
    specs: [
      { key: 'Body style', value: 'Bass guitar (5-string)' },
    ],
  },
]

export const SERIES_ORDER = [
  'Evolution',
  'Century',
  'D-Tox',
  'Artist Signature',
  // Bass guitars below the divider
  'Nemesis',
]

export const BASS_SERIES = ['Nemesis']
