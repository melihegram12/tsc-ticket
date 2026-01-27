import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PATCH /api/admin/departments/[id] - Update department
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { id } = await params;
        const deptId = parseInt(id);
        const body = await request.json();
        const { name, description, emailAlias, isActive } = body;

        // Check if email alias already exists for another department
        if (emailAlias) {
            const existing = await prisma.department.findFirst({
                where: {
                    emailAlias,
                    NOT: { id: deptId },
                },
            });
            if (existing) {
                return NextResponse.json(
                    { error: 'Bu e-posta takma adı zaten kullanımda' },
                    { status: 400 }
                );
            }
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (emailAlias !== undefined) updateData.emailAlias = emailAlias || null;
        if (isActive !== undefined) updateData.isActive = isActive;

        const department = await prisma.department.update({
            where: { id: deptId },
            data: updateData,
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
        });

        return NextResponse.json(department);
    } catch (error) {
        console.error('Error updating department:', error);
        return NextResponse.json({ error: 'Departman güncellenemedi' }, { status: 500 });
    }
}

// DELETE /api/admin/departments/[id] - Delete department
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { id } = await params;
        const deptId = parseInt(id);

        // Check if department has tickets
        const ticketCount = await prisma.ticket.count({
            where: { departmentId: deptId },
        });

        if (ticketCount > 0) {
            return NextResponse.json(
                { error: `Bu departmanda ${ticketCount} ticket bulunuyor. Önce ticketları taşıyın.` },
                { status: 400 }
            );
        }

        await prisma.department.delete({
            where: { id: deptId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting department:', error);
        return NextResponse.json({ error: 'Departman silinemedi' }, { status: 500 });
    }
}
