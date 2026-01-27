import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/admin/departments/[id]/categories - Create category
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { id } = await params;
        const departmentId = parseInt(id);
        const body = await request.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json({ error: 'Kategori adı zorunludur' }, { status: 400 });
        }

        // Get max sort order
        const maxOrder = await prisma.category.findFirst({
            where: { departmentId },
            orderBy: { sortOrder: 'desc' },
            select: { sortOrder: true },
        });

        const category = await prisma.category.create({
            data: {
                name,
                description,
                departmentId,
                sortOrder: (maxOrder?.sortOrder || 0) + 1,
            },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error('Error creating category:', error);
        return NextResponse.json({ error: 'Kategori oluşturulamadı' }, { status: 500 });
    }
}
