'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Ticket, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        email,
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
        {/* Left side - Branding */}
        <div className="login-branding">
          <div className="branding-content">
            <div className="logo-wrapper">
              <div className="logo-icon">
                <Ticket size={40} />
              </div>
              <h1>TSC Helpdesk</h1>
            </div>
            <p className="tagline">Şirket İçi Destek Sistemi</p>
            <div className="features">
              <div className="feature">
                <span className="feature-icon">🎫</span>
                <span>Ticket Yönetimi</span>
              </div>
              <div className="feature">
                <span className="feature-icon">⏱️</span>
                <span>SLA Takibi</span>
              </div>
              <div className="feature">
                <span className="feature-icon">💬</span>
                <span>Canlı Destek</span>
              </div>
              <div className="feature">
                <span className="feature-icon">📊</span>
                <span>Raporlama</span>
              </div>
            </div>
          </div>
          <div className="branding-bg"></div>
        </div>

        {/* Right side - Login Form */}
        <div className="login-form-wrapper">
          <div className="login-form-container">
            <div className="form-header">
              <h2>Hoş Geldiniz</h2>
              <p>Devam etmek için giriş yapın</p>
            </div>

            {error && (
              <div className="error-alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">E-posta</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    id="email"
                    type="email"
                    className="input"
                    placeholder="ornek@sirket.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Şifre</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Beni hatırla</span>
                </label>
                <a href="#" className="forgot-link">Şifremi unuttum</a>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg submit-btn"
                disabled={loading}
              >
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

            <div className="demo-credentials">
              <p>Demo Giriş Bilgileri:</p>
              <code>admin@tsc.local / admin123</code>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gray-100);
          padding: 1rem;
        }

        .login-container {
          display: flex;
          width: 100%;
          max-width: 1000px;
          min-height: 600px;
          background: white;
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          overflow: hidden;
        }

        .login-branding {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
          color: white;
          overflow: hidden;
        }

        .branding-content {
          position: relative;
          z-index: 1;
        }

        .branding-bg {
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        .logo-wrapper {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
        }

        .logo-wrapper h1 {
          font-size: 2rem;
          font-weight: 700;
          margin: 0;
        }

        .tagline {
          font-size: 1.125rem;
          opacity: 0.9;
          margin: 0 0 2.5rem 0;
        }

        .features {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          font-size: 0.9rem;
        }

        .feature-icon {
          font-size: 1.25rem;
        }

        .login-form-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem;
        }

        .login-form-container {
          width: 100%;
          max-width: 360px;
        }

        .form-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .form-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--gray-900);
          margin: 0 0 0.5rem 0;
        }

        .form-header p {
          color: var(--gray-500);
          margin: 0;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--danger-50);
          color: var(--danger-600);
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--gray-700);
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray-400);
        }

        .input-wrapper .input {
          padding-left: 2.75rem;
          padding-right: 2.75rem;
        }

        .password-toggle {
          position: absolute;
          right: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--gray-400);
          cursor: pointer;
          padding: 0;
          display: flex;
        }

        .password-toggle:hover {
          color: var(--gray-600);
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--gray-600);
          cursor: pointer;
        }

        .checkbox-label input {
          width: 16px;
          height: 16px;
          accent-color: var(--primary-500);
        }

        .forgot-link {
          color: var(--primary-600);
          text-decoration: none;
        }

        .forgot-link:hover {
          text-decoration: underline;
        }

        .submit-btn {
          width: 100%;
          margin-top: 0.5rem;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid transparent;
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .demo-credentials {
          margin-top: 2rem;
          padding: 1rem;
          background: var(--gray-50);
          border-radius: 0.5rem;
          text-align: center;
        }

        .demo-credentials p {
          font-size: 0.75rem;
          color: var(--gray-500);
          margin: 0 0 0.5rem 0;
        }

        .demo-credentials code {
          font-size: 0.8rem;
          color: var(--gray-700);
          background: white;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
        }

        @media (max-width: 768px) {
          .login-container {
            flex-direction: column;
            min-height: auto;
          }

          .login-branding {
            padding: 2rem;
          }

          .features {
            grid-template-columns: 1fr;
          }

          .login-form-wrapper {
            padding: 2rem;
          }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
