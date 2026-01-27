import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/departments
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const departments = await prisma.department.findMany({
            where: { isActive: true },
            include: {
                categories: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                },
                _count: {
                    select: {
                        tickets: {
                            where: {
                                status: { notIn: ['CLOSED', 'RESOLVED'] },
                            },
                        },
                        users: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(departments);
    } catch (error) {
        console.error('Error fetching departments:', error);
        return NextResponse.json({ error: 'Departmanlar alınamadı' }, { status: 500 });
    }
}

// POST /api/departments
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        // Only admins can create departments
        if (!session.user.permissions.includes('admin.departments')) {
            return NextResponse.json({ error: 'Departman oluşturma yetkiniz yok' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, emailAlias } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Departman adı gereklidir' }, { status: 400 });
        }

        const department = await prisma.department.create({
            data: {
                name: name.trim(),
                description: description?.trim(),
                emailAlias: emailAlias?.trim(),
            },
        });

        return NextResponse.json(department, { status: 201 });
    } catch (error) {
        console.error('Error creating department:', error);
        return NextResponse.json({ error: 'Departman oluşturulamadı' }, { status: 500 });
    }
}
