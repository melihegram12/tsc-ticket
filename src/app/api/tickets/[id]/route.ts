import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AutomationService } from '@/lib/automation';
import { TicketStatus, TicketPriority, EventType } from '@prisma/client';

// Check if user can access ticket
async function canAccessTicket(userId: number, userRole: string, userDepts: number[], ticketId: number) {
    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { requesterId: true, assignedToId: true, departmentId: true },
    });

    if (!ticket) return false;

    if (userRole === 'Admin') return true;
    if (userRole === 'Requester') return ticket.requesterId === userId;
    if (userRole === 'Agent' || userRole === 'Supervisor') {
        return userDepts.includes(ticket.departmentId) || ticket.assignedToId === userId;
    }
    return false;
}

// GET /api/tickets/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { id } = await params;
        const ticketId = parseInt(id);
        const userId = parseInt(session.user.id);
        const userDepts = session.user.departments.map(d => d.id);

        const hasAccess = await canAccessTicket(userId, session.user.role, userDepts, ticketId);
        if (!hasAccess) {
            return NextResponse.json({ error: 'Bu ticketa erişim izniniz yok' }, { status: 403 });
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                requester: { select: { id: true, name: true, email: true, avatarUrl: true } },
                assignedTo: { select: { id: true, name: true, avatarUrl: true } },
                department: { select: { id: true, name: true } },
                category: { select: { id: true, name: true } },
                slaTracking: true,
                tags: {
                    include: {
                        tag: true,
                    },
                },
                messages: {
                    include: {
                        author: { select: { id: true, name: true, avatarUrl: true } },
                        attachments: true,
                    },
                    orderBy: { createdAt: 'asc' },
                    // Hide internal notes from requesters
                    where: session.user.role === 'Requester'
                        ? { messageType: { not: 'INTERNAL_NOTE' } }
                        : undefined,
                },
                attachments: {
                    where: { messageId: null },
                },
                events: {
                    include: {
                        actor: { select: { id: true, name: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                },
            },
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket bulunamadı' }, { status: 404 });
        }

        return NextResponse.json(ticket);
    } catch (error) {
        console.error('Error fetching ticket:', error);
        return NextResponse.json({ error: 'Ticket alınamadı' }, { status: 500 });
    }
}

// PATCH /api/tickets/[id]
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { id } = await params;
        const ticketId = parseInt(id);
        const userId = parseInt(session.user.id);
        const userDepts = session.user.departments.map(d => d.id);

        // Only agents, supervisors, and admins can update tickets
        if (session.user.role === 'Requester') {
            return NextResponse.json({ error: 'Ticket güncelleme yetkiniz yok' }, { status: 403 });
        }

        const hasAccess = await canAccessTicket(userId, session.user.role, userDepts, ticketId);
        if (!hasAccess) {
            return NextResponse.json({ error: 'Bu ticketa erişim izniniz yok' }, { status: 403 });
        }

        const body = await request.json();
        const { status, priority, categoryId, assignedToId, departmentId } = body;

        // Get current ticket for comparison
        const currentTicket = await prisma.ticket.findUnique({
            where: { id: ticketId },
        });

        if (!currentTicket) {
            return NextResponse.json({ error: 'Ticket bulunamadı' }, { status: 404 });
        }

        // Prepare update data and events
        const updateData: Record<string, unknown> = {
            lastActivityAt: new Date(),
        };
        const events: Array<{ eventType: EventType; oldValue?: string; newValue?: string }> = [];

        if (status && status !== currentTicket.status) {
            updateData.status = status as TicketStatus;
            events.push({
                eventType: EventType.STATUS_CHANGED,
                oldValue: currentTicket.status,
                newValue: status,
            });

            // Handle special status changes
            if (status === 'RESOLVED' && !currentTicket.resolvedAt) {
                updateData.resolvedAt = new Date();
            }
            if (status === 'CLOSED' && !currentTicket.closedAt) {
                updateData.closedAt = new Date();
            }
            if (status === 'REOPENED') {
                updateData.resolvedAt = null;
                updateData.closedAt = null;
            }
        }

        if (priority && priority !== currentTicket.priority) {
            updateData.priority = priority as TicketPriority;
            events.push({
                eventType: EventType.PRIORITY_CHANGED,
                oldValue: currentTicket.priority,
                newValue: priority,
            });
        }

        if (categoryId !== undefined && categoryId !== currentTicket.categoryId) {
            updateData.categoryId = categoryId;
            events.push({
                eventType: EventType.CATEGORY_CHANGED,
                oldValue: currentTicket.categoryId?.toString(),
                newValue: categoryId?.toString(),
            });
        }

        if (assignedToId !== undefined && assignedToId !== currentTicket.assignedToId) {
            updateData.assignedToId = assignedToId;
            events.push({
                eventType: assignedToId ? EventType.ASSIGNED : EventType.UNASSIGNED,
                oldValue: currentTicket.assignedToId?.toString(),
                newValue: assignedToId?.toString(),
            });
        }

        if (departmentId && departmentId !== currentTicket.departmentId) {
            updateData.departmentId = departmentId;
            events.push({
                eventType: EventType.DEPARTMENT_CHANGED,
                oldValue: currentTicket.departmentId.toString(),
                newValue: departmentId.toString(),
            });
        }

        // Update ticket and create events
        const ticket = await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                ...updateData,
                events: {
                    createMany: {
                        data: events.map(e => ({
                            ...e,
                            actorId: userId,
                        })),
                    },
                },
            },
            include: {
                requester: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true } },
                department: { select: { id: true, name: true } },
                category: { select: { id: true, name: true } },
                slaTracking: true,
            },
        });

        // Trigger Automation for Update
        AutomationService.evaluateRules('TICKET_UPDATED', { ticketId: ticket.id }).catch(err => {
            console.error('Automation error:', err);
        });

        return NextResponse.json(ticket);
    } catch (error) {
        console.error('Error updating ticket:', error);
        return NextResponse.json({ error: 'Ticket güncellenemedi' }, { status: 500 });
    }
}

// DELETE /api/tickets/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        // Only admins can delete tickets
        if (session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Ticket silme yetkiniz yok' }, { status: 403 });
        }

        const { id } = await params;
        const ticketId = parseInt(id);

        await prisma.ticket.delete({
            where: { id: ticketId },
        });

        return NextResponse.json({ message: 'Ticket silindi' });
    } catch (error) {
        console.error('Error deleting ticket:', error);
        return NextResponse.json({ error: 'Ticket silinemedi' }, { status: 500 });
    }
}
