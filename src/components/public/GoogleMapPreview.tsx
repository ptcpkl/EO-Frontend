'use client'

import { useEffect, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

const directEmbedUrl = (mapsUrl?: string | null) => {
  if (!mapsUrl) return null
  return mapsUrl.includes('/maps/embed') || mapsUrl.includes('output=embed') ? mapsUrl : null
}

type Props = {
  mapsUrl?: string | null
  fallbackQuery?: string | null
  title: string
}

const GoogleMapPreview = ({ mapsUrl, fallbackQuery, title }: Props) => {
  const direct = useMemo(() => directEmbedUrl(mapsUrl), [mapsUrl])
  const [embedUrl, setEmbedUrl] = useState<string | null>(direct)
  const [loading, setLoading] = useState(Boolean(mapsUrl && !direct))

  useEffect(() => {
    let active = true

    if (direct) {
      setEmbedUrl(direct)
      setLoading(false)
      return () => {
        active = false
      }
    }

    if (!mapsUrl && !fallbackQuery) {
      setEmbedUrl(null)
      setLoading(false)
      return () => {
        active = false
      }
    }

    const query = new URLSearchParams()
    if (mapsUrl) query.set('url', mapsUrl)
    if (fallbackQuery) query.set('fallback', fallbackQuery)

    setLoading(true)

    void fetch(`/api/maps/preview?${query.toString()}`, { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) return null
        return (await response.json()) as { embedUrl?: string | null }
      })
      .then(result => {
        if (active) setEmbedUrl(result?.embedUrl ?? null)
      })
      .catch(() => {
        if (active) setEmbedUrl(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [direct, fallbackQuery, mapsUrl])

  if (loading) {
    return <Box sx={{ minHeight: 360, display: 'grid', placeItems: 'center', bgcolor: 'action.hover' }}><CircularProgress size={32} /></Box>
  }

  if (!embedUrl) {
    return (
      <Box sx={{ minHeight: 360, display: 'grid', placeItems: 'center', textAlign: 'center', px: 4, bgcolor: 'action.hover' }}>
        <Box>
          <Box sx={{ width: 64, height: 64, mx: 'auto', borderRadius: '50%', bgcolor: 'background.paper', display: 'grid', placeItems: 'center', color: 'primary.main' }}>
            <i className='tabler-map-2 text-3xl' />
          </Box>
          <Typography variant='h6' fontWeight={600} sx={{ mt: 2 }}>Map preview unavailable</Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>Use the exact location button to open the organizer&apos;s Google Maps pin.</Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box
      component='iframe'
      src={embedUrl}
      title={title}
      loading='lazy'
      referrerPolicy='no-referrer-when-downgrade'
      sx={{ display: 'block', width: '100%', height: 400, border: 0 }}
      allowFullScreen
    />
  )
}

export default GoogleMapPreview
