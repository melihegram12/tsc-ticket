'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Send,
    Loader2,
    Clock,
    User,
    Building2,
    Tag,
    AlertCircle,
    MessageSquare,
    Lock,
    Paperclip,
    FileText,
    File,
    Download,
} from 'lucide-react';
import FileUpload from '@/components/file-upload';
import SatisfactionModal from '@/components/SatisfactionModal';
import PresenceIndicator from '@/components/PresenceIndicator';

interface CannedResponse {
    id: number;
    title: string;
    body: string;
}

interface TicketDetail {
    id: number;
    ticketNumber: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    createdAt: string;
    lastActivityAt: string;
    firstResponseAt?: string;
    resolvedAt?: string;
    satisfactionScore?: number | null;
    satisfactionComment?: string | null;
    requester: { id: number; name: string; email: string };
    assignedTo?: { id: number; name: string };
    department: { id: number; name: string };
    category?: { id: number; name: string };
    slaTracking?: {
        firstResponseDueAt: string;
        resolutionDueAt: string;
        firstResponseBreachedAt?: string;
        resolutionBreachedAt?: string;
    };
    messages: Array<{
        id: number;
        body: string;
        messageType: string;
        createdAt: string;
        author: { id: number; name: string };
        attachments: Array<{
            id: number;
            fileName: string;
            sizeBytes: number;
            storagePath: string;
        }>;
    }>;
    events: Array<{
        id: number;
        eventType: string;
        oldValue?: string;
        newValue?: string;
        createdAt: string;
        actor?: { id: number; name: string };
    }>;
}

interface Agent {
    id: number;
    name: string;
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const [ticket, setTicket] = useState<TicketDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [messageType, setMessageType] = useState('PUBLIC_REPLY');
    const [agents, setAgents] = useState<Agent[]>([]);
    const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
    const [showCannedResponses, setShowCannedResponses] = useState(false);
    const [attachments, setAttachments] = useState<any[]>([]);
    const [showUpload, setShowUpload] = useState(false);
    const [showSatisfactionModal, setShowSatisfactionModal] = useState(false);

    const isAgent = session?.user?.role !== 'Requester';

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                const response = await fetch(`/api/tickets/${resolvedParams.id}`);
                if (!response.ok) throw new Error('Ticket bulunamadı');
                const data = await response.json();
                setTicket(data);
            } catch (error) {
                console.error('Failed to fetch ticket:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchAgents = async () => {
            if (!isAgent) return;
            try {
                const response = await fetch('/api/users?roleId=3');
                const data = await response.json();
                setAgents(data);
            } catch (error) {
                console.error('Failed to fetch agents:', error);
            }
        };

        fetchTicket();
        fetchAgents();
    }, [resolvedParams.id, isAgent]);

    useEffect(() => {
        const fetchCannedResponses = async () => {
            if (!isAgent || !ticket?.department.id) return;
            try {
                const response = await fetch(`/api/canned-responses?departmentId=${ticket.department.id}`);
                const data = await response.json();
                if (Array.isArray(data)) {
                    setCannedResponses(data);
                }
            } catch (error) {
                console.error('Failed to fetch canned responses:', error);
            }
        };

        if (ticket) {
            fetchCannedResponses();
        }
    }, [ticket, isAgent]);

    const updateTicket = async (updates: Record<string, unknown>) => {
        setUpdating(true);
        try {
            const response = await fetch(`/api/tickets/${resolvedParams.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error('Güncelleme başarısız');
            const data = await response.json();
            setTicket(prev => prev ? { ...prev, ...data } : null);

            // Check if status changed to RESOLVED and user is the requester
            if (updates.status === 'RESOLVED' &&
                ticket?.requester?.id === parseInt(session?.user?.id || '0') &&
                !ticket?.satisfactionScore) {
                setShowSatisfactionModal(true);
            }
        } catch (error) {
            console.error('Failed to update ticket:', error);
        } finally {
            setUpdating(false);
        }
    };

    const handleSatisfactionSubmit = async (score: number, comment: string) => {
        const response = await fetch(`/api/tickets/${resolvedParams.id}/satisfaction`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ satisfactionScore: score, satisfactionComment: comment }),
        });
        if (!response.ok) throw new Error('Failed to submit satisfaction');
        const data = await response.json();
        setTicket(prev => prev ? { ...prev, satisfactionScore: data.satisfactionScore, satisfactionComment: data.satisfactionComment } : null);
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const response = await fetch(`/api/tickets/${resolvedParams.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    body: newMessage,
                    messageType,
                    attachments,
                }),
            });
            if (!response.ok) throw new Error('Mesaj gönderilemedi');

            const message = await response.json();
            setTicket(prev => prev ? {
                ...prev,
                messages: [...prev.messages, message],
            } : null);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
            setAttachments([]);
            setShowUpload(false);
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            NEW: 'Yeni',
            OPEN: 'Açık',
            WAITING_REQUESTER: 'Yanıt Bekleniyor',
            PENDING: 'Beklemede',
            RESOLVED: 'Çözüldü',
            CLOSED: 'Kapandı',
            REOPENED: 'Yeniden Açıldı',
        };
        return labels[status] || status;
    };

    const getPriorityLabel = (priority: string) => {
        const labels: Record<string, string> = {
            URGENT: 'Acil', HIGH: 'Yüksek', NORMAL: 'Normal', LOW: 'Düşük',
        };
        return labels[priority] || priority;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="loading-container">
                <Loader2 className="spinner" size={32} />
                <style jsx>{`
          .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
          }
          .loading-container :global(.spinner) {
            color: var(--primary-500);
            animation: spin 1s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="error-state">
                <AlertCircle size={48} />
                <h2>Ticket Bulunamadı</h2>
                <Link href="/dashboard/tickets" className="btn btn-primary">
                    Taleplere Dön
                </Link>
                <style jsx>{`
          .error-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            color: var(--gray-400);
          }
          .error-state h2 {
            color: var(--gray-700);
            margin: 1rem 0;
          }
        `}</style>
            </div>
        );
    }

    return (
        <div className="ticket-detail-page">
            <div className="page-header">
                <Link href="/dashboard/tickets" className="back-link">
                    <ArrowLeft size={20} />
                    Talepler
                </Link>
                <div className="header-content">
                    <div className="ticket-info">
                        <span className="ticket-number">{ticket.ticketNumber}</span>
                        <h1>{ticket.subject}</h1>
                    </div>
                    <div className="header-badges">
                        <PresenceIndicator ticketId={ticket.id} />
                        <span className={`badge status-${ticket.status.toLowerCase().replace('_', '-')}`}>
                            {getStatusLabel(ticket.status)}
                        </span>
                        <span className={`badge priority-${ticket.priority.toLowerCase()}`}>
                            {getPriorityLabel(ticket.priority)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="ticket-layout">
                {/* Main content */}
                <div className="ticket-main">
                    {/* Original message */}
                    <div className="card message-card original">
                        <div className="message-header">
                            <div className="author-info">
                                <div className="avatar avatar-md">{ticket.requester.name.charAt(0)}</div>
                                <div>
                                    <span className="author-name">{ticket.requester.name}</span>
                                    <span className="message-date">{formatDate(ticket.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="message-body">
                            <p>{ticket.description}</p>
                        </div>
                    </div>

                    {/* Messages */}
                    {ticket.messages.map((message) => (
                        <div
                            key={message.id}
                            className={`card message-card ${message.messageType === 'INTERNAL_NOTE' ? 'internal' : ''}`}
                        >
                            <div className="message-header">
                                <div className="author-info">
                                    <div className="avatar avatar-md">{message.author.name.charAt(0)}</div>
                                    <div>
                                        <span className="author-name">{message.author.name}</span>
                                        <span className="message-date">{formatDate(message.createdAt)}</span>
                                    </div>
                                </div>
                                {message.messageType === 'INTERNAL_NOTE' && (
                                    <span className="internal-badge">
                                        <Lock size={12} />
                                        İç Not
                                    </span>
                                )}
                            </div>
                            <div className="message-body">
                                <p>{message.body}</p>
                                {message.attachments && message.attachments.length > 0 && (
                                    <div className="message-attachments">
                                        {message.attachments.map(att => (
                                            <a key={att.id} href={`/uploads/${att.storagePath}`} target="_blank" rel="noopener noreferrer" className="attachment-item">
                                                <div className="attachment-icon">
                                                    <File size={16} />
                                                </div>
                                                <div className="attachment-info">
                                                    <span className="attachment-name">{att.fileName}</span>
                                                    <span className="attachment-size">{(att.sizeBytes / 1024).toFixed(1)} KB</span>
                                                </div>
                                                <Download size={14} className="download-icon" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Reply form */}
                    <div className="card reply-card">
                        <form onSubmit={sendMessage}>
                            {isAgent && (
                                <div className="message-type-tabs">
                                    <button
                                        type="button"
                                        className={`tab ${messageType === 'PUBLIC_REPLY' ? 'active' : ''}`}
                                        onClick={() => setMessageType('PUBLIC_REPLY')}
                                    >
                                        <MessageSquare size={16} />
                                        Yanıt
                                    </button>
                                    <button
                                        type="button"
                                        className={`tab ${messageType === 'INTERNAL_NOTE' ? 'active' : ''}`}
                                        onClick={() => setMessageType('INTERNAL_NOTE')}
                                    >
                                        <Lock size={16} />
                                        İç Not
                                    </button>
                                </div>
                            )}
                            <textarea
                                className="input reply-textarea"
                                placeholder={messageType === 'INTERNAL_NOTE' ? 'İç not ekle (sadece personel görebilir)...' : 'Yanıtınızı yazın...'}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                rows={4}
                            />

                            {showUpload && (
                                <FileUpload
                                    onUploadComplete={setAttachments}
                                    maxFiles={5}
                                />
                            )}

                            <div className="reply-actions">
                                <div className="left-actions">
                                    <button
                                        type="button"
                                        className={`btn btn-ghost btn-sm ${showUpload ? 'active' : ''}`}
                                        onClick={() => setShowUpload(!showUpload)}
                                    >
                                        <Paperclip size={16} />
                                        Dosya Ekle
                                    </button>
                                    {isAgent && (
                                        <div className="canned-response-wrapper">
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => setShowCannedResponses(!showCannedResponses)}
                                            >
                                                <FileText size={16} />
                                                Hazır Cevap
                                            </button>
                                            {showCannedResponses && (
                                                <div className="canned-responses-menu">
                                                    {cannedResponses.length === 0 ? (
                                                        <div className="menu-item empty">Hazır cevap bulunamadı</div>
                                                    ) : (
                                                        cannedResponses.map(cr => (
                                                            <button
                                                                key={cr.id}
                                                                type="button"
                                                                className="menu-item"
                                                                onClick={() => {
                                                                    setNewMessage(prev => prev + (prev ? '\n\n' : '') + cr.body);
                                                                    setShowCannedResponses(false);
                                                                }}
                                                            >
                                                                <span className="cr-title">{cr.title}</span>
                                                                <span className="cr-preview">{cr.body.substring(0, 50)}...</span>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={sending || !newMessage.trim()}
                                >
                                    {sending ? (
                                        <Loader2 size={18} className="spinner" />
                                    ) : (
                                        <Send size={18} />
                                    )}
                                    Gönder
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="ticket-sidebar">
                    <div className="card sidebar-card">
                        <h3>Detaylar</h3>

                        <div className="detail-item">
                            <span className="detail-label"><User size={14} /> Talep Eden</span>
                            <span className="detail-value">{ticket.requester.name}</span>
                        </div>

                        <div className="detail-item">
                            <span className="detail-label"><Building2 size={14} /> Departman</span>
                            <span className="detail-value">{ticket.department.name}</span>
                        </div>

                        {ticket.category && (
                            <div className="detail-item">
                                <span className="detail-label"><Tag size={14} /> Kategori</span>
                                <span className="detail-value">{ticket.category.name}</span>
                            </div>
                        )}

                        <div className="detail-item">
                            <span className="detail-label"><Clock size={14} /> Oluşturulma</span>
                            <span className="detail-value">{formatDate(ticket.createdAt)}</span>
                        </div>

                        {isAgent && (
                            <>
                                <hr />
                                <h3>Eylemler</h3>

                                <div className="action-group">
                                    <label>Durum</label>
                                    <select
                                        className="input input-sm"
                                        value={ticket.status}
                                        onChange={(e) => updateTicket({ status: e.target.value })}
                                        disabled={updating}
                                    >
                                        <option value="NEW">Yeni</option>
                                        <option value="OPEN">Açık</option>
                                        <option value="WAITING_REQUESTER">Yanıt Bekleniyor</option>
                                        <option value="PENDING">Beklemede</option>
                                        <option value="RESOLVED">Çözüldü</option>
                                        <option value="CLOSED">Kapandı</option>
                                    </select>
                                </div>

                                <div className="action-group">
                                    <label>Öncelik</label>
                                    <select
                                        className="input input-sm"
                                        value={ticket.priority}
                                        onChange={(e) => updateTicket({ priority: e.target.value })}
                                        disabled={updating}
                                    >
                                        <option value="LOW">Düşük</option>
                                        <option value="NORMAL">Normal</option>
                                        <option value="HIGH">Yüksek</option>
                                        <option value="URGENT">Acil</option>
                                    </select>
                                </div>

                                <div className="action-group">
                                    <label>Atanan</label>
                                    <select
                                        className="input input-sm"
                                        value={ticket.assignedTo?.id || ''}
                                        onChange={(e) => updateTicket({
                                            assignedToId: e.target.value ? parseInt(e.target.value) : null
                                        })}
                                        disabled={updating}
                                    >
                                        <option value="">Atanmamış</option>
                                        {agents.map((agent) => (
                                            <option key={agent.id} value={agent.id}>{agent.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
        .ticket-detail-page {
          max-width: 1200px;
        }

        .page-header {
          margin-bottom: 1.5rem;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--gray-500);
          text-decoration: none;
          margin-bottom: 0.75rem;
        }

        .back-link:hover {
          color: var(--primary-600);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .ticket-number {
          font-family: monospace;
          font-size: 0.8125rem;
          color: var(--gray-500);
        }

        .ticket-info h1 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--gray-900);
          margin: 0.25rem 0 0 0;
        }

        .header-badges {
          display: flex;
          gap: 0.5rem;
        }

        .ticket-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 1.5rem;
        }

        .ticket-main {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .message-card {
          padding: 1rem 1.25rem;
        }

        .message-card.original {
          border-left: 3px solid var(--primary-500);
        }

        .message-card.internal {
          background: #fffbeb;
          border-left: 3px solid var(--warning-500);
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .author-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .author-name {
          display: block;
          font-weight: 500;
          color: var(--gray-900);
        }

        .message-date {
          font-size: 0.75rem;
          color: var(--gray-500);
        }

        .internal-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: var(--warning-600);
          background: white;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
        }

        .message-body {
          color: var(--gray-700);
          line-height: 1.6;
        }

        .message-body p {
          margin: 0;
          white-space: pre-wrap;
        }

        .reply-card {
          padding: 1rem 1.25rem;
        }

        .message-type-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .tab {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--gray-200);
          border-radius: 0.375rem;
          background: white;
          color: var(--gray-600);
          font-size: 0.8125rem;
          cursor: pointer;
        }

        .tab:hover {
          border-color: var(--gray-300);
        }

        .tab.active {
          background: var(--primary-50);
          border-color: var(--primary-200);
          color: var(--primary-600);
        }

        .reply-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .reply-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.75rem;
        }

        .reply-actions :global(.spinner) {
          animation: spin 0.8s linear infinite;
        }
        
        .left-actions {
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }

        .canned-response-wrapper {
            position: relative;
        }

        .canned-responses-menu {
            position: absolute;
            bottom: 100%;
            left: 0;
            margin-bottom: 0.5rem;
            background: white;
            border: 1px solid var(--gray-200);
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            width: 300px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 50;
        }
        
        .menu-item {
            width: 100%;
            text-align: left;
            padding: 0.75rem;
            border: none;
            background: none;
            border-bottom: 1px solid var(--gray-100);
            cursor: pointer;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }
        
        .menu-item:last-child {
            border-bottom: none;
        }
        
        .menu-item:hover {
            background: var(--gray-50);
        }
        
        .menu-item.empty {
            color: var(--gray-500);
            font-size: 0.875rem;
            text-align: center;
            cursor: default;
        }
        
        .cr-title {
            font-weight: 500;
            color: var(--gray-900);
            font-size: 0.875rem;
        }
        
        .cr-preview {
            color: var(--gray-500);
            font-size: 0.75rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .message-attachments {
            margin-top: 1rem;
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
        }

        .attachment-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.5rem 0.75rem;
            background: var(--gray-50);
            border: 1px solid var(--gray-200);
            border-radius: 0.375rem;
            text-decoration: none;
            transition: all 0.2s;
            max-width: 300px;
        }

        .attachment-item:hover {
            border-color: var(--primary-300);
            background: var(--primary-50);
        }

        .attachment-icon {
            color: var(--gray-500);
        }

        .attachment-item:hover .attachment-icon {
            color: var(--primary-500);
        }

        .attachment-info {
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .attachment-name {
            font-size: 0.8125rem;
            font-weight: 500;
            color: var(--gray-700);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .attachment-size {
            font-size: 0.6875rem;
            color: var(--gray-500);
        }

        .download-icon {
            color: var(--gray-400);
        }
        
        .btn.active {
            color: var(--primary-600);
            background: var(--primary-50);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .sidebar-card {
          padding: 1.25rem;
          position: sticky;
          top: calc(var(--header-height) + 1.5rem);
        }

        .sidebar-card h3 {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--gray-500);
          margin: 0 0 1rem 0;
        }

        .sidebar-card hr {
          border: none;
          border-top: 1px solid var(--gray-200);
          margin: 1rem 0;
        }

        .detail-item {
          margin-bottom: 0.875rem;
        }

        .detail-label {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: var(--gray-500);
          margin-bottom: 0.25rem;
        }

        .detail-value {
          font-size: 0.875rem;
          color: var(--gray-900);
        }

        .action-group {
          margin-bottom: 0.875rem;
        }

        .action-group label {
          display: block;
          font-size: 0.75rem;
          color: var(--gray-500);
          margin-bottom: 0.375rem;
        }

        .input-sm {
          padding: 0.5rem 0.75rem;
          font-size: 0.8125rem;
        }

        @media (max-width: 1024px) {
          .ticket-layout {
            grid-template-columns: 1fr;
          }

          .sidebar-card {
            position: static;
          }
        }

        @media (max-width: 640px) {
          .header-content {
            flex-direction: column;
          }
        }
      `}</style>

            {/* Satisfaction Modal */}
            <SatisfactionModal
                isOpen={showSatisfactionModal}
                onClose={() => setShowSatisfactionModal(false)}
                ticketId={ticket.id}
                ticketNumber={ticket.ticketNumber}
                onSubmit={handleSatisfactionSubmit}
            />
        </div>
    );
}
