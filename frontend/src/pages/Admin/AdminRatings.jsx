import { useState, useEffect } from 'react';
import Layout from '../../components/Layout.jsx';
import api from '../../api/axios.js';
import { SkeletonList, SkeletonStats } from '../../components/Skeleton.jsx';
import ConfirmDialog from '../../components/ConfirmModal.jsx';
import { useToast } from '../../components/Toast.jsx';

export default function AdminRatings() {
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const { addToast } = useToast();
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });


    useEffect(() => { fetchRatings(); }, []);

    const fetchRatings = async () => {
        try {
            const res = await api.get('/admin-panel/ratings/');
            setRatings(res.data);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        setConfirmDelete({ open: true, id });
    };
    const confirmDeleteAction = async () => {
        const { id } = confirmDelete;
        setConfirmDelete({ open: false, id: null });
        setDeletingId(id);
        try {
            await api.delete(`/admin-panel/ratings/${id}/delete/`);
            setRatings((prev) => prev.filter((r) => r.id !== id));
            addToast('Rating removed successfully.', 'success');
        } catch {
            addToast('Failed to delete rating.', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-5">
                <h1 className="text-2xl font-bold text-gray-800">Ratings Overview</h1>

                {loading ? (
                    <div className="flex items-center justify-center">
                        <SkeletonList count={3} />
                        <SkeletonStats />
                    </div>
                ) : ratings.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-5xl mb-3">⭐</div>
                        <p className="text-gray-400">No ratings yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {ratings.map((r) => (
                            <div key={r.id} className="bg-white rounded-2xl shadow-sm p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="flex">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <span key={s} className={`text-lg ${s <= r.stars ? 'opacity-100' : 'opacity-20'}`}>
                                                        ⭐
                                                    </span>
                                                ))}
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.stars >= 4 ? 'bg-green-100 text-green-600'
                                                : r.stars === 3 ? 'bg-yellow-100 text-yellow-600'
                                                    : 'bg-red-100 text-red-600'
                                                }`}>
                                                {r.stars}/5
                                            </span>
                                        </div>
                                        {r.comment && (
                                            <p className="text-gray-700 text-sm mb-2 italic">&ldquo;{r.comment}&rdquo;</p>
                                        )}
                                        <div className="flex gap-4 text-xs text-gray-400">
                                            <span>👤 Rider: {r.rider}</span>
                                            <span>🚗 Driver: {r.driver}</span>
                                            <span>📦 Order #{r.order_id}</span>
                                            <span>{new Date(r.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(r.id)}
                                        disabled={deletingId === r.id}
                                        className="ml-4 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                                    >
                                        🗑️ Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <ConfirmDialog
                isOpen={confirmDelete.open}
                title="Delete Rating"
                message="Are you sure you want to remove this rating? This cannot be undone."
                onConfirm={confirmDeleteAction}
                onCancel={() => setConfirmDelete({ open: false, id: null })}
                confirmLabel="🗑️ Delete"
            />
        </Layout>
    );
}