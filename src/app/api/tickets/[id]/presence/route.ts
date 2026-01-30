import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// In-memory presence store (would use Redis in production)
interface ViewerInfo {
    id: number;
    name: string;
    email: string;
    lastSeen: number; // timestamp
}

const viewersByTicket = new Map<number, Map<number, ViewerInfo>>();
const PRESENCE_TIMEOUT = 30000; // 30 seconds

// Clean up stale viewers
function cleanupStaleViewers() {
    const now = Date.now();
    for (const [ticketId, viewers] of viewersByTicket.entries()) {
        for (const [userId, viewer] of viewers.entries()) {
            if (now - viewer.lastSeen > PRESENCE_TIMEOUT) {
                viewers.delete(userId);
            }
        }
        if (viewers.size === 0) {
            viewersByTicket.delete(ticketId);
        }
    }
}

// GET /api/tickets/[id]/presence - Get current viewers
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

        cleanupStaleViewers();

        const viewers = viewersByTicket.get(ticketId);
        const viewerList = viewers
            ? Array.from(viewers.values()).filter(v => v.id !== parseInt(session.user.id))
            : [];

        return NextResponse.json({
            viewers: viewerList.map(v => ({
                id: v.id,
                name: v.name,
                initials: v.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
            })),
            count: viewerList.length,
        });
    } catch (error) {
        console.error('Error getting presence:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/tickets/[id]/presence - Register/update presence
export async function POST(
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
        const userId = parseInt(session.user.id);

        if (!viewersByTicket.has(ticketId)) {
            viewersByTicket.set(ticketId, new Map());
        }

        const viewers = viewersByTicket.get(ticketId)!;
        viewers.set(userId, {
            id: userId,
            name: session.user.name || 'Kullanıcı',
            email: session.user.email || '',
            lastSeen: Date.now(),
        });

        cleanupStaleViewers();

        // Return other viewers
        const otherViewers = Array.from(viewers.values()).filter(v => v.id !== userId);

        return NextResponse.json({
            success: true,
            viewers: otherViewers.map(v => ({
                id: v.id,
                name: v.name,
                initials: v.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
            })),
            count: otherViewers.length,
        });
    } catch (error) {
        console.error('Error updating presence:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/tickets/[id]/presence - Leave ticket
export async function DELETE(
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
        const userId = parseInt(session.user.id);

        const viewers = viewersByTicket.get(ticketId);
        if (viewers) {
            viewers.delete(userId);
            if (viewers.size === 0) {
                viewersByTicket.delete(ticketId);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing presence:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
