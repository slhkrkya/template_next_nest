"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import {
  getAllEntities as fetchAllEntities,
  getRolePermissions as fetchRolePermissions,
  getUserPermissions as fetchUserPermissions,
  upsertRolePermission,
  upsertUserPermission,
} from "@/lib/api/permissions.api";
import { getUsers as fetchUsers } from "@/lib/api/users.api";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAppToast } from "@/providers/prime-provider";
import type {
  OperationClaim,
  PermissionEntity,
  RoleEntityPermission,
  User,
  UserEntityPermission,
} from "@/types";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Checkbox } from "primereact/checkbox";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { ListBox } from "primereact/listbox";
import { SelectButton } from "primereact/selectbutton";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";

type ScopeType = "CREATE" | "READ" | "UPDATE" | "DELETE";

interface Entity {
  id: string;
  name: string;
}

interface PermissionEntry {
  entityName: string;
  CREATE: boolean;
  READ: boolean;
  UPDATE: boolean;
  DELETE: boolean;
}

interface SubjectOption {
  id: string;
  label: string;
  sublabel?: string;
}

async function getAllEntities(): Promise<Entity[]> {
  const entities = await fetchAllEntities();
  return entities.map((entity: PermissionEntity) => ({
    id: entity.id,
    name: entity.name,
  }));
}

async function getUsers(): Promise<SubjectOption[]> {
  const data = await fetchUsers({ pageSize: 100 });
  return (data.data ?? []).map((user: User) => ({
    id: user.id,
    label: `${user.firstName} ${user.lastName}`,
    sublabel: user.email,
  }));
}

async function getRoles(): Promise<SubjectOption[]> {
  const data = await axiosInstance.get<OperationClaim[]>("/roles");
  return (data.data ?? []).map((role) => ({
    id: role.id,
    label: role.name,
    sublabel: role.description,
  }));
}

async function getUserPermissions(userId: string): Promise<PermissionEntry[]> {
  const permissions = await fetchUserPermissions(userId);
  return permissions.map(toPermissionEntry);
}

async function getRolePermissions(roleId: string): Promise<PermissionEntry[]> {
  const permissions = await fetchRolePermissions(roleId);
  return permissions.map(toPermissionEntry);
}

async function savePermissions(
  type: "user" | "role",
  id: string,
  permissions: PermissionEntry[],
) {
  await Promise.all(
    permissions.map((permission) => {
      const payload = {
        entityName: permission.entityName,
        canCreate: permission.CREATE,
        canRead: permission.READ,
        canUpdate: permission.UPDATE,
        canDelete: permission.DELETE,
      };

      return type === "user"
        ? upsertUserPermission({ userId: id, ...payload })
        : upsertRolePermission({ roleId: id, ...payload });
    }),
  );
}

function toPermissionEntry(
  permission: UserEntityPermission | RoleEntityPermission,
): PermissionEntry {
  return {
    entityName: permission.entityName,
    CREATE: permission.canCreate,
    READ: permission.canRead,
    UPDATE: permission.canUpdate,
    DELETE: permission.canDelete,
  };
}

const SCOPES: ScopeType[] = ["CREATE", "READ", "UPDATE", "DELETE"];

const SCOPE_META: Record<ScopeType, { labelKey: string; color: string; severity: "success" | "info" | "warning" | "danger" }> = {
  CREATE: { labelKey: "create", color: "#16a34a", severity: "success" },
  READ: { labelKey: "read", color: "#2563eb", severity: "info" },
  UPDATE: { labelKey: "update", color: "#d97706", severity: "warning" },
  DELETE: { labelKey: "delete", color: "#dc2626", severity: "danger" },
};

export default function PermissionsPage() {
  const t = useTranslations("permissions");
  const commonT = useTranslations("common");
  const { toast } = useAppToast();
  const [tab, setTab] = useState<"user" | "role">("user");
  const [selectedId, setSelectedId] = useState("");
  const [permissions, setPermissions] = useState<PermissionEntry[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const entitiesQuery = useQuery({ queryKey: ["entities"], queryFn: getAllEntities });
  const usersQuery = useQuery({ queryKey: ["perm-users"], queryFn: getUsers });
  const rolesQuery = useQuery({ queryKey: ["perm-roles"], queryFn: getRoles });
  const tabOptions = [
    { label: t("users"), value: "user", icon: "pi pi-users" },
    { label: t("roles"), value: "role", icon: "pi pi-shield" },
  ];

  const subjects = tab === "user" ? (usersQuery.data ?? []) : (rolesQuery.data ?? []);
  const selectedSubject = subjects.find((subject) => subject.id === selectedId);

  const permsQuery = useQuery({
    queryKey: ["permissions", tab, selectedId],
    queryFn: () =>
      tab === "user" ? getUserPermissions(selectedId) : getRolePermissions(selectedId),
    enabled: !!selectedId,
  });

  useEffect(() => {
    const entities = entitiesQuery.data ?? [];
    const fetched = permsQuery.data ?? [];

    if (!entities.length) {
      return;
    }

    setPermissions(
      entities.map((entity) => {
        const found = fetched.find((permission) => permission.entityName === entity.name);
        return (
          found ?? {
            entityName: entity.name,
            CREATE: false,
            READ: false,
            UPDATE: false,
            DELETE: false,
          }
        );
      }),
    );
    setIsDirty(false);
  }, [entitiesQuery.data, permsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => savePermissions(tab, selectedId, permissions),
    onSuccess: () => {
      setIsDirty(false);
      toast({
        title: t("saved"),
        description: t("savedDescription"),
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: t("saveFailed"),
        description: t("saveFailedDescription"),
        variant: "destructive",
      });
    },
  });

  const togglePermission = useCallback((entityName: string, scope: ScopeType) => {
    setPermissions((prev) =>
      prev.map((permission) =>
        permission.entityName === entityName
          ? { ...permission, [scope]: !permission[scope] }
          : permission,
      ),
    );
    setIsDirty(true);
  }, []);

  const toggleAllScope = (scope: ScopeType, value: boolean) => {
    setPermissions((prev) =>
      prev.map((permission) => ({ ...permission, [scope]: value })),
    );
    setIsDirty(true);
  };

  const toggleAllEntity = (entityName: string, value: boolean) => {
    setPermissions((prev) =>
      prev.map((permission) =>
        permission.entityName === entityName
          ? { ...permission, CREATE: value, READ: value, UPDATE: value, DELETE: value }
          : permission,
      ),
    );
    setIsDirty(true);
  };

  const subjectTemplate = (subject: SubjectOption) => (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-foreground">
        {subject.label}
      </span>
      {subject.sublabel && (
        <span className="truncate text-xs text-muted-foreground">
          {subject.sublabel}
        </span>
      )}
    </div>
  );

  const emptyMessage = selectedId
    ? t("empty")
    : t("selectSubject");

  const selectedCount = useMemo(
    () =>
      permissions.reduce(
        (count, permission) =>
          count + SCOPES.filter((scope) => permission[scope]).length,
        0,
      ),
    [permissions],
  );

  const renderScopeHeader = (scope: ScopeType) => (
    <div className="flex min-w-28 flex-col items-center gap-2">
      <Tag value={t(SCOPE_META[scope].labelKey)} severity={SCOPE_META[scope].severity} />
      <div className="flex items-center gap-1">
        <Button
          type="button"
          label={commonT("all")}
          size="small"
          text
          className="px-2 py-1 text-xs"
          onClick={() => toggleAllScope(scope, true)}
          disabled={!selectedId}
        />
        <span className="text-border">/</span>
        <Button
          type="button"
          label={commonT("none")}
          size="small"
          text
          className="px-2 py-1 text-xs"
          onClick={() => toggleAllScope(scope, false)}
          disabled={!selectedId}
        />
      </div>
    </div>
  );

  const renderScopeCell = (permission: PermissionEntry, scope: ScopeType) => (
    <div className="flex justify-center">
      <Checkbox
        inputId={`${permission.entityName}-${scope}`}
        checked={permission[scope]}
        onChange={() => togglePermission(permission.entityName, scope)}
        pt={{
          box: {
            style: permission[scope]
              ? {
                  borderColor: SCOPE_META[scope].color,
                  backgroundColor: SCOPE_META[scope].color,
                }
              : undefined,
          },
        }}
      />
    </div>
  );

  const isLoadingSubjects = tab === "user" ? usersQuery.isLoading : rolesQuery.isLoading;
  const isMatrixLoading = !!selectedId && (permsQuery.isLoading || entitiesQuery.isLoading);

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          selectedId ? (
            <Button
              label={saveMutation.isPending ? commonT("saving") : commonT("saveChanges")}
              icon="pi pi-save"
              onClick={() => saveMutation.mutate()}
              disabled={!isDirty || saveMutation.isPending}
              loading={saveMutation.isPending}
            />
          ) : undefined
        }
      />

      <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Card className="h-fit">
          <div className="flex flex-col gap-4">
            <SelectButton
              value={tab}
              options={tabOptions}
              onChange={(event) => {
                if (event.value) {
                  setTab(event.value);
                  setSelectedId("");
                }
              }}
              optionLabel="label"
              optionValue="value"
              className="w-full"
            />

            {isLoadingSubjects ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} height="3.25rem" />
                ))}
              </div>
            ) : (
              <ListBox
                value={selectedId}
                options={subjects}
                onChange={(event) => setSelectedId(event.value)}
                optionLabel="label"
                optionValue="id"
                itemTemplate={subjectTemplate}
                filter
                filterPlaceholder={`${commonT("search")} ${tab === "user" ? t("users") : t("roles")}`}
                emptyMessage={commonT("noData")}
                listStyle={{ maxHeight: "28rem" }}
                className="w-full"
              />
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="m-0 text-lg font-semibold text-foreground">
                  {selectedSubject ? `${selectedSubject.label} ${t("matrix")}` : t("matrix")}
                </h2>
                {isDirty && (
                  <Tag value={t("unsaved")} icon="pi pi-circle-fill" severity="warning" />
                )}
              </div>
              <p className="m-0 text-sm text-muted-foreground">
                {selectedSubject?.sublabel ??
                  t("selectSubject")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Tag value={t("entities", { count: permissions.length })} severity="info" />
              <Tag value={t("grants", { count: selectedCount })} severity="success" />
            </div>
          </div>

          {isMatrixLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} height="3rem" />
              ))}
            </div>
          ) : (
            <DataTable
              value={selectedId ? permissions : []}
              dataKey="entityName"
              emptyMessage={emptyMessage}
              rowHover
              stripedRows
              scrollable
              scrollHeight="calc(100vh - 22rem)"
              className="arca-data-table"
              tableStyle={{ minWidth: "54rem" }}
            >
              <Column
                field="entityName"
                header={t("entity")}
                frozen
                body={(permission: PermissionEntry) => (
                  <div className="flex items-center gap-2">
                    <i className="pi pi-database text-primary" />
                    <span className="font-mono text-sm text-foreground">
                      {permission.entityName}
                    </span>
                  </div>
                )}
              />
              {SCOPES.map((scope) => (
                <Column
                  key={scope}
                  header={renderScopeHeader(scope)}
                  body={(permission: PermissionEntry) => renderScopeCell(permission, scope)}
                  style={{ textAlign: "center" }}
                />
              ))}
              <Column
                header={commonT("all")}
                body={(permission: PermissionEntry) => {
                  const allGranted = SCOPES.every((scope) => permission[scope]);
                  return (
                    <div className="flex justify-center">
                      <Checkbox
                        inputId={`${permission.entityName}-all`}
                        checked={allGranted}
                        onChange={() => toggleAllEntity(permission.entityName, !allGranted)}
                      />
                    </div>
                  );
                }}
                style={{ textAlign: "center", width: "6rem" }}
              />
            </DataTable>
          )}
        </Card>
      </div>
    </div>
  );
}
