
const admin = require('firebase-admin');
const path = require('path');

// 서비스 계정 키 파일 경로 확인 (보통 .env에 있거나 특정 위치에 있음)
// 여기서는 기본 firebase-admin 초기화 시도
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!admin.apps.length) {
    if (serviceAccountJson && serviceAccountJson !== '{}') {
        try {
            const sc = JSON.parse(serviceAccountJson);
            let privateKey = sc.private_key || '';
            if (privateKey) {
                privateKey = privateKey.replace(/\\n/g, '\n').replace(/"/g, '').trim();
            }
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: sc.project_id || process.env.GOOGLE_CLOUD_PROJECT,
                    clientEmail: sc.client_email,
                    privateKey: privateKey,
                }),
                projectId: sc.project_id || process.env.GOOGLE_CLOUD_PROJECT,
            });
        } catch (err) {
            console.error('Firebase Init Error:', err.message);
            admin.initializeApp();
        }
    } else {
        admin.initializeApp({
            projectId: process.env.GOOGLE_CLOUD_PROJECT,
        });
    }
}

const db = admin.firestore();

async function checkConsultants() {
    try {
        console.log('--- FIRESTORE CONSULTANTS CHECK ---');
        const snapshot = await db.collection('consultants').get();
        if (snapshot.empty) {
            console.log('No consultants found in DB.');
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id}`);
            console.log(`Name: ${data.name || 'N/A'}`);
            console.log(`Google Access Token: ${data.google_access_token ? 'EXISTS (' + data.google_access_token.substring(0, 20) + '...)' : 'MISSING'}`);
            console.log(`Google Refresh Token: ${data.google_refresh_token ? 'EXISTS (' + data.google_refresh_token.substring(0, 20) + '...)' : 'MISSING'}`);
            console.log('---------------------------');
        });
    } catch (error) {
        console.error('Error checking Firestore:', error.message);
    }
}

checkConsultants();
