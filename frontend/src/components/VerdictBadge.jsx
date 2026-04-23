/**
 * VerdictBadge — renders the color-coded recommendation chip
 */
export default function VerdictBadge({ verdict, size = 'md' }) {
    const config = {
        LIKELY_ELIGIBLE: {
            bg: 'bg-verdict-meets/10',
            text: 'text-verdict-meets',
            border: 'border-verdict-meets/20',
        },
        LIKELY_INELIGIBLE: {
            bg: 'bg-verdict-fails/10',
            text: 'text-verdict-fails',
            border: 'border-verdict-fails/20',
        },
        REQUIRES_REVIEW: {
            bg: 'bg-amber-500/10',
            text: 'text-amber-500',
            border: 'border-amber-500/20',
        },
    }[verdict] || {
        bg: 'bg-gray-800',
        text: 'text-gray-400',
        border: 'border-gray-700',
    };

    const displayFormat = verdict ? verdict.replace('_', ' ') : 'UNKNOWN';

    const sizes = {
        sm: 'px-2.5 py-1 text-xs',
        md: 'px-4 py-1.5 text-sm',
        lg: 'px-6 py-2.5 text-base',
    }[size];

    return (
        <span
            className={`inline-block rounded-full font-bold tracking-wide border ${config.bg} ${config.text} ${config.border} ${sizes}`}
        >
            {displayFormat}
        </span>
    );
}
