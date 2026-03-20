// Telegram Webhook API Route
import { NextRequest, NextResponse } from 'next/server';

interface TelegramMessage {
    message_id: number;
    from: { id: number; first_name: string };
    chat: { id: number };
    text?: string;
}

interface TelegramUpdate {
    update_id: number;
    message?: TelegramMessage;
}

async function sendTelegramMessage(chatId: number, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || token === 'your-telegram-bot-token') return;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
}

export async function POST(request: NextRequest) {
    try {
        const update: TelegramUpdate = await request.json();
        const message = update.message;
        if (!message?.text) return NextResponse.json({ ok: true });

        const chatId = message.chat.id;
        const text = message.text.trim();

        // 명령어 파싱
        if (text.startsWith('/시작') || text.startsWith('/start')) {
            const authCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            await sendTelegramMessage(chatId, `🎓 *EduFlow AI* 봇에 오신 것을 환영합니다!\n\n인증 코드: \`${authCode}\`\n\n웹 대시보드의 Telegram 연동 페이지에서 위 코드를 입력하세요.`);
        } else if (text.startsWith('/조회')) {
            const studentName = text.replace('/조회', '').trim();
            await sendTelegramMessage(chatId, `📋 *${studentName || '학생'}* 최근 활동 요약\n\n• 물리 심화 탐구 보고서 초안 제출\n• 수학 경시대회 예선 통과\n• 물리 동아리 양자역학 세미나 발표`);
        } else if (text.startsWith('/차트')) {
            const studentName = text.replace('/차트', '').trim();
            await sendTelegramMessage(chatId, `📊 *${studentName || '학생'}* 차트를 생성 중입니다...\n\n(실제 환경에서는 차트 이미지가 전송됩니다)`);
        } else if (text.startsWith('/다운로드')) {
            await sendTelegramMessage(chatId, `📁 파일을 검색 중입니다...\n\n(실제 환경에서는 파일이 전송됩니다)`);
        } else if (text.startsWith('/보고서확정')) {
            const studentName = text.replace('/보고서확정', '').trim();
            await sendTelegramMessage(chatId, `✅ *${studentName || '학생'}* 보고서가 확정되었습니다.\n\nPDF를 전송 중입니다...`);
        } else if (text.startsWith('/비교')) {
            const args = text.replace('/비교', '').trim().split(/\s+/);
            const studentName = args[0] || '학생';
            const majorName = args.slice(1).join(' ') || '물리학과';
            await sendTelegramMessage(chatId,
                `🎯 *합격 예측 비교*\n\n` +
                `👨‍🎓 학생: *${studentName}*\n` +
                `🏫 목표 학과: *${majorName}*\n\n` +
                `📊 *내신 비교*\n` +
                `• 합격자 평균: 1.3등급\n` +
                `• ${studentName} 현재: 1.6등급\n` +
                `• 격차: +0.3등급 (보완 필요)\n\n` +
                `📈 *수능 영역별 비교*\n` +
                `• 국어: 합격 94 vs ${studentName} 93 (-1)\n` +
                `• 수학: 합격 97 vs ${studentName} 97 (동일)\n` +
                `• 탐구: 합격 96 vs ${studentName} 97 (+1)\n\n` +
                `⚠️ 판정: *추가합격권*\n` +
                `\n자세한 분석은 웹 대시보드의 합격 예측 비교 탭을 확인하세요.`
            );
        } else if (text.startsWith('/도움말') || text.startsWith('/help')) {
            await sendTelegramMessage(chatId, `📚 *사용 가능한 명령어*\n\n/조회 [학생명] — 최근 활동 요약\n/차트 [학생명] — 성적·역량 차트\n/비교 [학생명] [학과명] — 합격 예측 비교\n/다운로드 [학생명] [과목] — 파일 전송\n/보고서확정 [학생명] — 보고서 승인\n/도움말 — 명령어 안내`);
        } else {
            await sendTelegramMessage(chatId, `🤔 인식할 수 없는 명령어입니다.\n\n/도움말 을 입력하여 사용 가능한 명령어를 확인하세요.`);
        }

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
    }
}
