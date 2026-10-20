export type NodeStatus = "idle" | "running" | "completed" | "skipped" | "failed";

export type NodeCategory =
  | "trigger"
  | "auth"
  | "routing"
  | "scraper"
  | "ai"
  | "delivery"
  | "email";

export interface WorkflowNode {
  id: string;
  name: string;
  category: NodeCategory;
  n8nType: string;
  description: string;
  status: NodeStatus;
  durationMs?: number;
  inputJson?: unknown;
  outputJson?: unknown;
  error?: string;
}

export interface ExecutionLogItem {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  nodeId: string;
  message: string;
}

export interface WorkflowExecutionTrace {
  runId: string;
  startTime: string;
  endTime?: string;
  totalDurationMs?: number;
  status: "idle" | "running" | "completed" | "failed";
  nodes: WorkflowNode[];
  logs: ExecutionLogItem[];
  emailPromptActive?: boolean;
  opportunityMetadata?: {
    role: string | null;
    company: string | null;
    hrName: string | null;
    hrEmail: string | null;
  };
  gmailDraftResult?: {
    draftId: string;
    draftUrl: string;
  };
}

export interface ChatButton {
  text: string;
  action: "yes" | "no";
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  status?: "pending" | "sent" | "error";
  replyMarkup?: {
    buttons: ChatButton[];
  };
  metadata?: {
    role?: string | null;
    company?: string | null;
    hrName?: string | null;
    hrEmail?: string | null;
  };
}

export type SSEWorkflowEvent =
  | { type: "node_start"; nodeId: string; inputJson?: unknown }
  | { type: "node_finish"; node: WorkflowNode }
  | { type: "log"; log: ExecutionLogItem }
  | { type: "chat_message"; message: ChatMessage }
  | { type: "chat_edit"; messageId: string; text: string; replyMarkup?: { buttons: ChatButton[] } }
  | { type: "email_prompt"; metadata: NonNullable<WorkflowExecutionTrace["opportunityMetadata"]> }
  | { type: "workflow_done"; trace: { totalDurationMs: number; status: "completed" | "failed" } }
  | { type: "error"; message: string };

