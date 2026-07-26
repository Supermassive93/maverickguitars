export type BodyContouring = 'Full Maverick contouring' | 'Partial contouring' | 'No contouring'
export type SourceMaterialType = 'Catalogue' | 'Magazine' | 'Advertisement' | 'Receipt' | 'Photograph' | 'Video' | 'Audio' | 'Other'
export type ExtractionStatus = 'pending' | 'processing' | 'complete' | 'failed'
export type IndicatorStatus = 'draft' | 'confirmed' | 'retired'
export type IndicatorConfidence = 'Low' | 'Medium' | 'High'
export type ArticleType = 'Article' | 'Testimonial' | 'Interview' | 'News'
export type SerialStatus = 'Complete' | 'Partial' | 'Prefix only' | 'None Visible' | 'Paper label' | 'Hand label'
export type GuitarStatus = 'Pending' | 'Approved' | 'Rejected' | 'Pre-populated'

// Lookup map returned by getRefValues() — id → display_name
export type RefMap = Record<string, string>

export interface Guitar {
  id: string
  mgr_id: number
  user_id: string | null
  serial: string | null
  serial_number_only: number | null
  serial_status: SerialStatus | null
  // ref IDs — resolve via RefMap
  series: string | null
  generation: string | null
  finish_type: string | null
  factory_colour: string | null
  custom_shop_colour: string | null
  catalogue_year: string | null
  body_shape_analogue: string | null
  body_wood: string | null
  body_construction: string | null
  body_bookmatched: string | null
  joint_type: string | null
  pickup_configuration: string | null
  instrument_type: string | null
  neck_pickup: string | null
  middle_pickup: string | null
  bridge_pickup: string | null
  bridge_type: string | null           // was bridge_configuration
  hardware_colour: string | null
  headstock_face: string | null
  headstock_style: string | null
  headstock_logo: string | null
  bridge_logo: string | null
  pickup_surrounds: string | null
  pickup_colours: string | null
  tuner_style: string | null
  neck_binding: string | null
  switch_type: string | null
  switch_knob: string | null
  potentiometers: string | null
  whammy_bar: string | null
  nut_type: string | null
  fret_count: string | null
  fretboard_wood: string | null
  neck_wood: string | null
  neck_profile: string | null
  scale_length: string | null
  neck_construction: string | null
  skunk_stripe: string | null
  left_handed_available: string | null // was left_handed
  headstock_break_angle: number | null
  neck_pitch: number | null
  specification_source: string | null
  source_type: string | null
  source_url: string | null
  last_known_country: string | null
  last_known_region: string | null
  last_known_city: string | null
  last_price: number | null
  original_rrp: number | null
  model_id: string                     // UUID FK → model_specifications.id
  date_submitted: string | null
  date_approved: string | null
  last_updated: string | null
  verified_by: string | null
  image_urls: string[] | null
  primary_image_url: string | null
  status: GuitarStatus
  admin_notes: string | null
  submission_notes: string | null
  submitter_email: string | null
  registered_by: string | null
  // joined field — present when query includes model_specifications(model)
  model_specifications?: { model: string } | null
}

export function getModelName(guitar: Pick<Guitar, 'model_specifications'>): string {
  return guitar.model_specifications?.model ?? 'Unknown model'
}

export interface ModelGenSpec {
  id: string
  model_id: string                     // UUID FK → model_specifications.id
  generation: string                   // GEN ref ID (GEN-0001 … GEN-0005)

  available_colours: string[] | null   // array of COL/CSC ref IDs
  original_rrp: number | null
  left_handed_rrp: number | null

  body_shape_analogue: string | null   // BSA ref ID
  body_wood: string | null             // BWD ref ID
  body_construction: string | null     // BCN ref ID

  pickup_configuration: string | null  // PCG ref ID
  switch_type: string | null           // SWT ref ID
  switch_knob: string | null           // SKN ref ID
  potentiometers: string | null        // POT ref ID
  pickup_surrounds: string | null      // PSR ref ID
  pickup_colours: string | null        // PKC ref ID
  neck_pickup: string | null           // PKP ref ID
  middle_pickup: string | null         // PKP ref ID
  bridge_pickup: string | null         // PKP ref ID

  bridge_type: string | null           // BRG ref ID
  bridge_logo: string | null           // BGL ref ID
  hardware_colour: string | null       // HWC ref ID
  tuner_style: string | null           // TNR ref ID

  neck_construction: string | null     // NCK ref ID
  neck_wood: string | null             // NWD ref ID
  neck_profile: string | null          // NPR ref ID
  fretboard_wood: string | null        // FWD ref ID
  side_dot_markers: string | null      // SDM ref ID
  fretboard_markers: string | null     // FMK ref ID
  fret_count: string | null            // FRT ref ID
  scale_length: string | null          // SCL ref ID
  neck_binding: string | null          // NKB ref ID
  skunk_stripe: string | null          // SKS ref ID
  nut_type: string | null              // NUT ref ID
  neck_finish: string | null           // NKF ref ID
  truss_rod_cover: string | null       // TRC ref ID

  headstock_style: string | null       // HST ref ID
  headstock_face: string | null        // HDF ref ID
  headstock_logo: string | null        // HGL ref ID
  headstock_trademark: string | null   // HTM ref ID
  headstock_binding: string | null     // HDB ref ID

  trem_arm: string | null              // TRM ref ID
  jack_socket: string | null           // JSK ref ID
  tremolo_cover_routing: string | null // TCR ref ID
  body_binding: string | null          // BBN ref ID
  binding_colour: string | null        // BNC ref ID
  fretboard_marker_colour: string | null // FMC ref ID
  side_dot_colour: string | null       // FMC ref ID
  spec_options: Record<string, string[]> | null  // field_name → [ref IDs]; renders as bullet list

  left_handed_available: string | null // LHA ref ID
  specification_source: string | null  // SPC ref ID
  notes: string | null
  production_year_start: number | null
  production_year_end: number | null
  serial_number_style: string | null    // SNS ref ID
  created_at: string | null
  updated_at: string | null
}

export interface ModelSpec {
  id: string
  model: string
  parent_model_id: string | null
  series: string | null             // SER ref ID
  serial_prefix: string | null
  catalogue_year: string | null     // CYR ref ID (legacy — kept for reference)

  // Body
  body_shape_analogue: string | null        // BSA ref ID
  maverick_body_family: string | null       // MBF ref ID
  body_wood: string | null                  // BWD ref ID
  body_construction: string | null          // BCN ref ID
  body_bookmatched: string | null
  joint_type: string | null                 // JNT ref ID
  body_carving: string | null               // BCV ref ID
  body_decorative_routing: string | null    // BDR ref ID

  // Pickups & electronics
  pickup_configuration: string | null  // PCG ref ID
  neck_pickup: string | null           // PKP ref ID
  middle_pickup: string | null         // PKP ref ID
  bridge_pickup: string | null         // PKP ref ID
  switch_type: string | null           // SWT ref ID
  switch_knob: string | null           // SKN ref ID
  potentiometers: string | null        // POT ref ID — retired, use volume_pot / tone_pot
  volume_pot: string | null            // POT ref ID
  volume_pot_count: number | null
  tone_pot: string | null              // POT ref ID
  tone_pot_count: number | null
  pickup_surrounds: string | null      // PSR ref ID
  pickup_colours: string | null        // PKC ref ID
  coil_tap: string | null              // CTF ref ID

  // Hardware
  bridge_type: string | null           // BRG ref ID
  hardware_colour: string | null       // HWC ref ID
  tuner_style: string | null           // TNR ref ID

  // Neck
  neck_mount: string | null            // NMT ref ID — universal mount type (bolt-on / set / through)
  truss_rod: string | null             // TRD ref ID
  neck_construction: string | null     // NCK ref ID — now null; construction (1-piece/2-piece) lives in gen specs
  neck_wood: string | null             // NWD ref ID
  neck_profile: string | null          // NPR ref ID
  fretboard_wood: string | null        // FWD ref ID
  fretboard_markers: string | null      // FMK ref ID
  side_dot_markers: string | null       // SDM ref ID
  fretboard_radius_mm: number | null
  fret_count: string | null            // FRT ref ID
  scale_length: string | null          // SCL ref ID
  neck_binding: string | null          // NKB ref ID
  skunk_stripe: string | null          // SKS ref ID
  nut_type: string | null              // NUT ref ID
  nut_width: number | null             // mm

  // Headstock
  headstock_style: string | null            // HST ref ID
  headstock_face: string | null             // HDF ref ID
  headstock_logo: string | null             // HGL ref ID
  headstock_decorative_routing: string | null // HDR ref ID
  headstock_binding: string | null          // HDB ref ID

  // Body (physical)
  weight_kg: number | null

  // Other
  string_count: number | null
  left_handed_available: string | null // LHA ref ID
  original_rrp: number | null
  left_handed_rrp: number | null
  // NOTE: production_years is NOT stored — it is derived at render time from
  // model_appearances → source_materials.year.
  // start = MIN(appears_in=true year); end = MIN(appears_in=false year) - 1, or MAX(true year).
  // Do NOT add a production_years column to model_specifications.
  // To correct a model's production window, add rows to model_appearances.

  // Metadata
  specification_source: string | null  // SPC ref ID
  catalogue_page: string | null
  press_references: string | null
  notes: string | null
  description: string | null
  rarity: string | null
  created_at: string | null
  updated_at: string | null
}

export interface Profile {
  id: string
  username: string | null
  created_at: string | null
}

export interface SourceMaterial {
  id: string
  title: string
  material_type: SourceMaterialType
  year: string | null
  description: string | null
  file_url: string | null
  thumbnail_url: string | null
  source_credit: string | null
  notes: string | null
  extracted_text: string | null
  page_count: number | null
  extraction_status: ExtractionStatus
  is_published: boolean
  created_at: string | null
}

export interface GenerationIndicator {
  id: string
  feature: string
  feature_value: string
  generation: string
  model: string | null
  series: string | null
  status: IndicatorStatus
  confidence: IndicatorConfidence | null
  notes: string | null
  created_at: string | null
}

export interface GenerationIndicatorSource {
  id: string
  indicator_id: string
  source_material_id: string
  text_excerpt: string | null
  page_reference: string | null
  created_at: string | null
}

export interface Article {
  id: string
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  author: string | null
  article_type: ArticleType
  is_published: boolean
  published_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface Database {
  public: {
    Tables: {
      guitars: {
        Row: Guitar
        Insert: Omit<Guitar, 'id' | 'mgr_id' | 'date_submitted' | 'last_updated'>
        Update: Partial<Omit<Guitar, 'id' | 'mgr_id'>>
      }
      model_specifications: {
        Row: ModelSpec
        Insert: Omit<ModelSpec, 'id'>
        Update: Partial<Omit<ModelSpec, 'id'>>
      }
      model_gen_specs: {
        Row: ModelGenSpec
        Insert: Omit<ModelGenSpec, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ModelGenSpec, 'id' | 'created_at'>>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      source_materials: {
        Row: SourceMaterial
        Insert: Omit<SourceMaterial, 'id' | 'created_at'>
        Update: Partial<Omit<SourceMaterial, 'id' | 'created_at'>>
      }
      articles: {
        Row: Article
        Insert: Omit<Article, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Article, 'id' | 'created_at'>>
      }
      generation_indicators: {
        Row: GenerationIndicator
        Insert: Omit<GenerationIndicator, 'id' | 'created_at'>
        Update: Partial<Omit<GenerationIndicator, 'id' | 'created_at'>>
      }
      generation_indicator_sources: {
        Row: GenerationIndicatorSource
        Insert: Omit<GenerationIndicatorSource, 'id' | 'created_at'>
        Update: Partial<Omit<GenerationIndicatorSource, 'id' | 'created_at'>>
      }
    }
  }
}
