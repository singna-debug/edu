/**
 * 학생의 현재 학년을 계산합니다.
 * 한국 학교 기준: 3월에 학년이 올라갑니다.
 * @param entryYear 1학년이었던 연도
 * @returns 현재 학년 (1, 2, 3...)
 */
export function calculateCurrentGrade(entryYear: number): number {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 0-indexed

    // 3월 1일 전까지는 이전 연도의 학년을 유지
    const schoolYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    
    // 학년 = (현재 학년도 - 입학 연도) + 1
    return schoolYear - entryYear + 1;
}

/**
 * 특정 학년과 현재 날짜를 바탕으로 입학 연도(1학년 연도)를 계산합니다.
 * @param currentGrade 현재 학년
 * @returns 1학년이었던 연도
 */
export function calculateEntryYear(currentGrade: number): number {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const schoolYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    
    // 입학 연도 = 현재 학년도 - (현재 학년 - 1)
    return schoolYear - (currentGrade - 1);
}

/**
 * 현재 날짜 기준 학기를 계산합니다.
 * 3월~8월: 1학기, 9월~다음해 2월: 2학기
 * @returns 1 또는 2
 */
export function calculateCurrentSemester(): number {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;

    if (currentMonth >= 3 && currentMonth <= 8) {
        return 1;
    }
    return 2;
}

/**
 * 학년 숫자를 텍스트로 변환합니다.
 * @param grade 학년 숫자
 * @returns '1학년', '2학년', '3학년' 또는 '졸업생'
 */
export function getGradeText(grade: number): string {
    if (grade <= 0) return '입학 전';
    if (grade <= 3) return `${grade}학년`;
    return '졸업생';
}
