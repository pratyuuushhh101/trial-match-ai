import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import InputForm from '@/components/InputForm';
import LoadingPipeline from '@/components/LoadingPipeline';
import { analyzeEligibility } from '@/lib/api';

/**
 * Landing page — input form + loading pipeline overlay.
 * On successful submission, navigates to /results with the state in query.
 */
export default function HomePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    async function handleSubmit({ patientSummary, trialId }) {
        setIsLoading(true);
        setError(null);

        try {
            const data = await analyzeEligibility(patientSummary, trialId);

            // Store full state in sessionStorage (too large for URL query params)
            sessionStorage.setItem('trially_result', JSON.stringify(data.state));
            router.push('/results');
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    }

    return (
        <>
            <Head>
                <title>Trially — Clinical Trial Eligibility Reasoning</title>
            </Head>

            <div className="min-h-screen flex flex-col">
                {/* Nav */}
                <nav className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-40 no-print">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
                        <img src="/logo.svg" alt="Trially" className="w-8 h-8" />
                        <span className="text-lg font-bold gradient-text">Trially</span>
                    </div>
                </nav>

                {/* Main content */}
                <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
                    {isLoading ? (
                        <div className="w-full max-w-lg slide-up">
                            <LoadingPipeline />
                        </div>
                    ) : (
                        <div className="w-full max-w-2xl slide-up">
                            {/* Hero */}
                            <div className="text-center mb-10">
                                <div className="inline-flex items-center gap-2 bg-brand-dark/20 border border-brand-accent/20 rounded-full px-4 py-1.5 mb-6">
                                    <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                                    <span className="text-xs text-brand-light font-medium">Multi-Agent Reasoning Pipeline</span>
                                </div>
                                <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
                                    Clinical Trial
                                    <br />
                                    <span className="gradient-text">Eligibility Reasoning</span>
                                </h1>
                                <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
                                    Paste a patient summary and a trial NCT ID. Our 5-agent pipeline will assess
                                    eligibility criterion by criterion — grounded in the patient&apos;s data,
                                    never hallucinated.
                                </p>
                            </div>

                            {/* Form card */}
                            <div className="glass-card p-6 sm:p-8">
                                <InputForm onSubmit={handleSubmit} isLoading={isLoading} />

                                {error && (
                                    <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 fade-in">
                                        <div className="flex items-start gap-3">
                                            <span className="text-red-400 text-lg flex-shrink-0">✕</span>
                                            <div>
                                                <p className="text-red-300 text-sm font-semibold">Analysis Failed</p>
                                                <p className="text-red-400/80 text-sm mt-1">{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer features */}
                            <div className="grid grid-cols-3 gap-4 mt-8 text-center">
                                <FeatureChip icon="🧬" label="Patient Extraction" description="Parses unstructured notes" />
                                <FeatureChip icon="🧠" label="AI Reasoning" description="Zero hallucination logic" />
                                <FeatureChip icon="📋" label="Coordinator Brief" description="Actionable checklists" />
                            </div>
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer className="border-t border-gray-800/40 py-4 text-center text-xs text-gray-600 no-print">
                    Trially — Research coordination tool. Not medical advice.
                </footer>
            </div>
        </>
    );
}

function FeatureChip({ icon, label, description }) {
    return (
        <div className="glass-card px-3 py-4 hover:border-teal-500/30 hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] transition-all duration-300 group">
            <span className="text-xl block mb-2">{icon}</span>
            <span className="text-sm text-gray-200 font-medium block mb-1 group-hover:text-teal-400 transition-colors">{label}</span>
            <span className="text-xs text-gray-500">{description}</span>
        </div>
    );
}
