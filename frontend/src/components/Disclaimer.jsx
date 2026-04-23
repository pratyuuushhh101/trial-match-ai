/**
 * Disclaimer — mandatory medical disclaimer banner
 * Fixed at the bottom of the results page. Cannot be dismissed.
 */
export default function Disclaimer() {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-amber-50 border-t-2 border-amber-300 px-4 py-3 print:static print:border print:rounded-lg print:mt-6">
            <div className="max-w-5xl mx-auto flex items-start gap-3">
                <span className="text-amber-600 text-lg flex-shrink-0 mt-0.5">⚕️</span>
                <p className="text-amber-800 text-xs leading-relaxed font-medium">
                    <strong>Medical Disclaimer:</strong> Trially is a research coordination tool.
                    All eligibility assessments must be reviewed by a qualified physician before any
                    enrollment decision. This tool does not constitute medical advice.
                </p>
            </div>
        </div>
    );
}
