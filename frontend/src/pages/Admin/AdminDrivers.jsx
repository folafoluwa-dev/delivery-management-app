import { useState, useEffect } from 'react';
import Layout from '../../components/Layout.jsx';
import api from '../../api/axios.js';
import { SkeletonList, SkeletonStats } from '../../components/Skeleton.jsx';
import { useToast } from '../../components/Toast.jsx';
import ConfirmDialog from "../../components/ConfirmModal.jsx"

export default function AdminDrivers() {
    const [drivers, setDrivers] = useState([]);
    const [filter, setFilter] = useState('PENDING');
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);
    const { addToast } = useToast();
    const [confirm, setConfirm] = useState({ open: false, id: null, action: null, name: '' });


    useEffect(() => { fetchDrivers(); }, [filter]);

    const fetchDrivers = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin-panel/drivers/?status=${filter}`);
            setDrivers(res.data);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id, name) => {
        setConfirm({ open: true, id, action: 'approve', name });
    };

    const handleReject = async (id, name) => {
        setConfirm({ open: true, id, action: 'reject', name });
    };
    const statusColors = {
        PENDING: 'bg-yellow-100 text-yellow-600',
        APPROVED: 'bg-green-100 text-green-600',
        REJECTED: 'bg-red-100 text-red-600',
    };

    const handleConfirmAction = async () => {
        const { id, action } = confirm;
        setConfirm({ open: false, id: null, action: null, name: '' });
        setActionId(id);
        try {
            if (action === 'approve') {
                await api.post(`/admin-panel/drivers/${id}/approve/`);
                addToast('Driver approved successfully!', 'success');
            } else {
                await api.post(`/admin-panel/drivers/${id}/reject/`);
                addToast('Driver rejected.', 'warning');
            }
            setDrivers((prev) => prev.filter((d) => d.id !== id));
        } catch {
            addToast('Action failed. Try again.', 'error');
        } finally {
            setActionId(null);
        }
    };

    const vehicleIcons = { BIKE: '🏍️', CAR: '🚗', VAN: '🚐' };

    return (
        <Layout>
            <div className="max-w-5xl mx-auto space-y-5">
                <h1 className="text-2xl font-bold text-gray-800">Driver Management</h1>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                    {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === s
                                ? 'bg-orange-500 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center">

                        <SkeletonList count={3} />
                        <SkeletonStats />
                    </div>
                ) : drivers.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-5xl mb-3">🚗</div>
                        <p className="text-gray-400">No {filter.toLowerCase()} drivers found.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {drivers.map((driver) => (
                            <div key={driver.id} className="bg-white rounded-2xl shadow-sm p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                            <span className="text-orange-500 font-bold text-lg">
                                                {driver.name.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-gray-800">{driver.name}</p>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[driver.approval_status]}`}>
                                                    {driver.approval_status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">{driver.email}</p>
                                            <p className="text-sm text-gray-500">{driver.phone}</p>
                                            <div className="flex gap-3 mt-2 text-xs text-gray-400">
                                                <span>{vehicleIcons[driver.vehicle_type]} {driver.vehicle_type}</span>
                                                <span>⭐ {Number(driver.avg_rating).toFixed(1)}</span>
                                                <span>📦 {driver.total_deliveries} deliveries</span>
                                                <span>💰 ₦{Number(driver.total_earnings).toLocaleString()} earned</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {driver.approval_status === 'PENDING' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(driver.id)}
                                                disabled={actionId === driver.id}
                                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                                            >
                                                ✅ Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(driver.id)}
                                                disabled={actionId === driver.id}
                                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                                            >
                                                ❌ Reject
                                            </button>
                                        </div>
                                    )}
                                    {driver.approval_status === 'APPROVED' && (
                                        <button
                                            onClick={() => handleReject(driver.id)}
                                            disabled={actionId === driver.id}
                                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl text-sm font-semibold disabled:opacity-50"
                                        >
                                            Revoke
                                        </button>
                                    )}
                                    {driver.approval_status === 'REJECTED' && (
                                        <button
                                            onClick={() => handleApprove(driver.id)}
                                            disabled={actionId === driver.id}
                                            className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-xl text-sm font-semibold disabled:opacity-50"
                                        >
                                            Re-approve
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <ConfirmDialog
                isOpen={confirm.open}
                title={confirm.action === 'approve' ? 'Approve Driver' : 'Reject Driver'}
                message={`Are you sure you want to ${confirm.action} ${confirm.name}?`}
                onConfirm={handleConfirmAction}
                onCancel={() => setConfirm({ open: false, id: null, action: null, name: '' })}
                confirmLabel={confirm.action === 'approve' ? '✅ Approve' : '❌ Reject'}
                confirmColor={confirm.action === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}
            />
        </Layout>
    );
}