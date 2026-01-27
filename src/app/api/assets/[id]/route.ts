
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, context: any) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const paramsObj = context?.params && typeof context.params.then === 'function' ? await context.params : context?.params;
    const { id } = paramsObj || {};

    try {
        const asset = await prisma.asset.findUnique({
            where: { id: parseInt(id) },
            include: {
                model: true,
                assignedTo: {
                    select: { id: true, name: true, email: true }
                },
                department: true,
                assignments: {
                    include: {
                        user: { select: { name: true } },
                        assignedBy: { select: { name: true } }
                    },
                    orderBy: { assignedAt: 'desc' }
                },
                tickets: {
                    include: {
                        ticket: {
                            select: { ticketNumber: true, subject: true, status: true }
                        }
                    }
                }
            }
        });

        if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

        return NextResponse.json(asset);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, context: any) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Agent')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const paramsObj = context?.params && typeof context.params.then === 'function' ? await context.params : context?.params;
    const { id } = paramsObj || {};

    try {
        const data = await req.json();
        const assetId = parseInt(id);

        const existingAsset = await prisma.asset.findUnique({ where: { id: assetId } });

        if (data.assignedToId && data.assignedToId !== existingAsset?.assignedToId) {
            await prisma.assetAssignment.create({
                data: {
                    assetId: assetId,
                    userId: data.assignedToId,
                    assignedById: parseInt(session.user.id),
                    notes: 'Assigned via update'
                }
            });
        }

        const asset = await prisma.asset.update({
            where: { id: assetId },
            data: {
                assetTag: data.assetTag,
                serialNumber: data.serialNumber,
                status: data.status,
                notes: data.notes,
                assignedToId: data.assignedToId,
                departmentId: data.departmentId
            }
        });

        return NextResponse.json(asset);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: any) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'Admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const paramsObj = context?.params && typeof context.params.then === 'function' ? await context.params : context?.params;
    const { id } = paramsObj || {};

    try {
        await prisma.asset.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
    }
}

