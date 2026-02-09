'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Ticket } from '@prisma/client';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface TicketCardProps {
    ticket: Ticket & {
        requester: { name: string };
        assignedTo?: { name: string } | null;
    };
}

export function TicketCard({ ticket }: TicketCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: ticket.id,
        data: {
            type: 'Ticket',
            ticket,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const priorityColors = {
        URGENT: 'bg-red-100 text-red-800 border-red-200',
        HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
        NORMAL: 'bg-blue-100 text-blue-800 border-blue-200',
        LOW: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-grab hover:shadow-md transition-shadow mb-3"
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-gray-500">{ticket.ticketNumber}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${priorityColors[ticket.priority] || 'bg-gray-100'}`}>
                    {ticket.priority}
                </span>
            </div>

            <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                {ticket.subject}
            </h4>

            <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                        {ticket.requester.name.charAt(0)}
                    </div>
                    <span className="truncate max-w-[80px]">{ticket.requester.name}</span>
                </div>
                <span>
                    {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: tr })}
                </span>
            </div>
        </div>
    );
}
