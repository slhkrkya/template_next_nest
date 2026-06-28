export interface BaseEntityProps {
  id: string
  createdAt: Date
}

export interface BaseTimestampedEntityProps extends BaseEntityProps {
  updatedAt: Date
}

export interface BaseSoftDeletableEntityProps extends BaseTimestampedEntityProps {
  isActive: boolean
}
