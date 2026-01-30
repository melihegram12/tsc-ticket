import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PATCH /api/admin/automation/[id] - Toggle rule (placeholder)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // For MVP, return success but explain limitation
        return NextResponse.json({
            message: `Kural #${id} güncelleme isteği alındı. Değişiklikler: ${JSON.stringify(body)}`,
            note: 'Dinamik kural değişiklikleri gelecek güncellemede aktif edilecektir.',
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/automation/[id] - Delete rule (placeholder)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        return NextResponse.json({
            message: `Kural #${id} silme isteği alındı.`,
            note: 'Dinamik kural silme gelecek güncellemede aktif edilecektir.',
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
