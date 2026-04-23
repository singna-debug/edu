import { 
    collection, 
    query, 
    where, 
    getDocs, 
    getDoc, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    Timestamp,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Student, Memo, GradeRecord, StudentFile, BookRecord, FileFolder, SubjectResource } from '../types';

const STUDENTS_COLLECTION = 'students';
const MEMOS_COLLECTION = 'memos';
const GRADES_COLLECTION = 'grades';
const FILES_COLLECTION = 'files';
const BOOKS_COLLECTION = 'books';

export const studentService = {
    // === Students ===
    async getStudents(consultantId: string): Promise<Student[]> {
        const q = query(
            collection(db, STUDENTS_COLLECTION),
            where('consultantId', '==', consultantId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
    },

    async getStudentById(id: string): Promise<Student | null> {
        const docRef = doc(db, STUDENTS_COLLECTION, id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() } as Student;
        }
        return null;
    },

    async getStudentByPortalToken(token: string): Promise<Student | null> {
        const q = query(
            collection(db, STUDENTS_COLLECTION),
            where('parentPortalToken', '==', token)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Student;
        }
        return null;
    },

    async addStudent(student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const now = new Date().toISOString();
        const docRef = await addDoc(collection(db, STUDENTS_COLLECTION), {
            ...student,
            createdAt: now,
            updatedAt: now,
        });
        return docRef.id;
    },

    async updateStudent(id: string, updates: Partial<Student>): Promise<void> {
        const docRef = doc(db, STUDENTS_COLLECTION, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: new Date().toISOString(),
        });
    },

    async deleteStudent(id: string): Promise<void> {
        await deleteDoc(doc(db, STUDENTS_COLLECTION, id));
        // Note: In production, you'd also delete sub-collections or associated data
    },

    // === Memos ===
    async getMemos(studentId: string): Promise<Memo[]> {
        const q = query(
            collection(db, MEMOS_COLLECTION),
            where('studentId', '==', studentId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Memo));
    },

    async addMemo(memo: Omit<Memo, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, MEMOS_COLLECTION), {
            ...memo,
            createdAt: new Date().toISOString(),
        });
        return docRef.id;
    },

    async deleteMemo(id: string): Promise<void> {
        await deleteDoc(doc(db, MEMOS_COLLECTION, id));
    },

    async updateMemo(id: string, updates: Partial<Memo>): Promise<void> {
        const docRef = doc(db, MEMOS_COLLECTION, id);
        await updateDoc(docRef, updates);
    },

    // === Grades ===
    async getGrades(studentId: string): Promise<GradeRecord[]> {
        const q = query(
            collection(db, GRADES_COLLECTION),
            where('studentId', '==', studentId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GradeRecord));
    },

    async addGrade(grade: Omit<GradeRecord, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, GRADES_COLLECTION), {
            ...grade,
            createdAt: new Date().toISOString(),
        });
        return docRef.id;
    },

    async updateGrade(id: string, updates: Partial<GradeRecord>): Promise<void> {
        const docRef = doc(db, GRADES_COLLECTION, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: new Date().toISOString()
        });
    },

    async deleteGrade(id: string): Promise<void> {
        await deleteDoc(doc(db, GRADES_COLLECTION, id));
    },

    // === Files ===
    async getFiles(studentId: string): Promise<StudentFile[]> {
        const q = query(
            collection(db, FILES_COLLECTION),
            where('studentId', '==', studentId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentFile));
    },

    subscribeToFiles(studentId: string, callback: (files: StudentFile[]) => void) {
        const q = query(
            collection(db, FILES_COLLECTION),
            where('studentId', '==', studentId)
        );
        return onSnapshot(q, (snapshot: any) => {
            const files = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as StudentFile));
            callback(files);
        });
    },

    async addFile(file: Omit<StudentFile, 'id' | 'uploadedAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, FILES_COLLECTION), {
            ...file,
            uploadedAt: new Date().toISOString(),
        });
        return docRef.id;
    },

    async deleteFile(id: string): Promise<void> {
        await deleteDoc(doc(db, FILES_COLLECTION, id));
    },

    async updateFile(id: string, updates: Partial<StudentFile>): Promise<void> {
        const docRef = doc(db, FILES_COLLECTION, id);
        await updateDoc(docRef, updates);
    },

    // === Folders ===
    async getFolders(studentId: string): Promise<FileFolder[]> {
        const q = query(
            collection(db, 'folders'),
            where('studentId', '==', studentId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FileFolder));
    },

    subscribeToFolders(studentId: string, callback: (folders: FileFolder[]) => void) {
        const q = query(
            collection(db, 'folders'),
            where('studentId', '==', studentId)
        );
        return onSnapshot(q, (snapshot: any) => {
            const folders = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as FileFolder));
            callback(folders);
        });
    },

    async addFolder(folder: Omit<FileFolder, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'folders'), folder);
        return docRef.id;
    },

    async updateFolder(id: string, updates: Partial<FileFolder>): Promise<void> {
        const docRef = doc(db, 'folders', id);
        await updateDoc(docRef, updates);
    },

    async deleteFolder(id: string): Promise<void> {
        await deleteDoc(doc(db, 'folders', id));
    },

    // === Books ===
    async getBooks(studentId: string): Promise<BookRecord[]> {
        const q = query(
            collection(db, BOOKS_COLLECTION),
            where('studentId', '==', studentId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BookRecord));
    },

    async addBook(book: Omit<BookRecord, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, BOOKS_COLLECTION), {
            ...book,
            createdAt: new Date().toISOString(),
        });
        return docRef.id;
    },
    
    async deleteBook(id: string): Promise<void> {
        await deleteDoc(doc(db, BOOKS_COLLECTION, id));
    },

    // === Resources ===
    async getResources(studentId: string): Promise<SubjectResource[]> {
        const q = query(
            collection(db, 'resources'),
            where('studentId', '==', studentId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubjectResource));
    },

    async addResource(resource: Omit<SubjectResource, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'resources'), resource);
        return docRef.id;
    },

    async updateResource(id: string, updates: Partial<SubjectResource>): Promise<void> {
        const docRef = doc(db, 'resources', id);
        await updateDoc(docRef, updates);
    },

    async deleteResource(id: string): Promise<void> {
        await deleteDoc(doc(db, 'resources', id));
    }
};
