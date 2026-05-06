import { useState, useEffect } from 'react';
import Layout from '../../components/Layout.jsx';
import api from '../../api/axios.js';
import { SkeletonList, SkeletonStats } from '../../components/Skeleton.jsx';

export default function DriverEarnings() {
    const [profile, setProfile] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [meRes, txRes, ordersRes] = await Promise.all([
                api.get('/auth/me/'),
                api.get('/wallet/transactions/'),
                api.get('/orders/history/'),
            ]);
            setProfile(meRes.data);
            setTransactions(txRes.data.filter(t => t.transaction_type === 'CREDIT'));
            setOrders(ordersRes.data.filter(o => o.status === 'DELIVERED'));
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const totalEarnings = profile?.driver_profile?.total_earnings || 0;
    const walletBalance = profile?.wallet_balance || 0;
    const totalDeliveries = orders.length;
    const avgEarning = totalDeliveries > 0
        ? (totalEarnings / totalDeliveries).toFixed(2)
        : 0;

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
                <h1 className="text-2xl font-bold text-gray-800">Earnings Dashboard</h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl shadow-sm p-5">
                        <p className="text-xs text-gray-500 mb-1">Wallet Balance</p>
                        <p className="text-2xl font-bold text-orange-500">
                            ₦{Number(walletBalance).toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-5">
                        <p className="text-xs text-gray-500 mb-1">Total Earned</p>
                        <p className="text-2xl font-bold text-green-500">
                            ₦{Number(totalEarnings).toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-5">
                        <p className="text-xs text-gray-500 mb-1">Deliveries</p>
                        <p className="text-2xl font-bold text-gray-800">{totalDeliveries}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-5">
                        <p className="text-xs text-gray-500 mb-1">Avg per Trip</p>
                        <p className="text-2xl font-bold text-gray-800">
                            ₦{Number(avgEarning).toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Rating Card */}
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">Your Rating</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-bold text-gray-800">
                                {Number(profile?.avg_rating || 0).toFixed(1)}
                            </span>
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <span key={s} className={`text-lg ${s <= Math.round(profile?.avg_rating || 0)
                                        ? 'opacity-100'
                                        : 'opacity-25'
                                        }`}>⭐</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="text-4xl">🏆</div>
                </div>

                {/* Recent Earnings */}
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-3">Recent Earnings</h2>
                    {transactions.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
                            <div className="text-4xl mb-3">💸</div>
                            <p className="text-gray-400 text-sm">No earnings yet. Accept your first order!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="bg-white rounded-xl shadow-sm px-5 py-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">{tx.description}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {new Date(tx.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">
                                            +₦{Number(tx.amount).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Bal: ₦{Number(tx.balance_after).toLocaleString()}
                                        </p>
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