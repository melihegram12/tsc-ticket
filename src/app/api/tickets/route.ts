import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AutomationService } from '@/lib/automation';
import { notifyNewTicket } from '@/lib/notifications';
import { Prisma } from '@prisma/client';

// Generate unique ticket number
async function generateTicketNumber(): Promise<string> {
    const setting = await prisma.systemSetting.findUnique({
        where: { key: 'ticket.prefix' },
    });
    const prefix = setting?.value || 'TCK';
    const year = new Date().getFullYear();

    const lastTicket = await prisma.ticket.findFirst({
        where: {
            ticketNumber: {
                startsWith: `${prefix}-${year}`,
            },
        },
        orderBy: { id: 'desc' },
    });

    let nextNum = 1;
    if (lastTicket) {
        const parts = lastTicket.ticketNumber.split('-');
        nextNum = parseInt(parts[2], 10) + 1;
    }

    return `${prefix}-${year}-${String(nextNum).padStart(6, '0')}`;
}

// Calculate SLA due dates
async function calculateSLADates(departmentId: number, priority: string) {
    const slaPolicy = await prisma.sLAPolicy.findUnique({
        where: {
            departmentId_priority: { departmentId, priority },
        },
    });

    if (!slaPolicy) return null;

    const now = new Date();
    return {
        firstResponseDueAt: new Date(now.getTime() + slaPolicy.firstResponseMinutes * 60 * 1000),
        resolutionDueAt: new Date(now.getTime() + slaPolicy.resolutionMinutes * 60 * 1000),
    };
}

// GET /api/tickets - List tickets with filters
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');
        const status = searchParams.get('status')?.split(',');
        const priority = searchParams.get('priority')?.split(',');
        const departmentId = searchParams.get('departmentId');
        const categoryId = searchParams.get('categoryId');
        const assignedToId = searchParams.get('assignedToId');
        const search = searchParams.get('search');
        const queue = searchParams.get('queue');

        // Build where clause based on user role
        const where: any = {};

        // Role-based filtering
        if (session.user.role === 'Requester') {
            // Requesters can only see their own tickets
            where.requesterId = parseInt(session.user.id);
        } else if (session.user.role === 'Agent') {
            // Agents can see tickets in their departments or assigned to them
            const deptIds = session.user.departments.map(d => d.id);
            where.OR = [
                { departmentId: { in: deptIds } },
                { assignedToId: parseInt(session.user.id) },
            ];
        } else if (session.user.role === 'Supervisor') {
            // Supervisors can see all tickets in their departments
            const deptIds = session.user.departments.map(d => d.id);
            where.departmentId = { in: deptIds };
        }
        // Admin can see all tickets (no filter)

        // Apply filters
        if (status?.length) where.status = { in: status };
        if (priority?.length) where.priority = { in: priority };
        if (departmentId) where.departmentId = parseInt(departmentId);
        if (categoryId) where.categoryId = parseInt(categoryId);
        if (assignedToId) where.assignedToId = parseInt(assignedToId);
        if (search) {
            where.OR = [
                { subject: { contains: search } },
                { ticketNumber: { contains: search } },
                { description: { contains: search } },
            ];
        }

        // Queue filtering
        if (queue) {
            if (queue === 'mine') {
                where.assignedToId = parseInt(session.user.id);
            } else if (queue === 'unassigned') {
                where.assignedToId = null;
            } else if (queue === 'sla_risk') {
                const now = new Date();
                const riskThreshold = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours

                // Ensure we don't show closed tickets for SLA risk
                if (where.status) {
                    // If status filter exists, ensure it doesn't include closed statuses if we want active risks
                    // But simpler to just enforce SLA check on whatever status is queried, 
                    // AND enforce it's not resolved/closed if no status specified or if we want to be strict.
                    // For now, let's just filter by date and exclude closed ones implicitly via standard logical expectations
                    // or explicitly exclude them.
                    // Let's AND the status exclusion
                    where.AND = [
                        ...(Array.isArray(where.AND) ? where.AND : []),
                        { status: { notIn: ['RESOLVED', 'CLOSED'] } }
                    ];
                } else {
                    where.status = { notIn: ['RESOLVED', 'CLOSED'] };
                }

                where.slaTracking = {
                    resolutionDueAt: {
                        lte: riskThreshold
                    }
                };
            }
        }

        const [tickets, total] = await Promise.all([
            prisma.ticket.findMany({
                where,
                include: {
                    requester: { select: { id: true, name: true, email: true } },
                    assignedTo: { select: { id: true, name: true } },
                    department: { select: { id: true, name: true } },
                    category: { select: { id: true, name: true } },
                    slaTracking: true,
                },
                orderBy: { lastActivityAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.ticket.count({ where }),
        ]);

        return NextResponse.json({
            data: tickets,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        return NextResponse.json({ error: 'Ticketlar alınamadı' }, { status: 500 });
    }
}

// POST /api/tickets - Create new ticket
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { requesterName, subject, description, departmentId, categoryId, priority = 'NORMAL' } = body;

        if (!requesterName || !subject || !description || !departmentId) {
            return NextResponse.json(
                { error: 'Ad soyad, konu, açıklama ve departman zorunludur' },
                { status: 400 }
            );
        }

        const ticketNumber = await generateTicketNumber();
        const slaDates = await calculateSLADates(departmentId, priority);

        const ticket = await prisma.ticket.create({
            data: {
                ticketNumber,
                requesterName,
                subject,
                description,
                priority,
                requesterId: parseInt(session.user.id),
                departmentId,
                categoryId: categoryId || null,
                slaTracking: slaDates
                    ? {
                        create: slaDates,
                    }
                    : undefined,
                events: {
                    create: {
                        eventType: 'CREATED',
                        actorId: parseInt(session.user.id),
                        newValue: JSON.stringify({ subject, priority, departmentId }),
                    },
                },
                attachments: body.attachments?.length ? {
                    create: body.attachments.map((att: any) => ({
                        fileName: att.fileName,
                        storagePath: att.storagePath,
                        mimeType: att.mimeType,
                        sizeBytes: att.sizeBytes,
                        uploadedById: parseInt(session.user.id),
                    }))
                } : undefined,
            },
            include: {
                requester: { select: { id: true, name: true, email: true } },
                department: { select: { id: true, name: true } },
                category: { select: { id: true, name: true } },
                slaTracking: true,
            },
        });

        // Trigger Automation
        // We run this asynchronously without awaiting to not block response
        AutomationService.evaluateRules('TICKET_CREATED', { ticketId: ticket.id }).catch(err => {
            console.error('Automation error:', err);
        });

        // Notify department agents about new ticket
        notifyNewTicket(
            ticket.id,
            ticket.ticketNumber,
            ticket.subject,
            departmentId,
            priority
        ).catch(err => {
            console.error('Notification error:', err);
        });

        return NextResponse.json(ticket, { status: 201 });
    } catch (error) {
        console.error('Error creating ticket:', error);
        return NextResponse.json({ error: 'Ticket oluşturulamadı' }, { status: 500 });
    }
}
