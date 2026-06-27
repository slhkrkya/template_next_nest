import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common'
import { ISubscriptionPlanRepository, SUBSCRIPTION_PLAN_REPOSITORY } from './domain/subscription-plan.repository.interface'
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto'
import { PaginationDto } from '../../common/dto/pagination.dto'
import { paginationHelper } from '../../common/utils/pagination.util'
import { PagedResult } from '../../common/types'

@Injectable()
export class SubscriptionPlansService {
  private readonly logger = new Logger(SubscriptionPlansService.name)

  constructor(
    @Inject(SUBSCRIPTION_PLAN_REPOSITORY) private readonly subscriptionPlans: ISubscriptionPlanRepository,
  ) {}

  async findAll(query: PaginationDto): Promise<PagedResult<any>> {
    const { buildResult } = paginationHelper(query, 'createdAt')

    let data = await this.subscriptionPlans.findAll()

    if (query.search) {
      const s = query.search.toLowerCase()
      data = data.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(s) ||
          p.description?.toLowerCase().includes(s),
      )
    }

    return buildResult(data, data.length)
  }

  async findOne(id: string): Promise<any> {
    const plan = await this.subscriptionPlans.findById(id)
    if (!plan) throw new NotFoundException(`SubscriptionPlan ${id} not found`)
    return plan
  }

  async create(dto: CreateSubscriptionPlanDto): Promise<any> {
    const all = await this.subscriptionPlans.findAll()
    const existing = all.find((p: any) => p.name === dto.name)
    if (existing) throw new ConflictException(`Plan with name "${dto.name}" already exists`)

    const plan = await this.subscriptionPlans.create({
      id: undefined as any,
      name: dto.name,
      displayName: dto.name,
      description: dto.description,
      monthlyPrice: dto.price ?? 0,
      yearlyPrice: (dto.price ?? 0) * 10,
      quarterlyPrice: null,
      maxUsers: dto.maxUsers ?? 10,
      maxStorageBytes: BigInt(0),
      isActive: dto.isActive ?? true,
      features: JSON.parse(JSON.stringify(dto.features ?? {})),
    })

    this.logger.log(`SubscriptionPlan created: ${plan.id} (${plan.name})`)
    return plan
  }

  async update(id: string, dto: Partial<CreateSubscriptionPlanDto>): Promise<any> {
    await this.findOne(id)

    const plan = await this.subscriptionPlans.update(id, {
      ...(dto.name !== undefined && { name: dto.name, displayName: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.price !== undefined && { monthlyPrice: dto.price }),
      ...(dto.maxUsers !== undefined && { maxUsers: dto.maxUsers }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.features !== undefined && { features: JSON.parse(JSON.stringify(dto.features)) }),
    })

    this.logger.log(`SubscriptionPlan updated: ${id}`)
    return plan
  }

  async deactivate(id: string): Promise<any> {
    await this.findOne(id)
    const plan = await this.subscriptionPlans.update(id, { isActive: false })
    this.logger.log(`SubscriptionPlan deactivated: ${id}`)
    return plan
  }
}
