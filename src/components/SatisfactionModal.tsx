'use client';

import { useState } from 'react';
import { Star, Loader2, X, MessageSquare } from 'lucide-react';

interface SatisfactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticketId: number;
    ticketNumber: string;
    onSubmit: (score: number, comment: string) => Promise<void>;
}

export default function SatisfactionModal({
    isOpen,
    onClose,
    ticketId,
    ticketNumber,
    onSubmit,
}: SatisfactionModalProps) {
    const [score, setScore] = useState(0);
    const [hoveredScore, setHoveredScore] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (score === 0) return;

        setSubmitting(true);
        try {
            await onSubmit(score, comment);
            setSubmitted(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Failed to submit satisfaction:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const getScoreLabel = (s: number) => {
        const labels: Record<number, string> = {
            1: 'Çok Kötü',
            2: 'Kötü',
            3: 'Orta',
            4: 'İyi',
            5: 'Mükemmel',
        };
        return labels[s] || '';
    };

    return (
        <div className="modal-overlay">
            <div className="modal satisfaction-modal">
                {submitted ? (
                    <div className="success-state">
                        <div className="success-icon">✓</div>
                        <h3>Teşekkürler!</h3>
                        <p>Geri bildiriminiz için teşekkür ederiz.</p>
                    </div>
                ) : (
                    <>
                        <div className="modal-header">
                            <div className="modal-title">
                                <MessageSquare size={20} />
                                <h3>Hizmet Değerlendirmesi</h3>
                            </div>
                            <button className="close-btn" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <p className="modal-description">
                                    <strong>{ticketNumber}</strong> numaralı talebiniz çözüldü.
                                    Aldığınız hizmeti değerlendirir misiniz?
                                </p>

                                <div className="rating-section">
                                    <div className="stars">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={`star-btn ${star <= (hoveredScore || score) ? 'active' : ''}`}
                                                onMouseEnter={() => setHoveredScore(star)}
                                                onMouseLeave={() => setHoveredScore(0)}
                                                onClick={() => setScore(star)}
                                            >
                                                <Star
                                                    size={32}
                                                    fill={star <= (hoveredScore || score) ? 'currentColor' : 'none'}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <span className="score-label">
                                        {getScoreLabel(hoveredScore || score)}
                                    </span>
                                </div>

                                <div className="comment-section">
                                    <label htmlFor="satisfaction-comment">
                                        Yorumunuz (isteğe bağlı)
                                    </label>
                                    <textarea
                                        id="satisfaction-comment"
                                        className="input"
                                        placeholder="Deneyiminizi paylaşın..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={onClose}
                                    disabled={submitting}
                                >
                                    Sonra
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={score === 0 || submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={18} className="spinner" />
                                            Gönderiliyor...
                                        </>
                                    ) : (
                                        'Gönder'
                                    )}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: fadeIn 0.2s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .satisfaction-modal {
                    background: white;
                    border-radius: 0.75rem;
                    width: 100%;
                    max-width: 420px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    animation: slideUp 0.3s ease-out;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid var(--gray-100);
                }

                .modal-title {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: var(--primary-600);
                }

                .modal-title h3 {
                    margin: 0;
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: var(--gray-900);
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: var(--gray-400);
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 0.25rem;
                }

                .close-btn:hover {
                    color: var(--gray-600);
                    background: var(--gray-100);
                }

                .modal-body {
                    padding: 1.5rem;
                }

                .modal-description {
                    text-align: center;
                    color: var(--gray-600);
                    margin: 0 0 1.5rem 0;
                    line-height: 1.5;
                }

                .modal-description strong {
                    color: var(--gray-900);
                    font-family: monospace;
                }

                .rating-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .stars {
                    display: flex;
                    gap: 0.5rem;
                }

                .star-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--gray-300);
                    padding: 0.25rem;
                    transition: all 0.15s;
                }

                .star-btn:hover,
                .star-btn.active {
                    color: #f59e0b;
                    transform: scale(1.1);
                }

                .score-label {
                    margin-top: 0.75rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--gray-700);
                    min-height: 1.25rem;
                }

                .comment-section label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--gray-700);
                    margin-bottom: 0.5rem;
                }

                .comment-section textarea {
                    resize: vertical;
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    padding: 1rem 1.5rem;
                    background: var(--gray-50);
                    border-top: 1px solid var(--gray-100);
                    border-radius: 0 0 0.75rem 0.75rem;
                }

                .modal-footer :global(.spinner) {
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .success-state {
                    padding: 3rem 2rem;
                    text-align: center;
                }

                .success-icon {
                    width: 64px;
                    height: 64px;
                    background: linear-gradient(135deg, var(--success-500), var(--success-600));
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    margin: 0 auto 1rem;
                    animation: scaleIn 0.3s ease-out;
                }

                @keyframes scaleIn {
                    from { transform: scale(0); }
                    to { transform: scale(1); }
                }

                .success-state h3 {
                    margin: 0 0 0.5rem;
                    color: var(--gray-900);
                }

                .success-state p {
                    margin: 0;
                    color: var(--gray-600);
                }
            `}</style>
        </div>
    );
}
