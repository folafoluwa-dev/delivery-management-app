import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { SkeletonList, SkeletonStats } from '../components/Skeleton.jsx';

export default function Home() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    // ✅ Auto-redirect logged-in users to their dashboard
    useEffect(() => {
        if (!loading && user) {
            if (user.role === 'RIDER') navigate('/rider/request');
            else if (user.role === 'DRIVER') navigate('/driver/orders');
            else if (user.role === 'ADMIN') navigate('/admin/dashboard');
        }
    }, [user, loading]);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50">
            <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-white text-3xl">🚚</span>
            </div>
            <SkeletonList count={3} />
            <SkeletonStats />
        </div>
    );

    return (
        <div className="min-h-screen bg-white">

            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">🚚</span>
                    </div>
                    <span className="font-bold text-gray-800 text-xl">DeliverNG</span>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/login"
                        className="text-gray-600 font-medium text-sm hover:text-orange-500 transition-colors"
                    >
                        Sign In
                    </Link>
                    <Link
                        to="/register"
                        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
                    >
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
                <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
                    <span>🇳🇬</span> Built for Nigeria
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                    Delivery made{' '}
                    <span className="text-orange-500">fast</span> &{' '}
                    <span className="text-orange-500">simple</span>
                </h1>
                <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto mb-10">
                    Send packages, groceries, and more across Lagos and beyond.
                    Track your delivery in real time — right from your phone.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        to="/register"
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all shadow-lg shadow-orange-200"
                    >
                        Send a Package →
                    </Link>
                    <Link
                        to="/register"
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-8 py-4 rounded-2xl text-lg transition-all"
                        onClick={() => localStorage.setItem('defaultRole', 'DRIVER')}
                    >
                        Become a Driver
                    </Link>
                </div>

                {/* Hero Visual */}
                <div className="mt-16 bg-orange-50 rounded-3xl p-8 max-w-3xl mx-auto">
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { icon: '📦', label: 'Place Order', desc: 'Enter pickup & drop-off' },
                            { icon: '🚗', label: 'Driver Picks Up', desc: 'Nearest driver accepts' },
                            { icon: '✅', label: 'Delivered!', desc: 'Track every step live' },
                        ].map((step, i) => (
                            <div key={i} className="text-center">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                                    <span className="text-2xl">{step.icon}</span>
                                </div>
                                <p className="font-bold text-gray-800 text-sm">{step.label}</p>
                                <p className="text-gray-500 text-xs mt-1">{step.desc}</p>
                                {i < 2 && (
                                    <div className="hidden md:block absolute mt-7 ml-full">→</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="bg-gray-50 py-20">
                <div className="max-w-6xl mx-auto px-6">
                    <h2 className="text-3xl font-extrabold text-gray-800 text-center mb-3">
                        Why choose DeliverNG?
                    </h2>
                    <p className="text-gray-500 text-center mb-12">
                        Everything you need for fast, reliable delivery in Nigeria.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: '📍',
                                title: 'Live GPS Tracking',
                                desc: 'Watch your driver move in real time on the map. No more guessing where your package is.',
                            },
                            {
                                icon: '💰',
                                title: 'Fair Pricing',
                                desc: 'Auto-calculated fares based on distance. No hidden charges — see the price before you pay.',
                            },
                            {
                                icon: '⚡',
                                title: 'Fast Pickup',
                                desc: 'Available drivers are notified instantly. Most pickups happen within minutes.',
                            },
                            {
                                icon: '🛡️',
                                title: 'Verified Drivers',
                                desc: 'Every driver is reviewed and approved by our admin team before they can go online.',
                            },
                            {
                                icon: '⭐',
                                title: 'Ratings & Reviews',
                                desc: 'Rate your driver after every delivery. We hold drivers accountable for quality service.',
                            },
                            {
                                icon: '👛',
                                title: 'Wallet Payments',
                                desc: 'Top up once and pay seamlessly from your wallet. No cash, no stress.',
                            },
                        ].map((feature) => (
                            <div key={feature.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                                    <span className="text-2xl">{feature.icon}</span>
                                </div>
                                <h3 className="font-bold text-gray-800 mb-2">{feature.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 max-w-6xl mx-auto px-6">
                <h2 className="text-3xl font-extrabold text-gray-800 text-center mb-3">
                    How it works
                </h2>
                <p className="text-gray-500 text-center mb-12">Get started in minutes.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* For Riders */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                                <span className="text-white">📦</span>
                            </div>
                            <h3 className="font-bold text-gray-800 text-lg">For Riders</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                { step: '1', text: 'Create an account as a Rider' },
                                { step: '2', text: 'Enter your pickup and drop-off addresses' },
                                { step: '3', text: 'See the price estimate and confirm' },
                                { step: '4', text: 'Track your driver live on the map' },
                                { step: '5', text: 'Rate your driver after delivery' },
                            ].map((item) => (
                                <div key={item.step} className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                                        {item.step}
                                    </div>
                                    <p className="text-gray-600 text-sm">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* For Drivers */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center">
                                <span className="text-white">🚗</span>
                            </div>
                            <h3 className="font-bold text-gray-800 text-lg">For Drivers</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                { step: '1', text: 'Register as a Driver with your vehicle details' },
                                { step: '2', text: 'Wait for admin approval (usually within 24hrs)' },
                                { step: '3', text: 'Go online and see available delivery requests' },
                                { step: '4', text: 'Accept an order and navigate to pickup' },
                                { step: '5', text: 'Deliver and earn — funds go straight to your wallet' },
                            ].map((item) => (
                                <div key={item.step} className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                                        {item.step}
                                    </div>
                                    <p className="text-gray-600 text-sm">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-orange-500 py-20">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-extrabold text-white mb-4">
                        Ready to get started?
                    </h2>
                    <p className="text-orange-100 mb-8 text-lg">
                        Join thousands of Nigerians sending packages the smart way.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            to="/register"
                            className="bg-white text-orange-500 font-bold px-8 py-4 rounded-2xl text-lg hover:bg-orange-50 transition-all"
                        >
                            Create Free Account
                        </Link>
                        <Link
                            to="/login"
                            className="border-2 border-white text-white font-bold px-8 py-4 rounded-2xl text-lg hover:bg-orange-600 transition-all"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-10">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm">🚚</span>
                        </div>
                        <span className="font-bold text-white">DeliverNG</span>
                    </div>
                    <p className="text-sm">© {new Date().getFullYear()} DeliverNG. Built with ❤️ for Nigeria.</p>
                    <div className="flex gap-4 text-sm">
                        <Link to="/register" className="hover:text-white transition-colors">Sign Up</Link>
                        <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}