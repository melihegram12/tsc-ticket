import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { EventType } from '@prisma/client';

// PUT /api/tickets/[id]/satisfaction
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const ticketId = parseInt(id);

        if (isNaN(ticketId)) {
            return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
        }

        const body = await request.json();
        const { satisfactionScore, satisfactionComment } = body;

        // Validate score
        if (!satisfactionScore || satisfactionScore < 1 || satisfactionScore > 5) {
            return NextResponse.json(
                { error: 'Satisfaction score must be between 1 and 5' },
                { status: 400 }
            );
        }

        // Check if ticket exists and belongs to the user or is accessible
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            select: {
                id: true,
                requesterId: true,
                status: true,
                satisfactionScore: true
            },
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Only the requester can rate the ticket
        const userId = parseInt(session.user.id);
        if (ticket.requesterId !== userId) {
            return NextResponse.json(
                { error: 'Only the ticket requester can rate the service' },
                { status: 403 }
            );
        }

        // Ticket must be resolved or closed
        if (!['RESOLVED', 'CLOSED'].includes(ticket.status)) {
            return NextResponse.json(
                { error: 'Ticket must be resolved or closed to rate' },
                { status: 400 }
            );
        }

        // Update the ticket with satisfaction data
        const updatedTicket = await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                satisfactionScore: satisfactionScore,
                satisfactionComment: satisfactionComment || null,
                events: {
                    create: {
                        eventType: EventType.SATISFACTION_RATED,
                        newValue: `Puan: ${satisfactionScore}/5${satisfactionComment ? ' - Yorum eklendi' : ''}`,
                        actorId: userId,
                    },
                },
            },
            select: {
                id: true,
                ticketNumber: true,
                satisfactionScore: true,
                satisfactionComment: true,
            },
        });

        return NextResponse.json(updatedTicket);
    } catch (error) {
        console.error('Error updating satisfaction:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET /api/tickets/[id]/satisfaction - Get satisfaction status
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const ticketId = parseInt(id);

        if (isNaN(ticketId)) {
            return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            select: {
                id: true,
                ticketNumber: true,
                status: true,
                requesterId: true,
                satisfactionScore: true,
                satisfactionComment: true,
            },
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        const userId = parseInt(session.user.id);

        return NextResponse.json({
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            status: ticket.status,
            isRequester: ticket.requesterId === userId,
            canRate: ['RESOLVED', 'CLOSED'].includes(ticket.status) &&
                ticket.requesterId === userId &&
                ticket.satisfactionScore === null,
            satisfactionScore: ticket.satisfactionScore,
            satisfactionComment: ticket.satisfactionComment,
        });
    } catch (error) {
        console.error('Error getting satisfaction:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
