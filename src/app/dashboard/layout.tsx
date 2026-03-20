'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
    LayoutDashboard, 
    Users, 
    Search, 
    Target, 
    FileText, 
    Send, 
    Settings, 
    LogOut,
    Bell,
    HelpCircle,
    Menu
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const navItems = [
    {
        section: '메인',
        items: [
            { icon: <LayoutDashboard size={18} />, label: '대시보드', href: '/dashboard' },
            { icon: <Users size={18} />, label: '학생 관리', href: '/dashboard/students' },
        ],
    },
    {
        section: '분석',
        items: [
            { icon: <Target size={18} />, label: '합격 예측 비교', href: '/dashboard/admission' },
        ],
    },
    {
        section: '설정',
        items: [
            { icon: <Send size={18} />, label: 'Telegram 연동', href: '/dashboard/telegram' },
            { icon: <Settings size={18} />, label: '설정', href: '/dashboard/settings' },
        ],
    },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isDemo, setIsDemo] = useState(false);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userPhoto, setUserPhoto] = useState('');

    useEffect(() => {
        // 1. Initial load from localStorage (faster)
        const mode = localStorage.getItem('authMode');
        const name = localStorage.getItem('userName');
        const email = localStorage.getItem('userEmail');
        const photo = localStorage.getItem('userPhoto');
        
        setIsDemo(mode === 'demo');
        setUserName(name || (mode === 'demo' ? '데모 컨설턴트' : '정식 컨설턴트'));
        setUserEmail(email || (mode === 'demo' ? 'demo@admitflow.ai' : 'consultant@admitflow.ai'));
        setUserPhoto(photo || '');

        // 2. Real-time update from Firebase Auth
        const unsubscribe = onAuthStateChanged(auth, (user: any) => {
            if (user && mode !== 'demo') {
                setUserName(user.displayName || user.email?.split('@')[0] || '정식 컨설턴트');
                setUserEmail(user.email || '');
                setUserPhoto(user.photoURL || '');
                
                // Update localStorage to keep it in sync
                localStorage.setItem('userName', user.displayName || '');
                localStorage.setItem('userEmail', user.email || '');
                localStorage.setItem('userPhoto', user.photoURL || '');
            }
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = () => {
        if (window.confirm('로그아웃 하시겠습니까?')) {
            localStorage.clear();
            router.push('/');
        }
    };


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
                        background: 'rgba(0,0,0,0.6)',
                        zIndex: 95,
                        backdropFilter: 'blur(4px)',
                    }}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <Link href="/dashboard" className="sidebar-brand" style={{ textDecoration: 'none' }}>
                    <div className="sidebar-brand-icon">AF</div>
                    <span className="sidebar-brand-text">AdmitFlow AI</span>
                </Link>


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
                                        <span className="sidebar-link-icon" style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
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
                                background: userPhoto ? `url(${userPhoto}) center/cover` : 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                                color: 'white',
                                width: 36,
                                height: 36,
                                fontSize: '0.85rem',
                            }}
                        >
                            {!userPhoto && (userName ? userName.charAt(0) : 'C')}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {userName}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {userEmail}
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
                        <Menu size={20} />
                    </button>
                    <h2 className="header-title">
                        {pathname === '/dashboard' && '대시보드'}
                        {pathname === '/dashboard/students' && '학생 관리'}
                        {pathname.startsWith('/dashboard/students/') && '학생 상세'}
                        {pathname === '/dashboard/admission' && '합격 예측 비교'}
                        {pathname === '/dashboard/telegram' && 'Telegram 연동'}
                        {pathname === '/dashboard/settings' && '설정'}
                    </h2>
                </div>

                <div className="header-actions">
                    <button className="btn btn-ghost btn-icon" title="알림">
                        <Bell size={20} />
                    </button>
                    <button className="btn btn-ghost btn-icon" title="도움말">
                        <HelpCircle size={20} />
                    </button>
                    <button className="btn btn-ghost btn-icon" title="로그아웃" onClick={handleLogout} style={{ color: 'var(--danger-400)' }}>
                        <LogOut size={20} />
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
