import { useState } from 'react';

/**
 * InputForm — two-field form for patient summary + trial NCT ID
 * Includes a "Try the demo" button that pre-fills with sample data.
 */

const SAMPLE_PATIENT = `REFERRAL SUMMARY — ONCOLOGY CONSULTATION

Patient: Male, 58 years old
Diagnosis: Stage IV non-small cell lung cancer (adenocarcinoma, non-squamous),
confirmed histologically via CT-guided biopsy, right lower lobe primary.
Diagnosis date: August 2024.

Metastatic sites: Right hilar and mediastinal lymph nodes, right adrenal gland.
Brain MRI (February 2026): No intracranial metastases.

Molecular profiling (NGS, October 2024):
- KRAS G12C mutation identified
- EGFR: wild-type
- ALK: negative
- PD-L1 TPS: 65% (22C3 assay)

Prior treatment history:
1. Pembrolizumab monotherapy (first-line, started November 2024)
   - Best response: Partial response confirmed at 3-month scan
   - Duration on therapy: 8 months of stable/responding disease
   - Progression confirmed: July 2025 (CT showing new adrenal lesion,
     enlargement of mediastinal nodes)
   - Pembrolizumab discontinued at confirmed progression

2. Sotorasib 960mg daily (KRAS G12C inhibitor, second-line, started August 2025)
   - Duration: 5 months
   - Best response: Stable disease
   - Discontinued February 2026 due to radiographic progression

Current status (April 2026):
- ECOG performance status: 1
- Weight: 74 kg
- No major surgery in the past 6 months
- No known hypersensitivity to taxanes or polysorbate 80
- No prior permanent discontinuation of immunotherapy due to adverse events

Current medications:
- Ondansetron PRN (nausea)
- Omeprazole 20mg daily
- Loratadine 10mg daily (seasonal allergies)

Lab values (March 2026):
- AST: 38 U/L (institutional ULN: 40 U/L) — within normal limits
- ALT: 52 U/L (institutional ULN: 40 U/L) — mildly elevated, 1.3× ULN
- ALP: 88 U/L (institutional ULN: 120 U/L) — within normal limits
- Serum creatinine: 1.1 mg/dL
- Absolute lymphocyte count: 1,450 cells/µL (institutional ULN: 1,200 cells/µL)
- No active autoimmune disease
- No history of ILD or pneumonitis`;

const SAMPLE_TRIAL_ID = 'NCT06745908';

const NCT_REGEX = /^NCT\d{8}$/;

export default function InputForm({ onSubmit, isLoading }) {
    const [patientSummary, setPatientSummary] = useState('');
    const [trialId, setTrialId] = useState('');
    const [errors, setErrors] = useState({});

    function validate() {
        const newErrors = {};
        if (!patientSummary.trim()) {
            newErrors.patientSummary = 'Patient summary is required';
        }
        if (!trialId.trim()) {
            newErrors.trialId = 'Trial NCT ID is required';
        } else if (!NCT_REGEX.test(trialId.trim())) {
            newErrors.trialId = 'NCT ID must be in format NCTxxxxxxxx (NCT followed by 8 digits)';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (validate()) {
            onSubmit({ patientSummary: patientSummary.trim(), trialId: trialId.trim() });
        }
    }

    function handleTryDemo() {
        setPatientSummary(SAMPLE_PATIENT);
        setTrialId(SAMPLE_TRIAL_ID);
        setErrors({});
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Summary */}
            <div>
                <label htmlFor="patientSummary" className="block text-sm font-semibold text-gray-200 mb-2">
                    Patient Summary
                </label>
                <textarea
                    id="patientSummary"
                    value={patientSummary}
                    onChange={(e) => setPatientSummary(e.target.value)}
                    placeholder="Paste a clinical summary here — discharge note, referral letter, or EHR export. Include diagnosis, treatment history, medications, lab values, and demographics."
                    rows={12}
                    className={`w-full rounded-xl border bg-[#1a2035] text-white placeholder-gray-400 px-4 py-3 text-sm font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 transition-all duration-200 ${errors.patientSummary
                        ? 'border-red-500 focus:ring-red-500/40'
                        : 'border-white/5 focus:ring-teal-500/40 focus:border-teal-500'
                        }`}
                    disabled={isLoading}
                />
                {errors.patientSummary && (
                    <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                        <span>⚠</span> {errors.patientSummary}
                    </p>
                )}
            </div>

            {/* Trial ID */}
            <div>
                <label htmlFor="trialId" className="block text-sm font-semibold text-gray-200 mb-2">
                    Clinical Trial NCT ID
                </label>
                <div className="flex gap-3 items-start">
                    <div className="flex-1">
                        <input
                            id="trialId"
                            type="text"
                            value={trialId}
                            onChange={(e) => setTrialId(e.target.value.toUpperCase())}
                            placeholder="NCT06745908"
                            className={`w-full rounded-xl border bg-[#1a2035] text-white placeholder-gray-400 px-4 py-3 text-sm tracking-wide focus:outline-none focus:ring-2 transition-all duration-200 ${errors.trialId
                                ? 'border-red-500 focus:ring-red-500/40'
                                : 'border-white/5 focus:ring-teal-500/40 focus:border-teal-500'
                                }`}
                            disabled={isLoading}
                        />
                        {errors.trialId && (
                            <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                                <span>⚠</span> {errors.trialId}
                            </p>
                        )}
                    </div>
                    <a
                        href="https://clinicaltrials.gov/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-light hover:text-brand-accent underline underline-offset-2 mt-3 whitespace-nowrap"
                    >
                        Find a trial →
                    </a>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                    {isLoading ? 'Analyzing...' : 'Analyze Eligibility'}
                </button>
                <button
                    type="button"
                    onClick={handleTryDemo}
                    disabled={isLoading}
                    className="sm:w-auto bg-white/5 hover:bg-white/10 text-white font-medium py-3.5 px-6 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ✨ Try the demo
                </button>
            </div>
        </form>
    );
}
