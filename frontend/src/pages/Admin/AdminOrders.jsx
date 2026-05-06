import { useState, useEffect } from 'react';
import Layout from '../../components/Layout.jsx';
import api from '../../api/axios.js';
import { SkeletonList, SkeletonStats } from '../../components/Skeleton.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/admin-panel/orders/');
            setOrders(res.data);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const statusColors = {
        PENDING: 'bg-yellow-100 text-yellow-600',
        ACCEPTED: 'bg-blue-100 text-blue-600',
        PICKED_UP: 'bg-purple-100 text-purple-600',
        DELIVERED: 'bg-green-100 text-green-600',
        CANCELLED: 'bg-red-100 text-red-600',
    };

    return (
        <Layout>
            <div className="max-w-5xl mx-auto space-y-5">
                <h1 className="text-2xl font-bold text-gray-800">All Orders</h1>

                {loading ? (
                    <div className="flex items-center justify-center">
                        <SkeletonList count={3} />
                        <SkeletonStats />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-5xl mb-3">📦</div>
                        <p className="text-gray-400">No orders yet.</p>
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
                                    <StatusBadge status={order.status} />
                                </div>

                                <div className="space-y-1.5 text-sm mb-3">
                                    <div className="flex gap-2">
                                        <span className="text-green-500">📍</span>
                                        <p className="text-gray-600 truncate">{order.pickup_address}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-red-500">🏁</span>
                                        <p className="text-gray-600 truncate">{order.dropoff_address}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-sm">
                                    <div className="flex gap-4 text-gray-500">
                                        <span>👤 {order.rider}</span>
                                        <span>🚗 {order.driver || 'Unassigned'}</span>
                                        <span>📏 {order.distance_km} km</span>
                                    </div>
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