'use client';

import { useState, useEffect } from 'react';
import { Smartphone, MessageSquare, History, Send, CheckCircle } from 'lucide-react';

export default function TelegramPage() {
    const [authMode, setAuthMode] = useState<'demo' | 'user'>('user');
    const [isConnected, setIsConnected] = useState(false);
    const [authCode, setAuthCode] = useState('');

    useEffect(() => {
        const mode = localStorage.getItem('authMode') as 'demo' | 'user';
        if (mode) setAuthMode(mode);
    }, []);

    const isDemo = authMode === 'demo';

    const demoLog = [
        { time: '14:30', command: '/조회 김민준', response: '최근 14일 활동 요약 전송 완료', status: 'success' },
        { time: '14:25', command: '/차트 이서연', response: '성적 차트 이미지 전송 완료', status: 'success' },
        { time: '13:50', command: '/보고서확정 김민준', response: '보고서 확정 및 PDF 전송 완료', status: 'success' },
    ];

    const commandLog = isDemo ? demoLog : [];

    const handleConnect = () => {
        if (authCode.length === 6) {
            setIsConnected(true);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h2 style={{ fontWeight: 700 }}>Telegram 연동</h2>
                <p className="text-sm text-muted" style={{ marginTop: '2px' }}>텔레그램 봇으로 모바일에서 학생 데이터를 관리하세요</p>
            </div>

            <div className="grid-2" style={{ gap: 'var(--space-lg)' }}>
                {/* Connection Status */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Smartphone size={18} color="var(--primary-400)" />
                        연동 상태
                    </h3>
                    {isConnected ? (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-400)', boxShadow: '0 0 8px var(--accent-400)' }} />
                                <span style={{ fontWeight: 600, color: 'var(--accent-400)' }}>연결됨</span>
                            </div>
                            <div style={{ padding: 'var(--space-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>@eduflow_bot</div>
                            </div>
                            <button className="btn btn-danger btn-sm" style={{ marginTop: 'var(--space-md)' }} onClick={() => setIsConnected(false)}>
                                연동 해제
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', lineHeight: 1.6 }}>
                                1. Telegram에서 <strong style={{ color: 'var(--primary-400)' }}>@eduflow_bot</strong>을 검색<br />
                                2. <strong>/시작</strong> 명령을 전송<br />
                                3. 받은 6자리 인증 코드를 아래에 입력
                            </p>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                <input
                                    className="form-input"
                                    placeholder="6자리 인증코드"
                                    value={authCode}
                                    onChange={(e) => setAuthCode(e.target.value)}
                                    maxLength={6}
                                    style={{ maxWidth: 160, textAlign: 'center', letterSpacing: '4px', fontWeight: 700 }}
                                />
                                <button className="btn btn-primary" onClick={handleConnect}>인증</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Available Commands */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MessageSquare size={18} color="var(--success-400)" />
                        사용 가능한 명령어
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {[
                            { cmd: '/조회 [학생명]', desc: '최근 활동 요약 브리핑' },
                            { cmd: '/차트 [학생명]', desc: '성적 및 역량 차트 이미지 전송' },
                            { cmd: '/다운로드 [학생명] [과목]', desc: '보고서 파일 전송' },
                            { cmd: '/보고서확정 [학생명]', desc: '초안 승인 및 PDF 다운로드' },
                            { cmd: '/도움말', desc: '명령어 목록 안내' },
                        ].map((item) => (
                            <div key={item.cmd} style={{ display: 'flex', gap: 'var(--space-md)', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                <code style={{ color: 'var(--primary-400)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', minWidth: 200 }}>
                                    {item.cmd}
                                </code>
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{item.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Command Log */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <History size={18} color="var(--warning-400)" />
                        최근 명령 기록
                    </h3>
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>시간</th>
                                    <th>명령어</th>
                                    <th>응답</th>
                                    <th>상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {commandLog.map((log, idx) => (
                                    <tr key={idx}>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{log.time}</td>
                                        <td><code style={{ color: 'var(--primary-400)' }}>{log.command}</code></td>
                                        <td style={{ fontSize: '0.85rem' }}>{log.response}</td>
                                        <td>
                                            <span className="tag tag-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <CheckCircle size={12} />
                                                성공
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {commandLog.length === 0 && (
                                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>명령 기록이 없습니다.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
