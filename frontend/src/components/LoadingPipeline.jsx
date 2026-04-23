import { useState, useEffect } from 'react';

/**
 * LoadingPipeline — shows the 5 agent steps with animated progress
 * Uses a timer to simulate progress since the backend does not stream agent status in v1.
 */

const PIPELINE_STEPS = [
    { id: 'patientExtractor', label: 'Extracting Patient Data', description: 'Parsing clinical summary into structured profile', icon: '🧬', duration: 8000 },
    { id: 'trialFetcher', label: 'Fetching Trial Protocol', description: 'Retrieving eligibility criteria from ClinicalTrials.gov', icon: '📋', duration: 3000 },
    { id: 'criteriaParser', label: 'Parsing Eligibility Criteria', description: 'Segmenting protocol into individual criteria', icon: '🔍', duration: 6000 },
    { id: 'eligibilityReasoner', label: 'Reasoning Through Criteria', description: 'Assessing each criterion against patient profile', icon: '🧠', duration: 15000 },
    { id: 'briefGenerator', label: 'Generating Brief', description: 'Synthesizing eligibility assessment report', icon: '📝', duration: 8000 },
];

export default function LoadingPipeline() {
    const [activeStep, setActiveStep] = useState(0);
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setElapsed((prev) => prev + 200);
        }, 200);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let cumulativeDuration = 0;
        for (let i = 0; i < PIPELINE_STEPS.length; i++) {
            cumulativeDuration += PIPELINE_STEPS[i].duration;
            if (elapsed < cumulativeDuration) {
                setActiveStep(i);
                return;
            }
        }
        setActiveStep(PIPELINE_STEPS.length - 1);
    }, [elapsed]);

    function getStepStatus(index) {
        let cumulativeDuration = 0;
        for (let i = 0; i <= index; i++) {
            cumulativeDuration += PIPELINE_STEPS[i].duration;
        }
        const stepStart = cumulativeDuration - PIPELINE_STEPS[index].duration;

        if (elapsed >= cumulativeDuration) return 'complete';
        if (elapsed >= stepStart) return 'active';
        return 'pending';
    }

    return (
        <div className="w-full max-w-lg mx-auto">
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-brand-dark/30 border border-brand-accent/20 rounded-full px-4 py-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                    <span className="text-sm text-brand-light font-medium">Pipeline Running</span>
                </div>
                <h3 className="text-xl font-semibold text-white">Analyzing Eligibility</h3>
                <p className="text-gray-400 text-sm mt-1">This typically takes 30–90 seconds</p>
            </div>

            <div className="space-y-1">
                {PIPELINE_STEPS.map((step, index) => {
                    const status = getStepStatus(index);

                    return (
                        <div key={step.id} className="flex items-start gap-4">
                            {/* Connector line + icon */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 ${status === 'complete'
                                            ? 'bg-verdict-meets/20 ring-2 ring-verdict-meets/40'
                                            : status === 'active'
                                                ? 'bg-brand-accent/20 ring-2 ring-brand-accent/60 animate-pulse'
                                                : 'bg-gray-800 ring-1 ring-gray-700'
                                        }`}
                                >
                                    {status === 'complete' ? '✓' : step.icon}
                                </div>
                                {index < PIPELINE_STEPS.length - 1 && (
                                    <div
                                        className={`w-0.5 h-8 transition-colors duration-500 ${status === 'complete' ? 'bg-verdict-meets/40' : 'bg-gray-700'
                                            }`}
                                    />
                                )}
                            </div>

                            {/* Step content */}
                            <div className="pt-1.5 pb-4">
                                <p
                                    className={`font-semibold text-sm transition-colors duration-300 ${status === 'complete'
                                            ? 'text-verdict-meets'
                                            : status === 'active'
                                                ? 'text-white'
                                                : 'text-gray-500'
                                        }`}
                                >
                                    Agent {index + 1}: {step.label}
                                </p>
                                <p
                                    className={`text-xs mt-0.5 transition-colors duration-300 ${status === 'active' ? 'text-gray-300' : 'text-gray-600'
                                        }`}
                                >
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
