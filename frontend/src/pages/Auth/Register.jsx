import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Register() {
    const { register } = useAuth(); // ✅ pull from context
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '', email: '', phone: '', password: '', role: 'RIDER', vehicle_type: 'BIKE',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const payload = { ...form };
            if (form.role !== 'DRIVER') delete payload.vehicle_type;
            const user = await register(payload);
            if (user.role === 'RIDER') navigate('/rider/request');
            else if (user.role === 'DRIVER') navigate('/driver/orders');
        } catch (err) {
            setError(err.response?.data?.email?.[0] || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-orange-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <span className="text-white text-2xl">🚚</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">DeliverNG</h1>
                    <p className="text-gray-500 text-sm mt-1">Create your account</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            name="name" value={form.name} onChange={handleChange} required
                            placeholder="John Doe"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            name="email" type="email" value={form.email} onChange={handleChange} required
                            placeholder="john@example.com"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                            name="phone" value={form.phone} onChange={handleChange} required
                            placeholder="08012345678"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            name="password" type="password" value={form.password} onChange={handleChange} required
                            placeholder="Min. 6 characters"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['RIDER', 'DRIVER'].map((r) => (
                                <button
                                    key={r} type="button"
                                    onClick={() => setForm({ ...form, role: r })}
                                    className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.role === r
                                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                                        : 'border-gray-200 text-gray-500 hover:border-orange-300'
                                        }`}
                                >
                                    {r === 'RIDER' ? '📦 Rider' : '🚗 Driver'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {form.role === 'DRIVER' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: 'BIKE', label: '🏍️ Bike' },
                                    { value: 'CAR', label: '🚗 Car' },
                                    { value: 'VAN', label: '🚐 Van' },
                                ].map((v) => (
                                    <button
                                        key={v.value} type="button"
                                        onClick={() => setForm({ ...form, vehicle_type: v.value })}
                                        className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${form.vehicle_type === v.value
                                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                                            : 'border-gray-200 text-gray-500 hover:border-orange-300'
                                            }`}
                                    >
                                        {v.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                ⚠️ Your account requires admin approval before you can accept orders.
                            </p>
                        </div>
                    )}

                    <button
                        type="submit" disabled={loading}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 mt-2"
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-orange-500 font-semibold hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}