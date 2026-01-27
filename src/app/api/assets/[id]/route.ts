
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const asset = await prisma.asset.findUnique({
            where: { id: parseInt(params.id) },
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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Agent')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const data = await req.json();
        const assetId = parseInt(params.id);

        // Handle Assignment Change Logic
        // If assignedToId changed, we should create a record in AssetAssignment
        // This is complex, so for MVP we might just update the field, but let's try to be smart.

        const existingAsset = await prisma.asset.findUnique({ where: { id: assetId } });

        if (data.assignedToId && data.assignedToId !== existingAsset?.assignedToId) {
            // Create assignment history
            await prisma.assetAssignment.create({
                data: {
                    assetId: assetId,
                    userId: data.assignedToId,
                    assignedById: parseInt(session.user.id),
                    notes: 'Assigned via update'
                }
            });

            // Mark previous assignment as returned? 
            // Real logic is harder, let's keep it simple for now and just log the new assignment.
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'Admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        await prisma.asset.delete({ where: { id: parseInt(params.id) } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
    }
}
