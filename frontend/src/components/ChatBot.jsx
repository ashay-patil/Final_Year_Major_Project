import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const ChatBot = () => {
    const [messages, setMessages] = useState([
        {
            role: 'ai',
            content: 'Hello! I am MediFlow AI. How can I assist you today? You can ask me about patients (e.g. "Tell me about PAT001"), discharge criteria, or hospital policies.'
        }
    ]);

    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const [sessionId] = useState(
        () => 'session_' + Math.random().toString(36).substring(2, 11)
    );

    const [patientId, setPatientId] = useState(null);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async (text = input) => {
        if (!text.trim() || isTyping) {
            return;
        }

        const userMessage = {
            role: 'user',
            content: text
        };

        setMessages(prev => [
            ...prev,
            userMessage
        ]);

        setInput('');
        setIsTyping(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/chatbot`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: text,
                        session_id: sessionId,
                        patient_id: patientId
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.patient_id) {
                setPatientId(data.patient_id);
            }

            setMessages(prev => [
                ...prev,
                {
                    role: 'ai',
                    content:
                        data.response ||
                        'Sorry, I received an empty response.'
                }
            ]);

        } catch (error) {
            console.error('Chatbot error:', error);

            setMessages(prev => [
                ...prev,
                {
                    role: 'ai',
                    content:
                        'Connection error. Please make sure the backend server is running and try again.'
                }
            ]);

        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const suggestions = [
        'Discharge criteria',
        'Tell me about PAT001',
        'Hospital policies'
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${
                            msg.role === 'user'
                                ? 'justify-end'
                                : 'justify-start'
                        }`}
                    >
                        <div
                            className={`flex gap-2 max-w-[85%] ${
                                msg.role === 'user'
                                    ? 'flex-row-reverse'
                                    : 'flex-row'
                            }`}
                        >
                            <div
                                className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full mt-1 ${
                                    msg.role === 'user'
                                        ? 'bg-blue-600/30 text-blue-300'
                                        : 'bg-emerald-500/20 text-emerald-300'
                                }`}
                            >
                                {msg.role === 'user'
                                    ? <User size={14} />
                                    : <Bot size={14} />
                                }
                            </div>

                            <div
                                className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                                    msg.role === 'user'
                                        ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-tr-none'
                                        : 'bg-white/10 border border-white/5 text-gray-200 rounded-tl-none backdrop-blur-md'
                                }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Suggestions */}
                {messages.length === 1 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {suggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(suggestion)}
                                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 transition-colors duration-200"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="flex gap-2 max-w-[80%]">
                            <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full mt-1 bg-emerald-500/20 text-emerald-300">
                                <Bot size={14} />
                            </div>
                            <div className="p-4 rounded-2xl rounded-tl-none bg-white/10 border border-white/5 backdrop-blur-md flex items-center gap-1.5">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white/5 border-t border-white/10 shrink-0">
                <div className="relative flex items-center">
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Ask anything about patients, policies..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-300 resize-none h-11 min-h-[44px] max-h-[120px]"
                        rows={1}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isTyping}
                        className={`absolute right-2 p-1.5 rounded-lg transition-all duration-300 ${
                            input.trim()
                                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                : 'bg-transparent text-gray-600'
                        }`}
                    >
                        <Send
                            size={16}
                            className={input.trim() ? 'translate-x-0.5 -translate-y-0.5 transition-transform' : ''}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatBot;