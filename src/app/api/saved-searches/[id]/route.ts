import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// DELETE /api/saved-searches/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const searchId = parseInt(id);
        const userId = parseInt(session.user.id);

        if (isNaN(searchId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        // Verify ownership
        const savedSearch = await prisma.savedSearch.findFirst({
            where: { id: searchId, userId },
        });

        if (!savedSearch) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        await prisma.savedSearch.delete({
            where: { id: searchId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting saved search:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH /api/saved-searches/[id] - Update (set as default)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const searchId = parseInt(id);
        const userId = parseInt(session.user.id);

        if (isNaN(searchId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const body = await request.json();
        const { isDefault } = body;

        // Verify ownership
        const savedSearch = await prisma.savedSearch.findFirst({
            where: { id: searchId, userId },
        });

        if (!savedSearch) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        // If setting as default, unset other defaults first
        if (isDefault) {
            await prisma.savedSearch.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
        }

        const updated = await prisma.savedSearch.update({
            where: { id: searchId },
            data: { isDefault: isDefault || false },
        });

        return NextResponse.json({
            ...updated,
            filters: JSON.parse(updated.filters),
        });
    } catch (error) {
        console.error('Error updating saved search:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
