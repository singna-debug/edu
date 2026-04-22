const fs = require('fs');
const path = 'c:/Users/vbxn6/.gemini/antigravity/scratch/admitflow-ai/src/app/dashboard/students/[id]/page.tsx';

try {
    const content = fs.readFileSync(path, 'utf8');
    
    // Define the start and end markers for replacement
    const startMarker = "{/* ===== BOOKS TAB ===== */}";
    const endMarker = "{/* ===== ANALYSIS TAB ===== */}";
    
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);
    
    if (startIndex === -1 || endIndex === -1) {
        throw new Error(`Markers not found. Start: ${startIndex}, End: ${endIndex}`);
    }
    
    const newChunk = `{/* ===== BOOKS TAB ===== */}
            {activeTab === 'books' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                        <div>
                            <h3 style={{ fontWeight: 700 }}>독서 관리</h3>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>학년별 과목당 최소 1권의 도서를 권장합니다</p>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowBookForm(!showBookForm)}>{showBookForm ? '닫기' : '도서 추가'}</button>
                    </div>

                    {showBookForm && (
                        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">제목 *</label><input className="form-input" placeholder="책 제목" value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} /></div>
                                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">저자</label><input className="form-input" placeholder="저자명" value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} /></div>
                                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">이미지 URL</label><input className="form-input" placeholder="https://..." value={bookForm.imageUrl} onChange={(e) => setBookForm({ ...bookForm, imageUrl: e.target.value })} /></div>
                                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">과목</label><input className="form-input" placeholder="관련 과목" value={bookForm.subject} onChange={(e) => setBookForm({ ...bookForm, subject: e.target.value })} /></div>
                                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">학년</label>
                                    <select className="form-select" value={bookForm.studentGrade} onChange={(e) => setBookForm({ ...bookForm, studentGrade: Number(e.target.value) })}>
                                        <option value={1}>1학년</option>
                                        <option value={2}>2학년</option>
                                        <option value={3}>3학년</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">메모</label><input className="form-input" placeholder="독서 메모" value={bookForm.memo} onChange={(e) => setBookForm({ ...bookForm, memo: e.target.value })} /></div>
                            </div>
                            {bookForm.imageUrl && <div style={{ marginTop: 'var(--space-sm)' }}><img src={bookForm.imageUrl} alt="미리보기" style={{ height: 80, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /></div>}
                            <button className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-md)' }} onClick={handleSaveBook}>저장</button>
                        </div>
                    )}

                    <div className="table-wrapper">
                        <table className="table">
                            <thead><tr><th style={{ width: 60 }}>표지</th><th>제목</th><th>저자</th><th>과목</th><th>학년</th><th>메모</th><th>작업</th></tr></thead>
                            <tbody>
                                {books.map((book) => (
                                    <tr key={book.id}>
                                        <td>{book.imageUrl ? <img src={book.imageUrl} alt="" style={{ width: 40, height: 56, objectFit: 'cover', borderRadius: 4 }} onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).alt = 'Book'; }} /> : <Book size={24} style={{ opacity: 0.5 }} />}</td>
                                        <td style={{ fontWeight: 600 }}>{book.title}</td>
                                        <td style={{ fontSize: '0.85rem' }}>{book.author || '-'}</td>
                                        <td><span className="tag tag-blue" style={{ fontSize: '0.72rem' }}>{book.subject || '-'}</span></td>
                                        <td style={{ fontSize: '0.82rem' }}>{book.studentGrade || '-'}학년</td>
                                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.memo || '-'}</td>
                                        <td>
                                            {userRole !== 'manager' && (
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteBook(book.id)} style={{ color: 'var(--danger-400)', fontSize: '0.72rem' }}>✕</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {books.length === 0 && <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}><p style={{ color: 'var(--text-muted)' }}>등록된 도서가 없습니다.</p></div>}
                </div>
            )}

            {/* ===== RESOURCES TAB ===== */}
            {activeTab === 'resources' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                        <h3 style={{ fontWeight: 700 }}>교과 리소스</h3>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowResourceForm(!showResourceForm)}>{showResourceForm ? '닫기' : '과목 추가'}</button>
                    </div>

                    {showResourceForm && (
                        <div className="card" style={{ marginBottom: 'var(--space-lg)', borderTop: '4px solid var(--primary-500)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)' }}>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">학습 리소스 URL</label>
                                    <input className="form-input" placeholder="학습 페이지 또는 교과서 소개 URL (https://...)" value={resourceForm.linkUrl} onChange={(e) => setResourceForm({ ...resourceForm, linkUrl: e.target.value })} />
                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>참고할 수 있는 웹 페이지 주소를 입력하세요.</p>
                                </div>
                                <div className="form-group"><label className="form-label">과목명 *</label><input className="form-input" placeholder="예: 물리학Ⅱ" value={resourceForm.subjectName} onChange={(e) => setResourceForm({ ...resourceForm, subjectName: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">출판사</label><input className="form-input" placeholder="예: 비상교육" value={resourceForm.publisher} onChange={(e) => setResourceForm({ ...resourceForm, publisher: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">링크 이름</label><input className="form-input" placeholder="예: EBS 수능특강 물리학Ⅱ" value={resourceForm.linkLabel} onChange={(e) => setResourceForm({ ...resourceForm, linkLabel: e.target.value })} /></div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <label className="form-label" style={{ marginBottom: 0 }}>교과 목차 (복사해서 붙여넣으세요)</label>
                                        <button 
                                            className="btn btn-secondary btn-sm" 
                                            onClick={handleFormatToc} 
                                            disabled={isAnalyzingUrl || !resourceForm.tableOfContents}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            {isAnalyzingUrl ? <Loader2 className="spinner" size={14} /> : <Brain size={14} />}
                                            AI 목차 정문화
                                        </button>
                                    </div>
                                    <textarea 
                                        className="form-input" 
                                        placeholder="알라딘 등에서 복사한 목차 내용을 그대로 붙여넣으세요. 'AI 목차 정문화'를 누르면 검색하기 좋게 자동 정리됩니다." 
                                        rows={12}
                                        value={resourceForm.tableOfContents} 
                                        onChange={(e) => setResourceForm({ ...resourceForm, tableOfContents: e.target.value })}
                                        style={{ resize: 'vertical', fontSize: '0.85rem' }}
                                    />
                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>목차를 정형화해두면 나중에 AI 검색으로 해당 교과 리소스를 쉽게 찾을 수 있습니다.</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                                <button className="btn btn-primary" onClick={handleSaveResource} style={{ flex: 1 }}>저장</button>
                                <button className="btn btn-ghost" onClick={() => setShowResourceForm(false)}>취소</button>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-lg)' }}>
                        {resources.map((res) => (
                            <div key={res.id} className="card" style={{ borderLeft: '4px solid var(--primary-500)', padding: 'var(--space-lg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                                    <div>
                                        <h4 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '4px' }}>{res.subjectName}</h4>
                                        {res.publisher && <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>📖 출판사: {res.publisher}</div>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {userRole !== 'manager' && (
                                            <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteResource(res.id)} style={{ color: 'var(--danger-400)' }} title="삭제">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {res.tableOfContents && (
                                    <div style={{ marginBottom: 'var(--space-md)' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Clipboard size={14} /> 교과 목차
                                        </div>
                                        <div style={{ 
                                            background: 'rgba(30, 41, 59, 0.4)', 
                                            padding: 'var(--space-md)', 
                                            borderRadius: 'var(--radius-md)', 
                                            fontSize: '0.9rem', 
                                            color: 'var(--text-secondary)',
                                            whiteSpace: 'pre-wrap',
                                            lineHeight: 1.6,
                                            border: '1px solid rgba(255, 255, 255, 0.05)',
                                            maxHeight: '400px',
                                            overflowY: 'auto'
                                        }}>
                                            {res.tableOfContents}
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', fontSize: '0.85rem' }}>
                                    {res.links.length > 0 ? res.links.map((link, idx) => (
                                        <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ color: 'var(--primary-400)' }}>
                                            <ExternalLink size={14} style={{ marginRight: '4px' }} /> {link.label || '학습 링크'}
                                        </a>
                                    )) : <span style={{ color: 'var(--text-muted)' }}>등록된 링크/파일이 없습니다.</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                    {resources.length === 0 && <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}><p style={{ color: 'var(--text-muted)' }}>등록된 교과 리소스가 없습니다.</p></div>}
                </div>
            )}
            `;
    
    const finalContent = content.substring(0, startIndex) + newChunk + content.substring(endIndex);
    fs.writeFileSync(path, finalContent, 'utf8');
    console.log('File successfully repaired using script.');
} catch (err) {
    console.error('Repair script failed:', err);
    process.exit(1);
}
