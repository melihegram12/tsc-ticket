'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Ticket,
  LayoutDashboard,
  Plus,
  List,
  MessageSquare,
  FileText,
  Settings,
  Users,
  Building2,
  BarChart3,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  BookOpen,
  Package,
  FileSearch,
  Zap,
  Mail,
  Trello,
} from 'lucide-react';
import ChatWidget from '@/components/chat/ChatWidget';
import NotificationCenter from '@/components/NotificationCenter';
import ThemeToggle from '@/components/ThemeToggle';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Yeni Talep', href: '/dashboard/tickets/new', icon: <Plus size={20} /> },
  { label: 'Talepler', href: '/dashboard/tickets', icon: <List size={20} /> },
  { label: 'Kanban', href: '/dashboard/tickets/kanban', icon: <Trello size={20} />, permission: 'ticket.update' },
  { label: 'Canlı Destek', href: '/dashboard/chat', icon: <MessageSquare size={20} /> },
  { label: 'Bilgi Bankası', href: '/dashboard/kb', icon: <BookOpen size={20} /> },
  { label: 'Varlıklar', href: '/dashboard/assets', icon: <Package size={20} /> },
];

const adminItems: NavItem[] = [
  { label: 'Raporlar', href: '/dashboard/reports', icon: <BarChart3 size={20} />, permission: 'report.view' },
  { label: 'Kullanıcılar', href: '/dashboard/admin/users', icon: <Users size={20} />, permission: 'admin.users' },
  { label: 'Departmanlar', href: '/dashboard/admin/departments', icon: <Building2 size={20} />, permission: 'admin.departments' },
  { label: 'E-posta Ayarları', href: '/dashboard/admin/email', icon: <Mail size={20} />, permission: 'admin.email' },
  { label: 'Otomasyon', href: '/dashboard/admin/automation', icon: <Zap size={20} />, permission: 'admin.automation' },
  { label: 'Denetim Logları', href: '/dashboard/admin/audit', icon: <FileSearch size={20} />, permission: 'admin.audit' },
  { label: 'Ayarlar', href: '/dashboard/admin/settings', icon: <Settings size={20} />, permission: 'admin.settings' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (status === 'loading') {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Yükleniyor...</p>
        <style jsx>{`
          .loading-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            background: var(--gray-50);
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--gray-200);
            border-top-color: var(--primary-500);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          p {
            color: var(--gray-500);
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  if (!session) return null;

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    return session.user.permissions.includes(permission) || session.user.role === 'Admin';
  };

  const filteredNavItems = navItems.filter(item => hasPermission(item.permission));
  const filteredAdminItems = adminItems.filter(item => hasPermission(item.permission));

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link href="/dashboard" className="logo">
            <div className="logo-icon">
              <Ticket size={24} />
            </div>
            <span className="logo-text">Malhotra Helpdesk</span>
          </Link>
          <button
            className="close-btn"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            {filteredNavItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="nav-icon">
                  {item.icon}
                </div>
                <span>{item.label}</span>
                {pathname === item.href && <div className="active-indicator" />}
              </Link>
            ))}
          </div>

          {filteredAdminItems.length > 0 && (
            <div className="nav-section admin-section">
              <span className="nav-section-title">Yönetim</span>
              {filteredAdminItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${pathname?.startsWith(item.href) ? 'active' : ''}`}
                  style={{ animationDelay: `${(index + 5) * 0.05}s` }}
                >
                  <div className="nav-icon admin-icon">
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                  {pathname?.startsWith(item.href) && <div className="active-indicator" />}
                </Link>
              ))}
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar avatar-md">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{session.user.name}</span>
              <span className="user-role">{session.user.role === 'Admin' ? 'Yönetici' : session.user.role === 'Agent' ? 'Destek Uzmanı' : session.user.role === 'Supervisor' ? 'Takım Lideri' : 'Personel'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-wrapper">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button
              className="menu-btn"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>

          <div className="header-right">
            <ThemeToggle />
            <NotificationCenter />

            <div className="user-menu-wrapper">
              <button
                className="user-menu-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="avatar avatar-sm">
                  {session.user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="user-menu-name">{session.user.name}</span>
                <ChevronDown size={16} />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="user-menu-overlay"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="user-menu">
                    <div className="user-menu-header">
                      <strong>{session.user.name}</strong>
                      <span>{session.user.email}</span>
                    </div>
                    <div className="user-menu-items">
                      <Link href="/dashboard/profile" className="user-menu-item">
                        <FileText size={16} />
                        Profil
                      </Link>
                      <button
                        className="user-menu-item logout"
                        onClick={handleLogout}
                      >
                        <LogOut size={16} />
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="main-content">
          {children}
        </main>
      </div>

      {/* Chat Widget for Requesters */}
      <ChatWidget />

      <style jsx>{`
        .dashboard-layout {
          display: flex;
          min-height: 100vh;
          background: #000;
        }

        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          z-index: 40;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          background: #0a0a0a;
          border-right: 1px solid #1a1a1a;
          display: flex;
          flex-direction: column;
          z-index: 50;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 1.25rem;
          border-bottom: 1px solid #1a1a1a;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          text-decoration: none;
          color: #fff;
          transition: all 0.3s ease;
        }

        .logo:hover {
          transform: scale(1.02);
        }

        .logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #06b6d4, #10b981);
          color: #000;
          border-radius: 14px;
          box-shadow: 0 8px 24px rgba(6, 182, 212, 0.35);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .logo:hover .logo-icon {
          transform: rotate(-8deg) scale(1.08);
          box-shadow: 0 12px 28px rgba(6, 182, 212, 0.45);
        }

        .logo-text {
          font-weight: 800;
          font-size: 1.25rem;
          background: linear-gradient(90deg, #06b6d4, #10b981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.01em;
        }

        @supports not (-webkit-background-clip: text) {
          .logo-text {
            background: none;
            -webkit-text-fill-color: #06b6d4;
            color: #06b6d4;
          }
        }

        .close-btn {
          display: none;
          background: none;
          border: none;
          color: #525252;
          cursor: pointer;
          padding: 0.5rem;
        }

        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem 0.875rem;
        }

        .nav-section {
          margin-bottom: 0.75rem;
        }

        .admin-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #1a1a1a;
        }

        .nav-section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #06b6d4;
          padding: 0.5rem 0.875rem;
          margin-bottom: 0.375rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.875rem 1rem;
          border-radius: 12px;
          color: #737373;
          text-decoration: none;
          font-size: 0.9375rem;
          font-weight: 500;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          margin-bottom: 0.375rem;
          animation: slideIn 0.4s ease-out both;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(6, 182, 212, 0.1);
          color: #06b6d4;
          transition: all 0.25s ease;
        }

        .nav-icon.admin-icon {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .nav-item:hover {
          background: #1a1a1a;
          color: #a3a3a3;
          transform: translateX(4px);
        }

        .nav-item:hover .nav-icon {
          background: rgba(6, 182, 212, 0.2);
          transform: scale(1.05);
        }

        .nav-item:hover .nav-icon.admin-icon {
          background: rgba(245, 158, 11, 0.2);
        }

        .nav-item.active {
          background: linear-gradient(135deg, #06b6d4, #10b981);
          color: #000;
          box-shadow: 0 8px 24px rgba(6, 182, 212, 0.35);
        }

        .nav-item.active .nav-icon {
          background: rgba(0, 0, 0, 0.2);
          color: #000;
        }

        .nav-item.active .nav-icon.admin-icon {
          background: rgba(0, 0, 0, 0.2);
          color: #000;
        }

        .nav-item.active:hover {
          transform: translateX(4px);
          box-shadow: 0 10px 28px rgba(6, 182, 212, 0.45);
        }

        .active-indicator {
          position: absolute;
          right: 12px;
          width: 6px;
          height: 6px;
          background: #000;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }

        .sidebar-footer {
          padding: 1.25rem;
          border-top: 1px solid #1a1a1a;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-details {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-weight: 500;
          font-size: 0.875rem;
          color: #fff;
        }

        .user-role {
          font-size: 0.75rem;
          color: #525252;
        }

        .main-wrapper {
          flex: 1;
          margin-left: var(--sidebar-width);
          display: flex;
          flex-direction: column;
        }

        .header {
          height: var(--header-height);
          background: #0a0a0a;
          border-bottom: 1px solid #1a1a1a;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          position: sticky;
          top: 0;
          z-index: 30;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .menu-btn {
          display: none;
          background: none;
          border: none;
          color: #525252;
          cursor: pointer;
          padding: 0.5rem;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .header-btn {
          position: relative;
          background: none;
          border: none;
          color: #525252;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.375rem;
        }

        .header-btn:hover {
          background: #1a1a1a;
          color: #fff;
        }

        .notification-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 16px;
          height: 16px;
          background: var(--danger-500);
          color: white;
          font-size: 0.625rem;
          font-weight: 600;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-menu-wrapper {
          position: relative;
        }

        .user-menu-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: 1px solid #262626;
          border-radius: 0.5rem;
          padding: 0.375rem 0.75rem;
          cursor: pointer;
          color: #a3a3a3;
        }

        .user-menu-btn:hover {
          background: #1a1a1a;
          color: #fff;
        }

        .user-menu-name {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .user-menu-overlay {
          position: fixed;
          inset: 0;
          z-index: 40;
        }

        .user-menu {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          width: 240px;
          background: #0a0a0a;
          border: 1px solid #262626;
          border-radius: 0.5rem;
          box-shadow: var(--shadow-lg);
          z-index: 50;
          overflow: hidden;
        }

        .user-menu-header {
          padding: 1rem;
          background: #111;
          border-bottom: 1px solid #262626;
          display: flex;
          flex-direction: column;
        }

        .user-menu-header strong {
          font-size: 0.875rem;
          color: #fff;
        }

        .user-menu-header span {
          font-size: 0.75rem;
          color: #525252;
        }

        .user-menu-items {
          padding: 0.5rem;
        }

        .user-menu-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.625rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          color: #a3a3a3;
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
        }

        .user-menu-item:hover {
          background: #1a1a1a;
          color: #fff;
        }

        .user-menu-item.logout {
          color: #f87171;
        }

        .user-menu-item.logout:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .main-content {
          flex: 1;
          padding: 1.5rem;
        }

        @media (max-width: 768px) {
          .sidebar-overlay {
            display: block;
          }

          .sidebar {
            transform: translateX(-100%);
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .close-btn {
            display: flex;
          }

          .main-wrapper {
            margin-left: 0;
          }

          .menu-btn {
            display: flex;
          }

          .user-menu-name {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
