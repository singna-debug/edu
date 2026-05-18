// Firebase Client SDK - 클라이언트 사이드 인증용
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 빌드 시 에러 방지를 위해 설정값이 있을 때만 초기화
let app: any;
try {
    if (getApps().length > 0) {
        app = getApp();
    } else if (firebaseConfig.apiKey) {
        app = initializeApp(firebaseConfig);
    } else {
        console.warn('[Firebase Client] Config skip: Building pages or development start...');
    }
} catch (err) {
    console.warn('[Firebase Client] Init Error:', err);
}

const auth = app ? getAuth(app) : ({ 
    onAuthStateChanged: () => (() => {}),
    signOut: async () => {},
    currentUser: null
} as any);
const db = app ? getFirestore(app) : ({
    collection: () => ({ doc: () => ({}) }),
    doc: () => ({})
} as any);
const storage = app ? getStorage(app) : null;

export { app, auth, db, storage };
