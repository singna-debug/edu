import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return NextResponse.json(
                { error: 'Google Drive client configuration is missing in environment variables' },
                { status: 500 }
            );
        }

        // Determine the redirect URI dynamically based on the request's origin.
        // This ensures the redirect matches the active environment (localhost vs production Vercel).
        const origin = new URL(req.url).origin;
        const redirectUri = `${origin}/api/auth/google/callback`;

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        // Scopes required for Google Drive integration
        const SCOPES = [
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/drive'
        ];

        // Generate the consent page URL
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent', // Force consent prompt to guarantee Google returns the refresh token
            scope: SCOPES,
            state: userId, // Pass userId as state to identify the consultant in callback
        });

        console.log(`[Google Auth Login] Redirecting userId: ${userId} to Google OAuth`);
        return NextResponse.redirect(authUrl);
    } catch (err: any) {
        console.error('[Google Auth Login] Error generating authorization URL:', err);
        return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
    }
}
