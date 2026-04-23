import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'];

/**
 * 유저별 OAuth2 클라이언트 생성 및 토큰 자동 갱신 설정
 */
async function getDriveClient(accessToken?: string, refreshToken?: string, consultantId?: string) {
    const { getDb } = require('./firebaseAdmin');
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;

    console.log(`[Drive Debug] Consultant: ${consultantId}`);
    console.log(`[Drive Debug] Acc Prefix: ${accessToken ? accessToken.substring(0, 5) : 'NONE'}`);
    console.log(`[Drive Debug] Ref Prefix: ${refreshToken ? refreshToken.substring(0, 5) : 'NONE'}`);

    if (!clientId || !clientSecret) {
        throw new Error('SERVER CONFIG ERROR: GOOGLE_DRIVE_CLIENT_ID or CLIENT_SECRET missing in .env.local');
    }

    // [중요] .env.local의 클라이언트 ID와 Firebase 프로젝트의 Web Client ID가 일치해야 합니다.
    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    );

    // 토큰 설정
    const credentials: any = {
        access_token: accessToken,
        refresh_token: refreshToken
    };
    oauth2Client.setCredentials(credentials);

    // 토큰 갱신 감지
    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.access_token && consultantId) {
            try {
                const db = getDb();
                await db.collection('consultants').doc(consultantId).update({
                    google_access_token: tokens.access_token,
                    updatedAt: new Date().toISOString()
                });
                console.log(`[Drive] Token automatically updated in DB for: ${consultantId}`);
            } catch (err) {
                console.error('[Drive] DB Update Error:', err);
            }
        }
    });

    const isRealGoogleAccessToken = accessToken && accessToken.length > 10;
    const isRealGoogleRefreshToken = refreshToken && refreshToken.length > 10;
    
    if (isRealGoogleRefreshToken) {
        try {
            console.log(`[Drive] Using Consultant Refresh Token: ${consultantId}`);
            oauth2Client.setCredentials({ refresh_token: refreshToken });
            const { token } = await oauth2Client.getAccessToken();
            if (token) {
                oauth2Client.setCredentials({ access_token: token });
                console.log(`[Drive] Token Refreshed Successfully for: ${consultantId}`);
            }
        } catch (err: any) {
            console.error(`[Drive] Refresh Failed for ${consultantId}:`, err.message);
            
            // 만약 가짜 토큰이거나 권한이 만료되어 invalid_grant가 뜬 경우 DB에서 찌꺼기 청소
            if (err.message?.includes('invalid_grant') && consultantId) {
                try {
                    const db = getDb();
                    await db.collection('consultants').doc(consultantId).update({
                        google_refresh_token: ''
                    });
                    console.log(`[Drive] Cleared invalid refresh token from DB for: ${consultantId}`);
                } catch (dbErr) {
                    console.error('[Drive] Failed to clear invalid token from DB:', dbErr);
                }
            }

            // 리프레시가 실패했더라도 현재 싱싱한 단기 엑세스 토큰이 있다면 플랜 B로 엑세스 토큰을 사용해 로직을 살림
            if (isRealGoogleAccessToken) {
                console.log(`[Drive] Falling back to Access Token for: ${consultantId}`);
                oauth2Client.setCredentials({ access_token: accessToken });
            }
        }
    } else if (isRealGoogleAccessToken) {
        console.log(`[Drive] Using Existing Consultant Access Token: ${consultantId}`);
        oauth2Client.setCredentials({ access_token: accessToken });
    } else {
        // [핵심] 대표님의 토큰이 아예 없는 경우에만 서버 전역 폴백 사용
        const envRefreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
        if (envRefreshToken && envRefreshToken.length > 10) {
            console.log(`[Drive] !!! WARNING !!! No consultant tokens found. Falling back to Global Server Drive for: ${consultantId}`);
            oauth2Client.setCredentials({ refresh_token: envRefreshToken });
            try {
                const { token } = await oauth2Client.getAccessToken();
                if (token) oauth2Client.setCredentials({ access_token: token });
            } catch (err: any) {
                console.error('[Drive] Global Fallback Token also failed:', err.message);
            }
        } else {
            console.error('[Drive] CRITICAL: No valid tokens found anywhere. Drive sync will fail for:', consultantId);
        }
    }

    return google.drive({ version: 'v3', auth: oauth2Client });
}

export interface DriveTokens {
    accessToken?: string;
    refreshToken?: string;
}

export const driveService = {
    /**
     * 구글 드라이브에 폴더 생성
     */
    async createFolder(name: string, tokens: DriveTokens, consultantId?: string, parentId?: string) {
        const drive = await getDriveClient(tokens.accessToken, tokens.refreshToken, consultantId);
        const safeParentId = (parentId === 'null' || parentId === 'undefined' || !parentId) ? undefined : parentId;
        const fileMetadata = {
            name: name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: safeParentId ? [safeParentId] : undefined,
        };

        try {
            const file = await drive.files.create({
                requestBody: fileMetadata,
                fields: 'id',
            });
            return file.data.id;
        } catch (err) {
            console.error('Google Drive Folder Create Error:', err);
            throw err;
        }
    },

    /**
     * 폴더가 있으면 가져오고 없으면 생성 (경로 유지용)
     */
    async getOrCreateFolder(name: string, tokens: DriveTokens, consultantId?: string, parentId?: string) {
        const drive = await getDriveClient(tokens.accessToken, tokens.refreshToken, consultantId);
        
        // 검색 쿼리: 이름이 일치하고, 폴더이며, 삭제되지 않았고, 부모가 일치하는 것 찾기
        const escapedName = name.replace(/'/g, "\\'");
        let query = `name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        
        // 부모 폴더가 지정되지 않았다면 최상위 루트('root')에서 검색하도록 명시 (중복 방지 핵심)
        const effectiveParentId = (parentId === 'null' || parentId === 'undefined' || !parentId) ? 'root' : parentId;
        query += ` and '${effectiveParentId}' in parents`;

        try {
            const response = await drive.files.list({
                q: query,
                fields: 'files(id, name)',
                spaces: 'drive',
            });

            if (response.data.files && response.data.files.length > 0) {
                return response.data.files[0].id;
            }

            // 폴더가 없으면 새로 생성
            return await this.createFolder(name, tokens, consultantId, effectiveParentId);
        } catch (err) {
            console.error('getOrCreateFolder Error:', err);
            throw err;
        }
    },

    /**
     * 파일 삭제 (또는 폴더 삭제)
     */
    async deleteFile(fileId: string, tokens: DriveTokens, consultantId?: string) {
        const drive = await getDriveClient(tokens.accessToken, tokens.refreshToken, consultantId);
        try {
            await drive.files.delete({
                fileId: fileId,
            });
        } catch (err) {
            console.error('Google Drive File Delete Error:', err);
            throw err;
        }
    },

    /**
     * 이름 변경
     */
    async renameFile(fileId: string, newName: string, tokens: DriveTokens, consultantId?: string) {
        const drive = await getDriveClient(tokens.accessToken, tokens.refreshToken, consultantId);
        try {
            await drive.files.update({
                fileId: fileId,
                requestBody: {
                    name: newName,
                },
            });
        } catch (err) {
            console.error('Google Drive Rename Error:', err);
            throw err;
        }
    },

    /**
     * 파일 이동 (부모 변경)
     */
    async moveFile(fileId: string, oldParentId: string | null, newParentId: string, tokens: DriveTokens, consultantId?: string) {
        const drive = await getDriveClient(tokens.accessToken, tokens.refreshToken, consultantId);
        try {
            await drive.files.update({
                fileId: fileId,
                addParents: newParentId,
                removeParents: oldParentId || undefined,
                fields: 'id, parents',
            });
        } catch (err) {
            console.error('Google Drive Move Error:', err);
            throw err;
        }
    },

    /**
     * 파일 업로드
     */
    async uploadFile(name: string, buffer: Buffer, contentType: string, tokens: DriveTokens, consultantId?: string, parentId?: string) {
        let drive;
        try {
            const { PassThrough } = require('stream');
            console.log(`[Drive] Preparing Upload: ${name}, Size: ${buffer.length} bytes, Parent: ${parentId || 'root'}`);
            drive = await getDriveClient(tokens.accessToken, tokens.refreshToken, consultantId);
            
            // 스트림 생성 및 버퍼 주입
            const bufferStream = new PassThrough();
            bufferStream.end(buffer);

            const file = await drive.files.create({
                requestBody: {
                    name: name,
                    parents: parentId ? [parentId] : undefined,
                },
                media: {
                    mimeType: contentType,
                    body: bufferStream,
                },
                fields: 'id',
            });
            
            console.log(`[Drive] SDK Upload Success: ${file.data.id}`);
            return file.data.id;
        } catch (err: any) {
            console.error('[Drive] SDK Upload Failed, attempting REST fallback:', err.message);
            
            // REST Fallback (Optional, but simplified)
            if (tokens.accessToken && tokens.accessToken.length > 10) {
                try {
                    console.log('[Drive] REST Fallback for:', name);
                    const boundary = '-------314159265358979323846';
                    const delimiter = "\r\n--" + boundary + "\r\n";
                    const close_delim = "\r\n--" + boundary + "--";

                    const metadata = { name: name, parents: parentId ? [parentId] : [] };
                    const body = 
                        delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata) +
                        delimiter + 'Content-Type: ' + contentType + '\r\n\r\n' + buffer.toString('binary') + 
                        close_delim;

                    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${tokens.accessToken}`,
                            'Content-Type': 'multipart/related; boundary=' + boundary,
                        },
                        body: Buffer.from(body, 'binary')
                    });

                    if (res.ok) {
                        const data = await res.json();
                        return data.id;
                    }
                } catch (restErr: any) {
                    console.error('[Drive] REST Critical Failure:', restErr.message);
                }
            }
            throw err;
        }
    }
};
