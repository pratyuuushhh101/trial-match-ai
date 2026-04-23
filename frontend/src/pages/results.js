import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import BriefViewer from '@/components/BriefViewer';
import ChatBot from '@/components/ChatBot';

/**
 * Results page — reads pipeline state from sessionStorage, renders BriefViewer.
 * Redirects to home if no state is available.
 */
export default function ResultsPage() {
    const router = useRouter();
    const [state, setState] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const stored = sessionStorage.getItem('trially_result');
            if (!stored) {
                router.replace('/');
                return;
            }
            setState(JSON.parse(stored));
        } catch {
            router.replace('/');
        } finally {
            setLoading(false);
        }
    }, [router]);

    if (loading || !state) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-500 animate-pulse">Loading results...</div>
            </div>
        );
    }

    const trialTitle = state.trial?.title || 'Eligibility Assessment';

    return (
        <>
            <Head>
                <title>{`Results — ${state.trial?.nctId || 'Trially'}`}</title>
            </Head>

            <div className="min-h-screen flex flex-col">
                {/* Nav */}
                <nav className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-40 no-print">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src="/logo.svg" alt="Trially" className="w-8 h-8" />
                            <span className="text-lg font-bold gradient-text">Trially</span>
                        </div>
                        <div className="flex items-center gap-3 no-print">
                            <button
                                onClick={() => window.print()}
                                className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800"
                            >
                                🖨 Print
                            </button>
                            <button
                                onClick={() => {
                                    sessionStorage.removeItem('trially_result');
                                    router.push('/');
                                }}
                                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-1.5 rounded-lg transition-colors"
                            >
                                ← New Analysis
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Results */}
                <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
                    <BriefViewer state={state} />
                </main>

                <ChatBot state={state} />
            </div>
        </>
    );
}
