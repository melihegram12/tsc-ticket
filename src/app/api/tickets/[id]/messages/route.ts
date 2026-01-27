import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notifyTicketReply } from '@/lib/notifications';
import { Prisma } from '@prisma/client';

// POST /api/tickets/[id]/messages - Add message to ticket
export async function POST(
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

        // Get ticket to check access
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            select: {
                id: true,
                requesterId: true,
                assignedToId: true,
                departmentId: true,
                status: true,
                firstResponseAt: true,
            },
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket bulunamadı' }, { status: 404 });
        }

        // Check access
        const userDepts = session.user.departments.map(d => d.id);
        const isRequester = ticket.requesterId === userId;
        const isAgent = session.user.role === 'Agent' || session.user.role === 'Supervisor';
        const isAdmin = session.user.role === 'Admin';
        const inDept = userDepts.includes(ticket.departmentId);

        if (!isAdmin && !isRequester && !(isAgent && (inDept || ticket.assignedToId === userId))) {
            return NextResponse.json({ error: 'Bu ticketa mesaj ekleme yetkiniz yok' }, { status: 403 });
        }

        const body = await request.json();
        const { body: messageBody, messageType = 'PUBLIC_REPLY' } = body;

        if (!messageBody?.trim()) {
            return NextResponse.json({ error: 'Mesaj içeriği gereklidir' }, { status: 400 });
        }

        // Requesters can only add public replies
        if (session.user.role === 'Requester' && messageType !== 'PUBLIC_REPLY') {
            return NextResponse.json({ error: 'Sadece yanıt ekleyebilirsiniz' }, { status: 403 });
        }

        // Create message
        const message = await prisma.ticketMessage.create({
            data: {
                ticketId,
                authorId: userId,
                body: messageBody.trim(),
                messageType: messageType,
                attachments: body.attachments?.length ? {
                    create: body.attachments.map((att: any) => ({
                        fileName: att.fileName,
                        storagePath: att.storagePath,
                        mimeType: att.mimeType,
                        sizeBytes: att.sizeBytes,
                        uploadedById: userId,
                        ticketId: ticketId
                    }))
                } : undefined,
            },
            include: {
                author: { select: { id: true, name: true, avatarUrl: true } },
                attachments: true,
            },
        });

        // Update ticket
        const updateData: Record<string, unknown> = {
            lastActivityAt: new Date(),
        };

        // Track first response for SLA
        if (!ticket.firstResponseAt && messageType === 'PUBLIC_REPLY' && !isRequester) {
            updateData.firstResponseAt = new Date();

            // Update SLA tracking
            await prisma.sLATracking.updateMany({
                where: { ticketId },
                data: { firstResponseBreachedAt: null },
            });
        }

        // Auto-update status based on who replied
        if (messageType === 'PUBLIC_REPLY') {
            if (isRequester && ticket.status === 'WAITING_REQUESTER') {
                updateData.status = 'OPEN';
            } else if (!isRequester && ticket.status === 'NEW') {
                updateData.status = 'OPEN';
            }
        }

        await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                ...updateData,
                events: {
                    create: {
                        eventType: 'MESSAGE_ADDED',
                        actorId: userId,
                        newValue: JSON.stringify({ messageType, messageId: message.id }),
                    },
                },
            },
        });

        // Notify requester or assignee about the reply
        if (messageType === 'PUBLIC_REPLY') {
            // Get ticket details for notification
            const ticketForNotify = await prisma.ticket.findUnique({
                where: { id: ticketId },
                select: {
                    ticketNumber: true,
                    subject: true,
                    requesterId: true,
                    assignedToId: true,
                },
            });

            if (ticketForNotify) {
                // If agent replies, notify requester
                // If requester replies, notify assignee (if any)
                const notifyUserId = isRequester
                    ? ticketForNotify.assignedToId
                    : ticketForNotify.requesterId;

                if (notifyUserId && notifyUserId !== userId) {
                    notifyTicketReply(
                        ticketId,
                        ticketForNotify.ticketNumber,
                        ticketForNotify.subject,
                        notifyUserId,
                        session.user.name || 'Kullanıcı'
                    ).catch(err => console.error('Notification error:', err));
                }
            }
        }

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error('Error creating message:', error);
        return NextResponse.json({ error: 'Mesaj eklenemedi' }, { status: 500 });
    }
}

// GET /api/tickets/[id]/messages
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

        const messages = await prisma.ticketMessage.findMany({
            where: {
                ticketId,
                // Hide internal notes from requesters
                ...(session.user.role === 'Requester' && {
                    messageType: { not: 'INTERNAL_NOTE' },
                }),
            },
            include: {
                author: { select: { id: true, name: true, avatarUrl: true } },
                attachments: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Mesajlar alınamadı' }, { status: 500 });
    }
}
