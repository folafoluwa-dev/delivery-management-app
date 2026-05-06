import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { SkeletonList } from '../../components/Skeleton.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import api from '../../api/axios.js';

export default function RiderHistory() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders/history/');
            setOrders(res.data);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Order History</h1>

                {loading ? (
                    <SkeletonList count={4} />
                ) : orders.length === 0 ? (
                    <EmptyState
                        icon="📦"
                        title="No orders yet"
                        message="You haven't placed any deliveries yet. Request your first one!"
                        action={() => navigate('/rider/request')}
                        actionLabel="Request Delivery"
                    />
                ) : (
                    <div className="space-y-3 animate-fade-in">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                onClick={() => order.status !== 'CANCELLED' && navigate(`/rider/track/${order.id}`)}
                                className={`bg-white rounded-2xl shadow-sm p-5 transition-all hover:shadow-md ${order.status !== 'CANCELLED' ? 'cursor-pointer' : 'opacity-70'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-semibold text-gray-800">Order #{order.id}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {new Date(order.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <StatusBadge status={order.status} />
                                </div>
                                <div className="space-y-1.5 text-sm mb-3">
                                    <div className="flex gap-2">
                                        <span className="text-orange-500">📍</span>
                                        <p className="text-gray-600 truncate">{order.pickup_address}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-orange-500">🏁</span>
                                        <p className="text-gray-600 truncate">{order.dropoff_address}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-sm">
                                    <span className="text-gray-500">{order.distance_km} km</span>
                                    <span className="font-bold text-orange-600">
                                        ₦{Number(order.fare).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}