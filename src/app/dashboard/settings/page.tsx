'use client';

export default function SettingsPage() {
    return (
        <div>
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h2 style={{ fontWeight: 700 }}>설정</h2>
                <p className="text-sm text-muted" style={{ marginTop: '2px' }}>시스템 환경 및 GCP 연동 설정</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                {/* Profile */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>👤 프로필</h3>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">이름</label>
                            <input className="form-input" defaultValue="데모 컨설턴트" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">이메일</label>
                            <input className="form-input" defaultValue="demo@admitflow.ai" />
                        </div>
                    </div>
                    <button className="btn btn-primary btn-sm">저장</button>
                </div>

                {/* GCP Settings */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>☁️ GCP 연동</h3>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">프로젝트 ID</label>
                            <input className="form-input" defaultValue="admitflow-ai" readOnly style={{ opacity: 0.6 }} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Storage 버킷</label>
                            <input className="form-input" defaultValue="admitflow-files" readOnly style={{ opacity: 0.6 }} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Gemini API Key</label>
                            <input className="form-input" type="password" defaultValue="●●●●●●●●●●●●" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Vector DB</label>
                            <select className="form-select" defaultValue="pinecone">
                                <option value="pinecone">Pinecone</option>
                                <option value="vertex">Vertex AI Vector Search</option>
                                <option value="memory">인메모리 (개발용)</option>
                            </select>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-sm">설정 업데이트</button>
                </div>

                {/* Report Settings */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>📋 보고서 설정</h3>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">보고서 생성 주기</label>
                            <select className="form-select" defaultValue="2weeks">
                                <option value="1week">1주</option>
                                <option value="2weeks">2주</option>
                                <option value="1month">1개월</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">보고서 어조</label>
                            <select className="form-select" defaultValue="professional">
                                <option value="professional">전문적 (입시 전문가)</option>
                                <option value="friendly">친근한</option>
                                <option value="formal">격식체</option>
                            </select>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-sm">저장</button>
                </div>

                {/* Data */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>🗄️ 데이터 관리</h3>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary">📥 데이터 내보내기</button>
                        <button className="btn btn-secondary">🔄 Vector DB 재인덱싱</button>
                        <button className="btn btn-danger">🗑️ 캐시 초기화</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
