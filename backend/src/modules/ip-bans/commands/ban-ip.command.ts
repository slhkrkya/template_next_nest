import { ICommand } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'
import { BanIpDto } from '../dto/ban-ip.dto'

export class BanIpCommand implements ICommand {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly dto: BanIpDto,
  ) {}
}
