import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/departments - List all departments with categories
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const departments = await prisma.department.findMany({
            include: {
                categories: {
                    orderBy: { sortOrder: 'asc' },
                },
                _count: {
                    select: {
                        users: true,
                        tickets: true,
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

// POST /api/admin/departments - Create new department
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, emailAlias, isActive = true } = body;

        if (!name) {
            return NextResponse.json({ error: 'Departman adı zorunludur' }, { status: 400 });
        }

        // Check if email alias already exists
        if (emailAlias) {
            const existing = await prisma.department.findUnique({
                where: { emailAlias },
            });
            if (existing) {
                return NextResponse.json(
                    { error: 'Bu e-posta takma adı zaten kullanımda' },
                    { status: 400 }
                );
            }
        }

        const department = await prisma.department.create({
            data: {
                name,
                description,
                emailAlias: emailAlias || null,
                isActive,
            },
            include: {
                categories: true,
                _count: {
                    select: {
                        users: true,
                        tickets: true,
                    },
                },
            },
        });

        return NextResponse.json(department, { status: 201 });
    } catch (error) {
        console.error('Error creating department:', error);
        return NextResponse.json({ error: 'Departman oluşturulamadı' }, { status: 500 });
    }
}
