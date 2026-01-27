import 'next-auth';

declare module 'next-auth' {
    interface User {
        id: string;
        email: string;
        name: string;
        role: string;
        permissions: string[];
        departments: Array<{
            id: number;
            name: string;
            isPrimary: boolean;
        }>;
    }

    interface Session {
        user: User;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        role: string;
        permissions: string[];
        departments: Array<{
            id: number;
            name: string;
            isPrimary: boolean;
        }>;
    }
}
