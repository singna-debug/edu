import { 
    doc, 
    setDoc, 
    getDoc,
    getDocs,
    deleteDoc,
    query,
    collection,
    where,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { sendApprovalRequestEmail } from '../email';

export interface ConsultantData {
    id: string;
    display_name: string;
    email: string;
    photo_url?: string;
    google_access_token?: string;
    google_refresh_token?: string;
    google_token_expiry?: number;
    approved?: boolean; // 관리자 승인 여부
    updated_at: any;
}

export interface ManagerData {
    email: string;
    parentId: string; // 소속된 대표(컨설턴트) ID
    name?: string;
    role: 'manager';
    createdAt: any;
}

export const consultantService = {
    async saveTokens(userId: string, data: Partial<ConsultantData>) {
        const docRef = doc(db, 'consultants', userId);
        
        // Remove undefined fields to prevent Firestore errors
        const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {} as any);

        // DB에서 기존 정보를 먼저 확인하여 신규 가입 여부 파악
        const existingDoc = await getDoc(docRef);
        const isNewUser = !existingDoc.exists();

        await setDoc(docRef, {
            ...cleanData,
            // 신규 가입 시에만 approved: false를 설정 (기존 승인 상태를 덮어쓰지 않음)
            ...(isNewUser ? { approved: false } : {}),
            updated_at: serverTimestamp()
        }, { merge: true });

        // [추가] 신규 가입 시 관리자에게 승인 요청 이메일 발송
        if (isNewUser) {
            try {
                // 비동기로 발송하여 가입 처리 속도에 영향을 주지 않음
                sendApprovalRequestEmail(data.email || 'unknown', userId, data.display_name || '신입 사용자');
            } catch (err) {
                console.error('[Admin] Approval Email Trigger Failed:', err);
            }
        }
    },

    async getConsultant(userId: string): Promise<ConsultantData | null> {
        const docRef = doc(db, 'consultants', userId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() } as ConsultantData;
        }
        return null;
    },

    // --- Sub-user (Manager) 관리 기능 ---
    
    // 대표가 관리자 추가 (이메일 기반)
    async addManager(consultantId: string, managerData: Omit<ManagerData, 'createdAt'>) {
        const email = managerData.email.toLowerCase();
        const docRef = doc(db, 'managers', email);
        await setDoc(docRef, {
            ...managerData,
            email,
            parentId: consultantId,
            role: 'manager',
            createdAt: serverTimestamp()
        });
    },

    // 대표에 소속된 모든 관리자 목록 조회
    async getManagers(consultantId: string): Promise<ManagerData[]> {
        const q = query(collection(db, 'managers'), where('parentId', '==', consultantId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ ...d.data() } as ManagerData));
    },

    // 관리자 삭제 (권한 회수)
    async deleteManager(consultantId: string, email: string) {
        const docRef = doc(db, 'managers', email.toLowerCase());
        const snapshot = await getDoc(docRef);
        
        if (snapshot.exists() && snapshot.data().parentId === consultantId) {
            await deleteDoc(docRef);
        } else {
            throw new Error("삭제 권한이 없거나 해당 관리자를 찾을 수 없습니다.");
        }
    },

    // 이메일로 관리자 정보 조회 (로그인 시 사용)
    async findManagerByEmail(email: string): Promise<ManagerData | null> {
        const docRef = doc(db, 'managers', email.toLowerCase());
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return snapshot.data() as ManagerData;
        }
        return null;
    }
};
