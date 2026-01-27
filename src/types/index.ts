export type TicketStatus = 'NEW' | 'OPEN' | 'WAITING_REQUESTER' | 'PENDING' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type MessageType = 'PUBLIC_REPLY' | 'INTERNAL_NOTE' | 'SYSTEM';
export type EventType = 'CREATED' | 'STATUS_CHANGED' | 'PRIORITY_CHANGED' | 'ASSIGNED' | 'UNASSIGNED' | 'CATEGORY_CHANGED' | 'DEPARTMENT_CHANGED' | 'TAG_ADDED' | 'TAG_REMOVED' | 'MESSAGE_ADDED' | 'ATTACHMENT_ADDED' | 'SLA_BREACHED' | 'REOPENED' | 'MERGED' | 'AUTOMATION';

// Ticket types
export interface TicketListItem {
    id: number;
    ticketNumber: string;
    subject: string;
    status: TicketStatus;
    priority: TicketPriority;
    createdAt: Date;
    lastActivityAt: Date;
    requester: {
        id: number;
        name: string;
        email: string;
    };
    assignedTo?: {
        id: number;
        name: string;
    };
    department: {
        id: number;
        name: string;
    };
    category?: {
        id: number;
        name: string;
    };
    slaTracking?: {
        firstResponseDueAt: Date;
        resolutionDueAt: Date;
        firstResponseBreachedAt?: Date;
        resolutionBreachedAt?: Date;
    };
}

export interface TicketDetail extends TicketListItem {
    description: string;
    messages: TicketMessageItem[];
    attachments: AttachmentItem[];
    events: TicketEventItem[];
    tags: { id: number; name: string; color: string }[];
}

export interface TicketMessageItem {
    id: number;
    body: string;
    messageType: MessageType;
    createdAt: Date;
    author: {
        id: number;
        name: string;
        avatarUrl?: string;
    };
    attachments: AttachmentItem[];
}

export interface AttachmentItem {
    id: number;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    storagePath: string;
    createdAt: Date;
}

export interface TicketEventItem {
    id: number;
    eventType: EventType;
    oldValue?: string;
    newValue?: string;
    metadata?: string;
    createdAt: Date;
    actor?: {
        id: number;
        name: string;
    };
}

// API types
export interface CreateTicketDTO {
    subject: string;
    description: string;
    departmentId: number;
    categoryId?: number;
    priority?: TicketPriority;
    attachments?: File[];
}

export interface UpdateTicketDTO {
    status?: TicketStatus;
    priority?: TicketPriority;
    categoryId?: number;
    assignedToId?: number | null;
    departmentId?: number;
}

export interface CreateMessageDTO {
    body: string;
    messageType: MessageType;
    attachments?: File[];
}

// Filter types
export interface TicketFilters {
    status?: TicketStatus[];
    priority?: TicketPriority[];
    departmentId?: number;
    categoryId?: number;
    assignedToId?: number;
    requesterId?: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    slaBreached?: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// Dashboard stats
export interface DashboardStats {
    openTickets: number;
    pendingTickets: number;
    resolvedToday: number;
    slaBreached: number;
    avgResponseTime: number;
    avgResolutionTime: number;
}

// SLA helpers
export interface SLAStatus {
    responseStatus: 'ok' | 'warning' | 'breached';
    resolutionStatus: 'ok' | 'warning' | 'breached';
    responseTimeRemaining?: number;
    resolutionTimeRemaining?: number;
}
