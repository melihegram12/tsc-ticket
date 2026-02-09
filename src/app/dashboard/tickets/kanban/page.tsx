'use client';

import { useEffect, useState } from 'react';
import Board from '@/components/kanban/Board';
import { Loader2 } from 'lucide-react';

export default function KanbanPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await fetch('/api/tickets?pageSize=100'); // Fetch enough tickets for board
            const data = await res.json();
            setTickets(data.data || []);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            <div className="mb-4 flex justify-between items-center px-1">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kanban Board</h1>
                    <p className="text-sm text-gray-500">Ticket durumlarını sürükle-bırak ile yönetin</p>
                </div>
                <button
                    onClick={fetchTickets}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    title="Yenile"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6"/><path d="M2.5 22v-6h6"/><path d="M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8"/><path d="M22 12.5a10 10 0 0 1-18.8 4.2L2.5 16"/></svg>
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <div className="flex-1 overflow-hidden">
                    <Board initialTickets={tickets} />
                </div>
            )}
        </div>
    );
}
