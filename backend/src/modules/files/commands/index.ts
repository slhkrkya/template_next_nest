export * from './upload-file.command'
export * from './handlers/upload-file.handler'

import { UploadFileHandler } from './handlers/upload-file.handler'

export const CommandHandlers = [UploadFileHandler]
