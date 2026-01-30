import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// In-memory rules storage (for MVP without DB model)
// In production, this would come from a database
const HARDCODED_RULES = [
    {
        id: 1,
        name: 'Fatura Talepleri - Muhasebe',
        description: 'Konu "fatura" içeren talepleri Muhasebe departmanına ata',
        trigger: 'TICKET_CREATED',
        conditions: [{ field: 'subject', operator: 'contains', value: 'fatura' }],
        actions: [{ type: 'assign_department', params: { department: 'Muhasebe' } }],
        isActive: true,
        priority: 10,
        createdAt: new Date().toISOString(),
    },
    {
        id: 2,
        name: 'VIP Müşteri Önceliği',
        description: 'VIP domain e-postalarını acil önceliğe al',
        trigger: 'TICKET_CREATED',
        conditions: [{ field: 'requesterEmail', operator: 'ends_with', value: '@vipclient.com' }],
        actions: [{ type: 'set_priority', params: { priority: 'URGENT' } }],
        isActive: true,
        priority: 20,
        createdAt: new Date().toISOString(),
    },
    {
        id: 3,
        name: 'Otomatik Çözüm (3 Gün)',
        description: '3 gün bekleyen PENDING talepleri otomatik çöz',
        trigger: 'HOURLY_CHECK',
        conditions: [{ field: 'status', operator: 'equals', value: 'PENDING' }],
        actions: [{ type: 'set_status', params: { status: 'RESOLVED' } }],
        isActive: true,
        priority: 5,
        createdAt: new Date().toISOString(),
    },
];

// GET /api/admin/automation - Get all automation rules
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Return hardcoded rules for MVP
        return NextResponse.json({ rules: HARDCODED_RULES });
    } catch (error) {
        console.error('Error fetching automation rules:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/automation - Create new rule (placeholder)
export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // For MVP, return success message but explain rule changes need code
        return NextResponse.json({
            message: 'Yeni kurallar şu an için kod seviyesinde tanımlanmaktadır. automation.ts dosyasını düzenleyin.',
            note: 'Gelecek güncellemede dinamik kural ekleme aktif edilecektir.',
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
