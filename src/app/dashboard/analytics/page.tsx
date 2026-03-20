'use client';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    RadialLinearScale,
    BarElement,
    Filler,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';
import { useState, useEffect, useMemo } from 'react';
import { BarChart2, TrendingUp, Target } from 'lucide-react';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    RadialLinearScale, BarElement, Filler, Title, Tooltip, Legend
);

const chartTextColor = '#94a3b8';
const chartGridColor = 'rgba(30, 41, 59, 0.5)';

export default function AnalyticsPage() {
    const [authMode, setAuthMode] = useState<'demo' | 'user'>('user');

    useEffect(() => {
        const mode = localStorage.getItem('authMode') as 'demo' | 'user';
        if (mode) setAuthMode(mode);
    }, []);

    const isDemo = authMode === 'demo';

    // 전체 학생 비교 차트
    const comparisonData = useMemo(() => ({
        labels: ['학업역량', '진로역량', '자기주도성', '발전가능성', '공동체의식'],
        datasets: isDemo ? [
            {
                label: '김민준',
                data: [9, 8, 8, 9, 7],
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: '#6366f1',
                borderWidth: 2,
                pointBackgroundColor: '#6366f1',
            },
            {
                label: '이서연',
                data: [8, 7, 9, 7, 9],
                backgroundColor: 'rgba(52, 211, 153, 0.2)',
                borderColor: '#34d399',
                borderWidth: 2,
                pointBackgroundColor: '#34d399',
            },
            {
                label: '최수아',
                data: [9, 9, 7, 8, 6],
                backgroundColor: 'rgba(251, 191, 36, 0.2)',
                borderColor: '#fbbf24',
                borderWidth: 2,
                pointBackgroundColor: '#fbbf24',
            },
        ] : [],
    }), [isDemo]);

    const barData = useMemo(() => ({
        labels: ['김민준', '이서연', '박지호', '최수아'],
        datasets: isDemo ? [
            {
                label: '내신 평균 등급',
                data: [1.4, 2.0, 2.8, 1.6],
                backgroundColor: ['rgba(99,102,241,0.6)', 'rgba(52,211,153,0.6)', 'rgba(251,191,36,0.6)', 'rgba(139,92,246,0.6)'],
                borderColor: ['#6366f1', '#34d399', '#fbbf24', '#8b5cf6'],
                borderWidth: 1,
                borderRadius: 6,
            },
        ] : [],
    }), [isDemo]);

    const trendData = useMemo(() => ({
        labels: ['25.03', '25.06', '25.09', '25.11', '26.03'],
        datasets: isDemo ? [
            { label: '김민준', data: [130, 135, 140, 142, 145], borderColor: '#818cf8', tension: 0.4, fill: false },
            { label: '이서연', data: [120, 122, 125, 128, 130], borderColor: '#34d399', tension: 0.4, fill: false },
            { label: '최수아', data: [135, 138, 140, 143, 148], borderColor: '#fbbf24', tension: 0.4, fill: false },
        ] : [],
    }), [isDemo]);

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: chartTextColor, font: { family: 'Inter' } } },
        },
    };

    return (
        <div>
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h2 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart2 size={22} color="var(--primary-400)" />
                    성적 분석
                </h2>
                <p className="text-sm text-muted" style={{ marginTop: '2px' }}>전체 학생의 성적과 역량을 비교 분석합니다</p>
            </div>

            <div className="grid-2" style={{ gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                {/* Radar Comparison */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Target size={18} color="var(--primary-400)" />
                        역량 비교
                    </h3>
                    <div style={{ height: 320 }}>
                        <Radar
                            data={comparisonData}
                            options={{
                                ...commonOptions,
                                scales: {
                                    r: {
                                        min: 0, max: 10,
                                        ticks: { color: chartTextColor, backdropColor: 'transparent', stepSize: 2 },
                                        grid: { color: chartGridColor },
                                        pointLabels: { color: chartTextColor, font: { size: 11, family: 'Inter' } },
                                        angleLines: { color: chartGridColor },
                                    },
                                },
                            }}
                        />
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart2 size={18} color="var(--success-400)" />
                        내신 평균 등급 비교
                    </h3>
                    <div style={{ height: 320 }}>
                        <Bar
                            data={barData}
                            options={{
                                ...commonOptions,
                                scales: {
                                    x: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } },
                                    y: { reverse: true, min: 0, max: 5, ticks: { color: chartTextColor, stepSize: 1 }, grid: { color: chartGridColor } },
                                },
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Trend Line Chart */}
            <div className="card">
                <h3 className="card-title" style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={18} color="var(--warning-400)" />
                    모의고사 표준점수 추이 (수학)
                </h3>
                <div style={{ height: 350 }}>
                    <Line
                        data={trendData}
                        options={{
                            ...commonOptions,
                            scales: {
                                x: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } },
                                y: { min: 110, max: 150, ticks: { color: chartTextColor }, grid: { color: chartGridColor } },
                            },
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
