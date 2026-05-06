import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonList, SkeletonStats } from '../../components/Skeleton.jsx';
import Layout from '../../components/Layout.jsx';
import api from '../../api/axios.js';
import EmptyState from '../../components/EmptyState.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { useToast } from '../../components/Toast.jsx';

export default function DriverOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const wsRef = useRef(null);
    const [error, setError] = useState(null)
    const { addToast } = useToast();
    const [activeOrder, setActiveOrder] = useState(null);

    useEffect(() => {
        fetchProfile();
        fetchOrders();
        connectWebSocket();

        const interval = setInterval(() => {
            fetchOrders();
            fetchProfile(); // ✅ Recheck approval status periodically
        }, 15000);

        return () => {
            clearInterval(interval);
            if (wsRef.current) wsRef.current.close();
        };
    }, []);
    useEffect(() => {
        const init = async () => {
            await fetchProfile(); // ✅ wait for profile first
            await fetchOrders();  // ✅ then fetch orders
            connectWebSocket();
        };
        init();

        const interval = setInterval(() => {
            fetchOrders();
            fetchProfile();
        }, 15000);

        return () => {
            clearInterval(interval);
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/me/');
            const profile = res.data.driver_profile;
            setIsOnline(profile?.is_online || false);

            // ✅ If revoked while online, show error and clear orders
            if (profile?.approval_status !== 'APPROVED') {
                setIsOnline(false);
                setOrders([]);
                setError('Your account has been revoked. Please contact support.');
            }
        } catch { }
    };

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders/available/');
            setOrders(res.data.orders || []);
            setActiveOrder(res.data.active_order || null);
            setError('');
        } catch (err) {
            const msg = err.response?.data?.error;
            if (err.response?.status === 403 && !isOnline) {
                setError('');
            } else {
                setError(msg || 'Failed to load orders.');
            }
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };
    const connectWebSocket = () => {
        const wsUrl = `${import.meta.env.VITE_WS_URL}/ws/orders/available/`;
        wsRef.current = new WebSocket(wsUrl);
        wsRef.current.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'new_order') {
                setOrders((prev) => {
                    // ✅ Don't add if order already exists
                    const exists = prev.find((o) => o.id === data.order_id);
                    if (exists) return prev;
                    return [{
                        id: data.order_id,
                        pickup_address: data.pickup_address,
                        dropoff_address: data.dropoff_address,
                        fare: data.fare,
                        driver_earnings: (data.fare * 0.85).toFixed(2),
                        distance_km: data.distance_km,
                        status: 'PENDING',
                        created_at: new Date().toISOString(),
                    }, ...prev];
                });
            }
        };
        wsRef.current.onclose = () => setTimeout(connectWebSocket, 3000);
    };

    const toggleOnline = async () => {
        setToggling(true);
        try {
            const res = await api.post('/auth/driver/toggle-online/');
            setIsOnline(res.data.is_online);
            if (res.data.is_online) fetchOrders();
            else setOrders([]);
            addToast(res.data.is_online ? '🟢 You are now online!' : '⚫ You are now offline.', 'info');
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to toggle status.', 'error');
        } finally {
            setToggling(false);
        }
    };

    const acceptOrder = async (orderId) => {
        try {
            await api.post(`/orders/${orderId}/accept/`);
            navigate(`/driver/map/${orderId}`);
            addToast('Order accepted! Head to pickup location.', 'success');
        } catch (err) {
            addToast(err.response?.data?.error || 'Order already taken.', 'error');
            fetchOrders();
        }
    };

    if (loading) return (
        <Layout>
            <div className="flex items-center justify-center h-64">
                <SkeletonList count={3} />
                <SkeletonStats />
            </div>
        </Layout>
    );

    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-5">

                {/* Online Toggle Card */}
                <div className={`rounded-2xl p-5 flex items-center justify-between transition-all ${isOnline ? 'bg-green-50 border border-green-200' : 'bg-gray-100 border border-gray-200'
                    }`}>
                    <div>
                        <p className="font-bold text-gray-800 text-lg">
                            {isOnline ? '🟢 You are Online' : '⚫ You are Offline'}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {isOnline ? 'You can receive delivery requests' : 'Go online to start receiving orders'}
                        </p>
                    </div>
                    <button
                        onClick={toggleOnline}
                        disabled={toggling}
                        className={`relative w-14 h-7 rounded-full transition-all duration-300 disabled:opacity-60 ${isOnline ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                    >
                        <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all duration-300 ${isOnline ? 'left-7' : 'left-0.5'
                            }`} />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                {/* Orders List */}
                <div>
                    {activeOrder && (
                        <div
                            onClick={() => navigate(`/driver/map/${activeOrder.id}`)}
                            className="bg-orange-500 rounded-2xl p-5 cursor-pointer hover:bg-orange-600 transition-all"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-white font-bold">🚗 Active Order #{activeOrder.id}</p>
                                <span className="bg-white text-orange-500 px-2.5 py-1 rounded-full text-xs font-bold">
                                    {activeOrder.status}
                                </span>
                            </div>
                            <div className="space-y-1 text-sm text-orange-100 mb-3">
                                <div className="flex gap-2">
                                    <span>📍</span>
                                    <p className="truncate">{activeOrder.pickup_address}</p>
                                </div>
                                <div className="flex gap-2">
                                    <span>🏁</span>
                                    <p className="truncate">{activeOrder.dropoff_address}</p>
                                </div>
                            </div>
                            <p className="text-orange-100 text-xs">
                                Tap to continue this delivery →
                            </p>
                        </div>
                    )}
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-gray-800">Available Orders</h2>
                        {isOnline && (
                            <button
                                onClick={fetchOrders}
                                className="text-sm text-orange-500 hover:underline"
                            >
                                Refresh
                            </button>
                        )}
                    </div>

                    {!isOnline ? (
                        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                            <div className="text-5xl mb-4">😴</div>
                            <p className="text-gray-500">Go online to see available orders</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                            <div className="text-5xl mb-4">🔍</div>
                            <p className="text-gray-500">No orders available right now.</p>
                            <p className="text-gray-400 text-sm mt-1">New orders will appear here automatically.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {orders.map((order) => (
                                <div key={order.id} className="bg-white rounded-2xl shadow-sm p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-semibold text-gray-800">Order #{order.id}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {new Date(order.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-semibold">
                                            ₦{Number(order.fare).toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm mb-4">
                                        <div className="flex gap-2">
                                            <span className="text-green-500 shrink-0">📍</span>
                                            <p className="text-gray-600 line-clamp-1">{order.pickup_address}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-red-500 shrink-0">🏁</span>
                                            <p className="text-gray-600 line-clamp-1">{order.dropoff_address}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-3 text-xs text-gray-500">
                                            <span>📏 {order.distance_km} km</span>
                                            <span>💰 ₦{Number(order.driver_earnings).toLocaleString()} earnings</span>
                                        </div>
                                        <button
                                            onClick={() => acceptOrder(order.id)}
                                            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                                        >
                                            Accept
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}