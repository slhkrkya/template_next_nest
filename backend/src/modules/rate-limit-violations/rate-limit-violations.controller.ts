import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { PaginationDto } from '../../common/dto/pagination.dto'
import { GetUser, RequirePermission } from '../../common/decorators'
import { AuthenticatedUser } from '../../common/types'
import { BulkDismissDto } from './dto/bulk-dismiss.dto'
import { ClearOldDto } from './dto/clear-old.dto'
import { GetRateLimitViolationsQuery } from './queries'
import { DismissViolationCommand, BulkDismissViolationsCommand, ClearOldViolationsCommand } from './commands'

@ApiTags('rate-limit-violations')
@ApiBearerAuth()
@Controller('rate-limit-violations')
export class RateLimitViolationsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @RequirePermission('RateLimits', 'read')
  @ApiOperation({ summary: 'List rate limit violations (paginated)' })
  findAll(
    @GetUser() user: AuthenticatedUser,
    @Query() query: PaginationDto,
    @Query('dismissed') dismissed?: string,
  ) {
    const dismissedFilter = dismissed === 'true' ? true : dismissed === 'false' ? false : undefined
    return this.queryBus.execute(new GetRateLimitViolationsQuery(user, query, dismissedFilter))
  }

  @Patch(':id/dismiss')
  @RequirePermission('RateLimits', 'update')
  @ApiOperation({ summary: 'Dismiss a single rate limit violation' })
  @ApiParam({ name: 'id', type: String })
  dismiss(
    @GetUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.commandBus.execute(new DismissViolationCommand(user, id))
  }

  @Post('bulk-dismiss')
  @RequirePermission('RateLimits', 'update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk dismiss rate limit violations by IDs' })
  bulkDismiss(
    @GetUser() user: AuthenticatedUser,
    @Body() dto: BulkDismissDto,
  ) {
    return this.commandBus.execute(new BulkDismissViolationsCommand(user, dto.ids))
  }

  @Delete('clear-old')
  @RequirePermission('RateLimits', 'delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete rate limit violations older than N days (default 30)' })
  clearOld(
    @GetUser() user: AuthenticatedUser,
    @Query() query: ClearOldDto,
  ) {
    return this.commandBus.execute(new ClearOldViolationsCommand(user, query.daysOld ?? 30))
  }
}
