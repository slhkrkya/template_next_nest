import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
} from '@nestjs/common'
import { IEntityWorkflowRepository, ENTITY_WORKFLOW_REPOSITORY } from './domain/entity-workflow.repository.interface'
import { CreateEntityWorkflowDto } from './dto/create-entity-workflow.dto'
import { PaginationDto } from '../../common/dto/pagination.dto'
import { paginationHelper } from '../../common/utils/pagination.util'
import { PagedResult } from '../../common/types'

export class EntityWorkflowsQueryDto extends PaginationDto {
  tenantId?: string
  entityName?: string
}

@Injectable()
export class EntityWorkflowsService {
  private readonly logger = new Logger(EntityWorkflowsService.name)

  constructor(
    @Inject(ENTITY_WORKFLOW_REPOSITORY) private readonly workflows: IEntityWorkflowRepository,
  ) {}

  async findAll(query: EntityWorkflowsQueryDto): Promise<PagedResult<any>> {
    const { buildResult } = paginationHelper(query, 'createdAt')

    let data = query.tenantId
      ? await this.workflows.findByTenant(query.tenantId)
      : await this.workflows.findByTenant('')

    if (query.entityName) {
      data = data.filter((w: any) => w.entityName === query.entityName)
    }

    if (query.search) {
      const s = query.search.toLowerCase()
      data = data.filter(
        (w: any) =>
          w.name?.toLowerCase().includes(s) ||
          w.description?.toLowerCase().includes(s) ||
          w.entityName?.toLowerCase().includes(s),
      )
    }

    return buildResult(data, data.length)
  }

  async findOne(id: string): Promise<any> {
    const workflow = await this.workflows.findById(id)
    if (!workflow) throw new NotFoundException(`EntityWorkflow ${id} not found`)
    return workflow
  }

  async create(dto: CreateEntityWorkflowDto): Promise<any> {
    const workflow = await this.workflows.create({
      tenantId: dto.tenantId,
      entityName: dto.entityName,
      name: dto.name,
      description: dto.description,
      definition: (dto.steps ?? []) as any,
      isActive: dto.isActive ?? true,
    })

    this.logger.log(`EntityWorkflow created: ${workflow.id} for entity "${dto.entityName}" in tenant ${dto.tenantId}`)
    return workflow
  }

  async update(id: string, dto: Partial<CreateEntityWorkflowDto>): Promise<any> {
    await this.findOne(id)

    const workflow = await this.workflows.update(id, {
      ...(dto.entityName !== undefined && { entityName: dto.entityName }),
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.steps !== undefined && { definition: (dto.steps ?? {}) as any }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    })

    this.logger.log(`EntityWorkflow updated: ${id}`)
    return workflow
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id)
    await this.workflows.delete(id)
    this.logger.log(`EntityWorkflow deleted: ${id}`)
  }
}
