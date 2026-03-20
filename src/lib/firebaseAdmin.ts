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
        try {
            const sc = JSON.parse(serviceAccountJson);
            
            // 비밀키 정규화 (PEM 형식 보정)
            let privateKey = sc.private_key || '';
            if (privateKey) {
                privateKey = privateKey.replace(/\\n/g, '\n').replace(/"/g, '').trim();
            }

            console.log('--- Auth Debug (Admin) ---');
            console.log('Project ID:', sc.project_id || process.env.GOOGLE_CLOUD_PROJECT);
            console.log('Client Email:', sc.client_email);
            console.log('PK Length:', privateKey.length);
            console.log('PK Start:', privateKey.substring(0, 50) + '...');
            console.log('--- --- --- --- ---');

            adminApp = initializeApp({
                credential: cert({
                    projectId: sc.project_id || process.env.GOOGLE_CLOUD_PROJECT,
                    clientEmail: sc.client_email,
                    privateKey: privateKey,
                } as any),
                projectId: sc.project_id || process.env.GOOGLE_CLOUD_PROJECT,
            });
        } catch (err: any) {
            console.error('Firebase Admin Init Exception:', err);
            throw err;
        }
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

let adminStorage: any;

export function getAdminStorage() {
    if (!adminStorage) {
        const { getStorage } = require('firebase-admin/storage');
        adminStorage = getStorage(getAdminApp());
    }
    return adminStorage;
}

export function getAdminAuth(): Auth {
    if (!adminAuth) {
        adminAuth = getAuth(getAdminApp());
    }
    return adminAuth;
}
