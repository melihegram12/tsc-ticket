'use client';

import { useState, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    closestCorners
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { TicketCard } from './TicketCard';
import { Ticket } from '@prisma/client';

type TicketWithRelations = Ticket & {
    requester: { name: string };
    assignedTo?: { name: string } | null;
};

interface BoardProps {
    initialTickets: TicketWithRelations[];
}

const COLUMNS = [
    { id: 'NEW', title: 'Yeni', color: 'bg-blue-500' },
    { id: 'OPEN', title: 'Açık', color: 'bg-indigo-500' },
    { id: 'PENDING', title: 'Beklemede', color: 'bg-yellow-500' },
    { id: 'RESOLVED', title: 'Çözüldü', color: 'bg-green-500' },
    { id: 'CLOSED', title: 'Kapalı', color: 'bg-gray-500' },
];

export default function Board({ initialTickets }: BoardProps) {
    const [tickets, setTickets] = useState<TicketWithRelations[]>(initialTickets);
    const [activeId, setActiveId] = useState<number | null>(null);

    // Sensors for drag detection
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px movement required to start drag
            },
        })
    );

    // Update local state when tickets prop changes
    useEffect(() => {
        setTickets(initialTickets);
    }, [initialTickets]);

    // Update ticket status via API
    const updateTicketStatus = async (ticketId: number, newStatus: string) => {
        try {
            const response = await fetch(`/api/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) throw new Error('Failed to update status');
        } catch (error) {
            console.error('Error updating ticket status:', error);
            // Optionally revert state here on error
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as number);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        // Determine if over is a column or a ticket
        const isActiveTicket = active.data.current?.type === 'Ticket';
        const isOverTicket = over.data.current?.type === 'Ticket';

        if (!isActiveTicket) return;

        // If dragging over a column
        if (!isOverTicket) {
            const columnId = over.id;
            setTickets((items) => {
                const activeIndex = items.findIndex((t) => t.id === activeId);
                const activeTicket = items[activeIndex];

                // If moving to a different column
                if (activeTicket.status !== columnId) {
                    const newItems = [...items];
                    newItems[activeIndex] = { ...activeTicket, status: columnId as any };
                    return newItems;
                }
                return items;
            });
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as number;
        const overId = over.id;

        // Find the active ticket
        const activeTicket = tickets.find(t => t.id === activeId);
        if (!activeTicket) return;

        // Determine target status
        let targetStatus = activeTicket.status;

        if (COLUMNS.some(c => c.id === overId)) {
            // Dropped directly on a column
            targetStatus = overId as any;
        } else {
            // Dropped on another ticket, find that ticket's status
            const overTicket = tickets.find(t => t.id === overId);
            if (overTicket) {
                targetStatus = overTicket.status;
            }
        }

        // Optimistic UI update already happened in DragOver mostly,
        // but let's ensure final consistency and call API
        if (activeTicket.status !== targetStatus) {
            // Update local state definitively
            setTickets(items => items.map(t =>
                t.id === activeId ? { ...t, status: targetStatus } : t
            ));

            // Call API
            await updateTicketStatus(activeId, targetStatus);
        }
    };

    const activeTicket = activeId ? tickets.find(t => t.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full gap-4 overflow-x-auto pb-4">
                {COLUMNS.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        color={col.color}
                        tickets={tickets.filter((t) => t.status === col.id)}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeTicket ? <TicketCard ticket={activeTicket} /> : null}
            </DragOverlay>
        </DndContext>
    );
}
