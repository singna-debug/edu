'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    RadialLinearScale,
    Filler,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Radar } from 'react-chartjs-2';
import { 
    ArrowLeft,
    Layout, 
    FileText, 
    Network, 
    BarChart, 
    Book, 
    Link as LinkIcon, 
    Brain, 
    Search as SearchIcon,
    Folder,
    FolderOpen,
    File,
    ChevronRight,
    ChevronDown,
    Plus,
    X,
    Trash2,
    AlertTriangle,
    Pencil,
    Loader2,
    ExternalLink
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { studentService } from '@/lib/services/studentService';
import type { Student, Memo, StudentFile, GradeRecord, SubjectGrade, CompetencyScore, BookRecord, SubjectResource, FileFolder, FileCategory } from '@/lib/types';
import { FILE_CATEGORIES } from '@/lib/types';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    RadialLinearScale, Filler, Title, Tooltip, Legend, ArcElement
);

// ============ TABS ============

type Tab = 'overview' | 'memos' | 'files' | 'grades' | 'books' | 'resources' | 'analysis' | 'search' | 'log';

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [loading, setLoading] = useState(true);
    
    const [student, setStudent] = useState<Student | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'error' | 'idle'>('idle');
    const [userRole, setUserRole] = useState<'consultant' | 'manager'>('consultant');
    const [parentConsultantId, setParentConsultantId] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const searchParams = useSearchParams();
    const urlTab = searchParams.get('tab');

    // URL 파라미터를 기반으로 초기 탭 설정
    useEffect(() => {
        if (urlTab && ['overview', 'memos', 'files', 'grades', 'books', 'resources', 'analysis', 'search', 'log'].includes(urlTab)) {
            setActiveTab(urlTab as Tab);
        }
    }, [urlTab]);

    // Toast state
    const [toast, setToast] = useState<string | null>(null);
    const showToast = useCallback((message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    }, []);

    // Edit student state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '', grade: 1, school: '', classNumber: '' as number | '', studentNumber: '' as number | '',
        teacherMemo: '', studentMemo: '', targetUniv: '', targetMajor: '',
    });

    // Memo state
    const [memos, setMemos] = useState<Memo[]>([]);
    const [newMemo, setNewMemo] = useState('');
    const [memoCategory, setMemoCategory] = useState('진로활동');
    const [memoTags, setMemoTags] = useState('');
    const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
    const [editMemoContent, setEditMemoContent] = useState('');

    // File upload state
    const [files, setFiles] = useState<StudentFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<{ name: string; parsing: boolean; result?: { category: string; tags: string[]; summary: string } } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Grade state
    const [grades, setGrades] = useState<GradeRecord[]>([]);
    const [showGradeForm, setShowGradeForm] = useState(false);
    const [gradeForm, setGradeForm] = useState({
        examType: '내신' as '내신' | '모의고사',
        year: new Date().getFullYear(),
        studentGrade: 1, // 학생 학년 (1, 2, 3)
        semester: 1,
        examPeriod: '중간고사' as '중간고사' | '기말고사',
        month: 3,
        subjects: [{ name: '', score: null as number | null, grade: null as number | null }] as SubjectGrade[],
    });
    const [isEditingGrade, setIsEditingGrade] = useState(false);
    const [editGradeId, setEditGradeId] = useState<string | null>(null);

    // Chart axis controls
    const [chartMinY, setChartMinY] = useState(80);
    const [chartMaxY, setChartMaxY] = useState(100);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<{ answer: string; sources: { text: string; category: string }[] } | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Book state
    const [books, setBooks] = useState<BookRecord[]>([]);
    const [showBookForm, setShowBookForm] = useState(false);
    const [bookForm, setBookForm] = useState({ title: '', author: '', imageUrl: '', subject: '', studentGrade: 1, memo: '' });

    // Resource state
    const [resources, setResources] = useState<SubjectResource[]>([]);
    const [showResourceForm, setShowResourceForm] = useState(false);
    const [resourceForm, setResourceForm] = useState({ subjectName: '', publisher: '', linkLabel: '', linkUrl: '' });

    // Mind map state
    const [selectedSemester, setSelectedSemester] = useState('1-1');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    // Log tab state
    const [logSearchQuery, setLogSearchQuery] = useState('');
    const [logStartDate, setLogStartDate] = useState('');
    const [logEndDate, setLogEndDate] = useState('');
    const [logCategory, setLogCategory] = useState('전체');

    // Activity log logic
    const allActivities = useMemo(() => {
        const all = [
            ...memos.map(m => ({ id: m.id, date: m.createdAt, type: '메모', content: m.content, semester: undefined })),
            ...files.map(f => ({ id: f.id, date: f.uploadedAt, type: '파일', content: f.fileName, memo: f.summary || '', semester: f.semester })),
            ...grades.map(g => ({ 
                id: g.id, 
                date: g.createdAt, 
                type: '성적', 
                content: `${g.studentGrade || ''}학년 ${g.examType === '내신' ? `${g.semester || '-'}학기 ${g.examPeriod || ''}` : `${g.month || '-'}월`}`,
                semester: g.examType === '내신' ? `${g.studentGrade}-${g.semester}` : undefined
            })),
            ...books.map(b => ({ id: b.id, date: b.createdAt, type: '도서', content: b.title, semester: undefined }))
        ] as { id: string; date: string; type: string; content: string; memo?: string; semester?: string }[];
        
        return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [memos, files, grades, books]);

    const recentActivities = useMemo(() => allActivities.slice(0, 5), [allActivities]);

    const filteredActivities = useMemo(() => {
        return allActivities.filter(act => {
            const matchesQuery = act.content.toLowerCase().includes(logSearchQuery.toLowerCase()) || 
                               (act.memo?.toLowerCase().includes(logSearchQuery.toLowerCase())) ||
                               act.type.toLowerCase().includes(logSearchQuery.toLowerCase());
            
            const matchesCategory = logCategory === '전체' || act.type === logCategory;
            
            const actDate = new Date(act.date);
            const matchesStart = !logStartDate || actDate >= new Date(logStartDate);
            const matchesEnd = !logEndDate || actDate <= new Date(logEndDate + 'T23:59:59');
            
            return matchesQuery && matchesCategory && matchesStart && matchesEnd;
        });
    }, [allActivities, logSearchQuery, logCategory, logStartDate, logEndDate]);
    const [folders, setFolders] = useState<FileFolder[]>([]);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [draggingFileId, setDraggingFileId] = useState<string | null>(null);
    const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null);
    const [mindmapView, setMindmapView] = useState<'mindmap' | 'list'>('mindmap');

    // Folder modal
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [folderModalTarget, setFolderModalTarget] = useState<{ cat: string; parentId: string | null } | null>(null);

    // Delete confirmation modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);

    // AI Analysis status
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Inline Teacher Memo state
    const [isEditingTeacherMemo, setIsEditingTeacherMemo] = useState(false);
    const [teacherMemoValue, setTeacherMemoValue] = useState('');
    // Timetable data (structured)
    const [timetableData, setTimetableData] = useState<Record<string, string[]>>({
        '월': ['', '', '', '', '', '', ''],
        '화': ['', '', '', '', '', '', ''],
        '수': ['', '', '', '', '', '', ''],
        '목': ['', '', '', '', '', '', ''],
        '금': ['', '', '', '', '', '', ''],
    });

    // File Upload with Memo Modal states
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFileToUpload, setSelectedFileToUpload] = useState<File | null>(null);
    const [uploadMemo, setUploadMemo] = useState('');
    const [uploadTargetCategory, setUploadTargetCategory] = useState<string | null>(null);
    const [uploadTargetFolderId, setUploadTargetFolderId] = useState<string | null>(null);

    // File Detail Modal states
    const [showFileDetailModal, setShowFileDetailModal] = useState(false);
    const [selectedFileForDetail, setSelectedFileForDetail] = useState<StudentFile | null>(null);
    const [isEditingFileMemo, setIsEditingFileMemo] = useState(false);
    const [editingFileMemoValue, setEditingFileMemoValue] = useState('');

    // Upload Memo Modal states (업로드 직후 메모 입력)
    const [uploadedFileForMemo, setUploadedFileForMemo] = useState<StudentFile | null>(null);
    const [uploadMemoValue, setUploadMemoValue] = useState('');

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleScanImage = async (type: 'grade' | 'timetable') => {
        if (!student) {
            showToast('학생 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setIsAnalyzing(true);
            try {
                const base64 = await fileToBase64(file);
                const response = await fetch('/api/analyze-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64, type, mimeType: file.type })
                });
                const result = await response.json();
                
                if (result.success) {
                    if (type === 'grade') {
                        const records = Array.isArray(result.data) ? result.data : [result.data];
                        
                        if (records.length > 0) {
                            showToast(`🔍 ${records.length}개의 시험 기간을 분석 중입니다...`);
                            
                            // Process all records
                            for (const rec of records) {
                                let subs = rec.subjects || (Array.isArray(rec) ? rec : []);
                                let inf = rec.info || {};
                                
                                const formattedSubjects = (subs && Array.isArray(subs)) ? subs.map((s: any) => ({
                                    name: s.name || s.subject || s.과목 || s.과목명 || '',
                                    score: (s.score || s.점수 || s.원점수 || s.point) ?? null,
                                    grade: (s.grade || s.등급) ?? null,
                                    rank: s.rank || s.석차 || '',
                                    studentCount: (s.studentCount || s.수강자수) ?? null,
                                    average: (s.average || s.과목평균 || s.평균) ?? null,
                                    stdDev: (s.stdDev || s.표준편차 || s.표차) ?? null,
                                    standardScore: (s.standardScore || s.표준점수 || s.stdScore) ?? null,
                                    percentile: (s.percentile || s.백분위 || s.percent) ?? null
                                })) : [];

                                // Auto-save each record
                                await studentService.addGrade({
                                    studentId: id,
                                    examType: inf.examType || '내신',
                                    year: inf.year || new Date().getFullYear(),
                                    studentGrade: inf.studentGrade || student.grade,
                                    semester: inf.semester || 1,
                                    examPeriod: inf.examPeriod || '중간고사',
                                    month: inf.month || 3,
                                    subjects: formattedSubjects
                                });
                            }
                            
                            // Refresh data
                            const updatedGrades = await studentService.getGrades(id);
                            setGrades(updatedGrades);
                            
                            setShowGradeForm(false);
                            setActiveTab('grades');
                            showToast(`✅ ${records.length}개의 성적 기록이 자동으로 생성되어 저장되었습니다!`);
                        }
                    } else if (type === 'timetable') {
                        setTimetableData(result.data);
                        showToast('✅ 시간표 데이터 분석 완료! 내용을 확인해주세요.');
                    }
                } else {
                    showToast('❌ 이미지 분석 실패: ' + result.error);
                }
            } catch (err: any) {
                console.error("Analysis error:", err);
                showToast('❌ 오류가 발생했습니다.');
            } finally {
                setIsAnalyzing(false);
            }
        };
        input.click();
    };

    // Timetable upload
    const timetableInputRef = useRef<HTMLInputElement>(null);

    const handleMoveFile = async (fileId: string, newCategory: string, newFolderId: string | null) => {
        const currentUserId = localStorage.getItem('userId');
        try {
            const file = files.find(f => f.id === fileId);
            if (!file) return;

            // 1. Google Drive Sync
            if (file.driveFileId) {
                try {
                    const oldParentDriveId = file.folderId ? folders.find(f => f.id === file.folderId)?.driveFolderId : (student as any).driveFolderId;
                    const newParentDriveId = newFolderId ? folders.find(f => f.id === newFolderId)?.driveFolderId : (student as any).driveFolderId;

                    const currentUserId = localStorage.getItem('userId');
                    const cId = (parentConsultantId && parentConsultantId !== 'undefined') ? parentConsultantId : currentUserId;

                    await fetch('/api/drive', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'moveFolder',
                            fileId: file.driveFileId,
                            oldParentId: oldParentDriveId,
                            newParentId: newParentDriveId,
                            consultantId: cId
                        })
                    });
                } catch (err) {
                    console.error("Drive move failed:", err);
                }
            }

            // 2. Firestore Sync
            await studentService.updateFile(fileId, { category: newCategory, folderId: newFolderId || undefined });
            setFiles(prev => prev.map(f => f.id === fileId ? { ...f, category: newCategory, folderId: newFolderId || undefined } : f));
            showToast('📂 파일이 이동되었습니다.');
        } catch (error) {
            console.error("Error moving file:", error);
            showToast('❌ 파일 이동 중 오류가 발생했습니다.');
        }
    };

    const handleCreateFolder = async (name: string, category: string, parentId: string | null) => {
        const currentUserId = localStorage.getItem('userId');
        if (!student?.id || !name) return;
        try {
            // 1. Google Drive Sync first
            let driveFolderId = '';
            try {
                // Find parent drive ID
                const currentUserId = localStorage.getItem('userId');
                const cId = (parentConsultantId && parentConsultantId !== 'undefined') ? parentConsultantId : currentUserId;

                let parentDriveId = parentId ? folders.find(f => f.id === parentId)?.driveFolderId : null;
                
                // 루트(학생 폴더) 직속 폴더 생성인 경우 경로 보장
                if (!parentDriveId && student?.driveFolderId) {
                    parentDriveId = await ensureDrivePath(category, cId as string);
                }

                const idToken = await auth.currentUser?.getIdToken();
                const response = await fetch('/api/drive', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({ action: 'createFolder', name, parentId: parentDriveId, consultantId: cId })
                });
                const result = await response.json();
                if (result.success) driveFolderId = result.id;
            } catch (err) {
                console.error("Drive sync failed, continuing with Firestore only:", err);
            }

            // 2. Save to Firestore
            const folderData: Omit<FileFolder, 'id'> = {
                studentId: student.id,
                name,
                category: category as FileCategory,
                semester: selectedSemester,
                parentId,
                driveFolderId,
                createdAt: new Date().toISOString()
            };
            const newId = await studentService.addFolder(folderData);
            setFolders(prev => [...prev, { id: newId, ...folderData }]);
            
            // Auto-expand category and current folder
            setExpandedNodes(prev => {
                const next = new Set(prev);
                next.add(category);
                if (parentId) next.add(parentId);
                next.add(newId);
                return next;
            });

            showToast(`📁 ${name} 폴더가 생성되었습니다.${driveFolderId ? ' (Drive 동기화됨)' : ''}`);
        } catch (error) {
            console.error("Error creating folder:", error);
            showToast('❌ 폴더 생성 중 오류가 발생했습니다.');
        }
    };

    const confirmCreateFolder = () => {
        if (folderModalTarget && newFolderName) {
            handleCreateFolder(newFolderName, folderModalTarget.cat, folderModalTarget.parentId);
            setNewFolderName('');
            setShowFolderModal(false);
            setFolderModalTarget(null);
        }
    };

    const handleMoveFolder = async (folderId: string, newParentId: string | null, newCategory?: string) => {
        const currentUserId = localStorage.getItem('userId');
        try {
            const folder = folders.find(f => f.id === folderId);
            if (!folder) return;

            // 1. Drive Move
            if (folder.driveFolderId) {
                try {
                    const oldParentDriveId = folder.parentId ? folders.find(f => f.id === folder.parentId)?.driveFolderId : (student as any).driveFolderId;
                    const newParentDriveId = newParentId ? folders.find(f => f.id === newParentId)?.driveFolderId : (student as any).driveFolderId;

                    const cId = (parentConsultantId && parentConsultantId !== 'undefined') ? parentConsultantId : currentUserId;
                    const idToken = await auth.currentUser?.getIdToken();
                    await fetch('/api/drive', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`
                        },
                        body: JSON.stringify({
                            action: 'moveFolder',
                            fileId: folder.driveFolderId,
                            oldParentId: oldParentDriveId,
                            newParentId: newParentDriveId,
                            consultantId: cId
                        })
                    });
                } catch (err) {
                    console.error("Drive move failed:", err);
                }
            }

            // 2. Firestore Update
            const updates: Partial<FileFolder> = { parentId: newParentId };
            if (newCategory) updates.category = newCategory as FileCategory;
            await studentService.updateFolder(folderId, updates);
            setFolders(prev => prev.map(f => f.id === folderId ? { ...f, ...updates } : f));
            showToast('📂 폴더가 이동되었습니다.');
        } catch (error) {
            console.error("Error moving folder:", error);
            showToast('❌ 폴더 이동 중 오류가 발생했습니다.');
        }
    };

    const handleDownloadFile = (fileId: string) => {
        const file = files.find(f => f.id === fileId);
        if (file?.driveFileId) {
            window.open(`https://drive.google.com/open?id=${file.driveFileId}`, '_blank');
        } else {
            showToast(`📥 ${file?.fileName || '파일'} 다운로드를 시작합니다...`);
        }
    };

    const handleDeleteFile = (fileId: string, fileName: string) => {
        if (userRole === 'manager') {
            showToast('❌ 삭제 권한이 없습니다.');
            return;
        }
        setDeleteTarget({ id: fileId, name: fileName, type: 'file' });
        setShowDeleteModal(true);
    };

    const handleDeleteFolder = (folderId: string, folderName: string) => {
        if (userRole === 'manager') {
            showToast('❌ 삭제 권한이 없습니다.');
            return;
        }
        setDeleteTarget({ id: folderId, name: folderName, type: 'folder' });
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget || !student) return;
        
        const { id: targetId, name: targetName, type } = deleteTarget;
        const currentUserId = localStorage.getItem('userId');
        const cId = (parentConsultantId && parentConsultantId !== 'undefined') ? parentConsultantId : currentUserId;
        
        setShowDeleteModal(false);

        try {
            if (type === 'file') {
                const file = files.find(f => f.id === targetId);
                
                // 1. Google Drive Sync
                if (file?.driveFileId) {
                    try {
                        const idToken = await auth.currentUser?.getIdToken();
                        await fetch('/api/drive', {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${idToken}`
                            },
                            body: JSON.stringify({ action: 'delete', fileId: file.driveFileId, consultantId: cId })
                        });
                    } catch (e) {
                        console.error("Drive delete failed:", e);
                    }
                }

                // 2. Firestore Sync
                await studentService.deleteFile(targetId);
                setFiles(prev => prev.filter(f => f.id !== targetId));
                showToast(`${targetName} 파일이 삭제되었습니다.`);
            } else {
                const folder = folders.find(f => f.id === targetId);

                // 1. Drive Delete
                if (folder?.driveFolderId) {
                    try {
                        const idToken = await auth.currentUser?.getIdToken();
                        await fetch('/api/drive', {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${idToken}`
                            },
                            body: JSON.stringify({ action: 'delete', fileId: folder.driveFolderId, consultantId: cId })
                        });
                    } catch (e) {
                        console.error("Drive delete failed:", e);
                    }
                }

                // 2. Firestore Delete
                await studentService.deleteFolder(targetId);
                setFolders(prev => prev.filter(f => f.id !== targetId && f.parentId !== targetId));
                setFiles(prev => prev.filter(f => f.folderId !== targetId));
                showToast(`🗑️ "${targetName}" 폴더가 삭제되었습니다.`);
            }
        } catch (error) {
            console.error("Error during deletion:", error);
            showToast(`❌ ${type === 'file' ? '파일' : '폴더'} 삭제 중 오류가 발생했습니다.`);
        } finally {
            setDeleteTarget(null);
        }
    };

    // Sub-folder design remains but color follows category
    // Recursive function for folders
    const renderFolder = (cat: string, folderId: string | null) => {
        const childFolders = folders.filter(f => f.category === cat && f.semester === selectedSemester && f.parentId === folderId);
        const childFiles = files.filter(f => f.category === cat && f.semester === selectedSemester && (f.folderId || undefined) === (folderId || undefined));

        return (
            <ul style={{ borderLeft: '1px solid var(--border-color)', marginLeft: 'var(--space-md)', paddingLeft: 'var(--space-sm)', marginTop: '4px' }}>
                {childFolders.map(folder => {
                    const isFolderExpanded = expandedNodes.has(folder.id);
                    const color = { '교과활동': '#6366f1', '자율활동': '#10b981', '진로활동': '#f59e0b', '동아리': '#8b5cf6', '행특': '#ec4899', '수업량유연화': '#14b8a6', '수상경력': '#f97316', '봉사활동': '#06b6d4', '도서': '#a855f7' }[cat] || 'var(--primary-500)';
                    return (
                        <li key={folder.id} style={{ marginBottom: '4px' }}>
                            <div className={`tree-node-content ${dragOverId === folder.id ? 'drag-over' : ''}`}
                                draggable
                                onDragStart={(e) => {
                                    e.stopPropagation();
                                    setDraggingFolderId(folder.id);
                                    e.dataTransfer.setData('text/plain', folder.id);
                                    e.currentTarget.style.opacity = '0.5';
                                }}
                                onDragEnd={(e) => {
                                    setDraggingFolderId(null);
                                    e.currentTarget.style.opacity = '1';
                                }}
                                onClick={(e) => { e.stopPropagation(); const next = new Set(expandedNodes); if (next.has(folder.id)) next.delete(folder.id); else next.add(folder.id); setExpandedNodes(next); }}
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverId(folder.id); }}
                                onDragLeave={() => setDragOverId(null)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOverId(null);
                                    if (draggingFileId) {
                                        handleMoveFile(draggingFileId, cat, folder.id);
                                        setDraggingFileId(null);
                                    } else if (draggingFolderId && draggingFolderId !== folder.id) {
                                        handleMoveFolder(draggingFolderId, folder.id);
                                        setDraggingFolderId(null);
                                    } else {
                                        const file = e.dataTransfer.files[0];
                                        if (file) { handleFileUpload(file, cat, folder.id); }
                                    }
                                }}
                                style={{
                                    background: 'var(--bg-card)',
                                    borderColor: color,
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    boxShadow: 'var(--shadow-sm)',
                                    padding: '6px 10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-xs)',
                                    opacity: (draggingFileId || draggingFolderId === folder.id) ? 0.7 : 1,
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'grab'
                                }}
                            >
                                {isFolderExpanded ? (
                                    <FolderOpen size={16} color={color} />
                                ) : (
                                    <Folder size={16} color={color} />
                                )}
                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{folder.name}</span>
                                {userRole !== 'manager' && (
                                    <button className="btn btn-ghost btn-sm" style={{ padding: '0 4px', color: 'var(--danger-400)', marginLeft: 'auto', zIndex: 10 }} onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id, folder.name); }}>
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            {isFolderExpanded && renderFolder(cat, folder.id)}
                        </li>
                    );
                })}
                {childFiles.map(f => (
                    <li key={f.id} style={{ marginBottom: '2px' }}>
                        <div className="tree-node-content file-node"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFileForDetail(f);
                                setEditingFileMemoValue(f.summary || '');
                                setIsEditingFileMemo(false);
                            }}
                            draggable
                            onDragStart={(e) => {
                                setDraggingFileId(f.id);
                                e.dataTransfer.setData('text/plain', f.id);
                                e.currentTarget.style.opacity = '0.5';
                                e.currentTarget.style.transform = 'scale(0.95)';
                            }}
                            onDragEnd={(e) => {
                                setDraggingFileId(null);
                                e.currentTarget.style.opacity = '1';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px dashed var(--gray-600)',
                                padding: '5px 10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-xs)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.8rem',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'grab'
                            }}>
                            <File size={14} color="var(--text-muted)" />
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.fileName}</span>
                            {userRole !== 'manager' && (
                                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); handleDeleteFile(f.id, f.fileName); }} style={{ color: 'var(--danger-400)', padding: '0 4px' }}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </li>
                ))}
                <li>
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '4px', marginTop: '4px' }}>
                        <button className="tree-new-btn" style={{ marginLeft: 0, fontSize: '0.7rem', padding: '2px 8px' }} onClick={(e) => { e.stopPropagation(); setFolderModalTarget({cat, parentId: folderId}); setShowFolderModal(true); }}>+ 폴더 추가</button>
                        <button className="tree-new-btn" style={{ marginLeft: 0, fontSize: '0.7rem', padding: '2px 8px' }} onClick={(e) => {
                            e.stopPropagation();
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.onchange = (ev: any) => {
                                 const file = ev.target.files?.[0];
                                 if (file) { handleFileUpload(file, cat, folderId); }
                            };
                            input.click();
                        }}>+ 파일 추가</button>
                    </div>
                </li>
            </ul>
        );
    };
    const [timetableUrl, setTimetableUrl] = useState('');

    // Parent portal
    const [portalCopied, setPortalCopied] = useState(false);

    // ============ CHART DATA ============
    const lineChartData = useMemo(() => {
        const labels = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2'];
        const subjects = Array.from(new Set(grades.flatMap(g => g.subjects.map(s => s.name))));

        const datasets = subjects.map((subName, i) => {
            const colors = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6'];
            const data = labels.map(label => {
                const [gNum, sNum] = label.split('-').map(Number);
                const record = grades.find(r => (r.year) === gNum && r.semester === sNum && r.examType === '내신');
                return record?.subjects.find(s => s.name === subName)?.score || null;
            });
            return {
                label: subName,
                data,
                borderColor: colors[i % colors.length],
                backgroundColor: `${colors[i % colors.length]}1A`,
                tension: 0.4,
                fill: true,
                spanGaps: true
            };
        });

        return { labels, datasets };
    }, [grades]);

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: '#94a3b8', font: { family: 'Inter' } } },
            title: { display: true, text: '내신 성적 추이', color: '#f1f5f9', font: { size: 14, family: 'Inter' } },
        },
        scales: {
            x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(30, 41, 59, 0.5)' } },
            y: { min: chartMinY, max: chartMaxY, ticks: { color: '#64748b' }, grid: { color: 'rgba(30, 41, 59, 0.5)' } },
        },
    };

    const radarData = {
        labels: ['학업역량', '진로역량', '자기주도성', '발전가능성', '공동체의식'],
        datasets: [{
            label: '역량 점수',
            data: [0, 0, 0, 0, 0], // AI analysis not yet implemented for user data
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            borderColor: '#6366f1',
            borderWidth: 2,
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
        }],
    };

    const radarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                min: 0, max: 10,
                ticks: { color: '#64748b', backdropColor: 'transparent', stepSize: 2 },
                grid: { color: 'rgba(30, 41, 59, 0.5)' },
                pointLabels: { color: '#94a3b8', font: { size: 12, family: 'Inter' } },
                angleLines: { color: 'rgba(30, 41, 59, 0.5)' },
            },
        },
        plugins: { legend: { display: false } },
    };

    const fetchData = useCallback(async (studentId: string) => {
        setLoading(true);
        setFetchError(null);
        console.log(`[StudentDetail] Fetching student ${studentId}`);
        
        try {
            // 1. Student Record (Critical)
            const s = await studentService.getStudentById(studentId);
            if (!s) {
                console.warn("[StudentDetail] Student record not found in Firestore");
                setStudent(null);
                setLoading(false);
                return;
            }
            setStudent(s);
            if (s.timetableData) setTimetableData(s.timetableData);

            // 2. Related data
            try {
                const [m, f, g, b, fld, res] = await Promise.all([
                    studentService.getMemos(studentId).catch(() => []),
                    studentService.getFiles(studentId).catch(() => []),
                    studentService.getGrades(studentId).catch(() => []),
                    studentService.getBooks(studentId).catch(() => []),
                    studentService.getFolders(studentId).catch(() => []),
                    studentService.getResources(studentId).catch(() => []),
                ]);
                
                setMemos(m);
                setFiles(f);
                setGrades(g);
                setBooks(b);
                setFolders(fld);
                setResources(res);

                const initialExpanded = new Set<string>([...FILE_CATEGORIES]);
                fld.forEach(parent => {
                    const hasSubFolders = fld.some(child => child.parentId === parent.id);
                    const hasFiles = f.some(file => file.folderId === parent.id);
                    if (hasSubFolders || hasFiles) initialExpanded.add(parent.id);
                });
                setExpandedNodes(initialExpanded);
            } catch (err) {
                console.warn("[StudentDetail] Non-critical data fetch error:", err);
            }

            // 3. 구글 드라이브 루트 폴더 자동 생성 체크
            if (s && !s.driveFolderId) {
                const pId = localStorage.getItem('parentId');
                const uId = localStorage.getItem('userId');
                const cId = pId || uId;
                
                if (cId) {
                    try {
                        const idToken = await auth.currentUser?.getIdToken();
                        const resp = await fetch('/api/drive', {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${idToken}`
                            },
                            body: JSON.stringify({ 
                                action: 'createFolder', 
                                name: `${s.name}_${s.school}`, 
                                consultantId: cId 
                            })
                        });
                        if (resp.status === 200) {
                            const res = await resp.json();
                            if (res.success && res.id) {
                                await studentService.updateStudent(studentId, { driveFolderId: res.id });
                                setStudent(prev => prev ? { ...prev, driveFolderId: res.id } : null);
                            }
                        }
                    } catch (driveErr) {
                        console.error("Auto drive folder creation failed:", driveErr);
                    }
                }
            }
        } catch (error: any) {
            console.error("Critical error fetching student details:", error);
            setFetchError(error.message);
        }
        setLoading(false);
    }, [showToast]); // Remove parentConsultantId dependency

    useEffect(() => {
        // 권한 정보 로드 (한 번만 실행)
        const role = localStorage.getItem('role') as 'consultant' | 'manager' || 'consultant';
        const pId = localStorage.getItem('parentId');
        setUserRole(role);
        setParentConsultantId(pId);
        
        const unsubscribe = auth.onAuthStateChanged((user: any) => {
            if (user) fetchData(id);
        });

        return () => unsubscribe();
    }, [id, fetchData]);

    // Sync state and ensure Drive Folder when student is loaded
    useEffect(() => {
        if (!student) return;

        // 1. 학생 폼 데이터 동기화
        setEditForm({
            name: student.name,
            grade: student.grade,
            school: student.school,
            classNumber: student.classNumber || '',
            studentNumber: student.studentNumber || '',
            teacherMemo: student.teacherMemo || '',
            studentMemo: student.studentMemo || '',
            targetUniv: student.targetUniv || '',
            targetMajor: student.targetMajor || '',
        });
        setTimetableUrl(student.timetableImageUrl || '');
        if (student.timetableData) setTimetableData(student.timetableData);


        // 2. 구글 드라이브 동기화 (EduFlow_Files 루트 하위 구조)
        const currentUserId = localStorage.getItem('userId');
        const cId = (parentConsultantId && parentConsultantId !== 'undefined') ? parentConsultantId : currentUserId;
        if (!student.driveFolderId && cId && cId !== 'undefined') {
            const ensureDriveFolder = async () => {
                setSyncStatus('syncing');
                try {
                    // EduFlow_Files 루트 아래에 학생 이름으로 폴더 생성/확인
                    const response = await fetch('/api/drive', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            action: 'getOrCreatePath', 
                            pathNames: ['EduFlow_Files', student.name], 
                            consultantId: cId 
                        })
                    });
                    const result = await response.json();
                    if (result.success) {
                        const driveFolderId = result.id;
                        await studentService.updateStudent(student.id, { driveFolderId });
                        setStudent(prev => prev ? { ...prev, driveFolderId } : null);
                        setSyncStatus('connected');
                    }
                } catch (err) {
                    console.error("Drive sync error:", err);
                    setSyncStatus('error');
                }
            };
            ensureDriveFolder();
        } else if (student.driveFolderId) {
            setSyncStatus('connected');
        }
    }, [student?.id]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 'var(--space-md)' }}>
                <Loader2 className="spinner" size={48} color="var(--primary-400)" />
                <p style={{ color: 'var(--text-muted)' }}>학생 정보를 불러오는 중입니다...</p>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                <Brain size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.2, margin: '0 auto' }} />
                <h3>학생을 찾을 수 없습니다</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
                    해당 ID({id})의 학생 데이터가 존재하지 않거나 접근 권한이 없습니다.
                </p>
                <div style={{ marginTop: 'var(--space-md)', fontSize: '0.8rem', color: 'var(--danger-400)', opacity: 0.7 }}>
                    Debug Info: Mode={localStorage.getItem('authMode')} | ID={id} | DB_Init={db && (db as any).type !== 'undefined' ? 'OK' : 'FAIL'}
                    {fetchError && <div style={{ marginTop: '4px' }}>Error: {fetchError}</div>}
                </div>
                <Link href="/dashboard/students" className="btn btn-primary" style={{ marginTop: 'var(--space-lg)', display: 'inline-block' }}>목록으로 돌아가기</Link>
            </div>
        );
    }



    const tabs: { key: Tab; label: string } [] = [
        { key: 'overview', label: '개요' },
        { key: 'memos', label: '메모' },
        { key: 'files', label: '파일' },
        { key: 'grades', label: '성적' },
        { key: 'books', label: '도서' },
        { key: 'resources', label: '교과 리소스' },
        { key: 'analysis', label: 'AI 분석' },
        { key: 'search', label: 'AI 검색' },
        { key: 'log', label: '로그' },
    ];

    // ============ HANDLERS ============

    const handleAddMemo = async () => {
        if (!newMemo.trim()) {
            showToast('메모 내용을 입력하세요.');
            return;
        }
        
        try {
            const memoData: Omit<Memo, 'id' | 'createdAt'> = {
                studentId: student.id,
                content: newMemo,
                tags: memoTags.split(',').map(t => t.trim()).filter(Boolean),
                category: memoCategory,
            };

            const newId = await studentService.addMemo(memoData);
            const fullMemo: Memo = {
                ...memoData,
                id: newId,
                createdAt: new Date().toISOString(),
            };
            setMemos([fullMemo, ...memos]);
            
            setNewMemo('');
            setMemoTags('');
            showToast('메모가 저장되었습니다.');
        } catch (error) {
            console.error("Error adding memo:", error);
            showToast("메모 저장 중 오류가 발생했습니다.");
        }
    };

    const handleDeleteMemo = async (memoId: string) => {
        if (userRole === 'manager') {
            showToast('❌ 삭제 권한이 없습니다.');
            return;
        }
        if (confirm('메모를 삭제하시겠습니까?')) {
            try {
                await studentService.deleteMemo(memoId);
                setMemos(memos.filter(m => m.id !== memoId));
                showToast('🗑️ 메모가 삭제되었습니다.');
            } catch (error) {
                console.error("Error deleting memo:", error);
                showToast("메모 삭제 중 오류가 발생했습니다.");
            }
        }
    };



    const ensureDrivePath = async (category: string, cId: string) => {
        let currentRootId = student?.driveFolderId;
        
        // 1. 만약 학생의 루트 폴더 ID가 없거나 유효하지 않은 경우 새로 생성 시도
        if (!currentRootId) {
            try {
                const idToken = await auth.currentUser?.getIdToken();
                const resp = await fetch('/api/drive', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({ 
                        action: 'createFolder', 
                        name: `${student?.name}_${student?.school}`, 
                        consultantId: cId 
                    })
                });
                const res = await resp.json();
                if (res.success && res.id) {
                    currentRootId = res.id;
                    await studentService.updateStudent(id, { driveFolderId: res.id });
                    setStudent(prev => prev ? { ...prev, driveFolderId: res.id } : null);
                }
            } catch (err) {
                console.error("Error creating initial drive folder:", err);
            }
        }

        if (!currentRootId) return null;
        
        let gradeName = "";
        let semesterName = "";
        
        if (selectedSemester.includes('학년')) {
            const parts = selectedSemester.split(' ');
            gradeName = parts[0];
            semesterName = parts[1];
        } else if (selectedSemester.includes('-')) {
            const [g, s] = selectedSemester.split('-');
            gradeName = `${g}학년`;
            semesterName = `${s}학기`;
        } else {
            gradeName = selectedSemester;
        }

        const pathNames = [gradeName, semesterName, category].filter(Boolean);
        
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const resp = await fetch('/api/drive', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ 
                    action: 'getOrCreatePath', 
                    pathNames, 
                    parentId: currentRootId, 
                    consultantId: cId 
                })
            });
            const res = await resp.json();
            
            // 만약 부모 폴더(currentRootId)가 삭제되어 getOrCreatePath가 실패한 경우
            if (!res.success && res.error?.includes('File not found')) {
                console.warn("[Drive] Root folder seems deleted. Retrying with new folder creation...");
                // driveFolderId를 제거하고 재귀적으로 다시 시도
                setStudent(prev => prev ? { ...prev, driveFolderId: undefined } : null);
                return await ensureDrivePath(category, cId);
            }
            
            return res.success ? res.id : currentRootId;
        } catch (err) {
            console.error("Error ensuring drive path:", err);
            return currentRootId;
        }
    };

    const handleFileUpload = async (file: File, targetCategory?: string, targetFolderId?: string | null) => {
        if (!student) return;
        
        showToast(`⏳ ${file.name} 업로드 중...`);
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('studentId', student.id);
            formData.append('semester', selectedSemester);
            
            const categories = ['교과활동', '자율활동', '진로활동', '동아리', '행특'];
            const finalCategory = targetCategory || categories[0];
            formData.append('category', finalCategory);
            
            const currentUserId = localStorage.getItem('userId');
            const cId = (parentConsultantId && parentConsultantId !== 'undefined') ? parentConsultantId : currentUserId;
            if (!cId || cId === 'undefined') {
                showToast('❌ 컨설턴트 인증 정보가 유실되었습니다. 다시 로그인해 주세요.');
                return;
            }
            formData.append('consultantId', cId);
            
            if (targetFolderId) {
                formData.append('folderId', targetFolderId);
            }

            // [중요 수정] 타임아웃을 제거하여 폴더 경로가 확실히 생성된 후 업로드 진행 (파일이 밖에 생기는 문제 해결)
            try {
                if (targetFolderId) {
                    const targetFolder = folders.find(f => f.id === targetFolderId);
                    if (targetFolder?.driveFolderId) {
                        formData.append('driveParentId', targetFolder.driveFolderId);
                    }
                } else {
                    const driveParentId = await ensureDrivePath(finalCategory, cId);
                    if (driveParentId) {
                        formData.append('driveParentId', driveParentId);
                    }
                }
            } catch (e) {
                console.warn('[Upload] Drive path resolution failed, but continuing with Firestore save:', e);
            }

            const idToken = await auth.currentUser?.getIdToken();
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${idToken}` },
                body: formData,
            });
            const result = await response.json();
            
            if (result.success) {
                setFiles(prev => [result.data, ...prev]);
                
                setExpandedNodes(prev => {
                    const next = new Set(prev);
                    next.add(result.data.category);
                    if (targetFolderId) next.add(targetFolderId);
                    return next;
                });

                // 업로드 완료 → 메모 모달 띄우기
                setUploadedFileForMemo(result.data);
                setUploadMemoValue('');
                
                showToast(`✅ ${file.name} 업로드 완료!`);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            console.error("Upload error:", error);
            const errorMsg = error.message || '업로드 중 오류가 발생했습니다.';
            showToast(`❌ 업로드 실패: ${errorMsg}`);
        }
    };



    const handleEditGrade = (record: GradeRecord) => {
        setGradeForm({
            examType: record.examType,
            year: record.year,
            studentGrade: record.studentGrade || 1,
            semester: record.semester || 1,
            examPeriod: record.examPeriod || '중간고사',
            month: record.month || 3,
            subjects: record.subjects.map(s => ({...s}))
        });
        setEditGradeId(record.id);
        setIsEditingGrade(true);
        setShowGradeForm(true);
        setActiveTab('grades');
    };

    const handleSaveGrade = async () => {
        const validSubjects = gradeForm.subjects.filter(s => s.name.trim());
        if (validSubjects.length === 0) {
            showToast('⚠️ 최소 하나의 과목을 입력하세요.');
            return;
        }

        try {
            const gradeData: Omit<GradeRecord, 'id' | 'createdAt'> = {
                studentId: id,
                examType: gradeForm.examType,
                year: gradeForm.year,
                studentGrade: gradeForm.studentGrade,
                semester: gradeForm.examType === '내신' ? gradeForm.semester : null,
                examPeriod: gradeForm.examType === '내신' ? gradeForm.examPeriod : null,
                month: gradeForm.examType === '모의고사' ? gradeForm.month : null,
                subjects: validSubjects,
            };

            if (isEditingGrade && editGradeId) {
                // Update existing record
                await studentService.updateGrade(editGradeId, gradeData);
                // Refresh data
                const updatedGrades = await studentService.getGrades(id);
                setGrades(updatedGrades);
                showToast('✅ 성적이 수정되었습니다.');
            } else {
                // Add new record
                const newId = await studentService.addGrade(gradeData);
                const fullGrade: GradeRecord = {
                    ...gradeData,
                    id: newId,
                    createdAt: new Date().toISOString(),
                } as GradeRecord;
                setGrades([fullGrade, ...grades]);
                showToast('✅ 성적이 저장되었습니다.');
            }

            setShowGradeForm(false);
            setIsEditingGrade(false);
            setEditGradeId(null);
            setGradeForm({
                examType: '내신',
                year: new Date().getFullYear(),
                studentGrade: student?.grade || 1,
                semester: 1,
                examPeriod: '중간고사',
                month: 3,
                subjects: [{ name: '', score: null, grade: null }],
            });
            showToast('✅ 성적이 저장되었습니다.');
        } catch (error) {
            console.error("Error saving grade:", error);
            showToast("성적 저장 중 오류가 발생했습니다.");
        }
    };

    const handleDeleteGrade = async (gradeId: string) => {
        if (userRole === 'manager') {
            showToast('❌ 삭제 권한이 없습니다.');
            return;
        }
        if (confirm('성적 기록을 삭제하시겠습니까?')) {
            try {
                await studentService.deleteGrade(gradeId);
                setGrades(grades.filter(g => g.id !== gradeId));
                showToast('🗑️ 성적 기록이 삭제되었습니다.');
            } catch (error) {
                console.error("Error deleting grade:", error);
                showToast("성적 삭제 중 오류가 발생했습니다.");
            }
        }
    };

    const addGradeSubject = () => {
        setGradeForm({
            ...gradeForm,
            subjects: [...gradeForm.subjects, { name: '', score: undefined, grade: undefined }],
        });
    };

    const removeGradeSubject = (idx: number) => {
        if (gradeForm.subjects.length <= 1) return;
        setGradeForm({
            ...gradeForm,
            subjects: gradeForm.subjects.filter((_, i) => i !== idx),
        });
    };

    const handleSearch = () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        const q = searchQuery.trim().toLowerCase();

        setTimeout(() => {
            // 성적/평균/내신/점수 관련 질문 감지
            const isGradeQuery = ['성적', '점수', '평균', '등급', '내신', '모의', '중간', '기말', '몇점', '몇 점', '알려줘', '알려줄래'].some(k => q.includes(k));
            // 활동/메모 관련 질문 감지
            const isActivityQuery = ['활동', '동아리', '봉사', '대회', '경시', '멘토', '발표', '탐구', '리더십', '진로'].some(k => q.includes(k));

            if (isGradeQuery) {
                // 질문에서 과목명 추출
                const allSubjectNames = Array.from(new Set(grades.flatMap(g => g.subjects.map(s => s.name))));
                const mentionedSubjects = allSubjectNames.filter(name => q.includes(name.toLowerCase().replace(/[ⅰⅱ]/gi, '')));
                // 일반적인 과목명 매칭
                const shortNameMap: Record<string, string[]> = { '국어': ['국어'], '수학': ['수학'], '영어': ['영어'], '물리': ['물리학Ⅰ', '물리학Ⅱ'], '화학': ['화학Ⅰ', '화학Ⅱ'] };
                for (const [short, full] of Object.entries(shortNameMap)) {
                    if (q.includes(short) && !mentionedSubjects.some(m => full.includes(m))) {
                        mentionedSubjects.push(...full.filter(f => allSubjectNames.includes(f)));
                    }
                }
                const targetSubjects = mentionedSubjects.length > 0 ? [...new Set(mentionedSubjects)] : allSubjectNames;

                // 내신 성적만 필터
                const naesinGrades = grades.filter(g => g.examType === '내신');
                const sources: { text: string; category: string }[] = [];

                let answerLines: string[] = [`"${searchQuery}"에 대한 검색 결과입니다.\n`];
                answerLines.push(`📊 ${student.name} 학생의 내신 성적 분석:\n`);

                for (const subName of targetSubjects) {
                    const records = naesinGrades
                        .filter(g => g.subjects.some(s => s.name === subName))
                        .sort((a, b) => {
                            const keyA = a.year * 100 + (a.semester || 0) * 10 + (a.examPeriod === '기말고사' ? 1 : 0);
                            const keyB = b.year * 100 + (b.semester || 0) * 10 + (b.examPeriod === '기말고사' ? 1 : 0);
                            return keyA - keyB;
                        });

                    if (records.length === 0) continue;

                    const scores = records.map(r => {
                        const sub = r.subjects.find(s => s.name === subName);
                        return { score: sub?.score, grade: sub?.grade, label: `${r.year} ${r.semester}학기 ${r.examPeriod || ''}`.trim() };
                    });

                    const validScores = scores.filter(s => s.score !== undefined);
                    const avg = validScores.length > 0 ? (validScores.reduce((sum, s) => sum + (s.score || 0), 0) / validScores.length).toFixed(1) : '-';

                    answerLines.push(`\n**${subName}**`);
                    scores.forEach(s => {
                        answerLines.push(`  • ${s.label}: ${s.score !== undefined ? `${s.score}점` : '-'}${s.grade !== undefined ? ` (${s.grade}등급)` : ''}`);
                    });
                    answerLines.push(`  → 평균: ${avg}점`);
                    sources.push({ text: `${subName} 내신 성적 ${records.length}건`, category: '성적표' });
                }

                if (sources.length === 0) {
                    answerLines.push('\n해당 과목의 성적 기록을 찾지 못했습니다.');
                }

                setSearchResult({ answer: answerLines.join('\n'), sources });
            } else if (isActivityQuery) {
                // 메모/파일에서 키워드 검색
                const matchedMemos = memos.filter(m =>
                    m.content.toLowerCase().includes(q) ||
                    m.tags.some(t => q.includes(t.toLowerCase())) ||
                    m.category.toLowerCase().includes(q) ||
                    q.split(/\s+/).some(w => w.length >= 2 && (m.content.includes(w) || m.tags.some(t => t.includes(w))))
                );
                const matchedFiles = files.filter(f =>
                    f.fileName.toLowerCase().includes(q) ||
                    f.tags.some(t => q.includes(t.toLowerCase())) ||
                    (f.summary && q.split(/\s+/).some(w => w.length >= 2 && f.summary!.includes(w)))
                );

                let answerLines: string[] = [`"${searchQuery}"에 대한 검색 결과입니다.\n`];
                answerLines.push(`${student.name} 학생의 활동 기록에서 관련 내용을 찾았습니다:\n`);
                const sources: { text: string; category: string }[] = [];

                if (matchedMemos.length > 0) {
                    matchedMemos.forEach((m, i) => {
                        answerLines.push(`${i + 1}. ${m.content} [출처 ${sources.length + 1}]`);
                        sources.push({ text: m.content.slice(0, 50) + '...', category: m.category });
                    });
                }
                if (matchedFiles.length > 0) {
                    matchedFiles.forEach(f => {
                        answerLines.push(`\n📄 관련 파일: ${f.fileName}`);
                        if (f.summary) answerLines.push(`   요약: ${f.summary}`);
                        sources.push({ text: f.fileName, category: f.category });
                    });
                }
                if (matchedMemos.length === 0 && matchedFiles.length === 0) {
                    // 전체 메모 중 가장 관련성 높은 것 보여주기
                    answerLines.push('정확히 일치하는 기록은 없지만, 아래 활동 기록을 참고해주세요:\n');
                    memos.slice(0, 3).forEach((m, i) => {
                        answerLines.push(`${i + 1}. [${m.category}] ${m.content}`);
                        sources.push({ text: m.content.slice(0, 50) + '...', category: m.category });
                    });
                }

                setSearchResult({ answer: answerLines.join('\n'), sources });
            } else {
                // 범용 검색
                const sources: { text: string; category: string }[] = [];
                let answerLines: string[] = [`"${searchQuery}"에 대한 종합 검색 결과입니다.\n`];
                answerLines.push(`📋 ${student.name} 학생 종합 현황:\n`);
                answerLines.push(`• 학교: ${student.school} (${student.grade}학년)`);
                answerLines.push(`• 목표: ${student.targetUniv} ${student.targetMajor}`);
                answerLines.push(`• 메모: ${memos.length}건 / 파일: ${files.length}건 / 성적 기록: ${grades.length}건\n`);

                const keywords = q.split(/[\s,，.。]+/).filter(w => w.length >= 2);
                const matchedMemos = memos.filter(m =>
                    keywords.some(k => m.content.includes(k) || m.tags.some(t => t.includes(k)))
                );

                if (matchedMemos.length > 0) {
                    answerLines.push('📝 관련 메모:');
                    matchedMemos.forEach((m, i) => {
                        answerLines.push(`${i + 1}. [${m.category}] ${m.content}`);
                        sources.push({ text: m.content.slice(0, 50) + '...', category: m.category });
                    });
                }

                setSearchResult({ answer: answerLines.join('\n'), sources });
            }

            setIsSearching(false);
        }, 1200);
    };

    const handleSaveEdit = async () => {
        try {
            const updatedData = {
                ...editForm,
                classNumber: editForm.classNumber === '' ? null : Number(editForm.classNumber),
                studentNumber: editForm.studentNumber === '' ? null : Number(editForm.studentNumber),
                updatedAt: new Date().toISOString(),
            };

            await studentService.updateStudent(student!.id, updatedData);
            setStudent({ ...student!, ...updatedData });

            showToast(`✅ ${editForm.name} 학생 정보가 수정되었습니다.`);
            setShowEditModal(false);
        } catch (error) {
            console.error("Error updating student profile:", error);
            showToast("학생 정보 수정 중 오류가 발생했습니다.");
        }
    };

    const handleSaveBook = async () => {
        if (!bookForm.title.trim()) {
            showToast('⚠️ 도서 제목을 입력하세요.');
            return;
        }

        try {
            const bookData: Omit<BookRecord, 'id' | 'createdAt'> = {
                studentId: student!.id,
                title: bookForm.title,
                author: bookForm.author,
                imageUrl: bookForm.imageUrl || 'https://via.placeholder.com/150',
                subject: bookForm.subject,
                studentGrade: bookForm.studentGrade,
                memo: bookForm.memo,
            };

            const newId = await studentService.addBook(bookData);
            const fullBook: BookRecord = {
                ...bookData,
                id: newId,
                createdAt: new Date().toISOString(),
            };
            setBooks([fullBook, ...books]);

            setShowBookForm(false);
            setBookForm({ title: '', author: '', imageUrl: '', subject: '', studentGrade: student?.grade || 1, memo: '' });
            showToast('📚 도서 기록이 저장되었습니다.');
        } catch (error) {
            console.error("Error adding book:", error);
            showToast("도서 기록 저장 중 오류가 발생했습니다.");
        }
    };

    const handleDeleteBook = async (bookId: string) => {
        if (userRole === 'manager') {
            showToast('❌ 삭제 권한이 없습니다.');
            return;
        }
        if (confirm('도서 기록을 삭제하시겠습니까?')) {
            try {
                await studentService.deleteBook(bookId);
                setBooks(books.filter(b => b.id !== bookId));
                showToast('🗑️ 도서 기록이 삭제되었습니다.');
            } catch (error) {
                console.error("Error deleting book:", error);
                showToast("도서 삭제 중 오류가 발생했습니다.");
            }
        }
    };

    const handleSaveResource = async () => {
        if (!resourceForm.subjectName.trim()) {
            showToast('과목명을 입력하세요.');
            return;
        }

        try {
            const links = resourceForm.linkLabel && resourceForm.linkUrl ? [{ label: resourceForm.linkLabel, url: resourceForm.linkUrl }] : [];
            const resourceData: Omit<SubjectResource, 'id'> = {
                studentId: student!.id,
                subjectName: resourceForm.subjectName,
                publisher: resourceForm.publisher,
                links,
                files: [],
            };

            const newId = await studentService.addResource(resourceData);
            setResources([...resources, { id: newId, ...resourceData }]);
            setResourceForm({ subjectName: '', publisher: '', linkLabel: '', linkUrl: '' });
            setShowResourceForm(false);
            showToast('✅ 교과 리소스가 추가되었습니다.');
        } catch (error) {
            console.error("Error adding resource:", error);
            showToast("리소스 저장 중 오류가 발생했습니다.");
        }
    };

    const handleDeleteResource = async (resourceId: string) => {
        if (userRole === 'manager') {
            showToast('❌ 삭제 권한이 없습니다.');
            return;
        }
        if (confirm('교과 리소스를 삭제하시겠습니까?')) {
            try {
                await studentService.deleteResource(resourceId);
                setResources(resources.filter(r => r.id !== resourceId));
                showToast('🗑️ 리소스가 삭제되었습니다.');
            } catch (error) {
                console.error("Error deleting resource:", error);
                showToast("리소스 삭제 중 오류가 발생했습니다.");
            }
        }
    };

    // ============ RENDER ============
    if (loading) {
        return <div style={{ textAlign: 'center', padding: '100px' }}><Loader2 className="spinner" size={40} /></div>;
    }
    if (fetchError || !student) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <h2 style={{ marginBottom: '20px' }}>학생 정보를 찾을 수 없습니다</h2>
                <Link href="/dashboard/students" className="btn btn-primary">목록으로 돌아가기</Link>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: 'var(--space-2xl)' }}>
            <div style={{ marginBottom: 'var(--space-md)' }}>
                <Link 
                    href="/dashboard/students" 
                    style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: 'var(--space-xs)', 
                        color: 'var(--text-muted)', 
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                    <ArrowLeft size={16} />
                    학생 목록으로 돌아가기
                </Link>
            </div>
            {/* Student Profile Header */}
            <div className="card-glass" style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', padding: 'var(--space-xl)', flexWrap: 'wrap' }}>
                <div className="avatar avatar-lg" style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))', color: 'white', fontWeight: 700, fontSize: '1.5rem', width: 72, height: 72 }}>
                    {student.name.slice(1) || student.name}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{student.name}</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2px' }}>
                        {student.school} · {student.grade}학년{student.classNumber ? ` ${student.classNumber}반` : ''}{student.studentNumber ? ` ${student.studentNumber}번` : ''}
                    </p>
                    <div style={{ marginTop: 'var(--space-sm)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>학생 메모</div>
                        <div style={{ 
                            fontSize: '0.9rem', 
                            color: student.studentMemo ? 'var(--text-secondary)' : 'rgba(255,255,255,0.2)',
                            lineHeight: 1.5,
                            maxWidth: '600px'
                        }}>
                            {student.studentMemo || '기록된 학생 메모가 없습니다.'}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => showToast('보고서 생성 기능은 보고서 페이지에서 이용 가능합니다.')}>보고서 생성</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => {
                        const url = `${window.location.origin}/parent/${student.parentPortalToken || ''}`;
                        navigator.clipboard.writeText(url).then(() => { setPortalCopied(true); setTimeout(() => setPortalCopied(false), 2000); });
                        showToast('학부모 공유 링크가 클립보드에 복사되었습니다.');
                    }}>{portalCopied ? '복사됨' : '학부모 링크'}</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(true)}>수정</button>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ overflowX: 'auto' }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ===== OVERVIEW TAB ===== */}
            {activeTab === 'overview' && (
                <div className="grid-2" style={{ gap: 'var(--space-lg)', minWidth: 0 }}>
                    <div className="card" style={{ minWidth: 0 }}>
                        <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>최근 업데이트</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
                            {recentActivities.map((act) => (
                                <div 
                                    key={`${act.type}-${act.id}`} 
                                    className="activity-item-clickable"
                                    onClick={() => {
                                        const tabMap: Record<string, Tab> = { '성적': 'grades', '파일': 'files', '도서': 'books', '메모': 'memos' };
                                        setActiveTab(tabMap[act.type] || 'overview');
                                    }}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '12px', 
                                        fontSize: '0.85rem', 
                                        padding: '10px 8px',
                                        borderRadius: 'var(--radius-sm)',
                                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        position: 'relative',
                                        minWidth: 0,
                                        overflow: 'hidden'
                                    }}
                                >
                                    <span style={{ 
                                        padding: '2px 8px', 
                                        borderRadius: '4px', 
                                        fontSize: '0.7rem', 
                                        background: act.type === '성적' ? 'rgba(59, 130, 246, 0.1)' : 
                                                    act.type === '파일' ? 'rgba(16, 185, 129, 0.1)' :
                                                    act.type === '도서' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: act.type === '성적' ? '#60a5fa' : 
                                               act.type === '파일' ? '#34d399' :
                                               act.type === '도서' ? '#a78bfa' : '#fbbf24',
                                        width: '45px',
                                        textAlign: 'center'
                                    }}>
                                        {act.type}
                                    </span>
                                    <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)' }}>
                                        {act.content}
                                        {act.semester && <span style={{ fontSize: '0.7rem', opacity: 0.5, marginLeft: '6px' }}>({act.semester})</span>}
                                    </span>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                                        {new Date(act.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            ))}
                            {recentActivities.length === 0 && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 'var(--space-md)' }}>
                                    최근 활동 기록이 없습니다.
                                </p>
                            )}
                            {allActivities.length > 5 && (
                                <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('log')} style={{ alignSelf: 'center', marginTop: 'var(--space-sm)' }}>더보기</button>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                            <h3 className="card-title" style={{ marginBottom: 0 }}>성적 추이</h3>
                            <button className="btn btn-ghost btn-xs" onClick={() => setActiveTab('grades')} style={{ fontSize: '0.75rem', padding: '4px 8px', border: '1px solid var(--border-color)' }}>
                                그래프 설정
                            </button>
                        </div>
                        <div style={{ height: 220 }}>
                            <Line data={lineChartData} options={{...lineChartOptions, maintainAspectRatio: false}} />
                        </div>
                    </div>

                    {/* Teacher Memo */}
                    <div className="card" style={{ cursor: isEditingTeacherMemo ? 'default' : 'pointer' }} onClick={() => { if (!isEditingTeacherMemo) { setIsEditingTeacherMemo(true); setTeacherMemoValue(student.teacherMemo || ''); } }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                            <h3 className="card-title" style={{ marginBottom: 0 }}>담임교사 메모</h3>
                            {!isEditingTeacherMemo && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>클릭하여 수정</span>}
                        </div>
                        
                        {isEditingTeacherMemo ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                <textarea 
                                    className="form-textarea" 
                                    value={teacherMemoValue} 
                                    onChange={(e) => setTeacherMemoValue(e.target.value)}
                                    autoFocus
                                    style={{ minHeight: '120px', fontSize: '0.9rem' }}
                                />
                                <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setIsEditingTeacherMemo(false); }}>취소</button>
                                    <button className="btn btn-primary btn-sm" onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                            await studentService.updateStudent(student.id, { teacherMemo: teacherMemoValue });
                                            setStudent({ ...student, teacherMemo: teacherMemoValue });
                                            setIsEditingTeacherMemo(false);
                                            showToast('✅ 메모가 업데이트되었습니다.');
                                        } catch (err) {
                                            showToast('❌ 업데이트 실패');
                                        }
                                    }}>저장</button>
                                </div>
                            </div>
                        ) : (
                            student.teacherMemo ? (
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, padding: 'var(--space-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent-500)', wordBreak: 'break-all', overflowWrap: 'break-word' }}>
                                    {student.teacherMemo}
                                </p>
                            ) : (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: 'var(--space-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                    담임교사 메모가 없습니다. 클릭해서 내용을 작성하세요.
                                </p>
                            )
                        )}
                    </div>

                    {/* Timetable */}
                    <div className="card" style={{ gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                            <h3 className="card-title" style={{ marginBottom: 0 }}>📅 주간 시간표</h3>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => handleScanImage('timetable')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Brain size={14} /> AI 사진 인식
                                </button>
                                <button className="btn btn-primary btn-sm" onClick={async () => {
                                    try {
                                        await studentService.updateStudent(student.id, { timetableData });
                                        showToast('✅ 시간표가 저장되었습니다.');
                                    } catch (err) {
                                        showToast('❌ 저장 실패');
                                    }
                                }}>저장</button>
                            </div>
                        </div>
                        
                        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                            <table className="table" style={{ borderCollapse: 'separate', borderSpacing: '4px', minWidth: '600px' }}>
                                <thead>
                                    <tr>
                                        <th style={{ background: 'transparent', width: '60px' }}></th>
                                        {['월', '화', '수', '목', '금'].map(day => (
                                            <th key={day} style={{ textAlign: 'center', padding: '10px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>{day}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4, 5, 6, 7].map(period => (
                                        <tr key={period}>
                                            <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)' }}>{period}</td>
                                            {['월', '화', '수', '목', '금'].map(day => (
                                                <td key={`${day}-${period}`} style={{ padding: 0 }}>
                                                    <input 
                                                        className="form-input" 
                                                        value={timetableData[day]?.[period - 1] || ''} 
                                                        onChange={(e) => {
                                                            const newData = { ...timetableData };
                                                            if (!newData[day]) newData[day] = ['', '', '', '', '', '', ''];
                                                            newData[day][period - 1] = e.target.value;
                                                            setTimetableData(newData);
                                                        }}
                                                        placeholder="-"
                                                        style={{ textAlign: 'center', border: 'none', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
                            * 사진 인식 후 정확하지 않은 부분은 직접 클릭해서 수정하세요.
                        </p>
                    </div>

                </div>
            )}

            {/* ===== MEMOS TAB ===== */}
            {activeTab === 'memos' && (
                <div>
                    <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                        <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>새 메모 작성</h3>
                        <textarea
                            className="form-textarea"
                            placeholder="상담 메모, 활동 기록 등을 입력하세요..."
                            value={newMemo}
                            onChange={(e) => setNewMemo(e.target.value)}
                            style={{ minHeight: 100 }}
                        />
                        <div className="grid-2" style={{ marginTop: 'var(--space-sm)', gap: 'var(--space-sm)' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <select className="form-select" value={memoCategory} onChange={(e) => setMemoCategory(e.target.value)}>
                                    <option>수행평가</option>
                                    <option>자율활동</option>
                                    <option>진로활동</option>
                                    <option>봉사활동</option>
                                    <option>동아리</option>
                                    <option>기타</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <input className="form-input" placeholder="태그 (쉼표 구분)" value={memoTags} onChange={(e) => setMemoTags(e.target.value)} />
                            </div>
                        </div>
                        <button className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }} onClick={handleAddMemo}>
                            메모 저장
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {memos.map((memo) => (
                            <div key={memo.id} className="card" style={{ borderLeft: '3px solid var(--primary-500)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                                    <span className="tag tag-green">{memo.category}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            {new Date(memo.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditingMemoId(memo.id); setEditMemoContent(memo.content); }} style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }} title="메모 수정"><Pencil size={14} /></button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteMemo(memo.id)} style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }} title="메모 삭제">🗑️</button>
                                        </div>
                                    </div>
                                </div>
                                {editingMemoId === memo.id ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                        <textarea
                                            className="form-textarea"
                                            value={editMemoContent}
                                            onChange={(e) => setEditMemoContent(e.target.value)}
                                            style={{ minHeight: '80px', fontSize: '0.9rem' }}
                                            autoFocus
                                        />
                                        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingMemoId(null)}>취소</button>
                                            <button className="btn btn-primary btn-sm" onClick={async () => {
                                                try {
                                                    await studentService.updateMemo(memo.id, { content: editMemoContent });
                                                    setMemos(memos.map(m => m.id === memo.id ? { ...m, content: editMemoContent } : m));
                                                    setEditingMemoId(null);
                                                    showToast('✅ 메모가 수정되었습니다.');
                                                } catch (err) {
                                                    showToast('❌ 수정 실패');
                                                }
                                            }}>저장</button>
                                        </div>
                                    </div>
                                ) : (
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, wordBreak: 'break-all', overflowWrap: 'break-word' }}>
                                        {memo.content}
                                    </p>
                                )}
                                <div style={{ display: 'flex', gap: '6px', marginTop: 'var(--space-sm)' }}>
                                    {memo.tags.map((tag) => (
                                        <span key={tag} className="tag tag-gray" style={{ fontSize: '0.7rem' }}>#{tag}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {memos.length === 0 && (
                            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                                <FileText size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.3, margin: '0 auto' }} />
                                <p style={{ color: 'var(--text-muted)' }}>아직 작성된 메모가 없습니다. 위에서 메모를 작성해보세요.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== FILES TAB (MIND MAP) ===== */}
            {activeTab === 'files' && (
                <div>
                    {/* Controls */}
                    <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select className="form-select" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} style={{ width: 140 }}>
                            {[1, 2, 3].map(g => [1, 2].map(s => <option key={`${g}-${s}`} value={`${g}-${s}`}>{g}학년 {s}학기</option>)).flat()}
                        </select>
                        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                            <button className={`btn btn-sm ${mindmapView === 'mindmap' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMindmapView('mindmap')}>마인드맵</button>
                            <button className={`btn btn-sm ${mindmapView === 'list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMindmapView('list')}>리스트</button>
                        </div>
                        <button className="btn btn-sm btn-secondary" onClick={() => fileInputRef.current?.click()}>파일 업로드</button>
                        <input ref={fileInputRef} type="file" accept=".pdf,.hwp,.doc,.docx,.txt,.jpg,.png,.pptx,.xlsx" style={{ display: 'none' }} onChange={(e) => { 
                            const f = e.target.files?.[0]; 
                            if (f) handleFileUpload(f);
                            e.target.value = ''; 
                        }} />
                    </div>

                    {/* Active File Dashboard (선택된 파일 정보) */}
                    {selectedFileForDetail && (
                        <div className="card-glass" style={{ 
                            marginBottom: 'var(--space-xl)', 
                            padding: 'var(--space-xl)', 
                            border: '1px solid var(--primary-600)',
                            boxShadow: '0 0 40px rgba(99, 102, 241, 0.25)',
                            animation: 'slideDown 0.3s ease-out'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>선택된 파일</div>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 700 }}>
                                        <File size={22} color="var(--primary-400)" />
                                        {selectedFileForDetail.fileName}
                                    </h3>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        {selectedFileForDetail.category} · {new Date(selectedFileForDetail.uploadedAt).toLocaleString('ko-KR')} 업로드
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <a 
                                        href={selectedFileForDetail.driveFileId ? `https://drive.google.com/file/d/${selectedFileForDetail.driveFileId}/view` : '#'} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn btn-primary btn-sm"
                                        style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '8px', 
                                            height: '36px', 
                                            padding: '0 16px',
                                            background: 'var(--accent-500)',
                                            borderColor: 'var(--accent-400)',
                                            fontWeight: 700,
                                            boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)'
                                        }}
                                        onClick={(e) => {
                                            if (!selectedFileForDetail.driveFileId) {
                                                e.preventDefault();
                                                showToast('⚠️ 드라이브 연결 정보를 찾는 중입니다. 잠시 후 다시 시도해 주세요.');
                                            }
                                        }}
                                    >
                                        <ExternalLink size={16} /> 드라이브 미리보기
                                    </a>
                                    <button className="btn btn-ghost btn-sm" style={{ padding: '8px' }} onClick={() => { 
                                        // 닫을 때 변경사항 있으면 저장
                                        if (editingFileMemoValue !== selectedFileForDetail.summary) {
                                            studentService.updateFile(selectedFileForDetail.id, { summary: editingFileMemoValue });
                                            setFiles(prev => prev.map(f => f.id === selectedFileForDetail.id ? { ...f, summary: editingFileMemoValue } : f));
                                        }
                                        setSelectedFileForDetail(null); 
                                        setIsEditingFileMemo(false); 
                                    }}><X size={24} /></button>
                                </div>
                            </div>
                            
                            <div style={{ width: '100%' }}>
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                    <FileText size={16} /> 파일 메모
                                </label>
                                <textarea
                                    className="form-textarea"
                                    value={editingFileMemoValue}
                                    onChange={(e) => setEditingFileMemoValue(e.target.value)}
                                    onBlur={() => {
                                        // 포커스 벗어날 때 자동 저장
                                        if (editingFileMemoValue !== selectedFileForDetail.summary) {
                                            studentService.updateFile(selectedFileForDetail.id, { summary: editingFileMemoValue });
                                            setFiles(prev => prev.map(f => f.id === selectedFileForDetail.id ? { ...f, summary: editingFileMemoValue } : f));
                                            setSelectedFileForDetail({ ...selectedFileForDetail, summary: editingFileMemoValue });
                                        }
                                    }}
                                    placeholder="파일 메모를 여기에 바로 입력하세요... (입력 후 다른 곳을 클릭하면 자동 저장됩니다)"
                                    style={{ minHeight: '120px', fontSize: '0.98rem', lineHeight: 1.7, width: '100%' }}
                                />
                            </div>
                        </div>
                    )}
                    {/* Mind Map View */}
                    {mindmapView === 'mindmap' && (
                        <div className="card mindmap-container">
                            <div className="tree">
                                <ul style={{ marginLeft: 0, paddingLeft: 0 }}>
                                    {FILE_CATEGORIES.map((cat) => {
                                        const catColors: Record<string, string> = { '교과활동': '#6366f1', '자율활동': '#10b981', '진로활동': '#f59e0b', '동아리': '#8b5cf6', '행특': '#ec4899', '수업량유연화': '#14b8a6', '수상경력': '#f97316', '봉사활동': '#06b6d4', '도서': '#a855f7' };
                                        const isExpanded = expandedNodes.has(cat);
                                        return (
                                            <li key={cat} style={{ marginBottom: '4px' }}>
                                                <div className={`tree-node-content ${dragOverId === cat ? 'drag-over' : ''}`}
                                                    onClick={(e) => { e.stopPropagation(); const next = new Set(expandedNodes); if (next.has(cat)) next.delete(cat); else next.add(cat); setExpandedNodes(next); }}
                                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverId(cat); }}
                                                    onDragLeave={() => setDragOverId(null)}
                                                    onDrop={(e) => { 
                                                        e.preventDefault(); 
                                                        e.stopPropagation(); 
                                                        setDragOverId(null); 
                                                        if (draggingFileId) {
                                                            handleMoveFile(draggingFileId, cat, null);
                                                            setDraggingFileId(null);
                                                        } else if (draggingFolderId) {
                                                            handleMoveFolder(draggingFolderId, null, cat);
                                                            setDraggingFolderId(null);
                                                        } else {
                                                            const file = e.dataTransfer.files[0]; 
                                                            if (file) { handleFileUpload(file, cat, null); } 
                                                        }
                                                    }}
                                                    style={{ borderLeftColor: catColors[cat], borderLeftWidth: '4px' }}
                                                >
                                                    <span style={{ color: catColors[cat] || 'var(--text-primary)', fontWeight: 700, minWidth: '80px', textAlign: 'left' }}>{cat}</span>
                                                </div>
                                                {isExpanded && renderFolder(cat, null)}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* List View */}
                    {mindmapView === 'list' && (
                        <div className="table-wrapper">
                            <table className="table">
                                <thead><tr><th>파일명</th><th>카테고리</th><th>태그</th><th>업로드일</th><th>작업</th></tr></thead>
                                <tbody>
                                    {files.map((file) => (
                                        <tr key={file.id} style={{ cursor: 'pointer' }} onClick={() => {
                                            setSelectedFileForDetail(file);
                                            setEditingFileMemoValue(file.summary || '');
                                            setIsEditingFileMemo(false);
                                        }}>
                                            <td><div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}><File size={16} /><span style={{ fontWeight: 500 }}>{file.fileName}</span></div></td>
                                            <td><span className="tag tag-blue">{file.category}</span></td>
                                            <td><div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>{file.tags.map((t) => <span key={t} className="tag tag-gray" style={{ fontSize: '0.68rem' }}>#{t}</span>)}</div></td>
                                            <td style={{ fontSize: '0.82rem' }}>{new Date(file.uploadedAt).toLocaleDateString('ko-KR')}</td>
                                            <td>
                                                {userRole !== 'manager' && (
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteFile(file.id, file.fileName)} style={{ color: 'var(--danger-400)' }}><Trash2 size={16} /></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {files.length === 0 && <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)', marginTop: 'var(--space-md)' }}><p style={{ color: 'var(--text-muted)' }}>업로드된 파일이 없습니다.</p></div>}
                        </div>
                    )}
                </div>
            )}

            {/* ===== GRADES TAB ===== */}
            {activeTab === 'grades' && (
                <div>
                    <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                        <div className="card-header">
                            <h3 className="card-title">📈 성적 추이 차트</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>최소</label>
                                    <input type="number" className="form-input" value={chartMinY} onChange={(e) => setChartMinY(Number(e.target.value))} style={{ width: 60, padding: '4px 8px', fontSize: '0.8rem' }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>최대</label>
                                    <input type="number" className="form-input" value={chartMaxY} onChange={(e) => setChartMaxY(Number(e.target.value))} style={{ width: 60, padding: '4px 8px', fontSize: '0.8rem' }} />
                                </div>
                            </div>
                        </div>
                        <div style={{ height: 350 }}>
                            <Line data={lineChartData} options={lineChartOptions} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                        <h3 style={{ fontWeight: 700 }}>성적 기록</h3>
                        <button className="btn btn-primary" onClick={() => setShowGradeForm(!showGradeForm)}>
                            {showGradeForm ? '닫기' : '성적 입력'}
                        </button>
                    </div>

                    {showGradeForm && (
                        <div className="card" style={{ marginBottom: 'var(--space-lg)', borderTop: '4px solid var(--primary-500)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                                <h4 className="card-title" style={{ marginBottom: 0 }}>성적 입력</h4>
                                <button className="btn btn-secondary btn-sm" onClick={() => handleScanImage('grade')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Brain size={16} /> 성적표 사진 스캔
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                                <div className="form-group">
                                    <label className="form-label">시험 유형</label>
                                    <select className="form-select" value={gradeForm.examType} onChange={(e) => setGradeForm({ ...gradeForm, examType: e.target.value as '내신' | '모의고사' })}>
                                        <option value="내신">내신</option>
                                        <option value="모의고사">모의고사</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">학년</label>
                                    <select className="form-select" value={gradeForm.studentGrade} onChange={(e) => setGradeForm({ ...gradeForm, studentGrade: Number(e.target.value) })}>
                                        <option value={1}>1학년</option>
                                        <option value={2}>2학년</option>
                                        <option value={3}>3학년</option>
                                    </select>
                                </div>
                                {gradeForm.examType === '내신' ? (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">학기</label>
                                            <select className="form-select" value={gradeForm.semester} onChange={(e) => setGradeForm({ ...gradeForm, semester: Number(e.target.value) })}>
                                                <option value={1}>1학기</option>
                                                <option value={2}>2학기</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">시험 구분</label>
                                            <select className="form-select" value={gradeForm.examPeriod} onChange={(e) => setGradeForm({ ...gradeForm, examPeriod: e.target.value as '중간고사' | '기말고사' })}>
                                                <option value="중간고사">중간고사</option>
                                                <option value="기말고사">기말고사</option>
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">시행 월</label>
                                            <select className="form-select" value={gradeForm.month} onChange={(e) => setGradeForm({ ...gradeForm, month: Number(e.target.value) })}>
                                                {[3,4,6,7,9,10,11].map(m => (
                                                    <option key={m} value={m}>{m}월</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">시행 년도</label>
                                            <input type="number" className="form-input" value={gradeForm.year} onChange={(e) => setGradeForm({ ...gradeForm, year: Number(e.target.value) })} />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)', alignItems: 'center' }}>
                                    <label className="form-label" style={{ marginBottom: 0 }}>과목별 성적</label>
                                    <button className="btn btn-ghost btn-sm" onClick={addGradeSubject}>+ 과목 추가</button>
                                </div>
                                <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                    <table className="table" style={{ minWidth: '800px', margin: 0 }}>
                                        <thead>
                                            <tr style={{ background: 'var(--bg-secondary)' }}>
                                                <th style={{ width: '180px' }}>과목명</th>
                                                <th style={{ width: '80px' }}>원점수</th>
                                                <th style={{ width: '70px' }}>등급</th>
                                                {gradeForm.examType === '내신' ? (
                                                    <>
                                                        <th style={{ width: '110px' }}>석차(동석차)</th>
                                                        <th style={{ width: '90px' }}>수강자수</th>
                                                        <th style={{ width: '90px' }}>과목평균</th>
                                                        <th style={{ width: '90px' }}>표준편차</th>
                                                    </>
                                                ) : (
                                                    <>
                                                        <th style={{ width: '100px' }}>표준점수</th>
                                                        <th style={{ width: '100px' }}>백분위</th>
                                                    </>
                                                )}
                                                <th style={{ width: '50px' }}>삭제</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {gradeForm.subjects.map((sub, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ padding: '8px' }}>
                                                        <input className="form-input" placeholder="국어 I" value={sub.name} onChange={(e) => {
                                                            const s = [...gradeForm.subjects]; s[idx] = { ...s[idx], name: e.target.value }; setGradeForm({ ...gradeForm, subjects: s });
                                                        }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="number" className="form-input" placeholder="0" value={sub.score ?? ''} style={{ textAlign: 'center' }} onChange={(e) => {
                                                            const s = [...gradeForm.subjects]; s[idx] = { ...s[idx], score: e.target.value ? Number(e.target.value) : null }; setGradeForm({ ...gradeForm, subjects: s });
                                                        }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="number" className="form-input" placeholder="0" value={sub.grade ?? ''} style={{ textAlign: 'center' }} onChange={(e) => {
                                                            const s = [...gradeForm.subjects]; s[idx] = { ...s[idx], grade: e.target.value ? Number(e.target.value) : null }; setGradeForm({ ...gradeForm, subjects: s });
                                                        }} />
                                                    </td>
                                                    {gradeForm.examType === '내신' ? (
                                                        <>
                                                            <td style={{ padding: '8px' }}>
                                                                <input className="form-input" placeholder="8(2)" value={sub.rank ?? ''} style={{ textAlign: 'center' }} onChange={(e) => {
                                                                    const s = [...gradeForm.subjects]; s[idx] = { ...s[idx], rank: e.target.value }; setGradeForm({ ...gradeForm, subjects: s });
                                                                }} />
                                                            </td>
                                                            <td style={{ padding: '8px' }}>
                                                                <input type="number" className="form-input" placeholder="332" value={sub.studentCount ?? ''} style={{ textAlign: 'center' }} onChange={(e) => {
                                                                    const s = [...gradeForm.subjects]; s[idx] = { ...s[idx], studentCount: e.target.value ? Number(e.target.value) : null }; setGradeForm({ ...gradeForm, subjects: s });
                                                                }} />
                                                            </td>
                                                            <td style={{ padding: '8px' }}>
                                                                <input type="number" step="0.1" className="form-input" placeholder="71.3" value={sub.average ?? ''} style={{ textAlign: 'center' }} onChange={(e) => {
                                                                    const s = [...gradeForm.subjects]; s[idx] = { ...s[idx], average: e.target.value ? Number(e.target.value) : null }; setGradeForm({ ...gradeForm, subjects: s });
                                                                }} />
                                                            </td>
                                                            <td style={{ padding: '8px' }}>
                                                                <input type="number" step="0.1" className="form-input" placeholder="18.6" value={sub.stdDev ?? ''} style={{ textAlign: 'center' }} onChange={(e) => {
                                                                    const s = [...gradeForm.subjects]; s[idx] = { ...s[idx], stdDev: e.target.value ? Number(e.target.value) : null }; setGradeForm({ ...gradeForm, subjects: s });
                                                                }} />
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td style={{ padding: '8px' }}>
                                                                <input type="number" className="form-input" value={sub.standardScore ?? ''} onChange={(e) => {
                                                                    const s = [...gradeForm.subjects]; s[idx] = { ...s[idx], standardScore: e.target.value ? Number(e.target.value) : null }; setGradeForm({ ...gradeForm, subjects: s });
                                                                }} />
                                                            </td>
                                                            <td style={{ padding: '8px' }}>
                                                                <input type="number" className="form-input" value={sub.percentile ?? ''} onChange={(e) => {
                                                                    const s = [...gradeForm.subjects]; s[idx] = { ...s[idx], percentile: e.target.value ? Number(e.target.value) : null }; setGradeForm({ ...gradeForm, subjects: s });
                                                                }} />
                                                            </td>
                                                        </>
                                                    )}
                                                    <td style={{ padding: '8px', textAlign: 'center' }}>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => removeGradeSubject(idx)} style={{ color: 'var(--danger-400)' }}>✕</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <button className="btn btn-primary w-full" onClick={handleSaveGrade}>📊 성적 저장하기</button>
                        </div>
                    )}

                    {grades.map((record) => (
                        <div key={record.id} className="card" style={{ marginBottom: 'var(--space-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                                <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                                    <span className={`tag ${record.examType === '내신' ? 'tag-blue' : 'tag-yellow'}`}>{record.examType}</span>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                        {record.studentGrade || ''}학년 {record.examType === '내신' ? `${record.semester}학기 ${record.examPeriod || ''}` : `${record.month}월`}
                                    </span>
                                </div>
                                {userRole !== 'manager' && (
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleEditGrade(record)} style={{ color: 'var(--text-muted)' }} title="성적 수정"><Pencil size={16} /></button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteGrade(record.id)} style={{ color: 'var(--danger-400)' }} title="성적 삭제"><Trash2 size={16} /></button>
                                    </div>
                                )}
                            </div>
                            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)' }}>
                                <table className="table" style={{ fontSize: '0.85rem', minWidth: '600px', margin: 0 }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                                            <th style={{ padding: '8px 12px' }}>과목명</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'center' }}>원점수</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'center' }}>등급</th>
                                            {record.examType === '내신' ? (
                                                <>
                                                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>석차(수강자)</th>
                                                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>평균(표차)</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>표준점수</th>
                                                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>백분위</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {record.subjects.map((sub, idx) => (
                                            <tr key={idx} style={{ background: 'var(--bg-card)' }}>
                                                <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>{sub.name}</td>
                                                <td style={{ padding: '8px 12px', textAlign: 'center' }}>{sub.score ?? '-'}</td>
                                                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                                    <span className={`badge ${sub.grade && sub.grade <= 2 ? 'badge-blue' : 'badge-gray'}`} style={{ padding: '2px 8px', borderRadius: '12px' }}>
                                                        {sub.grade || '-'}등급
                                                    </span>
                                                </td>
                                                {record.examType === '내신' ? (
                                                    <>
                                                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{sub.rank || '-'}{sub.studentCount ? ` / ${sub.studentCount}` : ''}</td>
                                                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{sub.average || '-'}{sub.stdDev ? ` (${sub.stdDev})` : ''}</td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{sub.standardScore ?? '-'}</td>
                                                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{sub.percentile ? `${sub.percentile}%` : '-'}</td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                    {grades.length === 0 && (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                            <p style={{ color: 'var(--text-muted)' }}>성적 기록이 없습니다. 위의 &quot;성적 입력&quot; 버튼을 눌러 입력하세요.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ===== BOOKS TAB ===== */}
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
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteBook(book.id)} style={{ color: 'var(--danger-400)' }}><Trash2 size={16} /></button>
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
                        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">과목명 *</label><input className="form-input" placeholder="예: 물리학Ⅱ" value={resourceForm.subjectName} onChange={(e) => setResourceForm({ ...resourceForm, subjectName: e.target.value })} /></div>
                                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">출판사</label><input className="form-input" placeholder="예: 비상교육" value={resourceForm.publisher} onChange={(e) => setResourceForm({ ...resourceForm, publisher: e.target.value })} /></div>
                                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">링크 이름</label><input className="form-input" placeholder="예: EBS 강의" value={resourceForm.linkLabel} onChange={(e) => setResourceForm({ ...resourceForm, linkLabel: e.target.value })} /></div>
                                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">링크 URL</label><input className="form-input" placeholder="https://..." value={resourceForm.linkUrl} onChange={(e) => setResourceForm({ ...resourceForm, linkUrl: e.target.value })} /></div>
                            </div>
                            <button className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-md)' }} onClick={handleSaveResource}>저장</button>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
                        {resources.map((res) => (
                            <div key={res.id} className="card" style={{ borderLeft: '3px solid var(--primary-500)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                                    <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>{res.subjectName}</h4>
                                    {userRole !== 'manager' && (
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteResource(res.id)} style={{ color: 'var(--danger-400)', fontSize: '0.72rem' }}>✕</button>
                                    )}
                                </div>
                                {res.publisher && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>📖 출판사: {res.publisher}</div>}
                                {res.links.length > 0 && (
                                    <div style={{ marginBottom: 'var(--space-sm)' }}>
                                        {res.links.map((link, i) => (
                                            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '0.82rem', color: 'var(--primary-400)', marginBottom: '4px' }}><LinkIcon size={14} style={{ display: 'inline', marginRight: '4px' }} /> {link.label}</a>
                                        ))}
                                    </div>
                                )}
                                {res.links.length === 0 && res.files.length === 0 && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>등록된 링크/파일이 없습니다.</p>}
                            </div>
                        ))}
                    </div>
                    {resources.length === 0 && <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}><p style={{ color: 'var(--text-muted)' }}>등록된 교과 리소스가 없습니다.</p></div>}
                </div>
            )}

            {/* ===== ANALYSIS TAB ===== */}
            {activeTab === 'analysis' && (
                <div className="grid-2" style={{ gap: 'var(--space-lg)' }}>
                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>AI 역량 방사형 차트</h3>
                        <div style={{ height: 320 }}>
                            <Radar data={radarData} options={radarOptions} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-lg)', marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
                            {['학업역량', '진로역량', '자기주도성', '발전가능성', '공동체의식'].map((key) => (
                                <div key={key} style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-400)', opacity: 0.3 }}>-</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{key}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>📝 AI 분석 근거</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                <div style={{ padding: 'var(--space-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--primary-500)', opacity: 0.5 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary-400)' }}>분석 대기 중</span>
                                    </div>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>학생 역량 분석을 위해 더 많은 활동 기록(메모, 파일 등)이 필요합니다.</p>
                                </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== SEARCH TAB ===== */}
            {activeTab === 'search' && (
                <div>
                    <div className="card-glass" style={{ marginBottom: 'var(--space-lg)' }}>
                        <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>AI 자연어 검색</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                            자연어로 질문하면 학생의 모든 활동 기록에서 관련 내용을 검색하고 답변합니다.
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            <input
                                className="form-input"
                                placeholder="예: 물리 관련 활동을 찾아줘, 리더십을 보여준 사례는?"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                style={{ flex: 1 }}
                            />
                            <button className="btn btn-primary" onClick={handleSearch} disabled={isSearching}>
                                {isSearching ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : '검색'}
                            </button>
                        </div>
                    </div>

                    {searchResult && (
                        <div className="card">
                            <h4 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>💡 검색 결과</h4>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 'var(--space-lg)' }}>
                                {searchResult.answer}
                            </div>
                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-md)' }}>
                                <h5 style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>출처</h5>
                                {searchResult.sources.map((src, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', marginBottom: '6px' }}>
                                        <span className="badge badge-blue">{idx + 1}</span>
                                        <span style={{ fontSize: '0.82rem' }}>{src.text}</span>
                                        <span className="tag tag-gray" style={{ fontSize: '0.68rem' }}>{src.category}</span>
                                    </div>
                                ))}
                            </div>
                            <button className="btn btn-ghost btn-sm" style={{ marginTop: 'var(--space-md)' }} onClick={() => setSearchResult(null)}>새 검색</button>
                        </div>
                    )}

                    {!searchResult && (
                        <div className="card">
                            <h4 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>추천 질문</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                {[
                                    '물리와 관련된 활동을 모두 찾아줘',
                                    '리더십을 보여준 사례는?',
                                    '작년에 참가한 대회 목록은?',
                                    '진로 탐색과 관련된 활동은 뭐가 있어?',
                                ].map((q) => (
                                    <button
                                        key={q}
                                        className="btn btn-secondary"
                                        style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                                        onClick={() => { setSearchQuery(q); }}
                                    >
                                        • {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===== LOG TAB ===== */}
            {activeTab === 'log' && (
                <div>
                    <div className="card-glass" style={{ marginBottom: 'var(--space-lg)' }}>
                        <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>활동 로그</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            {/* Filter Top: Range Presets */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {[
                                    { label: '최근 7일', days: 7 },
                                    { label: '최근 1개월', days: 30 },
                                    { label: '최근 3개월', days: 90 },
                                    { label: '최근 6개월', days: 180 },
                                    { label: '최근 1년', days: 365 }
                                ].map((preset) => (
                                    <button 
                                        key={preset.label} 
                                        className="btn btn-ghost btn-xs" 
                                        onClick={() => {
                                            const end = new Date();
                                            const start = new Date();
                                            start.setDate(start.getDate() - preset.days);
                                            setLogEndDate(end.toISOString().split('T')[0]);
                                            setLogStartDate(start.toISOString().split('T')[0]);
                                        }}
                                        style={{ border: '1px solid var(--border-color)', fontSize: '0.75rem', padding: '4px 10px' }}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            {/* Filter Bottom: Detailed Controls */}
                            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
                                    <label className="form-label">키워드 검색</label>
                                    <input 
                                        className="form-input" 
                                        placeholder="검색어를 입력하세요..." 
                                        value={logSearchQuery}
                                        onChange={(e) => setLogSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="form-group" style={{ width: '120px', marginBottom: 0 }}>
                                    <label className="form-label">카테고리</label>
                                    <select 
                                        className="form-select" 
                                        value={logCategory} 
                                        onChange={(e) => setLogCategory(e.target.value)}
                                    >
                                        <option value="전체">전체 보기</option>
                                        <option value="메모">메모</option>
                                        <option value="파일">파일</option>
                                        <option value="성적">성적</option>
                                        <option value="도서">도서</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ width: '140px', marginBottom: 0 }}>
                                    <label className="form-label">시작일</label>
                                    <input 
                                        type="date" 
                                        className="form-input" 
                                        value={logStartDate}
                                        onChange={(e) => setLogStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="form-group" style={{ width: '140px', marginBottom: 0 }}>
                                    <label className="form-label">종료일</label>
                                    <input 
                                        type="date" 
                                        className="form-input" 
                                        value={logEndDate}
                                        onChange={(e) => setLogEndDate(e.target.value)}
                                    />
                                </div>
                                <button className="btn btn-secondary" onClick={() => {
                                    setLogSearchQuery('');
                                    setLogStartDate('');
                                    setLogEndDate('');
                                    setLogCategory('전체');
                                }}>초기화</button>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {filteredActivities.map((act) => (
                                <div 
                                    key={`${act.type}-${act.id}`} 
                                    className="activity-item-clickable"
                                    onClick={() => {
                                        const tabMap: Record<string, Tab> = { '성적': 'grades', '파일': 'files', '도서': 'books', '메모': 'memos' };
                                        setActiveTab(tabMap[act.type] || 'overview');
                                    }}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '16px', 
                                        fontSize: '0.88rem', 
                                        padding: '12px 12px', 
                                        borderRadius: 'var(--radius-md)',
                                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', width: '100px', flexShrink: 0 }}>
                                        {new Date(act.date).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' })}
                                    </span>
                                    <span style={{ 
                                        padding: '2px 8px', 
                                        borderRadius: '4px', 
                                        fontSize: '0.75rem', 
                                        background: act.type === '성적' ? 'rgba(59, 130, 246, 0.1)' : 
                                                    act.type === '파일' ? 'rgba(16, 185, 129, 0.1)' :
                                                    act.type === '도서' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: act.type === '성적' ? '#60a5fa' : 
                                               act.type === '파일' ? '#34d399' :
                                               act.type === '도서' ? '#a78bfa' : '#fbbf24',
                                        width: '60px',
                                        textAlign: 'center',
                                        flexShrink: 0
                                    }}>
                                        {act.type}
                                    </span>
                                    <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)', fontWeight: 500 }}>
                                        {act.content}
                                    </span>
                                </div>
                            ))}
                            {filteredActivities.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)' }}>
                                    검색 결과가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== EDIT MODAL ===== */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)} style={{ zIndex: 1000 }}>
                    <div className="modal card-glass" onClick={(e) => e.stopPropagation()} style={{ 
                        maxWidth: '550px', 
                        padding: 'var(--space-xl)', 
                        border: '1px solid var(--primary-600)',
                        boxShadow: '0 0 50px rgba(99, 102, 241, 0.3)'
                    }}>
                        <div className="modal-header" style={{ marginBottom: 'var(--space-lg)', padding: 0, border: 'none' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700 }}>
                                <div className="avatar avatar-sm" style={{ background: 'var(--primary-500)', color: 'white' }}>
                                    <Pencil size={18} />
                                </div>
                                학생 기본 정보 수정
                            </h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowEditModal(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ padding: 0 }}>
                            <div className="form-group">
                                <label className="form-label">이름</label>
                                <input className="form-input" style={{ fontSize: '1.05rem', fontWeight: 600 }} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">학년</label>
                                    <select className="form-select" value={editForm.grade} onChange={(e) => setEditForm({ ...editForm, grade: Number(e.target.value) })}>
                                        <option value={1}>1학년</option>
                                        <option value={2}>2학년</option>
                                        <option value={3}>3학년</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">학교</label>
                                    <input className="form-input" value={editForm.school} onChange={(e) => setEditForm({ ...editForm, school: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">반</label>
                                    <input type="number" className="form-input" placeholder="반" value={editForm.classNumber} onChange={(e) => setEditForm({ ...editForm, classNumber: e.target.value ? Number(e.target.value) : '' })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">번호</label>
                                    <input type="number" className="form-input" placeholder="번호" value={editForm.studentNumber} onChange={(e) => setEditForm({ ...editForm, studentNumber: e.target.value ? Number(e.target.value) : '' })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">학생 메모 (이름 하단 노출)</label>
                                <textarea 
                                    className="form-textarea" 
                                    placeholder="학생의 개별 특이사항을 기록하세요." 
                                    value={editForm.studentMemo} 
                                    onChange={(e) => setEditForm({ ...editForm, studentMemo: e.target.value })} 
                                    style={{ minHeight: 80 }} 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">담임교사 메모 (개요 카드)</label>
                                <textarea 
                                    className="form-textarea" 
                                    placeholder="담임교사의 종합 의견을 기록하세요." 
                                    value={editForm.teacherMemo} 
                                    onChange={(e) => setEditForm({ ...editForm, teacherMemo: e.target.value })} 
                                    style={{ minHeight: 100 }} 
                                />
                            </div>
                        </div>
                        <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 'var(--space-xl)', gap: 'var(--space-md)' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>취소</button>
                            <button className="btn btn-primary" style={{ flex: 2, height: '48px' }} onClick={handleSaveEdit}>수정사항 저장하기</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== UPLOAD MEMO MODAL (업로드 직후 메모 입력) ===== */}
            {uploadedFileForMemo && (
                <div className="modal-overlay" onClick={() => setUploadedFileForMemo(null)} style={{ zIndex: 1200 }}>
                    <div className="modal card-glass" onClick={(e) => e.stopPropagation()} style={{ 
                        maxWidth: '500px', 
                        padding: 'var(--space-xl)', 
                        border: '1px solid var(--primary-600)',
                        boxShadow: '0 0 60px rgba(99, 102, 241, 0.4)'
                    }}>
                        <div className="modal-header" style={{ marginBottom: 'var(--space-lg)', padding: 0, border: 'none' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700 }}>
                                <div className="avatar avatar-sm" style={{ background: 'var(--success-500)', color: 'white' }}>
                                    <FileText size={18} />
                                </div>
                                파일 메모 작성
                            </h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setUploadedFileForMemo(null)}>✕</button>
                        </div>
                        <div style={{ marginBottom: 'var(--space-md)' }}>
                            <div style={{ 
                                display: 'flex', alignItems: 'center', gap: '10px', 
                                padding: '12px 16px', background: 'var(--bg-secondary)', 
                                borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)',
                                border: '1px solid var(--border-color)'
                            }}>
                                <File size={18} color="var(--primary-400)" />
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{uploadedFileForMemo.fileName}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{uploadedFileForMemo.category}</div>
                                </div>
                            </div>
                            <label className="form-label">메모 (나중에 검색에 활용됩니다)</label>
                            <textarea
                                className="form-textarea"
                                value={uploadMemoValue}
                                onChange={(e) => setUploadMemoValue(e.target.value)}
                                placeholder="이 파일에 대한 메모를 작성하세요..."
                                style={{ minHeight: '120px', fontSize: '0.95rem', lineHeight: 1.7 }}
                                autoFocus
                            />
                        </div>
                        <div className="modal-footer" style={{ padding: 0, border: 'none', gap: 'var(--space-sm)' }}>
                            <button className="btn btn-secondary" onClick={() => setUploadedFileForMemo(null)}>건너뛰기</button>
                            <button className="btn btn-primary" style={{ flex: 1, height: '48px' }} onClick={() => {
                                if (uploadMemoValue.trim()) {
                                    studentService.updateFile(uploadedFileForMemo.id, { summary: uploadMemoValue });
                                    setFiles(prev => prev.map(f => f.id === uploadedFileForMemo.id ? { ...f, summary: uploadMemoValue } : f));
                                    showToast('✅ 메모가 저장되었습니다.');
                                }
                                setUploadedFileForMemo(null);
                            }}>
                                💾 메모 저장
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Folder Creation Modal */}
            {showFolderModal && (
                <div className="modal-overlay" onClick={() => setShowFolderModal(false)} style={{ zIndex: 1000 }}>
                    <div className="modal card-glass" onClick={(e) => e.stopPropagation()} style={{ 
                        maxWidth: '400px', 
                        padding: 'var(--space-lg)', 
                        border: '1px solid var(--primary-600)',
                        boxShadow: '0 0 40px rgba(99, 102, 241, 0.4)'
                    }}>
                        <div className="modal-header" style={{ marginBottom: 'var(--space-md)', padding: 0, border: 'none' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Folder size={24} color="var(--primary-400)" />
                                새 폴더 생성
                            </h3>
                        </div>
                        <div className="modal-body" style={{ padding: 0 }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                                {folderModalTarget?.cat} &gt; {folderModalTarget?.parentId ? folders.find(f => f.id === folderModalTarget.parentId)?.name : '루트'} 아래에 생성
                            </p>
                            <div className="form-group">
                                <label className="form-label">폴더 이름</label>
                                <input 
                                    className="form-input" 
                                    autoFocus
                                    placeholder="폴더 이름을 입력하세요"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && confirmCreateFolder()}
                                />
                            </div>
                        </div>
                        <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 'var(--space-lg)', gap: 'var(--space-sm)' }}>
                            <button className="btn btn-secondary" onClick={() => setShowFolderModal(false)}>취소</button>
                            <button className="btn btn-primary" onClick={confirmCreateFolder}>생성</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)} style={{ zIndex: 1100 }}>
                    <div className="modal card-glass" onClick={(e) => e.stopPropagation()} style={{ 
                        maxWidth: '400px', 
                        padding: 'var(--space-lg)', 
                        border: '1px solid var(--danger-600)',
                        boxShadow: '0 0 40px rgba(239, 68, 68, 0.4)'
                    }}>
                        <div className="modal-header" style={{ marginBottom: 'var(--space-md)', padding: 0, border: 'none' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger-400)' }}>
                                <AlertTriangle size={24} />
                                {deleteTarget?.type === 'file' ? '파일 삭제' : '폴더 삭제'}
                            </h3>
                        </div>
                        <div className="modal-body" style={{ padding: 0 }}>
                            <p style={{ fontSize: '1rem', marginBottom: 'var(--space-xs)' }}>
                                <strong>"{deleteTarget?.name}"</strong> {deleteTarget?.type === 'file' ? '파일을' : '폴더를'} 삭제하시겠습니까?
                            </p>
                            {deleteTarget?.type === 'folder' && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '4px', borderLeft: '3px solid var(--danger-500)' }}>
                                    ※ 폴더 내부의 모든 하위 폴더와 파일이 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                                </p>
                            )}
                        </div>
                        <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 'var(--space-lg)', gap: 'var(--space-sm)' }}>
                            <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>취소</button>
                            <button className="btn btn-primary" style={{ background: 'var(--danger-600)', borderColor: 'var(--danger-500)' }} onClick={confirmDelete}>삭제하기</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Analyzing Overlay */}
            {/* Processing / Analyzing Overlay */}
            {isAnalyzing && (
                <div className="modal-overlay" style={{ zIndex: 9999, background: 'rgba(5, 5, 20, 0.9)', backdropFilter: 'blur(8px)' }}>
                    <div className="card-glass" style={{ 
                        padding: '40px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        gap: '24px',
                        border: '1px solid var(--primary-500)',
                        boxShadow: '0 0 80px rgba(99, 102, 241, 0.4)',
                        maxWidth: '450px'
                    }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ width: 80, height: 80, borderRadius: '50%', border: '2px solid rgba(99, 102, 241, 0.2)', borderTop: '2px solid var(--primary-500)', animation: 'spin 1s linear infinite' }} />
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--primary-400)' }}>
                                <Brain size={32} className="pulse" />
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ color: 'white', fontWeight: 700, marginBottom: '12px', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                                서류를 정밀 분석 중입니다
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                                AI가 학생의 핵심 역량과 전공 적합성을 추출하고 있습니다.<br />
                                잠시만 기다려 주세요 (약 5~10초 소요)
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="toast toast-success">{toast}</div>
            )}

            {/* ===== FILE DETAIL MODAL (메모 + 미리보기) ===== */}
            {showFileDetailModal && selectedFileForDetail && (
                <div className="modal-overlay" onClick={() => { setShowFileDetailModal(false); setIsEditingFileMemo(false); }} style={{ zIndex: 1200 }}>
                    <div className="modal card-glass" onClick={(e) => e.stopPropagation()} style={{ 
                        maxWidth: '550px', 
                        width: '95vw',
                        padding: 'var(--space-xl)', 
                        border: '1px solid var(--primary-600)',
                        boxShadow: '0 0 50px rgba(99, 102, 241, 0.3)',
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)' }}>
                            <div>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.15rem', fontWeight: 700 }}>
                                    <File size={20} color="var(--primary-400)" />
                                    {selectedFileForDetail.fileName}
                                </h3>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '6px', alignItems: 'center' }}>
                                    <span className="tag tag-blue" style={{ fontSize: '0.75rem' }}>{selectedFileForDetail.category}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {new Date(selectedFileForDetail.uploadedAt).toLocaleString('ko-KR')}
                                    </span>
                                </div>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setShowFileDetailModal(false); setIsEditingFileMemo(false); }}><X size={20} /></button>
                        </div>
                        
                        {/* Memo Field */}
                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                <FileText size={14} /> 파일 메모
                            </label>
                            <textarea
                                className="form-textarea"
                                value={editingFileMemoValue}
                                onChange={(e) => setEditingFileMemoValue(e.target.value)}
                                placeholder="이 파일에 대한 메모를 작성하세요... (나중에 이 내용으로 검색할 수 있습니다)"
                                style={{ minHeight: '150px', fontSize: '0.92rem', lineHeight: 1.7 }}
                                autoFocus
                            />
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                            <button 
                                className="btn btn-primary" 
                                style={{ flex: 2, height: '48px' }}
                                onClick={() => {
                                    studentService.updateFile(selectedFileForDetail.id, { summary: editingFileMemoValue });
                                    setFiles(files.map(f => f.id === selectedFileForDetail.id ? { ...f, summary: editingFileMemoValue } : f));
                                    setSelectedFileForDetail({ ...selectedFileForDetail, summary: editingFileMemoValue });
                                    showToast('✅ 메모가 저장되었습니다.');
                                    setShowFileDetailModal(false);
                                    setIsEditingFileMemo(false);
                                }}
                            >
                                💾 메모 저장
                            </button>
                            {selectedFileForDetail.driveFileId && (
                                <a 
                                    href={`https://drive.google.com/file/d/${selectedFileForDetail.driveFileId}/view`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary"
                                    style={{ flex: 1, height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                >
                                    <ExternalLink size={16} /> 미리보기
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .tree-new-btn:hover {
                    background: var(--bg-card-hover) !important;
                    border-color: var(--primary-400) !important;
                    color: var(--primary-300) !important;
                    transform: scale(1.02);
                }
                .tree-node-content:hover {
                    background: var(--bg-card-hover) !important;
                    transform: translateY(-1px);
                    box-shadow: var(--shadow-md) !important;
                }
                .tree-node-content.drag-over {
                    border-color: var(--primary-500) !important;
                    background: rgba(99, 102, 241, 0.1) !important;
                    box-shadow: 0 0 10px var(--primary-500)55 !important;
                }
            `}</style>
        </div>
    );
}
