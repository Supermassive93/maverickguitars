import { MODEL_CATALOGUE, SERIES_ORDER, BASS_SERIES } from '@/data/models'
import { readPickupSvg, injectPickupColors } from '@/lib/pickup-svg'

const MODEL_NICKNAMES: Record<string, string> = {
  'SF-1': 'Streetfighter',
  'SF-3': 'Streetfighter',
}
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { Metadata } from 'next'
import Link from 'next/link'
import ModelCard from '@/components/ModelCard'

export const metadata: Metadata = {
  title: 'Model Guide — Maverick Guitars Registry',
  description: 'The complete Maverick Guitars model catalogue — 24 models across the Evolution, Century, D-Tox and Nemesis series.',
}

const subNav = [
  { href: '#range',   label: 'Model Guide' },
  { href: '#identify', label: 'Generation Guide' },
  { href: '#colours', label: 'Colour Guide' },
]

export default async function ModelsPage() {
  const supabase = await createSupabaseServerClient()

  type ColourRow = {
    id: string
    category: string
    display_name: string
    descriptor: string | null
    metadata: {
      hex: string | null
      hex_note: string | null
      hex_primary: string | null
      hex_secondary: string | null
      pattern: string | null
      pattern_description: string | null
      aka: string | null
      colour_source: string | null
      source_year: number | null
      style: string | null
    } | null
  }

  type SpecRow = {
    id: string
    model: string
    parent_model_id: string | null
    description: string | null
    rarity: string | null
  }
  const [{ data: rawSpecRows }, { data: rawCounts }, { data: rawColours }, { data: rawSourceColours }] = await Promise.all([
    supabase
      .from('model_specifications')
      .select('id, model, parent_model_id, description, rarity'),
    supabase
      .from('guitars')
      .select('model_id')
      .eq('status', 'Approved'),
    supabase
      .from('ref_values')
      .select('id, category, display_name, descriptor, metadata')
      .in('category', ['COL', 'CSC', 'HWC', 'PKC', 'CPKC', 'BNC', 'FMC'])
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('model_source_colours')
      .select('available_colours, source_materials(year)'),
  ])

  const specByModel = new Map<string, SpecRow>()
  for (const row of (rawSpecRows ?? []) as SpecRow[]) {
    specByModel.set(row.model, row)
  }

  // Only show rarity once ≥ 3 approved guitars exist for the model, keyed by model_id UUID
  const registryCountByModel = new Map<string, number>()
  for (const row of (rawCounts ?? []) as { model_id: string | null }[]) {
    if (!row.model_id) continue
    registryCountByModel.set(row.model_id, (registryCountByModel.get(row.model_id) ?? 0) + 1)
  }

  const colourRows = (rawColours ?? []) as ColourRow[]
  const cscRows  = colourRows.filter(r => r.category === 'CSC'  && r.id !== 'CSC-0004')
  const hwcRows  = colourRows.filter(r => r.category === 'HWC'  && r.id !== 'HWC-0004')
  const pkcRows  = colourRows.filter(r => r.category === 'PKC'  && r.id !== 'PKC-0005')
  const cpkcRows = colourRows.filter(r => r.category === 'CPKC' && r.id !== 'CPKC-0005')
  const bncRows  = colourRows.filter(r => r.category === 'BNC'  && r.id !== 'BNC-0004')
  const fmcRows  = colourRows.filter(r => r.category === 'FMC'  && r.id !== 'FMC-0005')

  // Group factory body colours by model year from model_source_colours — dynamic, no hardcoded years
  type SourceColourEntry = { available_colours: string[]; source_materials: { year: string | null } | null }
  const yearToColourIds = new Map<string, Set<string>>()
  for (const row of (rawSourceColours ?? []) as SourceColourEntry[]) {
    const year = row.source_materials?.year
    if (!year) continue
    const existing = yearToColourIds.get(year) ?? new Set<string>()
    for (const id of (row.available_colours ?? [])) existing.add(id)
    yearToColourIds.set(year, existing)
  }
  const sortedColourYears = [...yearToColourIds.keys()].sort()
  const colByYear = new Map(
    sortedColourYears.map(year => [
      year,
      colourRows.filter(r => r.category === 'COL' && (yearToColourIds.get(year)?.has(r.id) ?? false)),
    ])
  )

  const electricSeries = SERIES_ORDER.filter(s => !BASS_SERIES.includes(s))
  const bassSeries = SERIES_ORDER.filter(s => BASS_SERIES.includes(s))

  function seriesModels(series: string) {
    return MODEL_CATALOGUE.filter(m => m.series === series)
  }

  function swatchBg(row: ColourRow): string {
    const m = row.metadata
    if (!m) return 'rgba(255,255,255,0.05)'
    const { hex, hex_primary, hex_secondary, pattern } = m
    if (pattern === 'Striped' && hex_primary && hex_secondary)
      return `repeating-linear-gradient(0deg, ${hex_primary} 0px, ${hex_primary} 22px, ${hex_secondary} 22px, ${hex_secondary} 44px)`
    if (pattern === 'Burst' && hex) {
      const centre = row.id === 'COL-0013' ? '#C4903C' : '#F0C030'
      return `radial-gradient(ellipse at center, ${centre} 0%, ${hex} 72%)`
    }
    if (pattern === 'Natural Grain' && hex)
      return `repeating-linear-gradient(92deg, rgba(0,0,0,0.07) 0px, rgba(0,0,0,0.07) 1px, transparent 1px, transparent 7px), ${hex}`
    if (pattern === 'Gloss Metallic' && hex)
      return `linear-gradient(135deg, rgba(255,255,255,0.20) 0%, transparent 50%, rgba(255,255,255,0.06) 100%), ${hex}`
    if (pattern === 'Brushed' && hex)
      return `repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 1px, transparent 1px, transparent 4px), ${hex}`
    if (hex) return hex
    return 'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 8px)'
  }

  function swatchLabel(displayName: string): { code: string; name: string } {
    const parts = displayName.split(' — ')
    return parts.length >= 2
      ? { code: parts[0], name: parts.slice(1).join(' — ') }
      : { code: '', name: displayName }
  }

  function pickupSwatchHtml(row: ColourRow): string {
    const style = row.metadata?.style ?? 'covered'
    const primary = row.metadata?.hex_primary ?? '#1e1c1a'
    const secondary = row.metadata?.hex_secondary ?? undefined
    const filename =
      style === 'active'    ? 'pkp-0005-active' :
      style === 'open_coil' ? 'pkp-0001-a-type-open-bridge' :
                              'pkp-0001-a-type-nickel-bridge'
    try {
      return injectPickupColors(readPickupSvg(filename), primary, secondary, style)
    } catch {
      return ''
    }
  }

  function SeriesSection({ series, bass = false }: { series: string; bass?: boolean }) {
    const models = seriesModels(series)
    const accentColor = bass ? '#9e9b96' : '#c8a96e'

    return (
      <section style={{
        padding: '3rem 4rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ marginBottom: '20px' }}>
          <p style={{
            fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '3px',
            color: '#5c5a57', textTransform: 'uppercase', marginBottom: '8px',
          }}>
            {models.length} {models.length === 1 ? 'model' : 'models'}
          </p>
          <h2 style={{
            fontFamily: 'var(--font-bebas)',
            fontSize: 'clamp(32px, 4vw, 52px)',
            letterSpacing: '2px', lineHeight: 1,
            color: accentColor,
          }}>
            {series}
          </h2>
        </div>

        <div style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '1px',
          background: 'rgba(255,255,255,0.06)',
          paddingBottom: '2px',
        }}>
          {models.map(m => {
            const spec = specByModel.get(m.model)
            const description = spec?.description ?? m.description
            const rarityRaw = spec?.rarity ?? m.rarity
            const rarity = (registryCountByModel.get(spec?.id ?? '') ?? 0) >= 3 ? rarityRaw : null
            return (
              <ModelCard
                key={m.model}
                model={m.model}
                nickname={MODEL_NICKNAMES[m.model]}
                description={description ?? null}
                rarity={rarity ?? null}
                slug={m.model.toLowerCase().replace(/\s+/g, '-')}
                accentColor={accentColor}
                bass={bass}
              />
            )
          })}
        </div>
      </section>
    )
  }

  return (
    <>
      {/* Header */}
      <section id="range" style={{ scrollMarginTop: '56px' }} />{/* anchor target at top */}
      <section style={{
        padding: '6rem 4rem 4rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.02) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.02) 60px)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative' }}>
          <p style={{
            fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '3px',
            color: '#c8a96e', textTransform: 'uppercase', marginBottom: '16px',
          }}>
            Model Guide
          </p>
          <h1 style={{
            fontFamily: 'var(--font-bebas)',
            fontSize: 'clamp(52px, 7vw, 96px)',
            letterSpacing: '3px', lineHeight: 0.92,
            color: '#f0ede8', marginBottom: '24px',
          }}>
            THE RANGE
          </h1>
          <p style={{ maxWidth: '600px', color: '#9e9b96', fontSize: '16px', lineHeight: 1.7 }}>
            In 1997, hardware designer Trev Wilkinson introduced Maverick Guitars to a small custom
            workshop in Korea. Recognising the level of hand craftsmanship on offer, Maverick spent
            the next three years researching what contemporary players needed — and where existing
            manufacturing fell short. The first guitars reached the market in late 2000.
          </p>
          <p style={{ maxWidth: '600px', color: '#9e9b96', fontSize: '16px', lineHeight: 1.7, marginTop: '16px' }}>
            British-designed and Korean-built, the range spanned 24 models across four catalogue
            series — featuring the patented Evolution roller volume and tone system as one of several
            in-house developments that set Maverick apart from the broader market.
          </p>
        </div>
      </section>

      {/* Sticky section sub-nav */}
      <div style={{
        position: 'sticky', top: '56px', zIndex: 50,
        background: 'rgba(14,14,14,0.97)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
      }}>
        {subNav.map(item => (
          <a key={item.href} href={item.href} className="subnav-link">
            {item.label}
          </a>
        ))}
      </div>

      {/* Electric guitar series */}
      {electricSeries.map(series => (
        <SeriesSection key={series} series={series} />
      ))}

      {/* Bass guitars divider */}
      <div style={{
        padding: '4rem 4rem 3rem',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <p style={{
          fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '3px',
          color: '#5c5a57', textTransform: 'uppercase', marginBottom: '12px',
        }}>
          Low end
        </p>
        <h2 style={{
          fontFamily: 'var(--font-bebas)',
          fontSize: 'clamp(42px, 5vw, 72px)',
          letterSpacing: '3px', lineHeight: 0.95,
          color: '#9e9b96',
        }}>
          BASS GUITARS
        </h2>
        <p style={{
          maxWidth: '520px', color: '#5c5a57', fontSize: '14px',
          lineHeight: 1.7, marginTop: '16px',
          fontFamily: 'var(--font-dm-mono)',
        }}>
          The Nemesis series covers Maverick&apos;s full bass range. The B1 and Z-47 predate
          the Nemesis branding appearing in catalogues but are referenced as Nemesis in
          secondary market listings — Registry Derived. The S4 and S5 are Catalogue Confirmed
          from the 2002 catalogue.
        </p>
      </div>

      {/* Bass series */}
      {bassSeries.map(series => (
        <SeriesSection key={series} series={series} bass />
      ))}

      {/* Footer note */}
      <section style={{ padding: '4rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <p style={{
          fontFamily: 'var(--font-dm-mono)', fontSize: '13px',
          color: '#5c5a57', lineHeight: 1.7, maxWidth: '600px',
        }}>
          Model descriptions are based on catalogue sources, press references, and documented registry examples.
          If you own a Maverick in a series not yet well-documented,{' '}
          <Link href="/submit" style={{ color: '#c8a96e', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
            register your guitar
          </Link>{' '}
          to help complete the archive.
        </p>
      </section>

      {/* ── GENERATION GUIDE ── */}
      <section id="identify" style={{ scrollMarginTop: '100px' }}>
        {/* Section header */}
        <div style={{
          padding: '5rem 4rem 4rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'relative', overflow: 'hidden',
          background: 'rgba(255,255,255,0.01)',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.015) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.015) 60px)',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative' }}>
            <p style={{
              fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '3px',
              color: '#c8a96e', textTransform: 'uppercase', marginBottom: '16px',
            }}>Generation Guide</p>
            <h2 style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: 'clamp(52px, 7vw, 88px)',
              letterSpacing: '3px', lineHeight: 0.92,
              color: '#f0ede8', marginBottom: '24px',
            }}>IDENTIFY YOUR GEN</h2>
            <p style={{ maxWidth: '600px', color: '#9e9b96', fontSize: '16px', lineHeight: 1.7 }}>
              Maverick produced guitars across four identifiable production periods. Confirmed physical
              indicators and catalogue evidence establish clear separators applicable across all models
              in the range — not just the flagship F1.
            </p>
          </div>
        </div>

        {/* Caveat */}
        <div style={{
          padding: '1.25rem 4rem',
          background: 'rgba(200,169,110,0.04)',
          borderBottom: '1px solid rgba(200,169,110,0.12)',
        }}>
          <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#8b6e3f', lineHeight: 1.7, maxWidth: '820px' }}>
            <span style={{ color: '#c8a96e', letterSpacing: '1px', textTransform: 'uppercase', marginRight: '10px' }}>Note</span>
            Generation boundaries are based on catalogue evidence and physical examples. Where evidence is limited, indicators are marked Tentative.
            If your guitar doesn&apos;t match what&apos;s described here —{' '}
            <Link href="/submit" style={{ color: '#c8a96e', textDecoration: 'underline', textUnderlineOffset: '3px' }}>register it</Link>
            {' '}to help extend the picture.
          </p>
        </div>

        {/* Generation timeline */}
        <div style={{ padding: '3rem 4rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{
            fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '3px',
            color: '#5c5a57', textTransform: 'uppercase', marginBottom: '24px',
          }}>Production timeline</p>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px',
            background: 'rgba(255,255,255,0.06)',
          }}>
            {[
              { gen: 'Gen 0.5', years: '2000 – 2001', colour: '#b8965a', desc: 'First production run. Foil decal headstock logo, Bubinga neck laminate, Maverick Stylised ® trademark on most models. Truss rod cover on F1, X1, B1 and SF-1.' },
              { gen: 'Gen 1', years: '2001 – 2003', colour: '#c8a96e', desc: 'Main catalogue period. Ivory silkscreen headstock logo, silver serial, Maverick Stylised ® trademark. No pickup surrounds. Core production run.' },
              { gen: 'Gen 2', years: '2004 – 2007', colour: '#9e9b96', desc: 'Final production period. Metal pickup surrounds, Industry Standard ® trademark, stencil bridge logo, C/D neck profile, O-ring removed from switch knob.' },
              { gen: 'Pre-production', years: 'Pre 2000', colour: '#3a3835', desc: 'Prototype and pre-series models only. No headstock trademark. Mixed construction. Includes Species 3 and SF-3. Not commercially released.' },
            ].map(item => (
              <div key={item.gen} style={{ background: '#161616', padding: '1.75rem' }}>
                <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '26px', letterSpacing: '2px', color: item.colour, lineHeight: 1, marginBottom: '4px' }}>
                  {item.gen}
                </div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: item.colour, opacity: 0.7, marginBottom: '10px' }}>
                  {item.years}
                </div>
                <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#5c5a57', lineHeight: 1.65 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quickest test */}
        <div style={{ padding: '4rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{
            fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '3px',
            color: '#5c5a57', textTransform: 'uppercase', marginBottom: '16px',
          }}>The quickest test</p>
          <h3 style={{
            fontFamily: 'var(--font-bebas)', fontSize: 'clamp(28px, 3vw, 44px)',
            letterSpacing: '2px', color: '#f0ede8', marginBottom: '20px',
          }}>LOOK AT THE PICKUPS</h3>
          <p style={{ color: '#9e9b96', fontSize: '15px', lineHeight: 1.75, maxWidth: '680px', marginBottom: '32px' }}>
            The single most reliable visual separator between Gen 2 and all earlier production is the pickup surrounds.
            Does a metal frame surround each pickup, or does it sit flush in a routed cavity with body finish visible around it?
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px',
            background: 'rgba(255,255,255,0.06)', maxWidth: '680px',
          }}>
            <div style={{ background: '#161616', padding: '1.75rem' }}>
              <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '22px', letterSpacing: '2px', color: '#c8a96e', marginBottom: '10px' }}>
                No surround → Gen 0.5 or Gen 1
              </div>
              <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#9e9b96', lineHeight: 1.65 }}>
                Pickup sits flush in the routed cavity. Present throughout both the 2001 and 2002 catalogues. Use the additional indicators below to separate Gen 0.5 from Gen 1.
              </p>
            </div>
            <div style={{ background: '#161616', padding: '1.75rem', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '22px', letterSpacing: '2px', color: '#9e9b96', marginBottom: '10px' }}>
                Surround present → Gen 2
              </div>
              <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#9e9b96', lineHeight: 1.65 }}>
                A metal frame surrounds each pickup housing. Confirmed Gen 2 indicator across all documented examples.
              </p>
            </div>
          </div>
        </div>

        {/* 4-column comparison table */}
        <div style={{ padding: '4rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{
            fontFamily: 'var(--font-bebas)', fontSize: 'clamp(28px, 3vw, 44px)',
            letterSpacing: '2px', color: '#f0ede8', marginBottom: '8px',
          }}>CONFIRMED INDICATORS</h3>
          <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '13px', color: '#5c5a57', marginBottom: '32px', maxWidth: '640px', lineHeight: 1.6 }}>
            Derived from gen spec data across all models. Evolution Roller Pots and Maverick-branded Gotoh-style tuners are consistent throughout all generations — they are production constants, not separators.
          </p>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '1px' }}>
            <div style={{ background: '#111', padding: '0.75rem 1.5rem' }}>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#5c5a57' }}>Feature</span>
            </div>
            <div style={{ background: '#111', padding: '0.75rem 1.5rem', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '18px', letterSpacing: '2px', color: '#b8965a' }}>Gen 0.5</span>
            </div>
            <div style={{ background: '#111', padding: '0.75rem 1.5rem', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '18px', letterSpacing: '2px', color: '#c8a96e' }}>Gen 1</span>
            </div>
            <div style={{ background: '#111', padding: '0.75rem 1.5rem', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '18px', letterSpacing: '2px', color: '#9e9b96' }}>Gen 2</span>
            </div>
          </div>

          {[
            {
              label: 'Pickup surrounds', note: null, confidence: 'Confirmed' as const,
              gen05: 'None — flush-mounted in routed cavity',
              gen1:  'None — flush-mounted in routed cavity',
              gen2:  'Metal surrounds on all models',
            },
            {
              label: 'Headstock trademark', note: 'Strongest Gen 1 → Gen 2 separator', confidence: 'Confirmed' as const,
              gen05: 'Maverick Stylised ® on most models — absent on F2 and F3',
              gen1:  'Maverick Stylised ® confirmed across all catalogued models',
              gen2:  'Industry Standard ® — different symbol and placement',
            },
            {
              label: 'Headstock logo', note: null, confidence: 'Confirmed' as const,
              gen05: 'Lacquer-encapsulated foil decal',
              gen1:  'Ivory silkscreen print',
              gen2:  'Ivory silkscreen print',
            },
            {
              label: 'Serial number style', note: null, confidence: 'Confirmed' as const,
              gen05: 'Label (F1) or plain silkscreen (F2, X1) — no silver finish',
              gen1:  'Silver silkscreen',
              gen2:  'Silver silkscreen',
            },
            {
              label: 'Neck wood', note: null, confidence: 'Confirmed' as const,
              gen05: 'Canadian Maple with Bubinga laminate — visible as dark stripe on neck back',
              gen1:  'Canadian Maple — single species, no Bubinga stripe',
              gen2:  'Canadian Maple — single species, no Bubinga stripe',
            },
            {
              label: 'Switch knob', note: null, confidence: 'Confirmed' as const,
              gen05: 'Cylindrical barrel with rubber O-rings',
              gen1:  'Cylindrical barrel with rubber O-rings (cylindrical-knob models)',
              gen2:  'Cylindrical barrel without O-rings, or tapered knob',
            },
            {
              label: 'Bridge logo', note: null, confidence: 'Confirmed' as const,
              gen05: 'Classic Script — flowing cursive on bridge plate',
              gen1:  'Classic Script — flowing cursive on bridge plate',
              gen2:  'Stencil Script — block-style logo on bridge plate',
            },
            {
              label: 'Neck profile', note: null, confidence: 'Confirmed' as const,
              gen05: 'Ultra Thin — Shallow C shape',
              gen1:  'Ultra Thin — Shallow C shape',
              gen2:  'C/D shape; Composite V→D on F4',
            },
            {
              label: 'Neck construction', note: 'Bolt-on models only — G-series is set-neck throughout', confidence: 'Tentative' as const,
              gen05: '3-piece laminated scarf joint',
              gen1:  '3-piece laminated scarf joint (bolt-on models)',
              gen2:  '1-piece carved — no scarf joint confirmed on any bolt-on model',
            },
          ].map((row, i, arr) => {
            const confColour = row.confidence === 'Confirmed' ? '#c8a96e' : '#7a6a4f'
            const confBg    = row.confidence === 'Confirmed' ? 'rgba(200,169,110,0.08)' : 'rgba(200,169,110,0.04)'
            return (
              <div key={row.label} style={{
                display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '1px',
                background: 'rgba(255,255,255,0.06)',
                marginBottom: i < arr.length - 1 ? '1px' : '0',
              }}>
                <div style={{ background: '#161616', padding: '1.25rem 1.5rem' }}>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '13px', color: '#f0ede8', marginBottom: '6px' }}>{row.label}</div>
                  {row.note && (
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#5c5a57', marginBottom: '6px', lineHeight: 1.4 }}>{row.note}</div>
                  )}
                  <div style={{ display: 'inline-block', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: confColour, background: confBg, padding: '2px 7px' }}>
                    {row.confidence}
                  </div>
                </div>
                <div style={{ background: '#161616', padding: '1.25rem 1.5rem', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#9e9b96', lineHeight: 1.55 }}>{row.gen05}</p>
                </div>
                <div style={{ background: '#161616', padding: '1.25rem 1.5rem', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#9e9b96', lineHeight: 1.55 }}>{row.gen1}</p>
                </div>
                <div style={{ background: '#161616', padding: '1.25rem 1.5rem', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#9e9b96', lineHeight: 1.55 }}>{row.gen2}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Model-specific notes */}
        <div style={{ padding: '4rem' }}>
          <h3 style={{
            fontFamily: 'var(--font-bebas)', fontSize: 'clamp(28px, 3vw, 44px)',
            letterSpacing: '2px', color: '#f0ede8', marginBottom: '32px',
          }}>MODEL-SPECIFIC NOTES</h3>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1px', background: 'rgba(255,255,255,0.06)',
          }}>
            {[
              {
                model: 'F1, X1, B1, SF-1', badge: 'Confirmed', badgeGold: true,
                body: 'Gen 0.5 examples carry a Maverick truss rod cover — a plastic cover over the headstock truss rod access. Absent from Gen 1 onwards and absent from F2 and F3 in Gen 0.5. A useful secondary identifier for these four models in the earliest production run.',
              },
              {
                model: 'F2', badge: 'Confirmed', badgeGold: true,
                body: 'Gen 1 examples carry a ~1° neck pitch requiring ~8mm body packing — PRS-equivalent geometry producing exceptionally low action potential. No truss rod cover despite being a Gen 0.5 model. Confirmed available in Tobacco Burst and Fireburst per the 2002 catalogue.',
              },
              {
                model: 'SF-1', badge: 'Confirmed', badgeGold: true,
                body: 'Retailer-commissioned limited run with reverse headstock and Wilkinson hardware throughout — outside the normal production spec for any generation. As few as 4 known examples in certain colourways. Generation assignment should be treated with caution.',
              },
              {
                model: 'X1', badge: 'Tentative', badgeGold: false,
                body: 'Available in 6 and 7-string configurations. The 7-string variant is rarer and generation placement is unconfirmed. If you own an X1 7-string, register it.',
              },
            ].map(item => (
              <div key={item.model} style={{ background: '#161616', padding: '2rem' }}>
                <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '36px', color: '#c8a96e', letterSpacing: '3px', lineHeight: 1, marginBottom: '8px' }}>
                  {item.model}
                </div>
                <div style={{
                  display: 'inline-block', marginBottom: '14px',
                  fontFamily: 'var(--font-dm-mono)', fontSize: '10px',
                  letterSpacing: '1.5px', textTransform: 'uppercase',
                  color: item.badgeGold ? '#c8a96e' : '#7a6a4f',
                  background: item.badgeGold ? 'rgba(200,169,110,0.08)' : 'rgba(200,169,110,0.04)',
                  padding: '2px 7px',
                }}>{item.badge}</div>
                <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#9e9b96', lineHeight: 1.65 }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ── COLOUR GUIDE ── */}
      <section id="colours" style={{ scrollMarginTop: '100px' }}>

        {/* Section header */}
        <div style={{
          padding: '5rem 4rem 4rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'relative', overflow: 'hidden',
          background: 'rgba(255,255,255,0.01)',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.015) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.015) 60px)',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative' }}>
            <p style={{
              fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '3px',
              color: '#c8a96e', textTransform: 'uppercase', marginBottom: '16px',
            }}>Colour Guide</p>
            <h2 style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: 'clamp(52px, 7vw, 88px)',
              letterSpacing: '3px', lineHeight: 0.92,
              color: '#f0ede8', marginBottom: '24px',
            }}>THE PALETTE</h2>
            <p style={{ maxWidth: '600px', color: '#9e9b96', fontSize: '16px', lineHeight: 1.7 }}>
              All known Maverick body finishes — factory catalogue colours and confirmed custom shop options.
              Grouped by source material.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{
          padding: '1.25rem 4rem',
          background: 'rgba(200,169,110,0.04)',
          borderBottom: '1px solid rgba(200,169,110,0.12)',
        }}>
          <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#8b6e3f', lineHeight: 1.7, maxWidth: '820px' }}>
            <span style={{ color: '#c8a96e', letterSpacing: '1px', textTransform: 'uppercase', marginRight: '10px' }}>Note</span>
            Swatches are approximate — sampled from printed catalogue material and rendered as flat colour.
            Metallic, burst, and natural-grain finishes will differ significantly in person.
          </p>
        </div>

        {/* Factory colours — dynamic by model year */}
        {sortedColourYears.map(year => {
          const colours = colByYear.get(year) ?? []
          if (!colours.length) return null
          return (
            <div key={year} style={{ padding: '3rem 4rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ marginBottom: '24px' }}>
                <p style={{
                  fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '3px',
                  color: '#5c5a57', textTransform: 'uppercase', marginBottom: '8px',
                }}>Factory Colours · {colours.length} colours</p>
                <h3 style={{
                  fontFamily: 'var(--font-bebas)', fontSize: 'clamp(28px, 3vw, 44px)',
                  letterSpacing: '2px', color: '#c8a96e', lineHeight: 1,
                }}>{year}</h3>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '1px', background: 'rgba(255,255,255,0.06)',
              }}>
                {colours.map(row => {
                  const { code, name } = swatchLabel(row.display_name)
                  return (
                    <div key={row.id} style={{ background: '#161616' }}>
                      <div
                        title={row.metadata?.hex_note ?? undefined}
                        style={{ height: '100px', background: swatchBg(row) }}
                      />
                      <div style={{ padding: '12px 14px' }}>
                        {code && <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '20px', letterSpacing: '2px', color: '#c8a96e', lineHeight: 1, marginBottom: '3px' }}>{code}</div>}
                        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#9e9b96', lineHeight: 1.4 }}>{name}</div>
                        {row.metadata?.pattern && (
                          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: '#3a3835', marginTop: '6px' }}>
                            {row.metadata.pattern}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Factory pickup colours */}
        {pkcRows.length > 0 && (
          <div style={{ padding: '3rem 4rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ marginBottom: '24px' }}>
              <p style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '3px',
                color: '#5c5a57', textTransform: 'uppercase', marginBottom: '8px',
              }}>Factory Pickup Colours · {pkcRows.length} options</p>
              <h3 style={{
                fontFamily: 'var(--font-bebas)', fontSize: 'clamp(28px, 3vw, 44px)',
                letterSpacing: '2px', color: '#c8a96e', lineHeight: 1,
              }}>Factory Pickup Colours</h3>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
              gap: '1px', background: 'rgba(255,255,255,0.06)',
            }}>
              {pkcRows.map(row => {
                const { code, name } = swatchLabel(row.display_name)
                return (
                  <div key={row.id} style={{ background: '#161616' }}>
                    <div style={{ height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      dangerouslySetInnerHTML={{ __html: pickupSwatchHtml(row) }}
                    />
                    <div style={{ padding: '10px 14px' }}>
                      {code && <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '20px', letterSpacing: '2px', color: '#c8a96e', lineHeight: 1, marginBottom: '3px' }}>{code}</div>}
                      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#9e9b96', lineHeight: 1.4 }}>{name}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Hardware colours */}
        {hwcRows.length > 0 && (
          <div style={{ padding: '3rem 4rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ marginBottom: '24px' }}>
              <p style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '3px',
                color: '#5c5a57', textTransform: 'uppercase', marginBottom: '8px',
              }}>Hardware Finishes · {hwcRows.length} options</p>
              <h3 style={{
                fontFamily: 'var(--font-bebas)', fontSize: 'clamp(28px, 3vw, 44px)',
                letterSpacing: '2px', color: '#c8a96e', lineHeight: 1,
              }}>Hardware Colours</h3>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '1px', background: 'rgba(255,255,255,0.06)',
            }}>
              {hwcRows.map(row => {
                const { code, name } = swatchLabel(row.display_name)
                return (
                  <div key={row.id} style={{ background: '#161616' }}>
                    <div
                      title={row.metadata?.hex_note ?? undefined}
                      style={{ height: '100px', background: swatchBg(row) }}
                    />
                    <div style={{ padding: '12px 14px' }}>
                      {code && <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '20px', letterSpacing: '2px', color: '#c8a96e', lineHeight: 1, marginBottom: '3px' }}>{code}</div>}
                      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#9e9b96', lineHeight: 1.4 }}>{name}</div>
                      {row.metadata?.pattern && (
                        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: '#3a3835', marginTop: '6px' }}>
                          {row.metadata.pattern}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Binding colours */}
        {bncRows.length > 0 && (
          <div style={{ padding: '3rem 4rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ marginBottom: '24px' }}>
              <p style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '3px',
                color: '#5c5a57', textTransform: 'uppercase', marginBottom: '8px',
              }}>Binding · {bncRows.length} options</p>
              <h3 style={{
                fontFamily: 'var(--font-bebas)', fontSize: 'clamp(28px, 3vw, 44px)',
                letterSpacing: '2px', color: '#c8a96e', lineHeight: 1,
              }}>Binding Colours</h3>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '1px', background: 'rgba(255,255,255,0.06)',
            }}>
              {bncRows.map(row => {
                const { code, name } = swatchLabel(row.display_name)
                return (
                  <div key={row.id} style={{ background: '#161616' }}>
                    <div
                      title={row.metadata?.hex_note ?? undefined}
                      style={{ height: '100px', background: swatchBg(row) }}
                    />
                    <div style={{ padding: '12px 14px' }}>
                      {code && <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '20px', letterSpacing: '2px', color: '#c8a96e', lineHeight: 1, marginBottom: '3px' }}>{code}</div>}
                      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#9e9b96', lineHeight: 1.4 }}>{name}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Fretboard marker colours */}
        {fmcRows.length > 0 && (
          <div style={{ padding: '3rem 4rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ marginBottom: '24px' }}>
              <p style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '3px',
                color: '#5c5a57', textTransform: 'uppercase', marginBottom: '8px',
              }}>Fretboard Markers · {fmcRows.length} options</p>
              <h3 style={{
                fontFamily: 'var(--font-bebas)', fontSize: 'clamp(28px, 3vw, 44px)',
                letterSpacing: '2px', color: '#c8a96e', lineHeight: 1,
              }}>Fretboard Marker Colours</h3>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '1px', background: 'rgba(255,255,255,0.06)',
            }}>
              {fmcRows.map(row => {
                const { code, name } = swatchLabel(row.display_name)
                return (
                  <div key={row.id} style={{ background: '#161616' }}>
                    <div
                      title={row.metadata?.hex_note ?? undefined}
                      style={{ height: '100px', background: swatchBg(row) }}
                    />
                    <div style={{ padding: '12px 14px' }}>
                      {code && <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '20px', letterSpacing: '2px', color: '#c8a96e', lineHeight: 1, marginBottom: '3px' }}>{code}</div>}
                      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#9e9b96', lineHeight: 1.4 }}>{name}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Custom shop colours */}
        {cscRows.length > 0 && (
          <div style={{ padding: '3rem 4rem' }}>
            <div style={{ marginBottom: '24px' }}>
              <p style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '3px',
                color: '#5c5a57', textTransform: 'uppercase', marginBottom: '8px',
              }}>Custom Shop · {cscRows.length} options</p>
              <h3 style={{
                fontFamily: 'var(--font-bebas)', fontSize: 'clamp(28px, 3vw, 44px)',
                letterSpacing: '2px', color: '#9e9b96', lineHeight: 1,
              }}>Custom Shop Colours</h3>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '1px', background: 'rgba(255,255,255,0.06)',
            }}>
              {cscRows.map(row => {
                const { code, name } = swatchLabel(row.display_name)
                return (
                  <div key={row.id} style={{ background: '#161616' }}>
                    <div
                      title={row.metadata?.hex_note ?? undefined}
                      style={{ height: '100px', background: swatchBg(row) }}
                    />
                    <div style={{ padding: '12px 14px' }}>
                      {code && <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '20px', letterSpacing: '2px', color: '#9e9b96', lineHeight: 1, marginBottom: '3px' }}>{code}</div>}
                      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#9e9b96', lineHeight: 1.4 }}>{name}</div>
                      {row.metadata?.aka && (
                        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#5c5a57', marginTop: '4px' }}>
                          {row.metadata.aka}
                        </div>
                      )}
                      {row.metadata?.pattern && (
                        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: '#3a3835', marginTop: '6px' }}>
                          {row.metadata.pattern}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Custom shop pickup colours */}
        {cpkcRows.length > 0 && (
          <div style={{ padding: '3rem 4rem' }}>
            <div style={{ marginBottom: '24px' }}>
              <p style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '3px',
                color: '#5c5a57', textTransform: 'uppercase', marginBottom: '8px',
              }}>Custom Shop · {cpkcRows.length} options</p>
              <h3 style={{
                fontFamily: 'var(--font-bebas)', fontSize: 'clamp(28px, 3vw, 44px)',
                letterSpacing: '2px', color: '#9e9b96', lineHeight: 1,
              }}>Custom Shop Pickup Colours</h3>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
              gap: '1px', background: 'rgba(255,255,255,0.06)',
            }}>
              {cpkcRows.map(row => {
                const { code, name } = swatchLabel(row.display_name)
                return (
                  <div key={row.id} style={{ background: '#161616' }}>
                    <div style={{ height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      dangerouslySetInnerHTML={{ __html: pickupSwatchHtml(row) }}
                    />
                    <div style={{ padding: '10px 14px' }}>
                      {code && <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '20px', letterSpacing: '2px', color: '#9e9b96', lineHeight: 1, marginBottom: '3px' }}>{code}</div>}
                      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#9e9b96', lineHeight: 1.4 }}>{name}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </section>
    </>
  )
}
