import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getDb } from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
    const origin = new URL(req.url).origin;
    
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');
        const userId = searchParams.get('state'); // The userId we passed as state parameter
        const authError = searchParams.get('error');

        // Handle user cancellation or other OAuth errors from Google
        if (authError) {
            console.error('[Google Auth Callback] OAuth error from Google:', authError);
            return NextResponse.redirect(
                `${origin}/dashboard/settings?error=true&message=${encodeURIComponent('Google authentication error: ' + authError)}`
            );
        }

        if (!code || !userId) {
            console.error('[Google Auth Callback] Missing code or state:', { hasCode: !!code, userId });
            return NextResponse.redirect(
                `${origin}/dashboard/settings?error=true&message=${encodeURIComponent('Authentication failed: missing authorization code or user session.')}`
            );
        }

        const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return NextResponse.redirect(
                `${origin}/dashboard/settings?error=true&message=${encodeURIComponent('Server configuration error: missing client credentials.')}`
            );
        }

        const redirectUri = `${origin}/api/auth/google/callback`;

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        // Exchange authorization code for access and refresh tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        console.log(`[Google Auth Callback] Successfully retrieved tokens for userId: ${userId}`);
        console.log(`[Google Auth Callback] Has Refresh Token: ${!!tokens.refresh_token}`);
        console.log(`[Google Auth Callback] Has Access Token: ${!!tokens.access_token}`);

        // Update Firestore with the new tokens
        const db = getDb();
        const updateData: any = {
            google_access_token: tokens.access_token,
            updatedAt: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        if (tokens.refresh_token) {
            updateData.google_refresh_token = tokens.refresh_token;
        } else {
            console.warn('[Google Auth Callback] Warning: No refresh token returned. Relying on existing refresh token in DB.');
        }

        if (tokens.expiry_date) {
            updateData.google_token_expiry = tokens.expiry_date;
        }

        await db.collection('consultants').doc(userId).update(updateData);
        console.log(`[Google Auth Callback] Successfully saved Google tokens to DB for userId: ${userId}`);

        return NextResponse.redirect(`${origin}/dashboard/settings?success=true`);
    } catch (err: any) {
        console.error('[Google Auth Callback] Exception during token exchange/DB save:', err);
        return NextResponse.redirect(
            `${origin}/dashboard/settings?error=true&message=${encodeURIComponent(err.message || 'Internal server error during Google link.')}`
        );
    }
}
