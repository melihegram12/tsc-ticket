'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="theme-toggle-wrapper" ref={dropdownRef}>
            <button
                className="theme-toggle-btn"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="Tema seçenekleri"
            >
                {theme === 'dark' ? <Moon size={18} /> : theme === 'light' ? <Sun size={18} /> : <Monitor size={18} />}
            </button>

            {showDropdown && (
                <div className="theme-dropdown">
                    <button
                        className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                        onClick={() => { setTheme('light'); setShowDropdown(false); }}
                    >
                        <Sun size={16} />
                        <span>Açık Tema</span>
                    </button>
                    <button
                        className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                        onClick={() => { setTheme('dark'); setShowDropdown(false); }}
                    >
                        <Moon size={16} />
                        <span>Koyu Tema</span>
                    </button>
                    <button
                        className={`theme-option ${theme === 'system' ? 'active' : ''}`}
                        onClick={() => { setTheme('system'); setShowDropdown(false); }}
                    >
                        <Monitor size={16} />
                        <span>Sistem</span>
                    </button>
                </div>
            )}

            <style jsx>{`
                .theme-toggle-wrapper {
                    position: relative;
                }

                .theme-toggle-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                    background: var(--bg-primary);
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .theme-toggle-btn:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                }

                .theme-dropdown {
                    position: absolute;
                    top: calc(100% + 0.5rem);
                    right: 0;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    min-width: 140px;
                    z-index: 100;
                    padding: 0.25rem;
                    animation: dropIn 0.15s ease-out;
                }

                @keyframes dropIn {
                    from {
                        opacity: 0;
                        transform: translateY(-4px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .theme-option {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    border: none;
                    border-radius: 6px;
                    background: transparent;
                    color: var(--text-secondary);
                    font-size: 0.8125rem;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .theme-option:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                }

                .theme-option.active {
                    background: var(--primary-50);
                    color: var(--primary-600);
                }
            `}</style>
        </div>
    );
}
