'use client';

import { ReactNode } from 'react';
import { Loader2, GripVertical, X, Settings } from 'lucide-react';

interface WidgetProps {
    title: string;
    icon?: ReactNode;
    children: ReactNode;
    loading?: boolean;
    onRemove?: () => void;
    onSettings?: () => void;
    className?: string;
    editMode?: boolean;
}

export default function Widget({
    title,
    icon,
    children,
    loading = false,
    onRemove,
    onSettings,
    className = '',
    editMode = false,
}: WidgetProps) {
    return (
        <div className={`widget ${className} ${editMode ? 'edit-mode' : ''}`}>
            <div className="widget-header">
                {editMode && (
                    <div className="drag-handle">
                        <GripVertical size={16} />
                    </div>
                )}
                <div className="widget-title">
                    {icon && <span className="widget-icon">{icon}</span>}
                    <h3>{title}</h3>
                </div>
                <div className="widget-actions">
                    {onSettings && (
                        <button className="widget-btn" onClick={onSettings} title="Ayarlar">
                            <Settings size={14} />
                        </button>
                    )}
                    {editMode && onRemove && (
                        <button className="widget-btn remove" onClick={onRemove} title="Kaldır">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>
            <div className="widget-body">
                {loading ? (
                    <div className="widget-loading">
                        <Loader2 className="spin" size={20} />
                    </div>
                ) : (
                    children
                )}
            </div>

            <style jsx>{`
                .widget {
                    background: white;
                    border-radius: 0.75rem;
                    border: 1px solid var(--gray-200);
                    overflow: hidden;
                    transition: all 0.2s ease;
                }

                .widget.edit-mode {
                    border: 2px dashed var(--primary-300);
                    cursor: move;
                }

                .widget.edit-mode:hover {
                    border-color: var(--primary-500);
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
                }

                .widget-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.875rem 1rem;
                    border-bottom: 1px solid var(--gray-100);
                    background: var(--gray-50);
                }

                .drag-handle {
                    color: var(--gray-400);
                    cursor: grab;
                }

                .drag-handle:active {
                    cursor: grabbing;
                }

                .widget-title {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    flex: 1;
                }

                .widget-icon {
                    color: var(--primary-500);
                    display: flex;
                }

                .widget-title h3 {
                    margin: 0;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: var(--gray-800);
                }

                .widget-actions {
                    display: flex;
                    gap: 0.25rem;
                }

                .widget-btn {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    background: transparent;
                    color: var(--gray-400);
                    border-radius: 0.25rem;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .widget-btn:hover {
                    background: var(--gray-200);
                    color: var(--gray-600);
                }

                .widget-btn.remove:hover {
                    background: var(--danger-100);
                    color: var(--danger-600);
                }

                .widget-body {
                    padding: 1rem;
                    min-height: 100px;
                }

                .widget-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 80px;
                    color: var(--gray-400);
                }

                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
