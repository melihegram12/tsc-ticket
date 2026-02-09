import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequestWithAuth } from 'next-auth/middleware';

export default withAuth(
    function middleware(req: NextRequestWithAuth) {
        const token = req.nextauth.token;
        const pathname = req.nextUrl.pathname;

        // Check if user needs to complete 2FA verification
        if (token?.twoFactorEnabled && !token?.twoFactorVerified) {
            // Allow access to 2FA verification endpoint
            if (pathname.startsWith('/api/auth/2fa/verify') || pathname === '/login/2fa') {
                return NextResponse.next();
            }
            // Redirect to 2FA verification page for other protected routes
            if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) {
                return NextResponse.redirect(new URL('/login/2fa', req.url));
            }
        }

        // Check admin routes - only allow Admin role
        if (pathname.startsWith('/api/admin') || pathname.startsWith('/dashboard/admin')) {
            const userRole = token?.role as string | undefined;
            if (userRole !== 'Admin') {
                return NextResponse.json(
                    { error: 'Forbidden: Admin access required' },
                    { status: 403 }
                );
            }
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: '/login',
        },
    }
);

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/api/tickets/:path*',
        '/api/departments/:path*',
        '/api/users/:path*',
        '/api/admin/:path*',
        '/api/chat/:path*',
        '/api/kb/:path*',
        '/api/assets/:path*',
        '/api/notifications/:path*',
        '/api/reports/:path*',
        '/api/saved-searches/:path*',
        '/api/canned-responses/:path*',
        '/api/uploads/:path*',
        '/api/dashboard/:path*',
    ],
};
