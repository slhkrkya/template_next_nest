export * from './get-file.query'
export * from './get-thumbnail.query'
export * from './handlers/get-file.handler'
export * from './handlers/get-thumbnail.handler'

import { GetFileHandler } from './handlers/get-file.handler'
import { GetThumbnailHandler } from './handlers/get-thumbnail.handler'

export const QueryHandlers = [GetFileHandler, GetThumbnailHandler]
