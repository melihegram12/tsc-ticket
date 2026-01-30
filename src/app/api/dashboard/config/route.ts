import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Default widget configuration
const DEFAULT_WIDGETS = ['stats', 'recent', 'sla', 'performance'];

// In-memory storage (would use DB in production when Prisma issue is resolved)
const userConfigs = new Map<number, string[]>();

// GET /api/dashboard/config - Get user's dashboard configuration
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const widgets = userConfigs.get(userId) || DEFAULT_WIDGETS;

        return NextResponse.json({ widgets });
    } catch (error) {
        console.error('Error getting dashboard config:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/dashboard/config - Update user's dashboard configuration
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const body = await request.json();
        const { widgets } = body;

        if (!Array.isArray(widgets)) {
            return NextResponse.json({ error: 'widgets must be an array' }, { status: 400 });
        }

        userConfigs.set(userId, widgets);

        return NextResponse.json({
            success: true,
            widgets,
        });
    } catch (error) {
        console.error('Error updating dashboard config:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
