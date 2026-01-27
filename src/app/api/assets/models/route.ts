
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const models = await prisma.assetModel.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(models);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Agent')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const data = await req.json();
        const model = await prisma.assetModel.create({
            data: {
                name: data.name,
                category: data.category,
                manufacturer: data.manufacturer,
                description: data.description
            }
        });
        return NextResponse.json(model, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create model' }, { status: 500 });
    }
}
