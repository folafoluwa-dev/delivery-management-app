import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function OrderChat() {
    const { orderId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        fetchOrder();
        fetchHistory();
        connectWebSocket();
        return () => { if (wsRef.current) wsRef.current.close(); };
    }, [orderId]);

    // Auto scroll to bottom on new message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchOrder = async () => {
        try {
            const res = await api.get(`/orders/${orderId}/`);
            setOrder(res.data);
        } catch { }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get(`/tracking/chat/${orderId}/`);
            setMessages(res.data);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const connectWebSocket = () => {
        const wsUrl = `${import.meta.env.VITE_WS_URL}/ws/chat/${orderId}/`;
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => setConnected(true);
        wsRef.current.onclose = () => {
            setConnected(false);
            setTimeout(connectWebSocket, 3000);
        };

        wsRef.current.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'chat_message') {
                setMessages((prev) => {
                    // Avoid duplicates
                    const exists = prev.find((m) => m.message_id === data.message_id);
                    if (exists) return prev;
                    return [...prev, data];
                });
            }
        };
    };

    const sendMessage = () => {
        const text = input.trim();
        if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        wsRef.current.send(JSON.stringify({
            message: text,
            sender_id: user.id,
        }));
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const isClosed = order?.status === 'DELIVERED' || order?.status === 'CANCELLED';
    const otherPerson = user?.role === 'RIDER' ? order?.driver_name : order?.rider_name;

    const formatTime = (iso) => {
        const date = new Date(iso);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (iso) => {
        const date = new Date(iso);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) return 'Today';
        return date.toLocaleDateString();
    };

    // Group messages by date
    const groupedMessages = messages.reduce((groups, msg) => {
        const date = formatDate(msg.created_at);
        if (!groups[date]) groups[date] = [];
        groups[date].push(msg);
        return groups;
    }, {});

    const backPath = user?.role === 'RIDER'
        ? `/rider/track/${orderId}`
        : `/driver/map/${orderId}`;

    return (
        <Layout>
            <div className="max-w-2xl mx-auto">
                {/* Chat Header */}
                <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 flex items-center gap-3">
                    <button
                        onClick={() => navigate(backPath)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all text-gray-600"
                    >
                        ←
                    </button>
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-orange-500 font-bold">
                            {otherPerson?.charAt(0) || '?'}
                        </span>
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                            {otherPerson || 'Loading...'}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                            <p className="text-xs text-gray-400">
                                {connected ? 'Connected' : 'Connecting...'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400">Order #{orderId}</p>
                        <span className={`text-xs font-semibold ${isClosed ? 'text-gray-400' : 'text-orange-500'
                            }`}>
                            {order?.status || '...'}
                        </span>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col" style={{ height: '60vh' }}>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="text-5xl mb-3">💬</div>
                                <p className="text-gray-500 font-medium">No messages yet</p>
                                <p className="text-gray-400 text-sm mt-1">
                                    Say hello to your {user?.role === 'RIDER' ? 'driver' : 'rider'}!
                                </p>
                            </div>
                        ) : (
                            Object.entries(groupedMessages).map(([date, msgs]) => (
                                <div key={date}>
                                    {/* Date Separator */}
                                    <div className="flex items-center gap-3 my-3">
                                        <div className="flex-1 h-px bg-gray-100"></div>
                                        <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                                            {date}
                                        </span>
                                        <div className="flex-1 h-px bg-gray-100"></div>
                                    </div>

                                    {/* Messages */}
                                    <div className="space-y-2">
                                        {msgs.map((msg) => {
                                            const isMe = msg.sender_id === user?.id;
                                            return (
                                                <div
                                                    key={msg.message_id}
                                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    {/* Avatar for other person */}
                                                    {!isMe && (
                                                        <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center mr-2 shrink-0 mt-1">
                                                            <span className="text-orange-500 text-xs font-bold">
                                                                {msg.sender_name?.charAt(0)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                                        {!isMe && (
                                                            <p className="text-xs text-gray-400 mb-1 ml-1">
                                                                {msg.sender_name}
                                                            </p>
                                                        )}
                                                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe
                                                            ? 'bg-orange-500 text-white rounded-br-sm'
                                                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                                                            }`}>
                                                            {msg.message}
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1 mx-1">
                                                            {formatTime(msg.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-gray-100 p-4">
                        {isClosed ? (
                            <div className="text-center text-sm text-gray-400 py-2">
                                💬 Chat is closed — order has ended
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message..."
                                    maxLength={500}
                                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || !connected}
                                    className="w-11 h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-40 shrink-0"
                                >
                                    ➤
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Back to Order button */}
                <button
                    onClick={() => navigate(backPath)}
                    className="w-full mt-4 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-all text-sm"
                >
                    ← Back to Order
                </button>
            </div>
        </Layout>
    );
}