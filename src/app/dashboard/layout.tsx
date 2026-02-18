'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    {
        section: '메인',
        items: [
            { icon: '📊', label: '대시보드', href: '/dashboard' },
            { icon: '👨‍🎓', label: '학생 관리', href: '/dashboard/students' },
        ],
    },
    {
        section: '분석',
        items: [
            { icon: '🔍', label: 'AI 검색', href: '/dashboard/search' },
            { icon: '📈', label: '성적 분석', href: '/dashboard/analytics' },
            { icon: '🎯', label: '합격 예측 비교', href: '/dashboard/admission' },
        ],
    },
    {
        section: '보고서',
        items: [
            { icon: '📋', label: '보고서 관리', href: '/dashboard/reports' },
        ],
    },
    {
        section: '설정',
        items: [
            { icon: '📱', label: 'Telegram 연동', href: '/dashboard/telegram' },
            { icon: '⚙️', label: '설정', href: '/dashboard/settings' },
        ],
    },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="app-layout">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 99,
                        display: 'none',
                    }}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">AF</div>
                    <span className="sidebar-brand-text">AdmitFlow AI</span>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((section) => (
                        <div key={section.section}>
                            <div className="sidebar-section-title">{section.section}</div>
                            {section.items.map((item) => {
                                const isActive =
                                    pathname === item.href ||
                                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`sidebar-link ${isActive ? 'active' : ''}`}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <span className="sidebar-link-icon">{item.icon}</span>
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div
                    style={{
                        padding: 'var(--space-md)',
                        borderTop: '1px solid var(--border-color)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-sm)',
                            padding: 'var(--space-sm)',
                        }}
                    >
                        <div
                            className="avatar"
                            style={{
                                background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                                color: 'white',
                                width: 36,
                                height: 36,
                                fontSize: '0.85rem',
                            }}
                        >
                            DC
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                데모 컨설턴트
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                demo@admitflow.ai
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Header */}
            <header className="header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <button
                        className="btn btn-ghost btn-icon mobile-menu-btn"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{ display: 'none' }}
                    >
                        ☰
                    </button>
                    <h2 className="header-title">
                        {pathname === '/dashboard' && '대시보드'}
                        {pathname === '/dashboard/students' && '학생 관리'}
                        {pathname.startsWith('/dashboard/students/') && '학생 상세'}
                        {pathname === '/dashboard/search' && 'AI 검색'}
                        {pathname === '/dashboard/analytics' && '성적 분석'}
                        {pathname === '/dashboard/admission' && '합격 예측 비교'}
                        {pathname === '/dashboard/reports' && '보고서 관리'}
                        {pathname === '/dashboard/telegram' && 'Telegram 연동'}
                        {pathname === '/dashboard/settings' && '설정'}
                    </h2>
                </div>

                <div className="header-actions">
                    <button className="btn btn-ghost btn-icon" title="알림">
                        🔔
                    </button>
                    <button className="btn btn-ghost btn-icon" title="도움말">
                        ❓
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                <div className="page-container">{children}</div>
            </main>

            <style jsx>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex !important;
          }
          .sidebar-overlay {
            display: block !important;
          }
        }
      `}</style>
        </div>
    );
}
