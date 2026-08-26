import Skeleton from '@mui/material/Skeleton'

const EventLoading = () => (
  <main className='min-h-screen bg-[#f4f6f2] p-6 lg:p-10'>
    <div className='mx-auto max-w-[1280px]'>
      <Skeleton variant='text' width={140} height={32} />
      <Skeleton variant='rectangular' height={480} sx={{ mt: 2 }} />
      <div className='mt-6 grid gap-6 lg:grid-cols-[1fr_330px]'>
        <Skeleton variant='rounded' height={230} />
        <Skeleton variant='rounded' height={230} />
      </div>
    </div>
  </main>
)

export default EventLoading
