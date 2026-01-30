import prisma from '@/lib/prisma';

interface AuditLogData {
    action: string;
    entity: string;
    entityId?: number;
    oldValue?: object | null;
    newValue?: object | null;
    userId?: number;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Log an action to the audit trail
 */
export async function logAuditAction(data: AuditLogData): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                action: data.action,
                entity: data.entity,
                entityId: data.entityId || null,
                oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
                newValue: data.newValue ? JSON.stringify(data.newValue) : null,
                userId: data.userId || null,
                ipAddress: data.ipAddress || null,
                userAgent: data.userAgent || null,
            },
        });
    } catch (error) {
        console.error('Failed to log audit action:', error);
        // Don't throw - audit logging should not break the main action
    }
}

/**
 * Common audit action types
 */
export const AUDIT_ACTIONS = {
    // Auth
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    LOGIN_FAILED: 'LOGIN_FAILED',

    // Tickets
    TICKET_CREATE: 'TICKET_CREATE',
    TICKET_UPDATE: 'TICKET_UPDATE',
    TICKET_DELETE: 'TICKET_DELETE',
    TICKET_ASSIGN: 'TICKET_ASSIGN',
    TICKET_STATUS_CHANGE: 'TICKET_STATUS_CHANGE',

    // Users
    USER_CREATE: 'USER_CREATE',
    USER_UPDATE: 'USER_UPDATE',
    USER_DELETE: 'USER_DELETE',

    // Departments
    DEPARTMENT_CREATE: 'DEPARTMENT_CREATE',
    DEPARTMENT_UPDATE: 'DEPARTMENT_UPDATE',
    DEPARTMENT_DELETE: 'DEPARTMENT_DELETE',

    // Settings
    SETTINGS_UPDATE: 'SETTINGS_UPDATE',
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];
