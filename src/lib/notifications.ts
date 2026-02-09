import prisma from './prisma';
import { NotificationType, Prisma } from '@prisma/client';

export { NotificationType };

/**
 * Create a notification for a user
 */
export async function createNotification(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, unknown>
): Promise<void> {
    try {
        await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                data: (data ?? Prisma.DbNull) as any,
            },
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

/**
 * Notify department agents about a new ticket
 */
export async function notifyNewTicket(
    ticketId: number,
    ticketNumber: string,
    subject: string,
    departmentId: number,
    priority: string
): Promise<void> {
    try {
        // Get agents in the department
        const departmentUsers = await prisma.userDepartment.findMany({
            where: { departmentId },
            include: {
                user: {
                    include: {
                        role: true,
                    },
                },
            },
        });

        // Filter to agents, supervisors, admins
        const agentRoles = ['Agent', 'Supervisor', 'Admin'];
        const agents = departmentUsers.filter(du =>
            agentRoles.includes(du.user.role.name)
        );

        // Create notifications for each agent
        const priorityLabels: Record<string, string> = {
            URGENT: '🚨 ACİL',
            HIGH: '⚠️ Yüksek',
            NORMAL: 'Normal',
            LOW: 'Düşük',
        };

        for (const agent of agents) {
            await createNotification(
                agent.userId,
                'TICKET_CREATED',
                'Yeni Destek Talebi',
                `[${ticketNumber}] ${subject} (${priorityLabels[priority] || priority})`,
                { ticketId, ticketNumber }
            );
        }
    } catch (error) {
        console.error('Error notifying new ticket:', error);
    }
}

/**
 * Notify user when a ticket is assigned to them
 */
export async function notifyTicketAssigned(
    ticketId: number,
    ticketNumber: string,
    subject: string,
    assignedToId: number,
    assignedByName: string
): Promise<void> {
    try {
        await createNotification(
            assignedToId,
            'TICKET_ASSIGNED',
            'Talep Size Atandı',
            `[${ticketNumber}] ${subject} - ${assignedByName} tarafından atandı`,
            { ticketId, ticketNumber }
        );
    } catch (error) {
        console.error('Error notifying ticket assigned:', error);
    }
}

/**
 * Notify user when their ticket gets a reply
 */
export async function notifyTicketReply(
    ticketId: number,
    ticketNumber: string,
    subject: string,
    userId: number,
    replierName: string
): Promise<void> {
    try {
        await createNotification(
            userId,
            'TICKET_REPLIED',
            'Talebinize Yanıt Geldi',
            `[${ticketNumber}] ${subject} - ${replierName} yanıtladı`,
            { ticketId, ticketNumber }
        );
    } catch (error) {
        console.error('Error notifying ticket reply:', error);
    }
}

/**
 * Notify agent about SLA warning
 */
export async function notifySLAWarning(
    ticketId: number,
    ticketNumber: string,
    subject: string,
    assignedToId: number,
    warningType: 'response' | 'resolution'
): Promise<void> {
    try {
        const typeLabel = warningType === 'response' ? 'İlk Yanıt' : 'Çözüm';
        await createNotification(
            assignedToId,
            'SLA_WARNING',
            `SLA Uyarısı: ${typeLabel} Süresi Yaklaşıyor`,
            `[${ticketNumber}] ${subject}`,
            { ticketId, ticketNumber, warningType }
        );
    } catch (error) {
        console.error('Error notifying SLA warning:', error);
    }
}
