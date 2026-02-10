// Bu dosya, SQLite geçişi nedeniyle Prisma şemasından kaldırılan Enum'ların yerine geçmesi için oluşturulmuştur.
// Veritabanında bu alanlar artık String olarak tutulmaktadır.

export const TicketStatus = {
  NEW: 'NEW',
  OPEN: 'OPEN',
  WAITING_REQUESTER: 'WAITING_REQUESTER',
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REOPENED: 'REOPENED',
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const TicketPriority = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type TicketPriority = (typeof TicketPriority)[keyof typeof TicketPriority];

export const TicketSource = {
  WEB: 'WEB',
  EMAIL: 'EMAIL',
  API: 'API',
} as const;

export type TicketSource = (typeof TicketSource)[keyof typeof TicketSource];

export const MessageType = {
  PUBLIC_REPLY: 'PUBLIC_REPLY',
  INTERNAL_NOTE: 'INTERNAL_NOTE',
  SYSTEM: 'SYSTEM',
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export const EventType = {
  CREATED: 'CREATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  PRIORITY_CHANGED: 'PRIORITY_CHANGED',
  ASSIGNED: 'ASSIGNED',
  UNASSIGNED: 'UNASSIGNED',
  CATEGORY_CHANGED: 'CATEGORY_CHANGED',
  DEPARTMENT_CHANGED: 'DEPARTMENT_CHANGED',
  TAG_ADDED: 'TAG_ADDED',
  TAG_REMOVED: 'TAG_REMOVED',
  MESSAGE_ADDED: 'MESSAGE_ADDED',
  ATTACHMENT_ADDED: 'ATTACHMENT_ADDED',
  SLA_BREACHED: 'SLA_BREACHED',
  REOPENED: 'REOPENED',
  MERGED: 'MERGED',
  AUTOMATION: 'AUTOMATION',
  SATISFACTION_RATED: 'SATISFACTION_RATED',
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];

export const ChatStatus = {
  WAITING: 'WAITING',
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
} as const;

export type ChatStatus = (typeof ChatStatus)[keyof typeof ChatStatus];

export const NotificationType = {
  TICKET_CREATED: 'TICKET_CREATED',
  TICKET_ASSIGNED: 'TICKET_ASSIGNED',
  TICKET_UPDATED: 'TICKET_UPDATED',
  TICKET_REPLIED: 'TICKET_REPLIED',
  SLA_WARNING: 'SLA_WARNING',
  SLA_BREACH: 'SLA_BREACH',
  CHAT_MESSAGE: 'CHAT_MESSAGE',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
