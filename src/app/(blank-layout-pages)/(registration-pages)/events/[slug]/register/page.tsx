import EventRegistration from '@views/EventRegistration'

type Props = {
  params: Promise<{ slug: string }>
}

const RegistrationPage = async ({ params }: Props) => {
  const { slug } = await params

  return <EventRegistration slug={slug} />
}

export default RegistrationPage
