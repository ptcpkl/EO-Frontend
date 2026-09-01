export type EventPackage = {
  id: string
  eventId: string
  name: string
  benefits: string | null
  capacity: number
  registeredCount: number
  remainingQuota: number
  price: number
  sortOrder: number
  isActive: boolean
}

export type CreateEventPackageRequest = {
  name: string
  benefits?: string | null
  capacity: number
  price: number
  sortOrder: number
}

export type UpdateEventPackageRequest =
  CreateEventPackageRequest
