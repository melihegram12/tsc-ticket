// @ts-nocheck - imap-simple lacks proper TypeScript declarations
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import crypto from 'crypto';
import prisma from './prisma';

/**
 * Generate a secure random password for email-created users
 */
function generateSecurePassword(): string {
    return crypto.randomBytes(32).toString('base64');
}

export interface IMAPConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    tls: boolean;
    authTimeout?: number;
}

interface EmailMessage {
    from: string;
    fromName: string;
    subject: string;
    body: string;
    date: Date;
    messageId: string;
}

/**
 * Fetch unread emails from IMAP server
 */
export async function fetchUnreadEmails(config: IMAPConfig): Promise<EmailMessage[]> {
    const connection = await imaps.connect({
        imap: {
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            tls: config.tls,
            authTimeout: config.authTimeout || 10000,
        },
    });

    try {
        await connection.openBox('INBOX');

        const searchCriteria = ['UNSEEN'];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            markSeen: true,
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        const emails: EmailMessage[] = [];

        for (const msg of messages) {
            const all = msg.parts.find((p: any) => p.which === '');
            if (all?.body) {
                const parsed = await simpleParser(all.body);

                const fromAddress = parsed.from?.value?.[0]?.address || '';
                const fromName = parsed.from?.value?.[0]?.name || fromAddress;

                emails.push({
                    from: fromAddress,
                    fromName: fromName,
                    subject: parsed.subject || 'No Subject',
                    body: parsed.text || (typeof parsed.html === 'string' ? parsed.html.replace(/<[^>]*>/g, '') : '') || '',
                    date: parsed.date || new Date(),
                    messageId: parsed.messageId || '',
                });
            }
        }

        return emails;
    } finally {
        connection.end();
    }
}

/**
 * Create tickets from emails
 */
export async function processEmailsToTickets(config: IMAPConfig, departmentId: number): Promise<number> {
    const emails = await fetchUnreadEmails(config);
    let created = 0;

    for (const email of emails) {
        // Check if ticket already exists for this email
        const existing = await prisma.ticket.findFirst({
            where: {
                description: { contains: email.messageId },
            },
        });

        if (existing) continue;

        // Find or create user by email
        let user = await prisma.user.findUnique({
            where: { email: email.from },
        });

        if (!user) {
            // Create a guest user for email sender
            const requesterRole = await prisma.role.findFirst({
                where: { name: 'Requester' },
            });

            if (requesterRole) {
                // Generate secure random password - user must use password reset to login
                const securePassword = generateSecurePassword();
                const bcrypt = await import('bcryptjs');
                const hashedPassword = await bcrypt.hash(securePassword, 12);

                user = await prisma.user.create({
                    data: {
                        email: email.from,
                        name: email.fromName,
                        passwordHash: hashedPassword,
                        roleId: requesterRole.id,
                    },
                });
            }
        }

        if (!user) continue;

        // Generate ticket number
        const year = new Date().getFullYear();
        const lastTicket = await prisma.ticket.findFirst({
            orderBy: { id: 'desc' },
        });
        const nextNum = (lastTicket?.id || 0) + 1;
        const ticketNumber = `EMAIL-${year}-${String(nextNum).padStart(6, '0')}`;

        // Create ticket
        await prisma.ticket.create({
            data: {
                ticketNumber,
                requesterName: email.fromName,
                subject: email.subject,
                description: `${email.body}\n\n---\nEmail ID: ${email.messageId}`,
                priority: 'NORMAL',
                requesterId: user.id,
                departmentId,
                events: {
                    create: {
                        eventType: 'CREATED',
                        actorId: user.id,
                        newValue: JSON.stringify({ source: 'email', subject: email.subject }),
                    },
                },
            },
        });

        created++;
    }

    return created;
}

/**
 * Get IMAP config from system settings
 */
export async function getIMAPConfigFromSettings(): Promise<IMAPConfig | null> {
    const settings = await prisma.systemSetting.findMany({
        where: {
            key: { startsWith: 'email.imap.' },
        },
    });

    const getValue = (key: string) => settings.find(s => s.key === key)?.value;

    const host = getValue('email.imap.host');
    const user = getValue('email.imap.user');
    const password = getValue('email.imap.password');

    if (!host || !user || !password) return null;

    return {
        host,
        port: parseInt(getValue('email.imap.port') || '993'),
        user,
        password,
        tls: getValue('email.imap.tls') !== 'false',
    };
}
