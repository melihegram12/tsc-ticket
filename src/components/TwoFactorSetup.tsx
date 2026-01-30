'use client';

import { useState } from 'react';
import { Shield, QrCode, Check, X, Loader2 } from 'lucide-react';

interface TwoFactorSetupProps {
    initialEnabled?: boolean;
}

export default function TwoFactorSetup({ initialEnabled = false }: TwoFactorSetupProps) {
    const [enabled, setEnabled] = useState(initialEnabled);
    const [setupMode, setSetupMode] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [verifyCode, setVerifyCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const startSetup = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setQrCode(data.qrCode);
            setSecret(data.secret);
            setSetupMode(true);
        } catch (err: any) {
            setError(err.message || '2FA kurulumu başlatılamadı');
        } finally {
            setLoading(false);
        }
    };

    const verifyAndEnable = async () => {
        if (!verifyCode || verifyCode.length !== 6) {
            setError('6 haneli doğrulama kodu girin');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: verifyCode }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setEnabled(true);
            setSetupMode(false);
            setSuccess('2FA başarıyla etkinleştirildi!');
            setQrCode(null);
            setSecret(null);
            setVerifyCode('');
        } catch (err: any) {
            setError(err.message || 'Doğrulama başarısız');
        } finally {
            setLoading(false);
        }
    };

    const disable2FA = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/2fa/setup', { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setEnabled(false);
            setSuccess('2FA devre dışı bırakıldı');
        } catch (err: any) {
            setError(err.message || '2FA devre dışı bırakılamadı');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="two-factor-setup">
            <div className="section-header">
                <Shield size={20} />
                <h3>İki Faktörlü Doğrulama (2FA)</h3>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {!setupMode ? (
                <div className="status-section">
                    <div className="status-indicator">
                        <span className={`status-badge ${enabled ? 'active' : 'inactive'}`}>
                            {enabled ? <Check size={14} /> : <X size={14} />}
                            {enabled ? 'Aktif' : 'Devre Dışı'}
                        </span>
                    </div>
                    <p className="description">
                        {enabled
                            ? 'Hesabınız iki faktörlü doğrulama ile korunuyor.'
                            : 'Hesabınızı daha güvenli hale getirmek için 2FA etkinleştirin.'}
                    </p>
                    <button
                        className={`btn ${enabled ? 'btn-danger' : 'btn-primary'}`}
                        onClick={enabled ? disable2FA : startSetup}
                        disabled={loading}
                    >
                        {loading && <Loader2 className="spinner" size={16} />}
                        {enabled ? 'Devre Dışı Bırak' : '2FA Etkinleştir'}
                    </button>
                </div>
            ) : (
                <div className="setup-section">
                    <div className="qr-container">
                        <QrCode size={24} />
                        <h4>QR Kodu Tarayın</h4>
                        <p>Google Authenticator veya benzeri bir uygulama kullanın</p>
                        {qrCode && <img src={qrCode} alt="2FA QR Code" className="qr-image" />}
                        {secret && (
                            <div className="secret-code">
                                <span>Manuel giriş:</span>
                                <code>{secret}</code>
                            </div>
                        )}
                    </div>

                    <div className="verify-section">
                        <label>Doğrulama Kodu</label>
                        <input
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                            className="verify-input"
                        />
                        <div className="button-group">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setSetupMode(false)}
                                disabled={loading}
                            >
                                İptal
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={verifyAndEnable}
                                disabled={loading || verifyCode.length !== 6}
                            >
                                {loading && <Loader2 className="spinner" size={16} />}
                                Doğrula ve Etkinleştir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .two-factor-setup {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    border: 1px solid var(--gray-200);
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                    color: var(--gray-900);
                }

                .section-header h3 {
                    margin: 0;
                    font-size: 1rem;
                    font-weight: 600;
                }

                .alert {
                    padding: 0.75rem 1rem;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                    font-size: 0.875rem;
                }

                .alert-error {
                    background: var(--danger-50);
                    color: var(--danger-700);
                    border: 1px solid var(--danger-200);
                }

                .alert-success {
                    background: var(--success-50);
                    color: var(--success-700);
                    border: 1px solid var(--success-200);
                }

                .status-section {
                    text-align: center;
                }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.375rem;
                    padding: 0.375rem 0.75rem;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .status-badge.active {
                    background: var(--success-100);
                    color: var(--success-700);
                }

                .status-badge.inactive {
                    background: var(--gray-100);
                    color: var(--gray-600);
                }

                .description {
                    color: var(--gray-600);
                    margin: 1rem 0;
                    font-size: 0.875rem;
                }

                .qr-container {
                    text-align: center;
                    padding: 1rem;
                    background: var(--gray-50);
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }

                .qr-container h4 {
                    margin: 0.5rem 0 0.25rem;
                    font-size: 0.875rem;
                }

                .qr-container p {
                    margin: 0 0 1rem;
                    font-size: 0.75rem;
                    color: var(--gray-500);
                }

                .qr-image {
                    width: 180px;
                    height: 180px;
                    border-radius: 8px;
                }

                .secret-code {
                    margin-top: 1rem;
                    font-size: 0.75rem;
                }

                .secret-code code {
                    display: block;
                    margin-top: 0.25rem;
                    padding: 0.5rem;
                    background: white;
                    border-radius: 4px;
                    font-family: monospace;
                    word-break: break-all;
                }

                .verify-section label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: var(--gray-600);
                    margin-bottom: 0.5rem;
                }

                .verify-input {
                    width: 100%;
                    padding: 0.75rem;
                    font-size: 1.5rem;
                    text-align: center;
                    letter-spacing: 0.5rem;
                    border: 1px solid var(--gray-300);
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }

                .button-group {
                    display: flex;
                    gap: 0.5rem;
                }

                .button-group .btn {
                    flex: 1;
                }

                :global(.spinner) {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
