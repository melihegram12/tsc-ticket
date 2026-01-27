import nodemailer from 'nodemailer';
import prisma from './prisma';

// Email configuration from environment or database
interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    fromEmail: string;
    fromName: string;
}

// Default config - will try to load from DB first
const defaultConfig: EmailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@example.com',
    fromName: process.env.SMTP_FROM_NAME || 'TSC Helpdesk',
};

// Get config from database or use defaults
async function getEmailConfig(): Promise<EmailConfig> {
    try {
        const dbConfig = await prisma.emailConfig.findFirst({
            where: { isActive: true },
        });

        if (dbConfig && dbConfig.smtpHost && dbConfig.smtpUser) {
            return {
                host: dbConfig.smtpHost,
                port: dbConfig.smtpPort || 587,
                secure: dbConfig.smtpSecure,
                user: dbConfig.smtpUser,
                pass: dbConfig.smtpPassword || '',
                fromEmail: dbConfig.fromEmail,
                fromName: dbConfig.fromName,
            };
        }
    } catch (error) {
        console.warn('Could not load email config from DB, using defaults');
    }
    return defaultConfig;
}

// Create transporter
async function createTransporter() {
    const config = await getEmailConfig();

    if (!config.user || !config.pass) {
        console.warn('Email credentials not configured');
        return null;
    }

    return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.pass,
        },
    });
}

// Generic send email function
export async function sendEmail(
    to: string,
    subject: string,
    html: string
): Promise<boolean> {
    try {
        const transporter = await createTransporter();
        if (!transporter) {
            console.warn('Email not sent - transporter not configured');
            return false;
        }

        const config = await getEmailConfig();

        await transporter.sendMail({
            from: `"${config.fromName}" <${config.fromEmail}>`,
            to,
            subject,
            html,
        });

        console.log(`Email sent to ${to}: ${subject}`);
        return true;
    } catch (error) {
        console.error('Failed to send email:', error);
        return false;
    }
}

// Email template wrapper
function wrapTemplate(content: string, title: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .card { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { text-align: center; margin-bottom: 24px; }
        .logo { font-size: 24px; font-weight: 700; color: #3b82f6; }
        .title { font-size: 20px; font-weight: 600; color: #1e293b; margin: 0 0 16px 0; }
        .content { color: #475569; }
        .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 16px; }
        .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #94a3b8; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .badge-urgent { background: #fee2e2; color: #dc2626; }
        .badge-high { background: #ffedd5; color: #ea580c; }
        .badge-normal { background: #dbeafe; color: #2563eb; }
        .badge-low { background: #f1f5f9; color: #64748b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <div class="logo">🎫 TSC Helpdesk</div>
            </div>
            ${content}
        </div>
        <div class="footer">
            Bu e-posta TSC Helpdesk sistemi tarafından otomatik olarak gönderilmiştir.
        </div>
    </div>
</body>
</html>
    `;
}

// Get priority badge HTML
function getPriorityBadge(priority: string): string {
    const labels: Record<string, string> = {
        URGENT: 'Acil',
        HIGH: 'Yüksek',
        NORMAL: 'Normal',
        LOW: 'Düşük',
    };
    const className = `badge badge-${priority.toLowerCase()}`;
    return `<span class="${className}">${labels[priority] || priority}</span>`;
}

// Send email when ticket is created
export async function sendTicketCreatedEmail(
    to: string,
    ticketNumber: string,
    subject: string,
    priority: string,
    requesterName: string
): Promise<boolean> {
    const html = wrapTemplate(`
        <h2 class="title">Yeni Destek Talebi Oluşturuldu</h2>
        <div class="content">
            <p><strong>Talep No:</strong> ${ticketNumber}</p>
            <p><strong>Konu:</strong> ${subject}</p>
            <p><strong>Öncelik:</strong> ${getPriorityBadge(priority)}</p>
            <p><strong>Talep Eden:</strong> ${requesterName}</p>
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/tickets" class="button">
                Talebi Görüntüle
            </a>
        </div>
    `, 'Yeni Talep');

    return sendEmail(to, `[${ticketNumber}] Yeni Talep: ${subject}`, html);
}

// Send email when ticket is assigned
export async function sendTicketAssignedEmail(
    to: string,
    ticketNumber: string,
    subject: string,
    priority: string,
    assignedBy: string
): Promise<boolean> {
    const html = wrapTemplate(`
        <h2 class="title">Bir Talep Size Atandı</h2>
        <div class="content">
            <p><strong>Talep No:</strong> ${ticketNumber}</p>
            <p><strong>Konu:</strong> ${subject}</p>
            <p><strong>Öncelik:</strong> ${getPriorityBadge(priority)}</p>
            <p><strong>Atayan:</strong> ${assignedBy}</p>
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/tickets" class="button">
                Talebi Görüntüle
            </a>
        </div>
    `, 'Talep Atandı');

    return sendEmail(to, `[${ticketNumber}] Size Atandı: ${subject}`, html);
}

// Send email when ticket gets a reply
export async function sendTicketReplyEmail(
    to: string,
    ticketNumber: string,
    subject: string,
    replierName: string,
    replyPreview: string
): Promise<boolean> {
    const html = wrapTemplate(`
        <h2 class="title">Talebinize Yanıt Geldi</h2>
        <div class="content">
            <p><strong>Talep No:</strong> ${ticketNumber}</p>
            <p><strong>Konu:</strong> ${subject}</p>
            <p><strong>Yanıtlayan:</strong> ${replierName}</p>
            <p style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                ${replyPreview.substring(0, 200)}${replyPreview.length > 200 ? '...' : ''}
            </p>
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/tickets" class="button">
                Yanıtı Görüntüle
            </a>
        </div>
    `, 'Talep Yanıtlandı');

    return sendEmail(to, `[${ticketNumber}] Yanıt: ${subject}`, html);
}

// Send SLA breach warning email
export async function sendSLAWarningEmail(
    to: string,
    ticketNumber: string,
    subject: string,
    warningType: 'response' | 'resolution',
    dueAt: Date
): Promise<boolean> {
    const typeLabel = warningType === 'response' ? 'İlk Yanıt' : 'Çözüm';
    const html = wrapTemplate(`
        <h2 class="title" style="color: #dc2626;">⚠️ SLA Uyarısı</h2>
        <div class="content">
            <p><strong>Talep No:</strong> ${ticketNumber}</p>
            <p><strong>Konu:</strong> ${subject}</p>
            <p><strong>SLA Türü:</strong> ${typeLabel} Süresi</p>
            <p><strong>Son Tarih:</strong> ${dueAt.toLocaleString('tr-TR')}</p>
            <p style="background: #fef2f2; padding: 16px; border-radius: 8px; color: #dc2626;">
                Bu talep için ${typeLabel.toLowerCase()} süresi yaklaşıyor. Lütfen gerekli işlemi yapın.
            </p>
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/tickets" class="button" style="background: linear-gradient(135deg, #dc2626, #b91c1c);">
                Talebi Görüntüle
            </a>
        </div>
    `, 'SLA Uyarısı');

    return sendEmail(to, `⚠️ SLA Uyarısı [${ticketNumber}]: ${subject}`, html);
}
