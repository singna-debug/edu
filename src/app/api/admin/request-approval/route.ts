import { NextResponse } from 'next/server';
import { sendApprovalRequestEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const { userId, userEmail, userName } = await request.json();

        if (!userId || !userEmail) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await sendApprovalRequestEmail(userEmail, userId, userName || '신규 사용자');
        
        if (result.success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }
    } catch (error: any) {
        console.error('[API] Request Approval Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
