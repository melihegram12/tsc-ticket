import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/audit - Get audit logs
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only admins can view audit logs
        if (session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '25');
        const action = searchParams.get('action');
        const entity = searchParams.get('entity');
        const userId = searchParams.get('userId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build where clause
        const where: Record<string, unknown> = {};

        if (action) where.action = action;
        if (entity) where.entity = entity;
        if (userId) where.userId = parseInt(userId);
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
            if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.auditLog.count({ where }),
        ]);

        // No need to parse JSON fields as they are already objects
        const parsedLogs = logs.map(log => ({
            ...log,
            oldValue: log.oldValue,
            newValue: log.newValue,
        }));

        // Get distinct actions and entities for filters
        const [actions, entities] = await Promise.all([
            prisma.auditLog.findMany({
                select: { action: true },
                distinct: ['action'],
            }),
            prisma.auditLog.findMany({
                select: { entity: true },
                distinct: ['entity'],
            }),
        ]);

        return NextResponse.json({
            data: parsedLogs,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
            filters: {
                actions: actions.map(a => a.action),
                entities: entities.map(e => e.entity),
            },
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
