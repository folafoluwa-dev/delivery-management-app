import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import api from '../../api/axios.js';
import { SkeletonList, SkeletonStats } from '../../components/Skeleton.jsx';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin-panel/stats/');
            setStats(res.data);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const statCards = stats ? [
        { label: 'Total Riders', value: stats.total_users, icon: '👤', color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Total Drivers', value: stats.total_drivers, icon: '🚗', color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Pending Approvals', value: stats.pending_drivers, icon: '⏳', color: 'text-yellow-600', bg: 'bg-yellow-50' },
        { label: 'Total Orders', value: stats.total_orders, icon: '📦', color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Completed', value: stats.completed_orders, icon: '✅', color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Cancelled', value: stats.cancelled_orders, icon: '❌', color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'Total Revenue', value: `₦${Number(stats.total_revenue).toLocaleString()}`, icon: '💰', color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Commission', value: `₦${Number(stats.platform_commission).toLocaleString()}`, icon: '🏦', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ] : [];

    if (loading) return (
        <Layout>
            <div className="flex w-max">
                <SkeletonList count={3} />
                <SkeletonStats />
            </div>
        </Layout>
    );

    return (
        <Layout>
            <div className="max-w-5xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {statCards.map((card) => (
                        <div key={card.label} className="bg-white rounded-2xl shadow-sm p-5">
                            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                                <span className="text-xl">{card.icon}</span>
                            </div>
                            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-3">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'Manage Drivers', icon: '🚗', path: '/admin/drivers', badge: stats?.pending_drivers },
                            { label: 'View Ratings', icon: '⭐', path: '/admin/ratings' },
                            { label: 'Manage Users', icon: '👥', path: '/admin/users' },
                            { label: 'All Orders', icon: '📦', path: '/admin/orders' },
                        ].map((action) => (
                            <button
                                key={action.label}
                                onClick={() => navigate(action.path)}
                                className="bg-white rounded-2xl shadow-sm p-5 text-center hover:shadow-md hover:border-orange-200 border border-transparent transition-all relative"
                            >
                                {action.badge > 0 && (
                                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                        {action.badge}
                                    </span>
                                )}
                                <div className="text-3xl mb-2">{action.icon}</div>
                                <p className="text-sm font-semibold text-gray-700">{action.label}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
}