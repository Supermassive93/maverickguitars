import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getRefValues, r } from '@/lib/ref-values'
import type { ModelSpec, ModelGenSpec } from '@/lib/types'
import { resolvePickupSvg, type SvgMapRow } from '@/lib/pickup-svg'
import { MODEL_CATALOGUE, SERIES_ORDER, BASS_SERIES } from '@/data/models'

export const revalidate = 60

type ColourMeta = {
  hex?: string | null
  hex_primary?: string | null
  hex_secondary?: string | null
  pattern?: string | null
}

type PickupMeta = {
  style?: string | null
  hex_primary?: string | null
  hex_secondary?: string | null
}

function swatchBg(refId: string, meta: ColourMeta | null): string | null {
  if (!meta) return null
  const { hex, hex_primary, hex_secondary, pattern } = meta
  if (pattern === 'Striped' && hex_primary && hex_secondary)
    return `repeating-linear-gradient(0deg, ${hex_primary} 0px, ${hex_primary} 10px, ${hex_secondary} 10px, ${hex_secondary} 20px)`
  if (pattern === 'Burst' && hex) {
    const centre = hex_primary ?? (refId === 'COL-0013' ? '#C4903C' : '#F0C030')
    return `radial-gradient(ellipse at center, ${centre} 0%, ${hex} 72%)`
  }
  if (pattern === 'Natural Grain' && hex)
    return `repeating-linear-gradient(92deg, rgba(0,0,0,0.07) 0px, rgba(0,0,0,0.07) 1px, transparent 1px, transparent 7px), ${hex}`
  if (pattern === 'Gloss Metallic' && hex)
    return `linear-gradient(135deg, rgba(255,255,255,0.20) 0%, transparent 50%, rgba(255,255,255,0.06) 100%), ${hex}`
  if (pattern === 'Brushed' && hex)
    return `repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 1px, transparent 1px, transparent 4px), ${hex}`
  return hex ?? null
}

// Always renders — shows "—" for null so every field is visible for review
function SpecRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  const hasValue = value !== null && value !== undefined && value !== ''
  return (
    <div style={{
      display: 'flex', gap: '16px', padding: '8px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px',
    }}>
      <span style={{ color: '#5c5a57', width: '180px', flexShrink: 0, fontFamily: 'var(--font-dm-mono)', fontSize: '11px' }}>
        {label}
      </span>
      <span style={{ color: hasValue ? '#f0ede8' : '#2e2d2b' }}>{hasValue ? String(value) : '—'}</span>
    </div>
  )
}

// Section header within a spec block
function SpecGroup({ label }: { label: string }) {
  return (
    <p style={{
      fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px',
      textTransform: 'uppercase', color: '#3a3835',
      marginTop: '16px', marginBottom: '4px',
    }}>
      {label}
    </p>
  )
}

function ColourSwatches({ colours, colourMetaMap, refMap }: {
  colours: string[]
  colourMetaMap: Record<string, ColourMeta>
  refMap: Record<string, string>
}) {
  if (!colours.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', paddingTop: '4px' }}>
      {colours.map(colId => {
        const name = r(refMap, colId) ?? colId
        const parts = name.split(' — ')
        const code = parts.length >= 2 ? parts[0] : name
        const label = parts.length >= 2 ? parts[1] : ''
        const bg = swatchBg(colId, colourMetaMap[colId] ?? null)
        return (
          <div key={colId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '56px' }}>
            <div style={{
              width: '36px', height: '36px', flexShrink: 0,
              background: bg ?? 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
            }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#c8a96e', letterSpacing: '0.5px' }}>
                {code}
              </div>
              {label && (
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#5c5a57', marginTop: '2px', lineHeight: 1.3 }}>
                  {label}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PickupSwatches({ pickupIds, pickupMetaMap, refMap, neckPkp, middlePkp, bridgePkp, svgMap }: {
  pickupIds: string[]
  pickupMetaMap: Record<string, PickupMeta>
  refMap: Record<string, string>
  neckPkp: string | null
  middlePkp: string | null
  bridgePkp: string | null
  svgMap: SvgMapRow[]
}) {
  if (!pickupIds.length) return null

  // Active positions in bridge→middle→neck order (left to right), excluding None (PKP-0010)
  const positions: Array<{ pkpId: string; posId: string }> = []
  if (bridgePkp && bridgePkp !== 'PKP-0010') positions.push({ pkpId: bridgePkp, posId: 'POS-0003' })
  if (middlePkp && middlePkp !== 'PKP-0010') positions.push({ pkpId: middlePkp, posId: 'POS-0002' })
  if (neckPkp   && neckPkp   !== 'PKP-0010') positions.push({ pkpId: neckPkp,   posId: 'POS-0001' })

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '60px', paddingTop: '4px' }}>
      {pickupIds.map(id => {
        const full    = r(refMap, id) ?? id
        const parts   = full.split(' — ')
        const code    = parts.length >= 2 ? parts[0] : ''
        const label   = parts.length >= 2 ? parts[1] : full
        const meta    = pickupMetaMap[id] ?? null
        const primary = meta?.hex_primary ?? '#1e1c1a'
        const secondary = meta?.hex_secondary ?? undefined
        const pkcStyle  = meta?.style ?? null

        const icons = positions
          .map(({ pkpId, posId }) => resolvePickupSvg(svgMap, pkpId, posId, pkcStyle, primary, secondary))
          .filter((s): s is string => s !== null)

        return (
          <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
              {icons.length > 0
                ? icons.map((html, i) => (
                    <div key={i} style={{ lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: html }} />
                  ))
                : <div style={{ width: 38, height: 70, background: primary, borderRadius: 4 }} />
              }
            </div>
            {code && (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#c8a96e', letterSpacing: '0.5px' }}>
                {code}
              </div>
            )}
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#5c5a57', textAlign: 'center', maxWidth: '80px', lineHeight: 1.4 }}>
              {label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Universal specification — all fields that apply across all generations
type VersionedValue = { value: string; year: string | null; title: string }
function SpecBlock({ spec, refMap, versionedSpecs, productionYears, hidePickups }: { spec: Partial<ModelSpec>; refMap: Record<string, string>; versionedSpecs: Record<string, VersionedValue[]>; productionYears: string | null; hidePickups?: boolean }) {
  return (
    <div>
      <SpecGroup label="Production Info" />
      <SpecRow label="Production years"     value={productionYears} />
      <SpecRow label="Strings"              value={spec.string_count != null ? `${spec.string_count}-string` : null} />
      {/* TODO: Serial Range — derive min/max serial_number_only from approved registry guitars for this model */}
      <SpecRow label="Serial range"         value={null} />
      <SpecRow label="Original RRP"         value={spec.original_rrp != null ? `£${spec.original_rrp}` : 'Unknown'} />
      <SpecRow label="Serial prefix"        value={spec.serial_prefix} />
      <SpecRow label="Weight"               value={spec.weight_kg != null ? `${spec.weight_kg}kg` : null} />
      <SpecRow label="Left handed option"   value={r(refMap, spec.left_handed_available)} />
      <SpecRow label="Left handed RRP"      value={spec.left_handed_rrp != null ? `£${spec.left_handed_rrp}` : null} />

      <SpecGroup label="Body" />
      <SpecRow label="Body design analogue"  value={r(refMap, spec.body_shape_analogue)} />
      <SpecRow label="Maverick body family"  value={r(refMap, spec.maverick_body_family)} />
      <SpecRow label="Body wood"            value={r(refMap, spec.body_wood)} />
      <SpecRow label="Body construction"    value={r(refMap, spec.body_construction)} />
      <SpecRow label="Joint type"           value={r(refMap, spec.joint_type)} />
      <SpecRow label="Bookmatched"          value={r(refMap, spec.body_bookmatched)} />
      <SpecRow label="Body contouring"       value={r(refMap, spec.body_carving)} />
      <SpecRow label="Decorative body routing" value={r(refMap, spec.body_decorative_routing)} />

      <SpecGroup label="Pickups & electronics" />
      <SpecRow label="Pickup configuration" value={r(refMap, spec.pickup_configuration)} />
      <SpecRow label="Coil tap"             value={r(refMap, spec.coil_tap)} />
      <SpecRow label="Volume pot"           value={r(refMap, spec.volume_pot)} />
      <SpecRow label="Volume pot count"     value={spec.volume_pot_count} />
      <SpecRow label="Tone pot"             value={r(refMap, spec.tone_pot)} />
      <SpecRow label="Tone pot count"       value={spec.tone_pot_count} />

      <SpecGroup label="Hardware" />
      <SpecRow label="Bridge"               value={r(refMap, spec.bridge_type)} />

      <SpecGroup label="Neck" />
      <SpecRow label="Neck mount"           value={r(refMap, spec.neck_mount)} />
      <SpecRow label="Truss rod"            value={r(refMap, spec.truss_rod)} />
      <SpecRow label="Fretboard"            value={r(refMap, spec.fretboard_wood)} />
      <SpecRow label="Fretboard radius"     value={spec.fretboard_radius_mm != null ? `${spec.fretboard_radius_mm}mm` : null} />
      <SpecRow label="Fret count"           value={r(refMap, spec.fret_count)} />
      <SpecRow label="Scale length"         value={r(refMap, spec.scale_length)} />
      <SpecRow label="Nut type"             value={r(refMap, spec.nut_type)} />
      <SpecRow label="Nut width"            value={
        versionedSpecs['nut_width']?.length > 1
          ? versionedSpecs['nut_width'].map(v => `${v.value}${v.year ? ` (${v.year})` : ''}`).join(' → ')
          : spec.nut_width != null ? `${spec.nut_width}mm` : null
      } />

      <SpecGroup label="Headstock" />
      <SpecRow label="Headstock style"      value={r(refMap, spec.headstock_style)} />
      <SpecRow label="Headstock face"       value={r(refMap, spec.headstock_face)} />
      <SpecRow label="Decorative headstock routing" value={r(refMap, spec.headstock_decorative_routing)} />
    </div>
  )
}

// Generational indicators only — fields confirmed to vary between generations
function GenIndicatorBlock({ spec, refMap }: { spec: Partial<ModelGenSpec>; refMap: Record<string, string> }) {
  const productionYearDisplay = spec.production_year_start != null
    ? spec.production_year_start === spec.production_year_end
      ? String(spec.production_year_start)
      : `${spec.production_year_start}–${spec.production_year_end}`
    : null

  return (
    <div>
      <SpecRow label="Production years" value={productionYearDisplay} />
      {/* TODO: Serial range — derive min/max serial_number_only from approved registry guitars matching this model_id + generation */}
      <SpecRow label="Serial range"     value={null} />
      <SpecGroup label="Pickups & electronics" />
      <SpecRow label="Selector switch knob" value={r(refMap, spec.switch_knob)} />
      <SpecRow label="Pickup surrounds" value={r(refMap, spec.pickup_surrounds)} />

      <SpecGroup label="Hardware" />
      <SpecRow label="Bridge logo"      value={r(refMap, spec.bridge_logo)} />
      <SpecRow label="Trem arm"         value={r(refMap, spec.trem_arm)} />

      <SpecGroup label="Neck" />
      <SpecRow label="Neck profile"      value={r(refMap, spec.neck_profile)} />
      <SpecRow label="Neck finish"       value={r(refMap, spec.neck_finish)} />
      <SpecRow label="Neck binding"      value={r(refMap, spec.neck_binding)} />
      <SpecRow label="Side-dot markers" value={r(refMap, spec.side_dot_markers)} />

      <SpecGroup label="Headstock" />
      <SpecRow label="Headstock logo"    value={r(refMap, spec.headstock_logo)} />
      <SpecRow label="Headstock binding" value={r(refMap, spec.headstock_binding)} />
    </div>
  )
}

const MODEL_NICKNAMES: Record<string, string> = {
  'SF-1': 'Streetfighter',
  'SF-3': 'Streetfighter',
}

function resolveSlug(slug: string, models: { model: string }[]): string {
  const match = models.find(m => m.model.toLowerCase().replace(/\s+/g, '-') === slug)
  return match?.model ?? slug
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { data: allModels } = await supabase.from('model_specifications').select('model')
  const modelName = resolveSlug(slug, allModels ?? [])
  const { data } = await supabase
    .from('model_specifications')
    .select('model, description')
    .eq('model', modelName)
    .single()
  const spec = data as Pick<ModelSpec, 'model' | 'description'> | null
  if (!spec) return { title: 'Model Not Found — Maverick Guitars Registry' }
  return {
    title: `${spec.model} — Maverick Guitars Registry`,
    description: spec.description ?? `Maverick ${spec.model} — full specification, available colours, and registry data.`,
  }
}

const toSlug = (model: string) => model.toLowerCase().replace(/\s+/g, '-')

const ORDERED_MODELS = [
  ...SERIES_ORDER.filter(s => !BASS_SERIES.includes(s)).flatMap(s => MODEL_CATALOGUE.filter(m => m.series === s)),
  ...SERIES_ORDER.filter(s => BASS_SERIES.includes(s)).flatMap(s => MODEL_CATALOGUE.filter(m => m.series === s)),
]

export default async function ModelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: allModels } = await supabase.from('model_specifications').select('model')
  const modelName = resolveSlug(slug, allModels ?? [])

  const currentIndex = ORDERED_MODELS.findIndex(m => toSlug(m.model) === slug)
  const prevModel = currentIndex > 0 ? ORDERED_MODELS[currentIndex - 1] : null
  const nextModel = currentIndex < ORDERED_MODELS.length - 1 ? ORDERED_MODELS[currentIndex + 1] : null

  const { data: specRaw } = await supabase
    .from('model_specifications')
    .select('*')
    .eq('model', modelName)
    .single()

  if (!specRaw) notFound()
  const spec = specRaw as ModelSpec

  const parentSpecPromise = spec.parent_model_id
    ? supabase.from('model_specifications').select('id, model').eq('id', spec.parent_model_id).single()
    : Promise.resolve({ data: null })

  const [
    refMap,
    { data: rawVariants },
    { data: rawGenSpecs },
    { data: rawRegistry },
    { data: rawColourMeta },
    { data: parentSpecData },
    { data: rawSourceColours },
    { data: rawSpecSources },
    { data: rawSvgMap },
  ] = await Promise.all([
    getRefValues(),
    supabase.from('model_specifications').select('*').eq('parent_model_id', spec.id),
    supabase.from('model_gen_specs').select('*').eq('model_id', spec.id).order('generation'),
    supabase.from('guitars').select('serial_number_only').eq('model_id', spec.id).eq('status', 'Approved'),
    supabase.from('ref_values').select('id, metadata').in('category', ['COL', 'CSC', 'HWC', 'PKC', 'CPKC', 'BNC', 'FMC']).eq('is_active', true),
    parentSpecPromise,
    supabase.from('model_source_colours').select('available_colours, available_custom_shop_colours, available_hardware_colours, available_pickup_colours, available_custom_shop_pickup_colours, notes, year_qualifier, source_materials(id, title, year, material_type)').eq('model_id', spec.id),
    supabase.from('model_spec_sources').select('field_name, field_value, source_materials(year, title)').eq('spec_id', spec.id).not('field_value', 'is', null),
    supabase.from('pickup_svg_map').select('pkp_id, pos_id, pkc_style, text_variant, svg_filename'),
  ])

  const colourMetaMap: Record<string, ColourMeta> = {}
  const pickupMetaMap: Record<string, PickupMeta> = {}
  for (const row of (rawColourMeta ?? []) as { id: string; metadata: Record<string, unknown> | null }[]) {
    if (row.id.startsWith('PKC-') || row.id.startsWith('CPKC-')) {
      pickupMetaMap[row.id] = (row.metadata ?? {}) as PickupMeta
    } else {
      colourMetaMap[row.id] = (row.metadata ?? {}) as ColourMeta
    }
  }

  const variants = (rawVariants ?? []) as ModelSpec[]
  const genSpecs = (rawGenSpecs ?? []) as ModelGenSpec[]
  const parentSpec = parentSpecData as { id: string; model: string } | null
  const svgMap = (rawSvgMap ?? []) as SvgMapRow[]

  // Derive representative PKP IDs from the first gen spec that has pickup data
  const pkpGenSpec = genSpecs.find(gs => gs.neck_pickup || gs.bridge_pickup) ?? genSpecs[0]
  const neckPkp   = pkpGenSpec?.neck_pickup   ?? null
  const middlePkp = pkpGenSpec?.middle_pickup ?? null
  const bridgePkp = pkpGenSpec?.bridge_pickup ?? null

  const hasGenPickups = genSpecs.length > 0

  // Versioned spec values — field_name → [{value, year, title}] sorted by year
  const versionedSpecs: Record<string, VersionedValue[]> = {}
  for (const row of (rawSpecSources ?? []) as { field_name: string; field_value: string; source_materials: { year: string | null; title: string } }[]) {
    const entries = versionedSpecs[row.field_name] ?? []
    entries.push({ value: row.field_value, year: row.source_materials?.year ?? null, title: row.source_materials?.title ?? '' })
    versionedSpecs[row.field_name] = entries
  }
  // Sort each field's entries by year ascending
  for (const key of Object.keys(versionedSpecs)) {
    versionedSpecs[key].sort((a, b) => (a.year ?? '').localeCompare(b.year ?? ''))
  }

  type SourceColourRow = { available_colours: string[]; available_custom_shop_colours: string[] | null; available_hardware_colours: string[] | null; available_pickup_colours: string[] | null; available_custom_shop_pickup_colours: string[] | null; notes: string | null; year_qualifier: string | null; source_materials: { id: string; title: string; year: string | null; material_type: string | null } }
  const sourceColours = (rawSourceColours ?? []) as SourceColourRow[]

  function sourceLabel(sm: SourceColourRow['source_materials'] | null): string {
    if (!sm) return 'Source Pending'
    if (sm.title === 'Pending — Source Required') return 'Source Pending'
    const y = sm.year ?? ''
    if (sm.material_type === 'Magazine') return `${y} Press Sourced Colours`
    if (sm.title.toLowerCase().includes('brochure')) return `${y} Maverick Brochure`
    return `${y} Maverick Catalogue`
  }

  // Aggregate all custom shop, hardware, and pickup colour IDs across all source rows — not split by year.
  const customShopColourIds = [...new Set(
    sourceColours.flatMap(sc => sc.available_custom_shop_colours ?? [])
  )]
  const hardwareColourIds = [...new Set(
    sourceColours.flatMap(sc => sc.available_hardware_colours ?? [])
  )]
  const pickupColourIds = [...new Set(
    sourceColours.flatMap(sc => sc.available_pickup_colours ?? [])
  )]
  const customShopPickupColourIds = [...new Set(
    sourceColours.flatMap(sc => sc.available_custom_shop_pickup_colours ?? [])
  )]

  // Aggregate unique binding and marker colours across all gen specs, including spec_options variants
  const bindingColourIds = [...new Set([
    ...genSpecs.map(gs => gs.binding_colour),
    ...genSpecs.flatMap(gs => gs.spec_options?.binding_colour ?? []),
  ].filter((id): id is string => id != null))]
  const markerColourIds = [...new Set([
    ...genSpecs.map(gs => gs.fretboard_marker_colour),
    ...genSpecs.map(gs => gs.side_dot_colour),
    ...genSpecs.flatMap(gs => gs.spec_options?.fretboard_marker_colour ?? []),
    ...genSpecs.flatMap(gs => gs.spec_options?.side_dot_colour ?? []),
  ].filter((id): id is string => id != null))]

  // Group factory body colours by source year — deduplicated across all sources for that year
  const factoryColoursByYear = new Map<string, string[]>()
  for (const sc of sourceColours) {
    if (!sc.source_materials || sc.source_materials.title === 'Pending — Source Required') continue
    const year = sc.source_materials.year
    if (!year) continue
    const existing = factoryColoursByYear.get(year) ?? []
    const merged = [...new Set([...existing, ...(sc.available_colours ?? [])])]
    factoryColoursByYear.set(year, merged)
  }
  const sortedFactoryYears = [...factoryColoursByYear.keys()].sort((a, b) => parseInt(a) - parseInt(b))

  // Collect undated factory body colours — confirmed but pending source citation
  const undatedFactoryColourIds = [...new Set(
    sourceColours
      .filter(sc => !sc.source_materials?.year)
      .flatMap(sc => sc.available_colours ?? [])
  )]

  // Derive universal production years from gen spec production_year_start/end.
  // start = MIN(production_year_start), end = MAX(production_year_end) across all gen specs.
  const genYearStarts = genSpecs.map(gs => gs.production_year_start).filter((y): y is number => y != null)
  const genYearEnds   = genSpecs.map(gs => gs.production_year_end).filter((y): y is number => y != null)
  const yearStart = genYearStarts.length > 0 ? Math.min(...genYearStarts) : null
  const yearEnd   = genYearEnds.length > 0   ? Math.max(...genYearEnds)   : null
  const singleYear = yearStart != null && yearStart === yearEnd
  const yearQualifier = singleYear
    ? (sourceColours.find(sc => sc.year_qualifier)?.year_qualifier ?? null)
    : null
  const productionYears = yearStart == null
    ? null
    : singleYear
      ? yearQualifier ? `${yearQualifier} ${yearStart}` : String(yearStart)
      : `${yearStart}–${yearEnd}`

  const serials = (rawRegistry ?? [])
    .map((g: { serial_number_only: number | null }) => g.serial_number_only)
    .filter((n): n is number => n != null)
  const registeredCount = rawRegistry?.length ?? 0
  const serialMin = serials.length ? Math.min(...serials) : null
  const serialMax = serials.length ? Math.max(...serials) : null

  const seriesLabel = r(refMap, spec.series)

  const sectionHead = (label: string) => (
    <p style={{
      fontSize: '10px', fontFamily: 'var(--font-dm-mono)', color: '#c8a96e',
      letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px',
    }}>
      {label}
    </p>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

      {/* Model navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ flex: 1 }}>
          {prevModel ? (
            <Link href={`/models/${toSlug(prevModel.model)}`} className="link-muted" style={{ fontSize: '13px', fontFamily: 'var(--font-dm-mono)', letterSpacing: '0.5px' }}>
              ← Previous Model ({prevModel.model})
            </Link>
          ) : <span />}
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <Link href="/models" className="link-muted" style={{ fontSize: '13px', fontFamily: 'var(--font-dm-mono)', letterSpacing: '0.5px' }}>
            ↑ Return to Model Guide
          </Link>
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          {nextModel ? (
            <Link href={`/models/${toSlug(nextModel.model)}`} className="link-muted" style={{ fontSize: '13px', fontFamily: 'var(--font-dm-mono)', letterSpacing: '0.5px' }}>
              Next Model ({nextModel.model}) →
            </Link>
          ) : <span />}
        </div>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '40px', paddingBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {seriesLabel && (
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '3px', color: '#c8a96e', textTransform: 'uppercase' }}>
              {seriesLabel}
            </span>
          )}
          {parentSpec && (
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#5c5a57' }}>
              HT variant of{' '}
              <Link href={`/models/${parentSpec.model.toLowerCase()}`} style={{ color: '#9e9b96' }}>
                {parentSpec.model}
              </Link>
            </span>
          )}
        </div>

        <h1 style={{
          fontFamily: 'var(--font-bebas)',
          fontSize: 'clamp(3rem, 8vw, 5rem)',
          letterSpacing: '3px', color: '#f0ede8', lineHeight: 1,
          marginBottom: '12px',
          display: 'flex', alignItems: 'baseline', gap: '20px', flexWrap: 'wrap',
        }}>
          {spec.model}
          {MODEL_NICKNAMES[spec.model] && (
            <span style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)', color: '#3a3835', letterSpacing: '2px' }}>
              {MODEL_NICKNAMES[spec.model]}
            </span>
          )}
        </h1>

        {spec.rarity && (
          <div style={{
            display: 'inline-block',
            fontFamily: 'var(--font-dm-mono)', fontSize: '10px',
            letterSpacing: '1.5px', textTransform: 'uppercase',
            color: '#8b6e3f', background: 'rgba(200,169,110,0.08)',
            padding: '3px 8px', marginBottom: '12px',
          }}>
            {spec.rarity}
          </div>
        )}

        {spec.description && (
          <p style={{ color: '#9e9b96', fontSize: '15px', lineHeight: 1.7, maxWidth: '680px', marginTop: '8px' }}>
            {spec.description}
          </p>
        )}

        {/* View in Registry + notes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '20px', flexWrap: 'wrap' }}>
          <Link
            href={`/?model=${spec.model}`}
            style={{
              fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px',
              color: '#c8a96e', border: '1px solid rgba(200,169,110,0.3)',
              padding: '5px 12px', textDecoration: 'none',
            }}
          >
            View in Registry →
          </Link>
          {registeredCount > 0 && (
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#5c5a57' }}>
              {registeredCount} registered
            </span>
          )}
          {serialMin != null && serialMax != null && serialMin !== serialMax && (
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#5c5a57' }}>
              Serial range {serialMin}–{serialMax}
            </span>
          )}
        </div>

      </div>

      {/* Universal specification + Available colours */}
      <div style={{ marginBottom: '48px', paddingBottom: '40px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Col 1 — Universal spec */}
          <div>
            {sectionHead('Universal Specification')}
            <SpecBlock spec={spec} refMap={refMap} versionedSpecs={versionedSpecs} productionYears={productionYears} hidePickups={hasGenPickups} />
          </div>

          {/* Col 2 — Body colours + Hardware colours */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>

            {/* Factory body colours grouped by year — deduplicated across sources */}
            <div>
              {sectionHead('Factory Body Colours')}
              {sortedFactoryYears.length > 0 || undatedFactoryColourIds.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  {sortedFactoryYears.map(year => (
                    <div key={year}>
                      <p style={{
                        fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px',
                        textTransform: 'uppercase', color: '#3a3835', marginBottom: '12px',
                      }}>
                        Available Colours {year}
                      </p>
                      <ColourSwatches colours={factoryColoursByYear.get(year) ?? []} colourMetaMap={colourMetaMap} refMap={refMap} />
                    </div>
                  ))}
                  {undatedFactoryColourIds.length > 0 && (
                    <div>
                      <p style={{
                        fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px',
                        textTransform: 'uppercase', color: '#3a3835', marginBottom: '12px',
                      }}>
                        Available Colours — Source Pending
                      </p>
                      <ColourSwatches colours={undatedFactoryColourIds} colourMetaMap={colourMetaMap} refMap={refMap} />
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#2e2d2b' }}>No colour data yet</p>
              )}
            </div>

            {/* Factory pickup colours */}
            <div>
              {sectionHead('Factory Pickup Colours')}
              {pickupColourIds.length > 0 ? (
                <PickupSwatches pickupIds={pickupColourIds} pickupMetaMap={pickupMetaMap} refMap={refMap} neckPkp={neckPkp} middlePkp={middlePkp} bridgePkp={bridgePkp} svgMap={svgMap} />
              ) : (
                <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#2e2d2b' }}>No pickup colour data yet</p>
              )}
            </div>

            {/* Custom shop body colours — aggregated across full production run */}
            <div>
              {sectionHead('Custom Shop Body Colours')}
              {customShopColourIds.length > 0 ? (
                <ColourSwatches colours={customShopColourIds} colourMetaMap={colourMetaMap} refMap={refMap} />
              ) : (
                <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#2e2d2b' }}>No custom shop data yet</p>
              )}
            </div>

            {/* Custom shop pickup colours */}
            <div>
              {sectionHead('Custom Shop Pickup Colours')}
              {customShopPickupColourIds.length > 0 ? (
                <PickupSwatches pickupIds={customShopPickupColourIds} pickupMetaMap={pickupMetaMap} refMap={refMap} neckPkp={neckPkp} middlePkp={middlePkp} bridgePkp={bridgePkp} svgMap={svgMap} />
              ) : (
                <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#2e2d2b' }}>No custom shop pickup data yet</p>
              )}
            </div>

            {/* Available hardware colours — aggregated across full production run */}
            <div>
              {sectionHead('Factory Hardware Colours')}
              {hardwareColourIds.length > 0 ? (
                <ColourSwatches colours={hardwareColourIds} colourMetaMap={colourMetaMap} refMap={refMap} />
              ) : (
                <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#2e2d2b' }}>No hardware colour data yet</p>
              )}
            </div>

            {/* Binding colour — aggregated unique values across gen specs */}
            {bindingColourIds.length > 0 && (
              <div>
                {sectionHead('Binding Colours')}
                <ColourSwatches colours={bindingColourIds} colourMetaMap={colourMetaMap} refMap={refMap} />
              </div>
            )}

            {/* Marker colour — fretboard + side dot combined, deduplicated */}
            {markerColourIds.length > 0 && (
              <div>
                {sectionHead('Fretboard Marker Colours')}
                <ColourSwatches colours={markerColourIds} colourMetaMap={colourMetaMap} refMap={refMap} />
              </div>
            )}

          </div>

        </div>
      </div>

      {/* HT Variants */}
      {variants.length > 0 && (
        <div style={{ marginBottom: '48px', paddingBottom: '40px' }}>
          {sectionHead('HT Variants')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px', background: 'rgba(255,255,255,0.06)' }}>
            {variants.map(v => (
              <Link
                key={v.id}
                href={`/models/${v.model.toLowerCase()}`}
                style={{
                  flex: '0 0 auto', minWidth: '240px', background: '#161616',
                  padding: '24px', textDecoration: 'none', display: 'block',
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-dm-mono)', fontSize: '9px',
                  letterSpacing: '2px', textTransform: 'uppercase',
                  color: '#8b6e3f', background: 'rgba(200,169,110,0.08)',
                  padding: '2px 6px', display: 'inline-block', marginBottom: '10px',
                }}>
                  HT Variant
                </span>
                <p style={{
                  fontFamily: 'var(--font-bebas)', fontSize: '36px',
                  color: '#c8a96e', letterSpacing: '2px', lineHeight: 1, marginBottom: '12px',
                }}>
                  {v.model}
                </p>
                {v.bridge_type && (
                  <div style={{ display: 'flex', gap: '16px', padding: '6px 0' }}>
                    <span style={{ color: '#5c5a57', width: '120px', flexShrink: 0, fontFamily: 'var(--font-dm-mono)', fontSize: '11px' }}>Bridge</span>
                    <span style={{ color: '#f0ede8', fontSize: '13px' }}>{r(refMap, v.bridge_type)}</span>
                  </div>
                )}
                {v.nut_type && (
                  <div style={{ display: 'flex', gap: '16px', padding: '6px 0' }}>
                    <span style={{ color: '#5c5a57', width: '120px', flexShrink: 0, fontFamily: 'var(--font-dm-mono)', fontSize: '11px' }}>Nut type</span>
                    <span style={{ color: '#f0ede8', fontSize: '13px' }}>{r(refMap, v.nut_type)}</span>
                  </div>
                )}
                {v.description && (
                  <p style={{ color: '#9e9b96', fontSize: '13px', lineHeight: 1.6, marginTop: '12px' }}>{v.description}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Generation specification comparison table */}
      <div style={{ paddingTop: '40px' }}>
        {(() => {
          const standardGens = ['GEN-0001', 'GEN-0002']
          const hasNonStandard = genSpecs.some(g => !standardGens.includes(g.generation))
          const GEN_ORDER = ['GEN-0005', 'GEN-0001', 'GEN-0002', 'GEN-0003', 'GEN-0004']
          const columns = hasNonStandard
            ? [...new Set(genSpecs.map(g => g.generation))].sort(
                (a, b) => {
                  const ai = GEN_ORDER.indexOf(a)
                  const bi = GEN_ORDER.indexOf(b)
                  return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
                }
              )
            : standardGens

          const gsFor = (genId: string): Partial<ModelGenSpec> =>
            genSpecs.find(g => g.generation === genId) ?? {}

          const genYears = (gs: Partial<ModelGenSpec>): string | null => {
            if (gs.production_year_start == null) return null
            return gs.production_year_start === gs.production_year_end
              ? String(gs.production_year_start)
              : `${gs.production_year_start}–${gs.production_year_end}`
          }

          const groupHeader = (label: string) => (
            <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#3a3835', marginTop: '16px', marginBottom: '4px' }}>
              {label}
            </p>
          )
          // Resolve a field from spec_options (bullet list) or fall back to the primary resolved value
          const fieldOrOptions = (gs: Partial<ModelGenSpec>, key: string, primary: string | null): string | string[] | null =>  {
            const opts = gs.spec_options?.[key]
            if (opts && opts.length > 0) return opts.map(rid => r(refMap, rid) ?? rid)
            return primary
          }

          const dataRow = (label: string, values: (string | string[] | null | undefined)[]) => (
            <div style={{ display: 'flex', gap: '0', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
              <span style={{ color: '#5c5a57', width: '180px', flexShrink: 0, fontFamily: 'var(--font-dm-mono)', fontSize: '11px' }}>{label}</span>
              {values.map((v, i) => {
                if (Array.isArray(v)) {
                  return (
                    <span key={i} style={{ flex: 1, paddingLeft: '16px' }}>
                      {v.map((item, j) => (
                        <span key={j} style={{ display: 'block', color: '#f0ede8', lineHeight: 1.7 }}>• {item}</span>
                      ))}
                    </span>
                  )
                }
                return <span key={i} style={{ flex: 1, color: v ? '#f0ede8' : '#2e2d2b', paddingLeft: '16px' }}>{v ?? '—'}</span>
              })}
            </div>
          )

          return (
            <div>
              {/* Column headers */}
              <div style={{ display: 'flex', paddingBottom: '12px', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ width: '180px', flexShrink: 0 }} />
                {columns.map(genId => (
                  <div key={genId} style={{ flex: 1, paddingLeft: '16px', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#c8a96e' }}>
                    {r(refMap, genId) ?? genId}
                  </div>
                ))}
              </div>

              {/* Production Info */}
              {groupHeader('Production Info')}
              {dataRow('Production years', columns.map(id => genYears(gsFor(id))))}
              {/* TODO: Serial range — derive min/max serial_number_only from registry guitars matching this model_id + generation */}
              {dataRow('Serial range', columns.map(() => null))}
              {dataRow('Serial number style', columns.map(id => r(refMap, gsFor(id).serial_number_style)))}

              {/* Body */}
              {groupHeader('Body')}
              {dataRow('Body binding',          columns.map(id => fieldOrOptions(gsFor(id), 'body_binding', r(refMap, gsFor(id).body_binding))))}
              {dataRow('Tremolo cover routing', columns.map(id => r(refMap, gsFor(id).tremolo_cover_routing)))}

              {/* Pickups & electronics */}
              {groupHeader('Pickups & electronics')}
              {dataRow('Selector switch type', columns.map(id => r(refMap, gsFor(id).switch_type)))}
              {dataRow('Neck pickup',      columns.map(id => r(refMap, gsFor(id).neck_pickup)))}
              {dataRow('Middle pickup',    columns.map(id => r(refMap, gsFor(id).middle_pickup)))}
              {dataRow('Bridge pickup',    columns.map(id => r(refMap, gsFor(id).bridge_pickup)))}
              {dataRow('Selector switch knob', columns.map(id => r(refMap, gsFor(id).switch_knob)))}
              {dataRow('Pickup surrounds', columns.map(id => r(refMap, gsFor(id).pickup_surrounds)))}

              {/* Hardware */}
              {groupHeader('Hardware')}
              {dataRow('Hardware colour', columns.map(id => r(refMap, gsFor(id).hardware_colour)))}
              {dataRow('Tuner style',     columns.map(id => r(refMap, gsFor(id).tuner_style)))}
              {dataRow('Jack socket',     columns.map(id => r(refMap, gsFor(id).jack_socket)))}
              {dataRow('Bridge logo',     columns.map(id => r(refMap, gsFor(id).bridge_logo)))}
              {dataRow('Trem arm',        columns.map(id => r(refMap, gsFor(id).trem_arm)))}

              {/* Neck */}
              {groupHeader('Neck')}
              {dataRow('Neck wood',         columns.map(id => r(refMap, gsFor(id).neck_wood)))}
              {dataRow('Neck profile',      columns.map(id => r(refMap, gsFor(id).neck_profile)))}
              {dataRow('Neck construction', columns.map(id => r(refMap, gsFor(id).neck_construction)))}
              {dataRow('Neck finish',       columns.map(id => r(refMap, gsFor(id).neck_finish)))}
              {dataRow('Truss rod cover',   columns.map(id => r(refMap, gsFor(id).truss_rod_cover)))}
              {dataRow('Neck binding',      columns.map(id => r(refMap, gsFor(id).neck_binding)))}
              {dataRow('Side-dot markers',  columns.map(id => r(refMap, gsFor(id).side_dot_markers)))}
              {dataRow('Fretboard markers', columns.map(id => fieldOrOptions(gsFor(id), 'fretboard_markers', r(refMap, gsFor(id).fretboard_markers))))}

              {/* Headstock */}
              {groupHeader('Headstock')}
              {dataRow('Headstock logo',       columns.map(id => r(refMap, gsFor(id).headstock_logo)))}
              {dataRow('Headstock trademark', columns.map(id => r(refMap, gsFor(id).headstock_trademark)))}
              {dataRow('Headstock binding',   columns.map(id => r(refMap, gsFor(id).headstock_binding)))}

            </div>
          )
        })()}
      </div>

    </div>
  )
}
