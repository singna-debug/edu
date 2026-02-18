// Firebase Admin SDK - 서버 사이드 인증 검증 및 Firestore 접근
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App;
let db: Firestore;
let adminAuth: Auth;

function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJson && serviceAccountJson !== '{}') {
        const serviceAccount = JSON.parse(serviceAccountJson);
        adminApp = initializeApp({
            credential: cert(serviceAccount),
            projectId: process.env.GOOGLE_CLOUD_PROJECT,
        });
    } else {
        // Application Default Credentials (로컬/Cloud Run 환경)
        adminApp = initializeApp({
            projectId: process.env.GOOGLE_CLOUD_PROJECT,
        });
    }

    return adminApp;
}

export function getDb(): Firestore {
    if (!db) {
        db = getFirestore(getAdminApp());
    }
    return db;
}

export function getAdminAuth(): Auth {
    if (!adminAuth) {
        adminAuth = getAuth(getAdminApp());
    }
    return adminAuth;
}
