import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import speakeasy from 'speakeasy';
import { twoFactorSecrets } from '../setup/route';

// POST /api/auth/2fa/verify - Verify TOTP code and enable 2FA
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const body = await request.json();
        const { code } = body;

        if (!code || typeof code !== 'string') {
            return NextResponse.json({ error: 'Doğrulama kodu gerekli' }, { status: 400 });
        }

        const userSecret = twoFactorSecrets.get(userId);
        if (!userSecret) {
            return NextResponse.json({ error: '2FA kurulumu bulunamadı. Önce kurulum yapın.' }, { status: 400 });
        }

        // Verify the code
        const isValid = speakeasy.totp.verify({
            secret: userSecret.secret,
            encoding: 'base32',
            token: code,
            window: 1, // Allow 1 step tolerance
        });

        if (!isValid) {
            return NextResponse.json({ error: 'Geçersiz doğrulama kodu' }, { status: 400 });
        }

        // Enable 2FA
        twoFactorSecrets.set(userId, { ...userSecret, enabled: true });

        return NextResponse.json({
            success: true,
            message: '2FA başarıyla etkinleştirildi',
        });
    } catch (error) {
        console.error('Error verifying 2FA:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
