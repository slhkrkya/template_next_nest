"use client";

import { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  Handle,
  Position,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { PageHeader } from "@/components/shared/PageHeader";
import { PermissionGuard } from "@/components/shared/PermissionGuard";
import { useAppToast } from "@/providers/prime-provider";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog";
import { FileUpload, type FileUploadHandlerEvent } from "primereact/fileupload";
import { Tag } from "primereact/tag";
import { useTranslations } from "next-intl";

const NODE_TYPES_CONFIG = [
  {
    type: "start",
    icon: "pi pi-play",
    color: "#16a34a",
  },
  {
    type: "action",
    icon: "pi pi-bolt",
    color: "#2563eb",
  },
  {
    type: "decision",
    icon: "pi pi-question-circle",
    color: "#d97706",
  },
  {
    type: "end",
    icon: "pi pi-stop-circle",
    color: "#dc2626",
  },
];

const NODE_COLOR: Record<string, string> = {
  start: "#16a34a",
  action: "#2563eb",
  decision: "#d97706",
  end: "#dc2626",
};

function NodeIcon({ icon }: { icon?: string }) {
  if (!icon) {
    return null;
  }

  return icon.startsWith("pi ") ? (
    <i className={icon} />
  ) : (
    <span>{icon}</span>
  );
}

function WorkflowNode({ data, type }: NodeProps) {
  const nodeData = data as { icon?: string; label?: string; description?: string };
  const color = NODE_COLOR[type as string] ?? "#64748b";
  const isDecision = type === "decision";

  return (
    <div
      className="min-w-36 rounded-lg border-2 bg-card px-5 py-3 text-center shadow-xl"
      style={{
        borderColor: color,
        boxShadow: `0 0 0 1px ${color}26, 0 14px 30px rgb(15 23 42 / 0.18)`,
        transform: isDecision ? "rotate(45deg)" : "none",
      }}
    >
      <div style={{ transform: isDecision ? "rotate(-45deg)" : "none" }}>
        <div className="text-lg" style={{ color }}>
          <NodeIcon icon={nodeData.icon} />
        </div>
        <div className="mt-1 text-sm font-bold text-foreground">
          {nodeData.label}
        </div>
        {nodeData.description && (
          <div className="mt-1 max-w-36 break-words text-xs text-muted-foreground">
            {nodeData.description}
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Top} style={{ background: color, border: "none" }} />
      <Handle type="source" position={Position.Bottom} style={{ background: color, border: "none" }} />
      {isDecision && (
        <>
          <Handle type="source" position={Position.Right} id="yes" style={{ background: color, border: "none" }} />
          <Handle type="source" position={Position.Left} id="no" style={{ background: color, border: "none" }} />
        </>
      )}
    </div>
  );
}

const nodeTypes = {
  start: WorkflowNode,
  action: WorkflowNode,
  decision: WorkflowNode,
  end: WorkflowNode,
};

function createInitialEdges(t: (key: any, params?: any) => string): Edge[] {
  return [
    { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "hsl(var(--primary))" } },
    { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "hsl(var(--primary))" } },
    {
      id: "e3-4",
      source: "3",
      target: "4",
      sourceHandle: "yes",
      label: t("common.yes"),
      style: { stroke: "#16a34a" },
      labelStyle: { fill: "#16a34a", fontSize: 11 },
    },
    {
      id: "e3-5",
      source: "3",
      target: "5",
      sourceHandle: "no",
      label: t("common.no"),
      style: { stroke: "#dc2626" },
      labelStyle: { fill: "#dc2626", fontSize: 11 },
    },
    { id: "e4-6", source: "4", target: "6", animated: true, style: { stroke: "hsl(var(--primary))" } },
  ];
}

function saveWorkflow(nodes: Node[], edges: Edge[]) {
  const data = JSON.stringify({ nodes, edges }, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "workflow.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

let nodeCounter = 10;

export default function WorkflowDemoPage() {
  const t = useTranslations();
  const { toast } = useAppToast();
  const nodeCopy = {
    start: { label: t("workflow.nodes.start.label"), desc: t("workflow.nodes.start.desc") },
    action: { label: t("workflow.nodes.action.label"), desc: t("workflow.nodes.action.desc") },
    decision: { label: t("workflow.nodes.decision.label"), desc: t("workflow.nodes.decision.desc") },
    end: { label: t("workflow.nodes.end.label"), desc: t("workflow.nodes.end.desc") },
  };
  const initialNodes: Node[] = [
    {
      id: "1",
      type: "start",
      position: { x: 250, y: 40 },
      data: { label: nodeCopy.start.label, icon: "pi pi-play", description: t("workflow.demo.workflowBegins") },
    },
    {
      id: "2",
      type: "action",
      position: { x: 250, y: 160 },
      data: { label: t("workflow.demo.validateInput"), icon: "pi pi-bolt", description: t("workflow.demo.checkRequestData") },
    },
    {
      id: "3",
      type: "decision",
      position: { x: 230, y: 290 },
      data: { label: t("workflow.demo.valid"), icon: "pi pi-question-circle" },
    },
    {
      id: "4",
      type: "action",
      position: { x: 120, y: 430 },
      data: { label: t("workflow.demo.process"), icon: "pi pi-bolt", description: t("workflow.demo.executeBusinessLogic") },
    },
    {
      id: "5",
      type: "end",
      position: { x: 380, y: 430 },
      data: { label: t("workflow.demo.reject"), icon: "pi pi-stop-circle", description: t("workflow.demo.returnError") },
    },
    {
      id: "6",
      type: "end",
      position: { x: 120, y: 560 },
      data: { label: t("workflow.demo.success"), icon: "pi pi-stop-circle", description: t("workflow.demo.returnOk") },
    },
  ];
  const initialEdges = createInitialEdges(t);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeType, setSelectedNodeType] = useState("action");
  const [clearDialogVisible, setClearDialogVisible] = useState(false);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((currentEdges) =>
        addEdge({ ...params, animated: true, style: { stroke: "hsl(var(--primary))" } }, currentEdges),
      ),
    [setEdges],
  );

  function addNode() {
    const config = NODE_TYPES_CONFIG.find((item) => item.type === selectedNodeType);

    if (!config) {
      return;
    }

    nodeCounter += 1;
    const newNode: Node = {
      id: `n${nodeCounter}`,
      type: selectedNodeType,
      position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: {
        label: nodeCopy[config.type as keyof typeof nodeCopy].label,
        icon: config.icon,
        description: nodeCopy[config.type as keyof typeof nodeCopy].desc,
      },
    };

    setNodes((currentNodes) => [...currentNodes, newNode]);
  }

  function handleSave() {
    saveWorkflow(nodes, edges);
    toast({
      title: t("workflow.exported"),
      description: t("workflow.exportedDescription"),
      variant: "success",
    });
  }

  function handleLoad(event: FileUploadHandlerEvent) {
    const file = event.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      try {
        const data = JSON.parse(String(readerEvent.target?.result ?? ""));

        if (Array.isArray(data.nodes) && Array.isArray(data.edges)) {
          setNodes(data.nodes);
          setEdges(data.edges);
          toast({
            title: t("workflow.loaded"),
            description: t("workflow.loadedDescription", { nodes: data.nodes.length, edges: data.edges.length }),
            variant: "success",
          });
          return;
        }

        throw new Error("Invalid workflow shape.");
      } catch {
        toast({
          title: t("workflow.invalidFile"),
          description: t("workflow.invalidFileDescription"),
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.options.clear();
  }

  function handleClear() {
    setNodes([]);
    setEdges([]);
    setClearDialogVisible(false);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[42rem] flex-col gap-4 p-6">
      <PageHeader
        title={t("workflow.title")}
        subtitle={t("workflow.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <FileUpload
              mode="basic"
              name="workflow"
              accept="application/json,.json"
              customUpload
              auto
              chooseLabel={t("workflow.loadJson")}
              chooseOptions={{ icon: "pi pi-upload", className: "p-button-outlined" }}
              uploadHandler={handleLoad}
            />
            <Button label={t("workflow.exportJson")} icon="pi pi-download" onClick={handleSave} />
          </div>
        }
      />

      <div className="grid flex-1 min-h-0 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col gap-4">
          <Card>
            <div className="flex flex-col gap-3">
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t("workflow.nodeTypes")}
              </div>
              {NODE_TYPES_CONFIG.map((config) => (
                <button
                  key={config.type}
                  type="button"
                  onClick={() => setSelectedNodeType(config.type)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                    selectedNodeType === config.type
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/40 hover:bg-accent"
                  }`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${config.color}1f`, color: config.color }}
                  >
                    <NodeIcon icon={config.icon} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      {nodeCopy[config.type as keyof typeof nodeCopy].label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {nodeCopy[config.type as keyof typeof nodeCopy].desc}
                    </span>
                  </span>
                </button>
              ))}
              <PermissionGuard entity="EntityWorkflows" action="create">
                <Button label={t("workflow.addNode")} icon="pi pi-plus" onClick={addNode} className="w-full" />
              </PermissionGuard>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-3">
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t("workflow.canvas")}
              </div>
              <Button
                label={t("workflow.resetDemo")}
                icon="pi pi-refresh"
                outlined
                onClick={() => {
                  setNodes(initialNodes);
                  setEdges(initialEdges);
                }}
              />
              <PermissionGuard entity="EntityWorkflows" action="delete">
                <Button
                  label={t("workflow.clearAll")}
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  onClick={() => setClearDialogVisible(true)}
                />
              </PermissionGuard>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t("workflow.tips")}
              </div>
              {[
                t("workflow.tipDrag"),
                t("workflow.tipConnect"),
                t("workflow.tipDelete"),
                t("workflow.tipDecision"),
                t("workflow.tipExport"),
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-2">
                  <i className="pi pi-check mt-1 text-xs text-emerald-500" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="min-h-0 overflow-hidden">
          <div className="h-full min-h-[34rem] overflow-hidden rounded-lg border border-border bg-muted">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              deleteKeyCode="Delete"
              defaultEdgeOptions={{
                animated: true,
                style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
              }}
            >
              <Background color="#cbd5e1" gap={20} />
              <Controls />
              <MiniMap
                nodeColor={(node) => NODE_COLOR[node.type as string] ?? "#64748b"}
                maskColor="rgba(15, 23, 42, 0.18)"
              />
              <Panel position="top-right">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
                  <Tag value={t("workflow.nodeCount", { count: nodes.length })} severity="info" />
                  <Tag value={t("workflow.edgeCount", { count: edges.length })} severity="success" />
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </Card>
      </div>

      <Dialog
        header={t("workflow.clearWorkflow")}
        visible={clearDialogVisible}
        onHide={() => setClearDialogVisible(false)}
        style={{ width: "28rem" }}
        modal
        footer={
          <div className="flex justify-end gap-2">
            <Button label={t("common.cancel")} icon="pi pi-times" text onClick={() => setClearDialogVisible(false)} />
            <Button label={t("common.clear")} icon="pi pi-trash" severity="danger" onClick={handleClear} />
          </div>
        }
      >
        <p className="m-0 text-sm text-muted-foreground">
          {t("workflow.clearDescription")}
        </p>
      </Dialog>
    </div>
  );
}
