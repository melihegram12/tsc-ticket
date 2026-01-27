'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="not-found-page">
            <div className="not-found-content">
                <div className="error-code">404</div>
                <h1>Sayfa Bulunamadı</h1>
                <p>Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>

                <div className="actions">
                    <Link href="/dashboard" className="btn btn-primary">
                        <Home size={18} />
                        Dashboard'a Git
                    </Link>
                    <button onClick={() => window.history.back()} className="btn btn-secondary">
                        <ArrowLeft size={18} />
                        Geri Dön
                    </button>
                </div>
            </div>

            <style jsx>{`
                .not-found-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                    padding: 2rem;
                }
                .not-found-content {
                    text-align: center;
                    max-width: 480px;
                }
                .error-code {
                    font-size: 8rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    line-height: 1;
                    margin-bottom: 1rem;
                    animation: pulse 2s ease-in-out infinite;
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.02); opacity: 0.9; }
                }
                h1 {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0 0 0.75rem 0;
                }
                p {
                    color: #64748b;
                    font-size: 1rem;
                    margin: 0 0 2rem 0;
                }
                .actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    flex-wrap: wrap;
                }
                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.875rem 1.5rem;
                    font-size: 0.9375rem;
                    font-weight: 600;
                    border-radius: 12px;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    cursor: pointer;
                    border: none;
                }
                .btn-primary {
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white;
                    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.45);
                }
                .btn-secondary {
                    background: white;
                    color: #475569;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    border: 1px solid #e2e8f0;
                }
                .btn-secondary:hover {
                    background: #f8fafc;
                    transform: translateY(-2px);
                }
            `}</style>
        </div>
    );
}
