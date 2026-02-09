'use client';

import { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import AgentChatPanel from '@/components/chat/AgentChatPanel';
import CustomerChatPanel from '@/components/chat/CustomerChatPanel';
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

    if (!session?.user) return null;

    // Render different panels based on role
    const isAgent = ['Admin', 'Supervisor', 'Agent'].includes(session.user.role);

    return (
        <div className="chat-page">
            <div className="page-header">
                <h1>Canlı Destek</h1>
                <p>{isAgent ? 'Müşteri sohbetlerini yönetin' : 'Destek ekibimizle iletişime geçin'}</p>
            </div>

            {isAgent ? <AgentChatPanel /> : <CustomerChatPanel />}

            <style jsx>{`
                .chat-page {
                    max-width: 1600px;
                    height: calc(100vh - 8rem);
                    display: flex;
                    flex-direction: column;
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
