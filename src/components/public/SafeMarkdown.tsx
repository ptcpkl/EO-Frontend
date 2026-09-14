import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const renderInline = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${index}-${part}`}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={`${index}-${part}`}>{part.slice(1, -1)}</em>
    }
    return <span key={`${index}-${part}`}>{part}</span>
  })
}

const SafeMarkdown = ({ value }: { value: string }) => {
  const lines = value.replace(/\r/g, '').split('\n')
  const nodes: React.ReactNode[] = []

  let index = 0
  while (index < lines.length) {
    const raw = lines[index]
    const line = raw.trim()

    if (!line) {
      index += 1
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''))
        index += 1
      }
      nodes.push(
        <Box component='ul' key={`ul-${index}`} sx={{ mt: 1.5, mb: 0, pl: 3, display: 'grid', gap: 0.75 }}>
          {items.map((item, itemIndex) => <li key={`${itemIndex}-${item}`}><Typography component='span' color='text.secondary' sx={{ lineHeight: 1.8 }}>{renderInline(item)}</Typography></li>)}
        </Box>
      )
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ''))
        index += 1
      }
      nodes.push(
        <Box component='ol' key={`ol-${index}`} sx={{ mt: 1.5, mb: 0, pl: 3, display: 'grid', gap: 0.75 }}>
          {items.map((item, itemIndex) => <li key={`${itemIndex}-${item}`}><Typography component='span' color='text.secondary' sx={{ lineHeight: 1.8 }}>{renderInline(item)}</Typography></li>)}
        </Box>
      )
      continue
    }

    if (line.startsWith('### ')) {
      nodes.push(<Typography key={`h3-${index}`} variant='h6' fontWeight={750} sx={{ mt: 2.5 }}>{renderInline(line.slice(4))}</Typography>)
      index += 1
      continue
    }

    if (line.startsWith('## ')) {
      nodes.push(<Typography key={`h2-${index}`} variant='h5' fontWeight={750} sx={{ mt: 2.5 }}>{renderInline(line.slice(3))}</Typography>)
      index += 1
      continue
    }

    if (line.startsWith('# ')) {
      nodes.push(<Typography key={`h1-${index}`} variant='h4' fontWeight={800} sx={{ mt: 2.5 }}>{renderInline(line.slice(2))}</Typography>)
      index += 1
      continue
    }

    const paragraph: string[] = [line]
    index += 1
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^#{1,3}\s+/.test(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !/^\d+\.\s+/.test(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim())
      index += 1
    }

    nodes.push(
      <Typography key={`p-${index}`} color='text.secondary' sx={{ mt: 1.5, lineHeight: 1.85 }}>
        {renderInline(paragraph.join(' '))}
      </Typography>
    )
  }

  return <Box>{nodes}</Box>
}

export default SafeMarkdown
