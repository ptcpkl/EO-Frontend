'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import {
  CORE_EVENT_MODULES,
  EVENT_MODULE_DEFINITIONS,
  createDefaultExperienceConfig,
  type BenefitItemDefinition,
  type ContentSectionDefinition,
  type EventExperienceConfig,
  type EventModuleKey,
  type ModularEventKind,
  type RegistrationFieldDefinition,
  type RegistrationFieldType
} from '@/lib/event-experience'

type Props = {
  kind: ModularEventKind
  value: EventExperienceConfig
  disabled?: boolean
  onChange: (value: EventExperienceConfig) => void
}

const fieldTypes: RegistrationFieldType[] = ['text', 'textarea', 'select', 'date', 'number']

const iconOptions = [
  ['tabler-sparkles', 'Sparkles'],
  ['tabler-gift', 'Gift / Prize'],
  ['tabler-shirt', 'Apparel'],
  ['tabler-certificate', 'Certificate'],
  ['tabler-medal', 'Medal'],
  ['tabler-trophy', 'Trophy'],
  ['tabler-ticket', 'Ticket'],
  ['tabler-map-pin', 'Location'],
  ['tabler-calendar-event', 'Schedule'],
  ['tabler-info-circle', 'Information'],
  ['tabler-heart', 'Benefit'],
  ['tabler-run', 'Running'],
  ['tabler-microphone-2', 'Speaker'],
  ['tabler-building-store', 'Booth'],
  ['tabler-package', 'Package']
] as const

const makeId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const EventExperienceConfigurator = ({ kind, value, disabled = false, onChange }: Props) => {
  const enabled = new Set(value.enabledModules)
  const benefits = value.benefits ?? []
  const contentSections = value.contentSections ?? []

  const setModules = (modules: EventModuleKey[]) => {
    const next = Array.from(new Set([...CORE_EVENT_MODULES, ...modules]))
    onChange({ ...value, kind, enabledModules: next })
  }

  const toggleModule = (key: EventModuleKey) => {
    if (CORE_EVENT_MODULES.includes(key)) return
    const definition = EVENT_MODULE_DEFINITIONS.find(module => module.key === key)
    if (definition?.comingSoon && !enabled.has(key)) return
    setModules(enabled.has(key) ? value.enabledModules.filter(module => module !== key) : [...value.enabledModules, key])
  }

  const updateField = (index: number, patch: Partial<RegistrationFieldDefinition>) => {
    const fields = value.registrationFields.map((field, fieldIndex) =>
      fieldIndex === index ? { ...field, ...patch } : field
    )
    onChange({ ...value, kind, registrationFields: fields })
  }

  const removeField = (index: number) => {
    onChange({
      ...value,
      kind,
      registrationFields: value.registrationFields.filter((_, fieldIndex) => fieldIndex !== index)
    })
  }

  const addField = () => {
    const suffix = value.registrationFields.length + 1
    onChange({
      ...value,
      kind,
      registrationFields: [
        ...value.registrationFields,
        {
          key: `customField${suffix}`,
          label: `Custom Field ${suffix}`,
          type: 'text',
          required: false,
          options: []
        }
      ]
    })
  }

  const updateBenefit = (index: number, patch: Partial<BenefitItemDefinition>) => {
    onChange({
      ...value,
      benefits: benefits.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)
    })
  }

  const addBenefit = () => {
    onChange({
      ...value,
      benefits: [
        ...benefits,
        { id: makeId(), title: 'New benefit', description: '', icon: 'tabler-sparkles' }
      ]
    })
  }

  const removeBenefit = (index: number) => {
    onChange({ ...value, benefits: benefits.filter((_, itemIndex) => itemIndex !== index) })
  }

  const updateContentSection = (index: number, patch: Partial<ContentSectionDefinition>) => {
    onChange({
      ...value,
      contentSections: contentSections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, ...patch } : section
      )
    })
  }

  const addContentSection = () => {
    onChange({
      ...value,
      contentSections: [
        ...contentSections,
        {
          id: makeId(),
          title: 'New Information',
          icon: 'tabler-info-circle',
          markdown: 'Write your information here.'
        }
      ]
    })
  }

  const removeContentSection = (index: number) => {
    onChange({ ...value, contentSections: contentSections.filter((_, sectionIndex) => sectionIndex !== index) })
  }

  const appendMarkdown = (index: number, snippet: string) => {
    const current = contentSections[index]?.markdown ?? ''
    const separator = current && !current.endsWith('\n') ? '\n' : ''
    updateContentSection(index, { markdown: `${current}${separator}${snippet}` })
  }

  const applyTemplate = () => {
    const template = createDefaultExperienceConfig(kind)
    onChange({
      ...template,
      benefits,
      contentSections
    })
  }

  return (
    <Box sx={{ display: 'grid', gap: 5 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          gap: 2,
          alignItems: { md: 'center' }
        }}
      >
        <Box>
          <Typography variant='h6' fontWeight={700}>Event modules</Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
            {kind} gives you a starting template. Core operations stay enabled, while optional modules can be turned on or off per event.
          </Typography>
        </Box>
        <Button variant='outlined' disabled={disabled} onClick={applyTemplate} startIcon={<i className='tabler-template' />}>
          Reset to {kind} template
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 2 }}>
        {EVENT_MODULE_DEFINITIONS.map(module => {
          const isCore = Boolean(module.core)
          const isEnabled = enabled.has(module.key)
          const recommended = module.recommendedFor?.includes(kind)
          const lockedComingSoon = Boolean(module.comingSoon && !isEnabled)

          return (
            <Card key={module.key} variant='outlined' sx={{ height: '100%', opacity: module.comingSoon ? 0.72 : 1 }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start' }}>
                  <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: 'action.hover', display: 'grid', placeItems: 'center', color: 'primary.main' }}>
                    <i className={`${module.icon} text-xl`} />
                  </Box>
                  <Checkbox
                    checked={isEnabled}
                    disabled={disabled || isCore || lockedComingSoon}
                    onChange={() => toggleModule(module.key)}
                    inputProps={{ 'aria-label': `Enable ${module.label}` }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Typography fontWeight={700}>{module.label}</Typography>
                  {isCore && <Chip size='small' label='Core' color='primary' variant='tonal' />}
                  {!isCore && recommended && !module.comingSoon && <Chip size='small' label={`${kind} default`} variant='outlined' />}
                  {module.comingSoon && <Chip size='small' label='Reserved / not built yet' color='warning' variant='tonal' />}
                </Box>

                <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.65 }}>
                  {module.description}
                </Typography>
              </CardContent>
            </Card>
          )
        })}
      </Box>

      <Divider />

      <Box>
        <Typography variant='h6' fontWeight={700}>Registration fields</Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
          Full name, email, phone, package, and consent remain core fields. Configure only the extra participant data required by this event.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 2 }}>
        {value.registrationFields.map((field, index) => (
          <Card key={`${field.key}-${index}`} variant='outlined'>
            <CardContent sx={{ display: 'grid', gap: 2.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 180px auto' }, gap: 2, alignItems: 'start' }}>
                <TextField
                  label='Field label'
                  value={field.label}
                  disabled={disabled}
                  onChange={event => updateField(index, { label: event.target.value })}
                  inputProps={{ maxLength: 150 }}
                />
                <TextField
                  label='Field key'
                  value={field.key}
                  disabled={disabled}
                  onChange={event => updateField(index, { key: event.target.value.replace(/\s+/g, '') })}
                  helperText='Example: jerseySize'
                  inputProps={{ maxLength: 64 }}
                />
                <TextField
                  select
                  label='Type'
                  value={field.type}
                  disabled={disabled}
                  onChange={event => updateField(index, { type: event.target.value as RegistrationFieldType, options: event.target.value === 'select' ? field.options : [] })}
                >
                  {fieldTypes.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                </TextField>
                <IconButton disabled={disabled} color='error' onClick={() => removeField(index)} aria-label={`Remove ${field.label}`}>
                  <i className='tabler-trash' />
                </IconButton>
              </Box>

              <FormControlLabel
                control={<Checkbox checked={field.required} disabled={disabled} onChange={event => updateField(index, { required: event.target.checked })} />}
                label='Required field'
              />

              {field.type === 'select' && (
                <TextField
                  label='Select options'
                  value={field.options.join(', ')}
                  disabled={disabled}
                  onChange={event => updateField(index, {
                    options: event.target.value.split(',').map(option => option.trim()).filter(Boolean)
                  })}
                  helperText='Separate options with commas. Example: 5K, 10K, 21K'
                  fullWidth
                />
              )}
            </CardContent>
          </Card>
        ))}

        {value.registrationFields.length === 0 && (
          <Card variant='outlined'>
            <CardContent sx={{ py: 4, textAlign: 'center' }}>
              <Typography fontWeight={600}>No extra registration fields</Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                The registration form will only ask for the core participant and package information.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      <Button disabled={disabled} variant='outlined' onClick={addField} startIcon={<i className='tabler-plus' />} sx={{ justifySelf: 'start' }}>
        Add registration field
      </Button>

      <Divider />

      <Box>
        <Typography variant='h6' fontWeight={700}>Dynamic benefits</Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
          Add benefit cards one by one. Each benefit can use its own icon, title, and description and will be rendered separately on the public event page.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 2 }}>
        {benefits.map((benefit, index) => (
          <Card key={benefit.id ?? index} variant='outlined'>
            <CardContent sx={{ display: 'grid', gap: 2.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px minmax(0, 1fr) auto' }, gap: 2, alignItems: 'start' }}>
                <TextField
                  select
                  label='Icon'
                  value={benefit.icon ?? 'tabler-sparkles'}
                  disabled={disabled}
                  onChange={event => updateBenefit(index, { icon: event.target.value })}
                >
                  {iconOptions.map(([icon, label]) => (
                    <MenuItem value={icon} key={icon}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <i className={icon} /> {label}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label='Benefit title'
                  value={benefit.title}
                  disabled={disabled}
                  onChange={event => updateBenefit(index, { title: event.target.value })}
                  inputProps={{ maxLength: 150 }}
                  required
                />
                <IconButton disabled={disabled} color='error' onClick={() => removeBenefit(index)} aria-label='Remove benefit'>
                  <i className='tabler-trash' />
                </IconButton>
              </Box>
              <TextField
                label='Description'
                value={benefit.description ?? ''}
                disabled={disabled}
                onChange={event => updateBenefit(index, { description: event.target.value })}
                multiline
                minRows={2}
                inputProps={{ maxLength: 500 }}
              />
            </CardContent>
          </Card>
        ))}

        {benefits.length === 0 && (
          <Card variant='outlined'>
            <CardContent sx={{ py: 4, textAlign: 'center' }}>
              <Typography fontWeight={600}>No benefit cards yet</Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>Add only the benefits that exist for this event.</Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      <Button disabled={disabled} variant='outlined' onClick={addBenefit} startIcon={<i className='tabler-plus' />} sx={{ justifySelf: 'start' }}>
        Add benefit
      </Button>

      <Divider />

      <Box>
        <Typography variant='h6' fontWeight={700}>Dynamic information sections</Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
          Create sections such as Prize, Winner Information, Rules, Race Pack Guide, or Seminar Notes. Content supports headings, bold, italic, and lists using the formatting buttons below.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 2 }}>
        {contentSections.map((section, index) => (
          <Card key={section.id ?? index} variant='outlined'>
            <CardContent sx={{ display: 'grid', gap: 2.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px minmax(0, 1fr) auto' }, gap: 2, alignItems: 'start' }}>
                <TextField
                  select
                  label='Icon'
                  value={section.icon ?? 'tabler-info-circle'}
                  disabled={disabled}
                  onChange={event => updateContentSection(index, { icon: event.target.value })}
                >
                  {iconOptions.map(([icon, label]) => (
                    <MenuItem value={icon} key={icon}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <i className={icon} /> {label}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label='Section title'
                  value={section.title}
                  disabled={disabled}
                  onChange={event => updateContentSection(index, { title: event.target.value })}
                  inputProps={{ maxLength: 160 }}
                  placeholder='Example: Prize'
                  required
                />
                <IconButton disabled={disabled} color='error' onClick={() => removeContentSection(index)} aria-label='Remove information section'>
                  <i className='tabler-trash' />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Button size='small' variant='outlined' disabled={disabled} onClick={() => appendMarkdown(index, '# Heading')}>H1</Button>
                <Button size='small' variant='outlined' disabled={disabled} onClick={() => appendMarkdown(index, '## Heading')}>H2</Button>
                <Button size='small' variant='outlined' disabled={disabled} onClick={() => appendMarkdown(index, '**bold text**')}><strong>Bold</strong></Button>
                <Button size='small' variant='outlined' disabled={disabled} onClick={() => appendMarkdown(index, '*italic text*')}><em>Italic</em></Button>
                <Button size='small' variant='outlined' disabled={disabled} onClick={() => appendMarkdown(index, '- list item')}>• List</Button>
                <Button size='small' variant='outlined' disabled={disabled} onClick={() => appendMarkdown(index, '1. list item')}>1. List</Button>
              </Box>

              <TextField
                label='Formatted content'
                value={section.markdown}
                disabled={disabled}
                onChange={event => updateContentSection(index, { markdown: event.target.value })}
                multiline
                minRows={7}
                inputProps={{ maxLength: 12000 }}
                helperText='Formatting: # H1, ## H2, **bold**, *italic*, - bullet list, 1. numbered list. Raw HTML is not rendered.'
              />
            </CardContent>
          </Card>
        ))}

        {contentSections.length === 0 && (
          <Card variant='outlined'>
            <CardContent sx={{ py: 4, textAlign: 'center' }}>
              <Typography fontWeight={600}>No additional information sections</Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                Add sections only when this event needs extra public information.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      <Button disabled={disabled} variant='outlined' onClick={addContentSection} startIcon={<i className='tabler-plus' />} sx={{ justifySelf: 'start' }}>
        Add information section
      </Button>
    </Box>
  )
}

export default EventExperienceConfigurator
