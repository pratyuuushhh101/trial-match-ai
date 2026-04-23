import { useState, useRef, useEffect } from 'react';
import { askChatbot } from '@/lib/api';

export default function ChatBot({ state }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! I am the Trially Assistant. I have full context of this patient and the trial protocol. How can I help you clarify this eligibility report?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    async function handleSend(e) {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input.trim() };
        const newHist = [...messages, userMsg];
        setMessages(newHist);
        setInput('');
        setLoading(true);

        try {
            const answer = await askChatbot(state, userMsg.content, messages.filter(m => m.role !== 'system'));
            setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
        } catch (err) {
            setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed bottom-12 right-6 z-50 flex flex-col items-end print:hidden">
            {/* Chat Window */}
            {isOpen && (
                <div className="glass-card mb-4 w-[380px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-120px)] flex flex-col shadow-2xl overflow-hidden border border-brand-accent/40 fade-in">
                    {/* Header */}
                    <div className="bg-brand-dark/50 border-b border-brand-accent/20 p-4 flex justify-between items-center bg-gradient-to-r from-brand-dark to-brand-dark/20">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                            <h3 className="text-white font-semibold flex items-center gap-2">
                                Ask Trially
                            </h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-950/40">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm ${msg.role === 'user'
                                    ? 'bg-brand-accent text-white rounded-br-sm'
                                    : 'bg-gray-800/80 text-gray-200 border border-gray-700/50 rounded-bl-sm'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="px-4 py-2.5 rounded-2xl bg-gray-800/80 text-gray-400 border border-gray-700/50 flex gap-1 items-center">
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-3 bg-gray-900 border-t border-gray-800/80">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 bg-gray-950/50 border border-gray-700 text-white text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-brand-accent/50 focus:ring-1 focus:ring-brand-accent/50"
                                placeholder="Ask about criteria..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="bg-brand-accent hover:bg-brand-light disabled:opacity-50 text-white rounded-xl px-4 flex items-center justify-center transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Floating Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-brand-accent hover:bg-brand-light text-white p-4 rounded-full shadow-lg hover:shadow-brand-accent/40 transition-all flex items-center gap-2 group ring-4 ring-gray-900"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap opacity-0 group-hover:opacity-100 font-medium">
                        Ask Assistant
                    </span>
                </button>
            )}
        </div>
    );
}
