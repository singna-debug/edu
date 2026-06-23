'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Cloud, FileText, Database, Download, RefreshCw, Trash2, Brain, Loader2, Mail } from 'lucide-react';
import { consultantService, ManagerData } from '@/lib/services/consultantService';

export default function SettingsPage() {
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userRole, setUserRole] = useState<'consultant' | 'manager'>('consultant');

    // Manager Management State
    const [managers, setManagers] = useState<ManagerData[]>([]);
    const [newManagerEmail, setNewManagerEmail] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isLoadingManagers, setIsLoadingManagers] = useState(false);
    const [pendingConsultants, setPendingConsultants] = useState<any[]>([]);
    const [isLoadingPending, setIsLoadingPending] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [hasDriveToken, setHasDriveToken] = useState<boolean | null>(null);
    const [hasRefreshToken, setHasRefreshToken] = useState<boolean>(false);

    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const fetchPendingConsultants = useCallback(async () => {
        const role = localStorage.getItem('role');
        if (role !== 'consultant') return;

        setIsLoadingPending(true);
        try {
            const data = await consultantService.getPendingConsultants();
            setPendingConsultants(data);
        } catch (error) {
            console.error("Error fetching pending consultants:", error);
        } finally {
            setIsLoadingPending(false);
        }
    }, []);

    const fetchManagers = useCallback(async () => {
        const userId = localStorage.getItem('userId');
        const role = localStorage.getItem('role') as 'consultant' | 'manager';
        if (role === 'manager' || !userId) return;

        setIsLoadingManagers(true);
        try {
            const data = await consultantService.getManagers(userId);
            setManagers(data);
        } catch (error) {
            console.error("Error fetching managers:", error);
        } finally {
            setIsLoadingManagers(false);
        }
    }, []);

    useEffect(() => {
        const mode = localStorage.getItem('authMode');
        const name = localStorage.getItem('userName');
        const email = localStorage.getItem('userEmail');
        const role = (localStorage.getItem('role') as 'consultant' | 'manager') || 'consultant';
        const userId = localStorage.getItem('userId');
        const parentId = localStorage.getItem('parentId');

        setUserName(name || (mode === 'demo' ? '데모 컨설턴트' : '정식 컨설턴트'));
        setUserEmail(email || (mode === 'demo' ? 'demo@eduflow.ai' : 'consultant@eduflow.ai'));
        setUserRole(role);

        if (role === 'consultant') {
            fetchManagers();
            fetchPendingConsultants();
        }

        const targetId = role === 'manager' ? parentId : userId;
        if (targetId && mode !== 'demo') {
            consultantService.getConsultant(targetId).then(data => {
                if (data) {
                    const hasAcc = !!(data.google_access_token && data.google_access_token !== 'undefined' && data.google_access_token.length > 10);
                    const hasRef = !!(data.google_refresh_token && data.google_refresh_token !== 'undefined' && data.google_refresh_token.length > 10);
                    setHasDriveToken(hasAcc);
                    setHasRefreshToken(hasRef);
                } else {
                    setHasDriveToken(false);
                    setHasRefreshToken(false);
                }
            }).catch(err => console.error("Error fetching consultant tokens:", err));
        } else if (mode === 'demo') {
            setHasDriveToken(true);
            setHasRefreshToken(true);
        }
    }, [fetchManagers, fetchPendingConsultants]);

    const handleAddManager = async () => {
        if (!newManagerEmail.trim() || !newManagerEmail.includes('@')) {
            showToast('올바른 이메일 주소를 입력하세요.');
            return;
        }

        const userId = localStorage.getItem('userId');
        if (!userId) return;

        setIsAdding(true);
        try {
            await consultantService.addManager(userId, {
                email: newManagerEmail.trim().toLowerCase(),
                name: '조교 (이름 미설정)',
                role: 'manager',
                parentId: userId,
            });
            showToast('✅ 관리자가 초대되었습니다.');
            setNewManagerEmail('');
            fetchManagers();
        } catch (error) {
            console.error("Error adding manager:", error);
            showToast('❌ 관리자 추가 중 오류가 발생했습니다.');
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteManager = async (managerEmail: string) => {
        if (!confirm(`${managerEmail} 관리자 권한을 회수하시겠습니까?`)) return;

        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            await consultantService.deleteManager(userId, managerEmail);
            showToast('🗑️ 관리자 권한이 삭제되었습니다.');
            fetchManagers();
        } catch (error) {
            console.error("Error deleting manager:", error);
            showToast('❌ 권한 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleApproveConsultant = async (userId: string) => {
        try {
            await consultantService.approveConsultant(userId);
            showToast('✅ 사용자가 승인되었습니다.');
            fetchPendingConsultants();
        } catch (error) {
            console.error("Error approving consultant:", error);
            showToast('❌ 승인 중 오류가 발생했습니다.');
        }
    };

    const handleReconnectGoogle = async () => {
        setIsAdding(true);
        try {
            const { auth } = await import('@/lib/firebase');
            const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
            const provider = new GoogleAuthProvider();
            provider.addScope('https://www.googleapis.com/auth/drive.file');
            provider.setCustomParameters({
                access_type: 'offline',
                prompt: 'consent'
            });

            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const credential = GoogleAuthProvider.credentialFromResult(result);

            if (credential?.accessToken) {
                // [핵심 수정] Firebase Auth의 ID 토큰이 아니라, Google OAuth용 Access/Refresh Token을 타겟팅
                const tokenResponse = (result as any)._tokenResponse;

                // Google OAuth2용 실제 토큰들
                const googleAccessToken = credential.accessToken; // 보통 'ya29.'으로 시작
                const googleRefreshToken = tokenResponse?.oauthRefreshToken; // '1/'로 시작

                if (!googleRefreshToken) {
                    console.warn("[Auth] No Refresh Token. Ensure 'prompt: consent' is active.");
                }

                await consultantService.saveTokens(user.uid, {
                    google_access_token: googleAccessToken,
                    ...(googleRefreshToken ? { google_refresh_token: googleRefreshToken } : {}),
                    google_token_expiry: Date.now() + 3500 * 1000
                });
                
                // 로컬 상태 즉시 갱신
                setHasDriveToken(true);
                if (googleRefreshToken) {
                    setHasRefreshToken(true);
                }
                showToast('✅ 구글 연동 정보가 정식 갱신되었습니다. 이제 폴더 생성이 가능합니다.');
            }
        } catch (error: any) {
            console.error('Re-auth error:', error);
            showToast(`❌ 연동 실패: ${error.message}`);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h2 style={{ fontWeight: 700 }}>설정</h2>
                <p className="text-sm text-muted" style={{ marginTop: '2px' }}>시스템 환경 및 서비스 최적화 설정</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                {/* Profile */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={18} color="var(--primary-400)" />
                        프로필 관리
                    </h3>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">컨설턴트 이름</label>
                            <input className="form-input" value={userName} onChange={(e) => setUserName(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">로그인 이메일</label>
                            <input className="form-input" value={userEmail} disabled style={{ opacity: 0.6 }} />
                        </div>
                    </div>
                </div>

                {/* AI & Integration Settings */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Brain size={18} color="var(--accent-400)" />
                        AI 및 외부 서비스 연동
                    </h3>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Google Drive 상태</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {hasDriveToken === null ? (
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>불러오는 중...</div>
                                ) : hasDriveToken ? (
                                    hasRefreshToken ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '8px', background: 'rgba(52, 211, 153, 0.1)', color: 'var(--success-400)', fontSize: '0.875rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-400)' }}></div>
                                            연결됨 (자동 갱신 활성화됨)
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-400)', fontSize: '0.875rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger-400)' }}></div>
                                            연결 상태 불안정 (1시간 후 만료 예정. 구글 계정을 다시 연결해 주세요.)
                                        </div>
                                    )
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-muted)' }}></div>
                                        연결 안 됨 (구글 드라이브 동기화 미활성 상태)
                                    </div>
                                )}
                                
                                {userRole === 'consultant' ? (
                                    <button className="btn btn-secondary btn-sm" onClick={handleReconnectGoogle} style={{ width: 'fit-content', border: '1px solid var(--border-color)', background: 'transparent' }}>
                                        <RefreshCw size={14} style={{ marginRight: '6px' }} /> 구글 계정 다시 연결 (인증 에러 시 클릭)
                                    </button>
                                ) : (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        ⚠️ 구글 드라이브 연동은 대표 컨설턴트 계정으로 로그인해야만 다시 연결(갱신)할 수 있습니다.
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Gemini API Key</label>
                            <input className="form-input" type="password" placeholder="이미 시스템에 등록됨 (업데이트 필요 시 입력)" />
                        </div>
                    </div>
                </div>

                {/* Report Settings */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={18} color="var(--secondary-400)" />
                        보고서 자동화 설정
                    </h3>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">분석 리포트 생성 주기</label>
                            <select className="form-select" defaultValue="2weeks">
                                <option value="1week">1주 (밀착 관리)</option>
                                <option value="2weeks">2주 (일반)</option>
                                <option value="1month">1개월 (장기)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">AI 리포트 어조</label>
                            <select className="form-select" defaultValue="professional">
                                <option value="professional">전문적 (입시 전략 중심)</option>
                                <option value="friendly">친근한 (학생 눈높이)</option>
                                <option value="formal">격식체 (학부모 보고용)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Sub-user Management - Consultants Only */}
                {userRole === 'consultant' && (
                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={18} color="var(--primary-400)" />
                            관리자(서브유저) 계정 관리
                        </h3>
                        <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-md)' }}>
                            직원이나 조교님께 관리자 권한을 부여하세요. 관리자는 파일 등록이 가능하지만 삭제는 제한됩니다.
                        </p>

                        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                            <input
                                className="form-input"
                                style={{ flex: 1 }}
                                placeholder="추가할 관리자 이메일 입력"
                                value={newManagerEmail}
                                onChange={(e) => setNewManagerEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddManager()}
                            />
                            <button className="btn btn-primary" onClick={handleAddManager} disabled={isAdding}>
                                {isAdding ? <Loader2 className="spinner" size={16} /> : '초대하기'}
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            {isLoadingManagers ? (
                                <div style={{ textAlign: 'center', padding: 'var(--space-md)' }}>
                                    <Loader2 className="spinner" size={20} style={{ margin: '0 auto', opacity: 0.5 }} />
                                </div>
                            ) : managers.length > 0 ? (
                                managers.map((mgr) => (
                                    <div key={mgr.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-md)', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{mgr.name}</div>
                                            <div className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {mgr.email}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                            <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>읽기/쓰기 (삭제 불가)</span>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                style={{ padding: '6px', minWidth: 'auto', color: 'var(--danger-400)' }}
                                                onClick={() => handleDeleteManager(mgr.email)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: 'var(--space-md)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    등록된 관리자가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Pending Approvals - Master Admin Section */}
                {userRole === 'consultant' && pendingConsultants.length > 0 && (
                    <div className="card" style={{ border: '1px solid var(--warning-600)', background: 'rgba(245, 158, 11, 0.02)' }}>
                        <h3 className="card-title" style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning-400)' }}>
                            <Mail size={18} /> 가입 승인 대기 목록
                        </h3>
                        <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-md)' }}>
                            신규 가입한 컨설턴트의 접근 권한을 승인합니다.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            {isLoadingPending ? (
                                <div style={{ textAlign: 'center', padding: 'var(--space-md)' }}>
                                    <Loader2 className="spinner" size={20} style={{ margin: '0 auto', opacity: 0.5 }} />
                                </div>
                            ) : (
                                pendingConsultants.map((cp) => (
                                    <div key={cp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-md)', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{cp.display_name}</div>
                                            <div className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {cp.email}</div>
                                        </div>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            style={{ background: 'var(--warning-500)', borderColor: 'var(--warning-600)' }}
                                            onClick={() => handleApproveConsultant(cp.id)}
                                        >
                                            승인하기
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Data Management - Consultants Only */}
                {userRole === 'consultant' && (
                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Database size={18} color="var(--warning-400)" />
                            고급 데이터 도구
                        </h3>
                        <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-md)' }}>시스템 백업 및 AI 검색 최적화를 위한 도구입니다.</p>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                            <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Download size={14} /> 데이터 내보내기 (JSON)</button>
                            <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><RefreshCw size={14} /> AI 검색 인덱스 갱신</button>
                            <button className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Trash2 size={14} /> 시스템 캐시 비우기</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="toast toast-success" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
                    {toast}
                </div>
            )}
        </div>
    );
}
