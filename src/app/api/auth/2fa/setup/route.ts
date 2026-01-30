import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

// In-memory 2FA secrets (would use DB in production when schema is updated)
const twoFactorSecrets = new Map<number, { secret: string; enabled: boolean }>();

// Export for use in verify route
export { twoFactorSecrets };

// POST /api/auth/2fa/setup - Generate 2FA secret and QR code
export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const userEmail = session.user.email || 'user';

        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `TSC Helpdesk (${userEmail})`,
            issuer: 'TSC Helpdesk',
        });

        // Store temporarily (not enabled yet)
        twoFactorSecrets.set(userId, { secret: secret.base32, enabled: false });

        // Generate QR Code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url || '');

        return NextResponse.json({
            secret: secret.base32,
            qrCode: qrCodeDataUrl,
            message: 'QR kodu tarayın ve doğrulama kodunu girin',
        });
    } catch (error) {
        console.error('Error setting up 2FA:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/auth/2fa/setup - Disable 2FA
export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        twoFactorSecrets.delete(userId);

        return NextResponse.json({ success: true, message: '2FA devre dışı bırakıldı' });
    } catch (error) {
        console.error('Error disabling 2FA:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
