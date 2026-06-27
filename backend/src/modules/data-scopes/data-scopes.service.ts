import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ScopeType } from '@prisma/client';
import { IDataScopeRepository, DATA_SCOPE_REPOSITORY } from './domain/data-scope.repository.interface';
import { CreateDataScopeDto } from './dto/create-data-scope.dto';

@Injectable()
export class DataScopesService {
  constructor(
    @Inject(DATA_SCOPE_REPOSITORY) private readonly dataScopes: IDataScopeRepository,
  ) {}

  async getUserDataScopes(userId: string, tenantId?: string | null) {
    return this.dataScopes.findByUser(userId, tenantId ?? undefined);
  }

  async upsertDataScope(dto: CreateDataScopeDto) {
    const { userId, tenantId, entityName, scopeType } = dto;

    // Map DTO enum to Prisma ScopeType enum
    const scopeTypeMap: Record<string, ScopeType> = {
      ALL: ScopeType.ALL,
      OWN: ScopeType.SELF,
      TEAM: ScopeType.DEPARTMENT,
      CUSTOM: ScopeType.ALL,
      SELF: ScopeType.SELF,
      DEPARTMENT: ScopeType.DEPARTMENT,
    };
    const prismaScope: ScopeType = scopeTypeMap[scopeType] ?? ScopeType.SELF;

    return this.dataScopes.upsert({
      userId,
      tenantId,
      entityName,
      scopeType: prismaScope,
    });
  }

  async removeDataScope(
    userId: string,
    entityName: string,
    tenantId?: string | null,
  ): Promise<void> {
    await this.dataScopes.delete(userId, entityName, tenantId ?? undefined);
  }
}
