'use client';

import { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import AgentChatPanel from '@/components/chat/AgentChatPanel';
import { Loader2 } from 'lucide-react';

function ChatPageContent() {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return (
            <div className="loading-container">
                <Loader2 className="spinner" size={32} />
                <style jsx>{`
                    .loading-container {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 400px;
                        color: var(--gray-500);
                    }
                    .loading-container :global(.spinner) {
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    // Only agents, supervisors, and admins can access chat panel
    if (!session?.user || session.user.role === 'Requester') {
        return (
            <div className="access-denied">
                <h2>Erişim Engellendi</h2>
                <p>Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
                <style jsx>{`
                    .access-denied {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 400px;
                        color: var(--gray-500);
                    }
                    .access-denied h2 {
                        color: var(--gray-700);
                        margin: 0 0 0.5rem 0;
                    }
                    .access-denied p {
                        margin: 0;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="chat-page">
            <div className="page-header">
                <h1>Canlı Destek Paneli</h1>
                <p>Müşteri sohbetlerini yönetin</p>
            </div>
            <AgentChatPanel />
            <style jsx>{`
                .chat-page {
                    max-width: 1600px;
                }
                .page-header {
                    margin-bottom: 1.5rem;
                }
                .page-header h1 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--gray-900);
                    margin: 0 0 0.25rem 0;
                }
                .page-header p {
                    color: var(--gray-500);
                    margin: 0;
                }
            `}</style>
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div>Yükleniyor...</div>}>
            <ChatPageContent />
        </Suspense>
    );
}
