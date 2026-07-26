import fs from 'fs'
import path from 'path'

export type SvgMapRow = {
  pkp_id: string
  pos_id: string
  pkc_style: string | null
  text_variant: string | null
  svg_filename: string
}

const svgCache = new Map<string, string>()

export function readPickupSvg(filename: string): string {
  const cached = svgCache.get(filename)
  if (cached !== undefined) return cached
  const filePath = path.join(process.cwd(), 'public', 'pickups', `${filename}.svg`)
  const content = fs.readFileSync(filePath, 'utf8')
  svgCache.set(filename, content)
  return content
}

export function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

function renderDimensions(svgText: string): { origW: string; origH: string; w: number; h: number } {
  const wm = svgText.match(/width="(\d+)"/)
  const hm = svgText.match(/height="(\d+)"/)
  const origW = wm?.[1] ?? '766'
  const origH = hm?.[1] ?? '1408'
  const renderH = 100
  const renderW = Math.round(renderH * parseInt(origW) / parseInt(origH))
  return { origW, origH, w: renderW, h: renderH }
}

export function injectPickupColors(svgText: string, primary: string, secondary?: string, style?: string | null): string {
  const lum = getLuminance(primary)
  const strokeColor = lum < 0.45 ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)'
  const { origW, origH, w, h } = renderDimensions(svgText)

  let svg = svgText

  // Set viewBox and normalise render dimensions
  svg = svg.replace(
    `width="${origW}" height="${origH}"`,
    `viewBox="0 0 ${origW} ${origH}" width="${w}" height="${h}"`,
  )

  // Outer housing identified by stroke-width="13.75" + stroke-miterlimit="8"
  const hasOuterHousing = svg.includes(' stroke-width="13.75" stroke-miterlimit="8" fill="none"')

  if (hasOuterHousing) {
    if (style === 'open_coil') {
      // Open coil humbucker: insert two bobbin capsule rects before the <g> group (SVG viewport space)
      const rightColour = secondary ?? primary
      svg = svg.replace('<g ',
        `<rect x="7" y="7" width="365" height="1394" rx="182" fill="${primary}"/>` +
        `<rect x="395" y="7" width="364" height="1394" rx="182" fill="${rightColour}"/><g `,
      )
    } else {
      // Covered humbucker: fill the outer housing path directly
      svg = svg.replace(
        ' stroke-width="13.75" stroke-miterlimit="8" fill="none"',
        ` stroke-width="13.75" stroke-miterlimit="8" fill="${primary}"`,
      )
    }
  } else {
    // Single coil — no closed outer housing path.
    // Insert a filled capsule rect in SVG viewport space that matches the pickup body outline,
    // rather than a CSS background which would extend into the empty corners outside the capsule.
    // Coordinates are derived from the standard 560×1590 single coil SVG geometry.
    if (origW === '560' && origH === '1590') {
      svg = svg.replace('<g ', `<rect x="189" y="7" width="364" height="1576" rx="182" fill="${primary}"/><g `)
    } else {
      svg = svg.replace('<svg ', `<svg style="background-color:${primary};border-radius:3px;" `)
    }
  }

  // Fill closed circular paths (pole pieces, mounting holes) with an exposed-metal grey.
  // Discriminator: path data ends with Z (closed shape) + stroke-width 13.75 + miterlimit 10.
  // This excludes: outer housing (miterlimit 8, stroke #0D0D0D), screw marks (stroke-width 22.9167),
  // and open structural lines (no closing Z).
  svg = svg.replace(
    /(<path d="[^"]*Z") (stroke="#000000" stroke-width="13\.75" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10") fill="none"/g,
    `$1 $2 fill="#8c8c8c"`,
  )

  // Override all stroke colours with high-contrast colour so line work is visible over the fill
  svg = svg
    .replaceAll('stroke="#000000"', `stroke="${strokeColor}"`)
    .replaceAll('stroke="#0D0D0D"', `stroke="${strokeColor}"`)

  return svg
}

export function resolvePickupSvg(
  svgMap: SvgMapRow[],
  pkpId: string,
  posId: string,
  pkcStyle: string | null,
  primary: string,
  secondary?: string,
): string | null {
  const lum = getLuminance(primary)
  const textVariant = lum < 0.45 ? 'white_text' : 'black_text'

  // Priority: exact (style + text variant) → exact (style, no text variant) → style-agnostic
  const row =
    svgMap.find(r => r.pkp_id === pkpId && r.pos_id === posId && r.pkc_style === pkcStyle && r.text_variant === textVariant) ??
    svgMap.find(r => r.pkp_id === pkpId && r.pos_id === posId && r.pkc_style === pkcStyle && r.text_variant === null) ??
    svgMap.find(r => r.pkp_id === pkpId && r.pos_id === posId && r.pkc_style === null && r.text_variant === null)

  if (!row) return null

  try {
    return injectPickupColors(readPickupSvg(row.svg_filename), primary, secondary, pkcStyle)
  } catch {
    return null
  }
}
