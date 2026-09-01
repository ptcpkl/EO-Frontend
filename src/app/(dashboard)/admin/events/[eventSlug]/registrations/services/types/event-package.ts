export type EventPackage = {
  id: string
  eventId: string
  name: string
  benefits: string | null
  capacity: number | null
  registeredCount: number
  remainingQuota: number | null
  isUnlimited: boolean
  price: number
  sortOrder: number
  isActive: boolean
}

export type CreateEventPackageRequest = {
  name: string
  benefits?: string | null
  capacity: number | null
  price: number
  sortOrder: number
}

export type UpdateEventPackageRequest = CreateEventPackageRequest
