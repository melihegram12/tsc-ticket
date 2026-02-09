'use client';

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { TicketCard } from './TicketCard';
import { Ticket } from '@prisma/client';

interface KanbanColumnProps {
    id: string;
    title: string;
    tickets: Array<Ticket & {
        requester: { name: string };
        assignedTo?: { name: string } | null;
    }>;
    color: string;
}

export function KanbanColumn({ id, title, tickets, color }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({
        id: id,
    });

    return (
        <div className="flex flex-col h-full min-w-[280px] w-80 bg-gray-50/50 rounded-xl border border-gray-200/60">
            {/* Column Header */}
            <div className={`p-3 border-b border-gray-200 flex items-center justify-between rounded-t-xl ${color} bg-opacity-10`}>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color}`}></div>
                    <h3 className="font-semibold text-gray-700 text-sm">{title}</h3>
                </div>
                <span className="bg-white/50 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full border border-gray-200">
                    {tickets.length}
                </span>
            </div>

            {/* Droppable Area */}
            <div ref={setNodeRef} className="flex-1 p-2 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-hide">
                <SortableContext items={tickets.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tickets.map((ticket) => (
                        <TicketCard key={ticket.id} ticket={ticket} />
                    ))}
                </SortableContext>

                {tickets.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                        Buraya sürükleyin
                    </div>
                )}
            </div>
        </div>
    );
}
