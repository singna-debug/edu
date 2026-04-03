
const { google } = require('googleapis');

async function testDrive() {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

    console.log('--- ENV CHECK ---');
    console.log('CLIENT_ID:', clientId ? 'EXISTS' : 'MISSING');
    console.log('CLIENT_SECRET:', clientSecret ? 'EXISTS' : 'MISSING');
    console.log('REDIRECT_URI:', redirectUri ? 'EXISTS' : 'MISSING');
    console.log('REFRESH_TOKEN:', refreshToken ? 'EXISTS' : 'MISSING');

    if (!clientId || !clientSecret || !refreshToken) {
        console.error('CRITICAL ERROR: Env variables missing in .env.local');
        return;
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    try {
        console.log('\n--- TOKEN REFRESH TEST ---');
        const { token } = await oauth2Client.getAccessToken();
        console.log('SUCCESS: Access Token refreshed:', token ? token.substring(0, 10) + '...' : 'NONE');

        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
        console.log('\n--- FOLDER CREATE TEST ---');
        const folderName = 'TEST_FOLDER_' + new Date().toISOString();
        const res = await drive.files.create({
            requestBody: {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
            },
            fields: 'id, name',
        });

        console.log('SUCCESS: Folder created in Google Drive!');
        console.log('Folder ID:', res.data.id);
        console.log('Folder Name:', res.data.name);

        console.log('\n--- FOLDER DELETE TEST ---');
        await drive.files.delete({ fileId: res.data.id });
        console.log('SUCCESS: Test folder deleted.');

    } catch (error) {
        console.error('\n!!! DRIVE API ERROR !!!');
        console.error('Message:', error.message);
        if (error.response && error.response.data) {
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testDrive();
