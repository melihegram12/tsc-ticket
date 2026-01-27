import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from './prisma';

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'E-posta', type: 'email' },
                password: { label: 'Şifre', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('E-posta ve şifre gereklidir');
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: {
                                        permission: true,
                                    },
                                },
                            },
                        },
                        departments: {
                            include: {
                                department: true,
                            },
                        },
                    },
                });

                if (!user || !user.isActive) {
                    throw new Error('Kullanıcı bulunamadı veya hesap pasif');
                }

                if (!user.passwordHash) {
                    throw new Error('Bu hesap için şifre ile giriş yapılamaz');
                }

                const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
                if (!isValid) {
                    throw new Error('Şifre hatalı');
                }

                // Update last login
                await prisma.user.update({
                    where: { id: user.id },
                    data: { lastLoginAt: new Date() },
                });

                return {
                    id: String(user.id),
                    email: user.email,
                    name: user.name,
                    role: user.role.name,
                    permissions: user.role.permissions.map(rp => rp.permission.key),
                    departments: user.departments.map(ud => ({
                        id: ud.department.id,
                        name: ud.department.name,
                        isPrimary: ud.isPrimary,
                    })),
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.permissions = user.permissions;
                token.departments = user.departments;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.permissions = token.permissions as string[];
                session.user.departments = token.departments as Array<{
                    id: number;
                    name: string;
                    isPrimary: boolean;
                }>;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 hours
    },
    secret: process.env.NEXTAUTH_SECRET,
};
