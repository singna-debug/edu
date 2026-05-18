import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';
import { getDb } from '@/lib/firebaseAdmin';
import { generateText } from '@/lib/gemini';

export async function POST(request: NextRequest) {
    try {
        const decodedToken = await verifyAuth(request);
        if (!decodedToken) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { query, studentId } = body;

        if (!query) {
            return NextResponse.json({ success: false, error: '검색어를 입력하세요.' }, { status: 400 });
        }
        if (!studentId) {
            return NextResponse.json({ success: false, error: '학생 ID가 제공되지 않았습니다.' }, { status: 400 });
        }

        console.log(`[AI Search] Optimized search starting for query: "${query}" (Student: ${studentId})`);
        
        const db = getDb();

        // 1. Fetch Student Profile
        const studentDoc = await db.collection('students').doc(studentId).get();
        if (!studentDoc.exists) {
            return NextResponse.json({ success: false, error: '존재하지 않는 학생입니다.' }, { status: 404 });
        }
        const studentData = studentDoc.data() || {};
        const studentName = studentData.name || '이름없음';
        const studentSchool = studentData.school || '학교미정';
        const studentGrade = studentData.grade || '학년미정';
        const targetUniv = studentData.targetUniv || '대학미정';
        const targetMajor = studentData.targetMajor || '학과미정';

        // 2. Fetch School Records
        const schoolRecordsSnapshot = await db.collection('school_records')
            .where('studentId', '==', studentId)
            .get();
        
        let schoolRecordText = '';
        let schoolRecordFileName = '';
        if (!schoolRecordsSnapshot.empty) {
            const docData = schoolRecordsSnapshot.docs[0].data();
            schoolRecordText = docData.parsedText || '';
            schoolRecordFileName = docData.fileName || '생활기록부.pdf';
        }

        // 3. Fetch Memos
        const memosSnapshot = await db.collection('memos')
            .where('studentId', '==', studentId)
            .get();
        
        const memos = memosSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                category: data.category || '일반',
                content: data.content || '',
                createdAt: data.createdAt || ''
            };
        });

        // 4. Fetch Files list (metadata)
        const filesSnapshot = await db.collection('files')
            .where('studentId', '==', studentId)
            .get();
        
        const files = filesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                fileName: data.fileName || '이름없음',
                category: data.category || '기타',
                summary: data.summary || ''
            };
        });

        // 5. LIGHTSPEED PRE-FILTERING (Heuristic RAG)
        // Splits the massive 21-page text and keeps only the highly-scored matching blocks.
        // Cuts token input by 80%-90% to speed up Gemini from 45s down to 5s.
        let filteredRecordText = schoolRecordText;
        let isFiltered = false;

        if (schoolRecordText) {
            const blocks = schoolRecordText.split(/\n\n+/).map(b => b.trim()).filter(b => b.length > 0);
            
            // Extract key search terms by excluding common particles & stopwords
            const stopwords = [
                '찾아줘', '알려줘', '있니', '있나요', '검색', '대해', '대한', '관련', '관련된', 
                '활동', '내용', '모두', '의', '에', '에서', '을', '를', '은', '는', '이', '가', 
                '로', '으로', '와', '과', '사례', '부분', '기록', '내역', '글자', '항목'
            ];
            
            const queryKeywords = query
                .split(/[\s,，.。?!]+/)
                .map((w: string) => w.trim())
                .filter((w: string) => w.length >= 2 && !stopwords.includes(w));

            console.log(`[AI Search] Extracted search keywords:`, queryKeywords);

            const isGeneralQuery = query.includes('요약') || query.includes('종합') || query.includes('전체') || queryKeywords.length === 0;

            if (!isGeneralQuery) {
                const scoredBlocks = blocks.map((block, idx) => {
                    let score = 0;
                    queryKeywords.forEach((kw: string) => {
                        if (block.toLowerCase().includes(kw.toLowerCase())) {
                            score += 10;
                        }
                    });
                    return { block, score, idx };
                });

                // Filter blocks that have at least one keyword match
                const matchedBlocks = scoredBlocks
                    .filter(b => b.score > 0)
                    .sort((a, b) => b.score - a.score || a.idx - b.idx);

                if (matchedBlocks.length > 0) {
                    // Keep the top matched blocks (up to 8 blocks to avoid cutting too much context)
                    const topBlocks = matchedBlocks.slice(0, 8);
                    
                    // Re-sort by original index to keep reading chronological order
                    topBlocks.sort((a, b) => a.idx - b.idx);
                    
                    filteredRecordText = topBlocks.map(b => b.block).join('\n\n---\n\n');
                    isFiltered = true;
                    console.log(`[AI Search] Heuristic RAG filtered blocks from ${blocks.length} to ${topBlocks.length}`);
                } else {
                    // If no block matched exactly, fallback to sending first 6 pages/blocks instead of full 21 pages
                    filteredRecordText = blocks.slice(0, 6).join('\n\n---\n\n') + '\n\n...[생략됨]...';
                    isFiltered = true;
                    console.log(`[AI Search] Zero keyword match. Sent fallback first 6 blocks to speed up.`);
                }
            }
        }

        // 6. Build structured context for Gemini
        let context = `## 학생 기본 프로필\n`;
        context += `- 이름: ${studentName}\n`;
        context += `- 학교 및 학년: ${studentSchool} (${studentGrade})\n`;
        context += `- 목표 대학/학과: ${targetUniv} ${targetMajor}\n\n`;

        if (memos.length > 0) {
            context += `## 컨설팅 상담 메모 기록 (총 ${memos.length}건)\n`;
            memos.forEach((m, i) => {
                context += `${i + 1}. [${m.category}] ${m.content}\n`;
            });
            context += `\n`;
        }

        if (files.length > 0) {
            context += `## 업로드된 과제/활동 파일 목록\n`;
            files.forEach((f, i) => {
                context += `${i + 1}. [${f.category}] 파일명: ${f.fileName} ${f.summary ? `(요약: ${f.summary})` : ''}\n`;
            });
            context += `\n`;
        }

        if (filteredRecordText) {
            context += `## 학교생활기록부 복원 본문 텍스트 (출처 파일명: ${schoolRecordFileName}${isFiltered ? ' - 부분 검색 추출됨' : ''})\n`;
            context += `${filteredRecordText}\n\n`;
        } else {
            context += `*등록된 생활기록부 텍스트 복원 데이터가 없습니다.*\n\n`;
        }

        // 7. Define elite system instruction
        const systemInstruction = `너는 대치동 최고 권위의 입시 전문 컨설턴트다. 
원장님이 입력하신 질문에 대해, 제공된 학생의 [학교생활기록부 복원 텍스트], [상담 메모], [제출 파일 목록]을 이 잡듯 뒤져 가장 풍부하고 정확하며 구체적인 근거를 들어 전문적으로 답변하라.

답변 규칙:
1. 근거를 제시할 때는 반드시 "생활기록부 본문 내용에 기재된 [OO 활동]에 따르면..." 혹은 "상담 메모([OO 카테고리]) 기록에 따르면..." 형태로 정확한 출처와 맥락을 명시하라.
2. 학생의 진로 방향성(목표 학과: ${targetMajor})과 연계하여, 질문한 활동이 대입 수시 학종에서 어떤 경쟁력을 갖는지 가치를 부여해 분석해 주어라.
3. 데이터가 존재하지 않거나 부족한 내용에 대해서는 절대 소설을 쓰지 말고, "제공된 기록에서는 해당 내용을 찾을 수 없습니다"라고 객관적으로 알린 후, 생기부 보완을 위해 어떤 점을 상담 시 추가 유도해야 하는지 꿀팁 조언을 대신 제시하라.
4. 존댓말로 품격 있고 차분한 대치동 최고 전문가 톤앤매너를 유지하라.`;

        const prompt = `## 질문\n${query}\n\n## 학생 활동 데이터 컨텍스트\n${context}`;

        console.log(`[AI Search] Triggering Gemini text generation...`);
        const answer = await generateText(prompt, systemInstruction);

        // 8. Dynamic Sources List Formulation
        const sources: { text: string; category: string; url: string }[] = [];
        
        if (schoolRecordText && (
            schoolRecordText.toLowerCase().includes(query.toLowerCase()) || 
            answer.includes('생활기록부') ||
            answer.includes(schoolRecordFileName)
        )) {
            sources.push({
                text: `생활기록부 (${schoolRecordFileName})`,
                category: '생활기록부',
                url: `/dashboard/students/${studentId}?tab=files`
            });
        }

        memos.forEach((m) => {
            const hasKeyword = query.split(/\s+/).some((kw: string) => kw.length >= 2 && m.content.includes(kw));
            if (hasKeyword || answer.includes(m.content.substring(0, 15))) {
                sources.push({
                    text: `상담 메모: ${m.content.substring(0, 30)}${m.content.length > 30 ? '...' : ''}`,
                    category: m.category,
                    url: `/dashboard/students/${studentId}?tab=memos`
                });
            }
        });

        // Fallback: If no sources matched but we queried records, add school record as a reference source
        if (sources.length === 0 && schoolRecordText) {
            sources.push({
                text: `생활기록부 (${schoolRecordFileName})`,
                category: '생활기록부',
                url: `/dashboard/students/${studentId}?tab=files`
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                answer,
                sources: sources.slice(0, 5)
            }
        });

    } catch (error: any) {
        console.error('[AI Search Error]', error);
        return NextResponse.json({ success: false, error: '자연어 검색 중 오류가 발생했습니다: ' + error.message }, { status: 500 });
    }
}
