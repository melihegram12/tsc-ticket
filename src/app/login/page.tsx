'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Shield, Sparkles } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('SKIP_PASSWORD_CHECK_FOR_REQUESTER');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: password === 'SKIP_PASSWORD_CHECK_FOR_REQUESTER' ? 'calisan@tsc.local' : email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Giriş yapılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Brand */}
        <div className="brand">
          <h1>
            <span className="text-white">Malhotra</span>
            <span className="text-gradient"> Helpdesk.</span>
          </h1>
          <p>Şirket İçi Destek Sistemi</p>
        </div>

        {/* Login Form */}
        <div className="form-card">
          {/* Login Type Tabs */}
          <div className="tabs">
            <button
              className={`tab ${password !== 'SKIP_PASSWORD_CHECK_FOR_REQUESTER' ? 'active' : ''}`}
              onClick={() => { setPassword(''); setError(''); }}
            >
              <Shield size={16} />
              Yönetici / Destek
            </button>
            <button
              className={`tab ${password === 'SKIP_PASSWORD_CHECK_FOR_REQUESTER' ? 'active' : ''}`}
              onClick={() => { setPassword('SKIP_PASSWORD_CHECK_FOR_REQUESTER'); setError(''); }}
            >
              <Sparkles size={16} />
              Personel
            </button>
          </div>

          {error && (
            <div className="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {password !== 'SKIP_PASSWORD_CHECK_FOR_REQUESTER' && (
              <>
                <div className="input-group">
                  <label>E-posta</label>
                  <div className="input-wrapper">
                    <Mail size={18} />
                    <input
                      type="email"
                      placeholder="ornek@sirket.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Şifre</label>
                  <div className="input-wrapper">
                    <Lock size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="toggle-pw"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {password === 'SKIP_PASSWORD_CHECK_FOR_REQUESTER' && (
              <div className="info-box">
                Personel girişi için bilgilerinize gerek yoktur.
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Giriş yapılıyor...
                </>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>
        </div>

        <div className="footer">
          © 2026 Malhotra Kablo
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .login-container {
          width: 100%;
          max-width: 400px;
          animation: fadeIn 0.6s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .brand {
          text-align: center;
          margin-bottom: 3rem;
        }

        .brand h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
          letter-spacing: -0.02em;
        }

        .text-white {
          color: #fff;
        }

        .text-gradient {
          background: linear-gradient(90deg, #06b6d4, #10b981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .brand p {
          color: #525252;
          font-size: 0.9rem;
          margin: 0;
        }

        .form-card {
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          border-radius: 16px;
          padding: 1.5rem;
        }

        .tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: transparent;
          border: 1px solid #262626;
          border-radius: 8px;
          color: #737373;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab:hover {
          border-color: #404040;
          color: #a3a3a3;
        }

        .tab.active {
          background: linear-gradient(135deg, #06b6d4, #10b981);
          border-color: transparent;
          color: #000;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px;
          color: #f87171;
          font-size: 0.8125rem;
          margin-bottom: 1rem;
        }

        .info-box {
          padding: 1rem;
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.2);
          border-radius: 8px;
          color: #22d3ee;
          font-size: 0.8125rem;
          text-align: center;
          margin-bottom: 1rem;
        }

        .input-group {
          margin-bottom: 1rem;
        }

        .input-group label {
          display: block;
          color: #a3a3a3;
          font-size: 0.8125rem;
          margin-bottom: 0.5rem;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-wrapper > :global(svg:first-child) {
          position: absolute;
          left: 0.875rem;
          color: #525252;
          pointer-events: none;
        }

        .input-wrapper input {
          width: 100%;
          padding: 0.75rem 0.875rem 0.75rem 2.75rem;
          background: #000;
          border: 1px solid #262626;
          border-radius: 8px;
          color: #fff;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .input-wrapper input::placeholder {
          color: #525252;
        }

        .input-wrapper input:focus {
          outline: none;
          border-color: #06b6d4;
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
        }

        .toggle-pw {
          position: absolute;
          right: 0.75rem;
          background: none;
          border: none;
          color: #525252;
          cursor: pointer;
          padding: 0;
          display: flex;
        }

        .toggle-pw:hover {
          color: #a3a3a3;
        }

        .submit-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem;
          background: linear-gradient(90deg, #06b6d4, #10b981);
          border: none;
          border-radius: 8px;
          color: #000;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .footer {
          text-align: center;
          margin-top: 2rem;
          color: #404040;
          font-size: 0.75rem;
        }

        @media (max-width: 480px) {
          .brand h1 {
            font-size: 2rem;
          }
          
          .tab {
            font-size: 0.75rem;
            padding: 0.625rem;
          }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#525252' }}>Yükleniyor...</div>}>
      <LoginForm />
    </Suspense>
  );
}
