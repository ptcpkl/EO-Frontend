import Typography from '@mui/material/Typography'

type Props = {
  publicView?: boolean
}

const HomeDashboard = (props: Props) => {
  void props

  return (
    <main className='flex min-h-screen items-center justify-center'>
      <Typography variant='h4'>Hello!</Typography>
    </main>
  )
}

export default HomeDashboard
