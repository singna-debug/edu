// Google Cloud Storage 클라이언트
import { Storage, Bucket } from '@google-cloud/storage';

let storage: Storage;
let bucket: Bucket;

function getStorage(): Storage {
    if (!storage) {
        storage = new Storage({
            projectId: process.env.GOOGLE_CLOUD_PROJECT,
        });
    }
    return storage;
}

export function getBucket(): Bucket {
    if (!bucket) {
        bucket = getStorage().bucket(process.env.GCS_BUCKET_NAME || 'admitflow-files');
    }
    return bucket;
}

/**
 * 학생별 카테고리 기반 GCS 경로 생성
 * 구조: {studentId}/{category}/{year}/{filename}
 */
export function buildGcsPath(
    studentId: string,
    category: string,
    fileName: string,
    year?: number
): string {
    const y = year || new Date().getFullYear();
    return `${studentId}/${category}/${y}/${fileName}`;
}

/**
 * 파일 업로드 → GCS
 */
export async function uploadFile(
    buffer: Buffer,
    gcsPath: string,
    contentType: string
): Promise<string> {
    const file = getBucket().file(gcsPath);
    await file.save(buffer, {
        contentType,
        metadata: {
            cacheControl: 'private, max-age=0',
        },
    });
    return `gs://${process.env.GCS_BUCKET_NAME}/${gcsPath}`;
}

/**
 * GCS 파일 다운로드 (Buffer 반환)
 */
export async function downloadFile(gcsPath: string): Promise<Buffer> {
    const file = getBucket().file(gcsPath);
    const [buffer] = await file.download();
    return buffer;
}

/**
 * 서명된 URL 생성 (임시 접근용)
 */
export async function getSignedUrl(gcsPath: string, expiresMinutes = 60): Promise<string> {
    const file = getBucket().file(gcsPath);
    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresMinutes * 60 * 1000,
    });
    return url;
}

/**
 * 학생 디렉토리 내 파일 목록 조회
 */
export async function listStudentFiles(
    studentId: string,
    category?: string
): Promise<string[]> {
    const prefix = category ? `${studentId}/${category}/` : `${studentId}/`;
    const [files] = await getBucket().getFiles({ prefix });
    return files.map(f => f.name);
}
