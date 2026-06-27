import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { BanIpDto } from './dto/ban-ip.dto'
import { PaginationDto } from '../../common/dto/pagination.dto'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AuthenticatedUser } from '../../common/types'
import { GetIpBansQuery } from './queries'
import { BanIpCommand, UnbanIpCommand } from './commands'

@ApiTags('ip-bans')
@ApiBearerAuth()
@Controller('ip-bans')
export class IpBansController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all banned IPs (paginated)' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationDto,
  ) {
    return this.queryBus.execute(new GetIpBansQuery(user, query))
  }

  @Post('ban')
  @ApiOperation({ summary: 'Ban an IP address' })
  ban(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BanIpDto,
  ) {
    return this.commandBus.execute(new BanIpCommand(user, dto))
  }

  @Delete('unban/:ip')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unban an IP address' })
  @ApiParam({ name: 'ip', type: String, description: 'IP address to unban' })
  unban(
    @CurrentUser() user: AuthenticatedUser,
    @Param('ip') ip: string,
  ) {
    return this.commandBus.execute(new UnbanIpCommand(user, ip))
  }
}
