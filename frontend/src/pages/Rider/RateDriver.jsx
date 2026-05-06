import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import api from '../../api/axios.js';

export default function RateDriver() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [stars, setStars] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (stars === 0) { setError('Please select a rating.'); return; }
        setLoading(true);
        try {
            await api.post('/ratings/create/', { order: orderId, stars, comment });
            navigate('/rider/history');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit rating.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-md mx-auto">
                <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                    <div className="text-5xl mb-4">🚗</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Rate Your Driver</h1>
                    <p className="text-gray-500 text-sm mb-8">How was your delivery experience?</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Star Rating */}
                    <div className="flex justify-center gap-3 mb-6">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStars(s)}
                                className={`text-4xl transition-transform hover:scale-110 ${s <= stars ? 'opacity-100' : 'opacity-30'
                                    }`}
                            >
                                ⭐
                            </button>
                        ))}
                    </div>

                    <div className="mb-6">
                        <textarea
                            value={comment} onChange={(e) => setComment(e.target.value)}
                            placeholder="Leave a comment (optional)"
                            rows={3}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/rider/history')}
                            className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50"
                        >
                            Skip
                        </button>
                        <button
                            onClick={handleSubmit} disabled={loading}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Rating'}
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}