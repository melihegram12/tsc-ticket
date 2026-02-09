'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Ticket,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface DashboardStats {
  openTickets: number;
  pendingTickets: number;
  resolvedToday: number;
  slaAtRisk: number;
}

interface RecentTicket {
  id: number;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  requester: { name: string };
}


export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/tickets?pageSize=5');
        const data = await response.json();
        setRecentTickets(data.data || []);

        // Calculate stats from data
        const allResponse = await fetch('/api/tickets?pageSize=1000');
        const allData = await allResponse.json();
        const tickets = allData.data || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        setStats({
          openTickets: tickets.filter((t: RecentTicket) => !['CLOSED', 'RESOLVED'].includes(t.status)).length,
          pendingTickets: tickets.filter((t: RecentTicket) => t.status === 'PENDING' || t.status === 'WAITING_REQUESTER').length,
          resolvedToday: tickets.filter((t: RecentTicket) => t.status === 'RESOLVED' && new Date(t.createdAt) >= today).length,
          slaAtRisk: 0,
        });

        // Fetch real SLA stats
        const slaResponse = await fetch('/api/sla/stats');
        if (slaResponse.ok) {
          const slaData = await slaResponse.json();
          setStats(prev => prev ? {
            ...prev,
            slaAtRisk: slaData.atRisk
          } : null);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      URGENT: 'Acil',
      HIGH: 'Yüksek',
      NORMAL: 'Normal',
      LOW: 'Düşük',
    };
    return labels[priority] || priority;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} dk önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader2 className="spinner" size={32} />
        <p>Yükleniyor...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            gap: 1rem;
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

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>İyi günler</h1>
          <p>Malhotra Helpdesk paneline hoş geldiniz</p>
        </div>
        <Link href="/dashboard/tickets/new" className="btn btn-primary">
          <Ticket size={18} />
          Yeni Talep Oluştur
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon open">
            <Ticket size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.openTickets || 0}</span>
            <span className="stat-label">Açık Talepler</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.pendingTickets || 0}</span>
            <span className="stat-label">Bekleyen</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon resolved">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.resolvedToday || 0}</span>
            <span className="stat-label">Bugün Çözülen</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sla">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.slaAtRisk || 0}</span>
            <span className="stat-label">SLA Riski</span>
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="card">
        <div className="card-header">
          <h2>
            <TrendingUp size={20} />
            Son Talepler
          </h2>
          <Link href="/dashboard/tickets" className="view-all">
            Tümünü Gör
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="card-body">
          {recentTickets.length === 0 ? (
            <div className="empty-state">
              <Ticket size={48} />
              <p>Henüz talep bulunmuyor</p>
              <Link href="/dashboard/tickets/new" className="btn btn-primary btn-sm">
                İlk Talebi Oluştur
              </Link>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Konu</th>
                  <th>Durum</th>
                  <th>Öncelik</th>
                  <th>Tarih</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <Link href={`/dashboard/tickets/${ticket.id}`} className="ticket-number">
                        {ticket.ticketNumber}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/dashboard/tickets/${ticket.id}`} className="ticket-subject">
                        {ticket.subject}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge status-${ticket.status.toLowerCase().replace('_', '-')}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge priority-${ticket.priority.toLowerCase()}`}>
                        {getPriorityLabel(ticket.priority)}
                      </span>
                    </td>
                    <td className="date-cell">{formatDate(ticket.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          max-width: 1200px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .page-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.25rem 0;
        }

        .page-header p {
          color: #525252;
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: #0a0a0a;
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border: 1px solid #1a1a1a;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #06b6d4, #10b981);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(6, 182, 212, 0.15);
        }

        .stat-card:hover::before {
          opacity: 1;
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }

        .stat-card:hover .stat-icon {
          transform: scale(1.1) rotate(-5deg);
        }

        .stat-icon.open {
          background: rgba(6, 182, 212, 0.15);
          color: #06b6d4;
          box-shadow: 0 4px 12px rgba(6, 182, 212, 0.2);
        }

        .stat-icon.pending {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
        }

        .stat-icon.resolved {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
        }

        .stat-icon.sla {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 800;
          color: #fff;
          line-height: 1;
          animation: countIn 0.5s ease-out;
        }

        @keyframes countIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .stat-label {
          font-size: 0.875rem;
          color: #525252;
          margin-top: 0.375rem;
          font-weight: 500;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-header h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .view-all {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          color: #06b6d4;
          text-decoration: none;
          font-weight: 500;
        }

        .view-all:hover {
          text-decoration: underline;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: #525252;
        }

        .empty-state p {
          margin: 1rem 0;
          color: #737373;
        }

        .ticket-number {
          font-family: monospace;
          font-size: 0.8125rem;
          color: #06b6d4;
          text-decoration: none;
          font-weight: 500;
        }

        .ticket-number:hover {
          text-decoration: underline;
        }

        .ticket-subject {
          color: #fff;
          text-decoration: none;
        }

        .ticket-subject:hover {
          color: #06b6d4;
        }

        .date-cell {
          color: #525252;
          font-size: 0.8125rem;
          white-space: nowrap;
        }

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .page-header {
            flex-direction: column;
            gap: 1rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
