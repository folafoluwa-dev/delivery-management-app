import { useState, useEffect } from 'react';
import Layout from '../../components/Layout.jsx';
import api from '../../api/axios.js';
import { SkeletonList, SkeletonStats } from '../../components/Skeleton.jsx';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);
    const [creditModal, setCreditModal] = useState(null);
    const [creditAmount, setCreditAmount] = useState('');
    const [crediting, setCrediting] = useState(false);

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin-panel/users/');
            setUsers(res.data);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (id) => {
        setActionId(id);
        try {
            const res = await api.post(`/admin-panel/users/${id}/toggle-active/`);
            setUsers((prev) => prev.map((u) =>
                u.id === id ? { ...u, is_active: res.data.is_active } : u
            ));
        } catch { }
        finally { setActionId(null); }
    };

    const handleCredit = async () => {
        if (!creditAmount || parseFloat(creditAmount) <= 0) return;
        setCrediting(true);
        try {
            const res = await api.post(`/admin-panel/users/${creditModal.id}/credit-wallet/`, {
                amount: creditAmount,
            });
            // ✅ Use the actual new balance returned from backend
            setUsers((prev) => prev.map((u) =>
                u.id === creditModal.id
                    ? { ...u, wallet_balance: res.data.new_balance }
                    : u
            ));
            setCreditModal(null);
            setCreditAmount('');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to credit wallet.');
        } finally {
            setCrediting(false);
        }
    };
    return (
        <Layout>
            <div className="max-w-5xl mx-auto space-y-5">
                <h1 className="text-2xl font-bold text-gray-800">User Management</h1>

                {loading ? (
                    <div className="flex items-center justify-center">
                        <SkeletonList count={3} />
                        <SkeletonStats />
                    </div>
                ) : users.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-5xl mb-3">👤</div>
                        <p className="text-gray-400">No riders yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {users.map((user) => (
                            <div key={user.id} className="bg-white rounded-2xl shadow-sm p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-4">
                                        <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                            <span className="text-blue-500 font-bold">
                                                {user.name.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-gray-800">{user.name}</p>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.is_active
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-red-100 text-red-600'
                                                    }`}>
                                                    {user.is_active ? 'Active' : 'Deactivated'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">{user.email} · {user.phone}</p>
                                            <div className="flex gap-3 mt-1 text-xs text-gray-400">
                                                <span>📦 {user.total_orders} orders</span>
                                                <span>💰 ₦{Number(user.wallet_balance).toLocaleString()} balance</span>
                                                <span>Joined {new Date(user.date_joined).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCreditModal(user)}
                                            className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl text-xs font-semibold"
                                        >
                                            💰 Credit
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(user.id)}
                                            disabled={actionId === user.id}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-50 ${user.is_active
                                                ? 'bg-red-50 hover:bg-red-100 text-red-500'
                                                : 'bg-green-50 hover:bg-green-100 text-green-600'
                                                }`}
                                        >
                                            {user.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Credit Wallet Modal */}
                {creditModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                            <h3 className="font-bold text-gray-800 text-lg mb-1">Credit Wallet</h3>
                            <p className="text-gray-500 text-sm mb-4">
                                Adding funds to <span className="font-semibold">{creditModal.name}</span>'s wallet
                            </p>
                            <input
                                type="number"
                                value={creditAmount}
                                onChange={(e) => setCreditAmount(e.target.value)}
                                placeholder="Enter amount in ₦"
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-4"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setCreditModal(null); setCreditAmount(''); }}
                                    className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCredit}
                                    disabled={crediting}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                                >
                                    {crediting ? 'Crediting...' : 'Credit ₦' + creditAmount}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}