import { useState } from 'react';

/**
 * CriterionCard — displays a single criterion + its assessment.
 * Expandable/collapsible to show the AI reasoning and action items.
 */
export default function CriterionCard({ criterion, assessment }) {
    const [expanded, setExpanded] = useState(false);

    const verdict = assessment?.verdict || 'UNCERTAIN';
    const reasoning = assessment?.reasoning || 'No assessment currently available.';
    const action = assessment?.action || null;

    const colors = {
        MEETS: 'bg-verdict-meets text-white',
        FAILS: 'bg-verdict-fails text-white',
        UNCERTAIN: 'bg-gray-600 text-gray-200',
    }[verdict];

    return (
        <div className="glass-card-light overflow-hidden transition-all duration-300">
            {/* Header (Click to expand) */}
            <button
                type="button"
                className="w-full text-left p-4 sm:p-5 flex items-start gap-4 hover:bg-gray-800/30 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                {/* ID & Type */}
                <div className="flex flex-col items-center gap-2 pt-1 flex-shrink-0">
                    <span className="text-xs font-mono text-gray-500">#{criterion.id}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${criterion.type === 'inclusion' ? 'border-brand-accent/30 text-brand-light' : 'border-amber-500/30 text-amber-500'
                        }`}>
                        {criterion.type}
                    </span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 leading-relaxed pr-4">
                        {criterion.text}
                    </p>
                </div>

                {/* Verdict Badge */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${colors}`}>
                        {verdict}
                    </span>
                    <svg
                        className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Expanded Content (Reasoning + Actions) */}
            <div
                className={`transition-all duration-300 ease-in-out ${expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden bg-gray-900/50`}
            >
                <div className="p-5 border-t border-gray-800/60 ml-14">
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-xs uppercase tracking-wider text-brand-light font-semibold mb-2">
                                Trially Reasoning
                            </h4>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {reasoning}
                            </p>
                        </div>
                        {action && (
                            <div className="bg-brand-dark/20 border border-brand-accent/20 rounded-lg p-3">
                                <h4 className="text-xs uppercase tracking-wider text-amber-500 font-semibold mb-1 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Recommended Action
                                </h4>
                                <p className="text-sm text-amber-100/80 leading-relaxed">
                                    {action}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
