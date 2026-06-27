import { BadRequestException, NotFoundException } from '@nestjs/common'

export class EntityNotFoundException extends NotFoundException {
  constructor(entity: string, id: string) {
    super(`${entity} with id "${id}" was not found`)
  }
}

export class EntityAlreadyExistsException extends BadRequestException {
  constructor(entity: string, field: string, value: string) {
    super(`${entity} with ${field} "${value}" already exists`)
  }
}

export class DomainValidationException extends BadRequestException {
  constructor(message: string) {
    super(message)
  }
}
