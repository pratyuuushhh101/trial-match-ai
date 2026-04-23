import { useState } from 'react';
import VerdictBadge from './VerdictBadge';
import CriterionCard from './CriterionCard';
import Disclaimer from './Disclaimer';

/**
 * BriefViewer — full results page content.
 * Builds the criteria table by joining state.criteria and state.assessments at render time.
 * state.brief.criteriaTable is NOT stored in the backend — this is by design.
 */
export default function BriefViewer({ state }) {
    const { patient, trial, criteria, assessments, brief, meta } = state;
    const [filter, setFilter] = useState('all'); // all | MEETS | FAILS | UNCERTAIN

    // Build the joined criteria table
    const criteriaTable = criteria.map((criterion) => {
        const assessment = assessments.find((a) => a.criterionId === criterion.id) || null;
        return { criterion, assessment };
    });

    // Filter
    const filtered = filter === 'all'
        ? criteriaTable
        : criteriaTable.filter((row) => row.assessment?.verdict === filter);

    // Verdict counts
    const counts = {
        MEETS: assessments.filter((a) => a.verdict === 'MEETS').length,
        FAILS: assessments.filter((a) => a.verdict === 'FAILS').length,
        UNCERTAIN: assessments.filter((a) => a.verdict === 'UNCERTAIN').length,
    };

    const totalTime = Object.values(meta.agentTimings)
        .filter((v) => v !== null)
        .reduce((sum, v) => sum + v, 0);

    return (
        <div className="space-y-8 pb-24 fade-in">
            {/* ── Header ──────────────────────────────────────────── */}
            <div className="glass-card p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-white mb-2">Eligibility Assessment</h1>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
                            {trial.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                            <span className="bg-gray-800 px-2.5 py-1 rounded-full">{trial.nctId}</span>
                            <span className="bg-gray-800 px-2.5 py-1 rounded-full">{trial.phase}</span>
                            <span className={`px-2.5 py-1 rounded-full ${trial.status === 'RECRUITING'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                }`}>
                                {trial.status}
                            </span>
                            <span className="bg-gray-800 px-2.5 py-1 rounded-full">
                                {(totalTime / 1000).toFixed(1)}s total
                            </span>
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        <VerdictBadge verdict={brief.recommendation} size="lg" />
                    </div>
                </div>
            </div>

            {/* ── Summary ─────────────────────────────────────────── */}
            <div className="glass-card p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-white mb-3">Summary</h2>
                <p className="text-gray-300 leading-relaxed">{brief.summary}</p>
            </div>

            {/* ── Verdict Stats ───────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-4">
                <StatCard
                    label="Criteria Met"
                    count={counts.MEETS}
                    total={assessments.length}
                    color="text-verdict-meets"
                    bgColor="bg-verdict-meets/5"
                    borderColor="border-verdict-meets/20"
                />
                <StatCard
                    label="Criteria Failed"
                    count={counts.FAILS}
                    total={assessments.length}
                    color="text-verdict-fails"
                    bgColor="bg-verdict-fails/5"
                    borderColor="border-verdict-fails/20"
                />
                <StatCard
                    label="Uncertain"
                    count={counts.UNCERTAIN}
                    total={assessments.length}
                    color="text-verdict-uncertain"
                    bgColor="bg-verdict-uncertain/5"
                    borderColor="border-verdict-uncertain/20"
                />
            </div>

            {/* ── Coordinator Checklist ───────────────────────────────── */}
            {brief.openQuestions && brief.openQuestions.length > 0 && (
                <div className="glass-card p-6 sm:p-8 border-brand-accent/30 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-brand-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    <div className="flex items-center gap-3 mb-5">
                        <div className="bg-brand-accent/10 border border-brand-accent/30 p-2 rounded-lg text-brand-light">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold bg-gradient-to-r from-brand-light to-blue-400 bg-clip-text text-transparent">
                                Coordinator Action Checklist
                            </h2>
                            <p className="text-xs text-gray-400 mt-1">
                                {brief.openQuestions.length} pending items required before PI review
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {brief.openQuestions.map((q, i) => (
                            <ChecklistItem key={i} text={q} index={i} />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Patient Profile ─────────────────────────────────── */}
            <div className="glass-card p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-white mb-4">Extracted Patient Profile</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <Field label="Diagnosis" value={patient.primaryDiagnosis} />
                    <Field label="Stage" value={patient.stage} />
                    <Field label="Age" value={patient.age} />
                    <Field label="Sex" value={patient.sex} />
                    <Field label="ECOG" value={patient.ecogScore} />
                    <Field
                        label="Medications"
                        value={
                            Array.isArray(patient.currentMedications)
                                ? patient.currentMedications.map(m => typeof m === 'string' ? m : m.name).join(', ')
                                : null
                        }
                    />
                    <Field
                        label="Prior Treatments"
                        value={
                            Array.isArray(patient.priorTreatments)
                                ? patient.priorTreatments.join(' | ')
                                : null
                        }
                        full
                    />
                    {patient.keyLabValues && typeof patient.keyLabValues === 'object' && (
                        <div className="sm:col-span-2">
                            <span className="text-gray-500 font-medium block mb-1">Lab Values</span>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(patient.keyLabValues).map(([key, val]) => (
                                    <span key={key} className="bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full text-xs">
                                        {key}: {val}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Criteria Table ──────────────────────────────────── */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h2 className="text-lg font-semibold text-white">
                        Criterion-by-Criterion Analysis
                        <span className="text-sm font-normal text-gray-500 ml-2">
                            ({filtered.length} of {criteriaTable.length})
                        </span>
                    </h2>
                    <div className="flex gap-2">
                        {['all', 'MEETS', 'FAILS', 'UNCERTAIN'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${filter === f
                                    ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20'
                                    : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                                    }`}
                            >
                                {f === 'all' ? `All (${criteriaTable.length})` : `${f} (${counts[f]})`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    {filtered.map((row) => (
                        <CriterionCard
                            key={row.criterion.id}
                            criterion={row.criterion}
                            assessment={row.assessment}
                        />
                    ))}
                    {filtered.length === 0 && (
                        <div className="glass-card-light p-8 text-center text-gray-500">
                            No criteria match the current filter.
                        </div>
                    )}
                </div>
            </div>

            {/* ── Warnings ────────────────────────────────────────── */}
            {meta.warnings && meta.warnings.length > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-amber-400 mb-3">⚠ Warnings</h2>
                    <ul className="space-y-2">
                        {meta.warnings.map((w, i) => (
                            <li key={i} className="text-sm text-amber-200">{w}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ── Disclaimer (fixed at bottom via component) ──── */}
            <Disclaimer />
        </div>
    );
}

function StatCard({ label, count, total, color, bgColor, borderColor }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className={`glass-card-light ${bgColor} border ${borderColor} p-5 text-center`}>
            <p className={`text-3xl font-bold ${color}`}>{count}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
            <div className="w-full bg-gray-800 rounded-full h-1.5 mt-3">
                <div
                    className={`h-1.5 rounded-full transition-all duration-700 ${color.includes('meets') ? 'bg-verdict-meets' :
                        color.includes('fails') ? 'bg-verdict-fails' : 'bg-verdict-uncertain'
                        }`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

function Field({ label, value, full }) {
    return (
        <div className={full ? 'sm:col-span-2' : ''}>
            <span className="text-gray-500 font-medium">{label}: </span>
            <span className="text-gray-300">{value || '—'}</span>
        </div>
    );
}

function ChecklistItem({ text, index }) {
    const [checked, setChecked] = useState(false);

    return (
        <div
            onClick={() => setChecked(!checked)}
            className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 cursor-pointer border ${checked
                    ? 'bg-gray-800/20 border-gray-800/50 grayscale opacity-60'
                    : 'bg-brand-dark/10 border-brand-accent/20 hover:border-brand-light/40 hover:bg-brand-dark/20'
                }`}
        >
            <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'bg-brand-accent text-white' : 'bg-gray-900 border border-gray-600'
                }`}>
                {checked && (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </div>
            <span className={`text-sm leading-relaxed transition-all duration-300 ${checked ? 'text-gray-500 line-through' : 'text-gray-200'
                }`}>
                {text}
            </span>
        </div>
    );
}
