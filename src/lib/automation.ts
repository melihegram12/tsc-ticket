import prisma from './prisma';

export type TriggerEvent = 'TICKET_CREATED' | 'TICKET_UPDATED' | 'HOURLY_CHECK';

export class AutomationService {

    /**
     * Evaluate rules for a specific trigger event and context
     */
    static async evaluateRules(trigger: TriggerEvent, context: any) {
        console.log(`Evaluating rules for ${trigger}`, context.ticketId);

        // Fetch active rules for this trigger
        // For MVP we hardcode some example logic or fetch from DB if we had a table
        // But since we don't have an AutomationRule table yet, let's implement hardcoded rules
        // representing what the dynamic engine would do.

        /*
          Example Rules we want to support:
          1. IF Subject contains "Fatura" THEN Assign to "Muhasebe" Dept & Set Priority HIGH
          2. IF Created by VIP Domain "@vipclient.com" THEN Set Priority URGENT
          3. IF Status is PENDING for > 3 days THEN Auto-Close (HOURLY_CHECK)
        */

        if (trigger === 'TICKET_CREATED' || trigger === 'TICKET_UPDATED') {
            await this.rule_AutoAssignDepartment(context.ticketId);
            await this.rule_VipPriority(context.ticketId);
        }

        if (trigger === 'HOURLY_CHECK') {
            await this.rule_AutoCloseOldTickets();
        }
    }

    // Rule 1: Keyword based assignment
    private static async rule_AutoAssignDepartment(ticketId: number) {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { department: true }
        });

        if (!ticket) return;

        // Example: "Fatura" -> Muhasebe (assuming we have ID for it, or we search)
        // This is pseudo-code for the logic
        if (ticket.subject.toLowerCase().includes('fatura')) {
            // Find Muhasebe department
            const dept = await prisma.department.findFirst({ where: { name: 'Muhasebe' } });
            if (dept && ticket.departmentId !== dept.id) {
                await prisma.ticket.update({
                    where: { id: ticket.id },
                    data: {
                        departmentId: dept.id,
                        // Log event
                        events: {
                            create: {
                                eventType: 'AUTOMATION',
                                newValue: 'Otomatik olarak Muhasebe departmanına atandı (Fatura kuralı)',
                                actorId: 1 // System
                            }
                        }
                    }
                });
                console.log(`Automation: Assigned ticket ${ticketId} to Muhasebe`);
            }
        }
    }

    // Rule 2: VIP Domain
    private static async rule_VipPriority(ticketId: number) {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { requester: true }
        });

        if (!ticket) return;

        if (ticket.requester.email.endsWith('@vipclient.com') && ticket.priority !== 'URGENT') {
            await prisma.ticket.update({
                where: { id: ticket.id },
                data: {
                    priority: 'URGENT',
                    events: {
                        create: {
                            eventType: 'AUTOMATION',
                            newValue: 'VIP Müşteri kuralı ile ACİL öncelik atandı',
                            actorId: 1
                        }
                    }
                }
            });
            console.log(`Automation: Set VIP priority for ticket ${ticketId}`);
        }
    }

    // Rule 3: Auto-close old pending tickets
    private static async rule_AutoCloseOldTickets() {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const pendingTickets = await prisma.ticket.findMany({
            where: {
                status: 'PENDING',
                updatedAt: { lte: threeDaysAgo }
            }
        });

        for (const ticket of pendingTickets) {
            await prisma.ticket.update({
                where: { id: ticket.id },
                data: {
                    status: 'RESOLVED',
                    events: {
                        create: {
                            eventType: 'AUTOMATION',
                            newValue: '3 gün işlem yapılmadığı için otomatik çözüldü',
                            actorId: 1
                        }
                    }
                }
            });
            console.log(`Automation: Auto-resolved old pending ticket ${ticket.id}`);
        }
    }
}
