import { NextRequest, NextResponse } from 'next/server'

const allowedHosts = new Set([
  'maps.app.goo.gl',
  'goo.gl',
  'google.com',
  'www.google.com',
  'maps.google.com'
])

// Google place URLs often contain both a viewport center (`@lat,lng`) and the
// actual place coordinates (`!3dlat!4dlng`). The place coordinates must win,
// otherwise the embedded marker can point at a nearby but different location.
const exactCoordinatePatterns = [
  /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  /[?&](?:q|query)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/
]

const viewportCoordinatePattern = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/

const extractMapQuery = (rawUrl: string) => {
  for (const pattern of exactCoordinatePatterns) {
    const match = rawUrl.match(pattern)
    if (match) return `${match[1]},${match[2]}`
  }

  try {
    const url = new URL(rawUrl)
    const placeId = url.searchParams.get('query_place_id') || url.searchParams.get('place_id')

    if (placeId) return `place_id:${placeId}`

    const query = url.searchParams.get('query') || url.searchParams.get('q')
    if (query) return query

    const placeMatch = url.pathname.match(/\/maps\/place\/([^/]+)/)
    if (placeMatch?.[1]) {
      const viewportMatch = rawUrl.match(viewportCoordinatePattern)
      if (viewportMatch) return `${viewportMatch[1]},${viewportMatch[2]}`

      return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
    }
  } catch {
    return null
  }

  const viewportMatch = rawUrl.match(viewportCoordinatePattern)
  return viewportMatch ? `${viewportMatch[1]},${viewportMatch[2]}` : null
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url')?.trim()
  const fallbackQuery = request.nextUrl.searchParams.get('fallback')?.trim()

  // Address/name fallback is allowed only when the organizer did not provide
  // a Google Maps URL at all. We never substitute another searched pin when an
  // explicit organizer Maps URL exists.
  if (!rawUrl) {
    return NextResponse.json({
      embedUrl: fallbackQuery
        ? `https://www.google.com/maps?q=${encodeURIComponent(fallbackQuery)}&output=embed`
        : null,
      source: fallbackQuery ? 'fallback' : 'none'
    })
  }

  let inputUrl: URL

  try {
    inputUrl = new URL(rawUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid Google Maps URL.' }, { status: 400 })
  }

  if (inputUrl.protocol !== 'https:' || !allowedHosts.has(inputUrl.hostname.toLowerCase())) {
    return NextResponse.json({ error: 'Only Google Maps links are supported.' }, { status: 400 })
  }

  let resolvedUrl = rawUrl

  if (['maps.app.goo.gl', 'goo.gl'].includes(inputUrl.hostname.toLowerCase())) {
    try {
      const response = await fetch(rawUrl, {
        method: 'GET',
        redirect: 'follow',
        cache: 'no-store',
        headers: { 'User-Agent': 'Mozilla/5.0 PertaminaEventMapPreview/1.0' }
      })

      resolvedUrl = response.url || rawUrl
    } catch {
      resolvedUrl = rawUrl
    }
  }

  const query = extractMapQuery(resolvedUrl) || extractMapQuery(rawUrl)

  if (!query) {
    return NextResponse.json({ embedUrl: null, resolvedUrl, source: 'maps-url' })
  }

  return NextResponse.json({
    embedUrl: `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`,
    resolvedUrl,
    source: 'maps-url'
  })
}
