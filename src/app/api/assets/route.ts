
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/assets - List assets
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const assets = await prisma.asset.findMany({
            include: {
                model: true,
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                department: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(assets);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
    }
}

// POST /api/assets - Create new asset
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Agent')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const data = await req.json();

        // Check if model exists, if not create keys might be needed
        // For MVP we assume modelId is passed

        const asset = await prisma.asset.create({
            data: {
                assetTag: data.assetTag,
                serialNumber: data.serialNumber,
                status: data.status || 'STOCK',
                modelId: parseInt(data.modelId),
                notes: data.notes,
                purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
                warrantyEnd: data.warrantyEnd ? new Date(data.warrantyEnd) : null,
            }
        });

        return NextResponse.json(asset, { status: 201 });
    } catch (error) {
        console.error('Asset create error:', error);
        return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
    }
}
