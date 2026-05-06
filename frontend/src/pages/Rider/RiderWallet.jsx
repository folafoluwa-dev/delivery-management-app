import { useState, useEffect } from 'react';
import Layout from '../../components/Layout.jsx';
import api from '../../api/axios.js';
import { useToast } from '../../components/Toast.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

export default function RiderWallet() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState('topup');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [balRes, txRes] = await Promise.all([
                api.get('/wallet/balance/'),
                api.get('/wallet/transactions/'),
            ]);
            setBalance(balRes.data.balance);
            setTransactions(txRes.data);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const handlePaystack = async () => {
        if (!amount || parseFloat(amount) < 100) {
            addToast('Minimum top-up is ₦100.', 'error');
            return;
        }

        setProcessing(true);

        try {
            // Step 1 — Initialize payment on backend
            const res = await api.post('/wallet/initialize-payment/', {
                amount: parseFloat(amount),
            });

            const { reference, public_key, email } = res.data;

            // Step 2 — Open Paystack inline
            const PaystackPop = (await import('@paystack/inline-js')).default;
            const popup = new PaystackPop();

            popup.newTransaction({
                key: public_key,
                email: email,
                amount: parseFloat(amount) * 100, // Paystack uses kobo
                ref: reference,
                currency: 'NGN',
                channels: ['card', 'bank_transfer'],
                label: 'DeliverNG Wallet Top-up',
                onSuccess: async (transaction) => {
                    // Step 3 — Verify payment on backend
                    try {
                        const verifyRes = await api.post('/wallet/verify-payment/', {
                            reference: transaction.reference,
                        });
                        setBalance(verifyRes.data.new_balance);
                        setAmount('');
                        addToast(`₦${Number(amount).toLocaleString()} added to your wallet!`, 'success');
                        fetchData();
                        setActiveTab('history');
                    } catch (err) {
                        addToast(err.response?.data?.error || 'Verification failed. Contact support.', 'error');
                    }
                },
                onCancel: () => {
                    addToast('Payment cancelled.', 'warning');
                },
            });
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to initialize payment.', 'error');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
        <Layout>
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        </Layout>
    );

    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-5">
                <h1 className="text-2xl font-bold text-gray-800">My Wallet</h1>

                {/* Balance Card */}
                <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-orange-200">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-orange-100 text-sm mb-1">Available Balance</p>
                            <p className="text-4xl font-extrabold">
                                ₦{Number(balance).toLocaleString()}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-orange-400 flex items-center justify-between text-sm">
                        <span className="text-orange-100">
                            {user?.name}
                        </span>
                        <span className="text-orange-100 text-xs">
                            DeliverNG Wallet
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                    {[
                        { key: 'topup', label: '💳 Top Up' },
                        { key: 'history', label: '📋 History' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key
                                ? 'bg-white text-orange-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Top Up Tab */}
                {activeTab === 'topup' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5 animate-fade-in">
                        <h2 className="font-bold text-gray-800">Select Amount</h2>

                        {/* Quick Amounts */}
                        <div className="grid grid-cols-3 gap-2">
                            {QUICK_AMOUNTS.map((a) => (
                                <button
                                    key={a}
                                    onClick={() => setAmount(String(a))}
                                    className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${amount === String(a)
                                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                                        : 'border-gray-200 text-gray-600 hover:border-orange-300'
                                        }`}
                                >
                                    ₦{a.toLocaleString()}
                                </button>
                            ))}
                        </div>

                        {/* Custom Amount */}
                        <div>
                            <label className="block text-sm text-gray-500 mb-2">
                                Or enter custom amount
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₦</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    min="100"
                                    className="w-full border border-gray-300 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs text-gray-500 font-medium mb-3">Accepted payment methods</p>
                            <div className="flex gap-3">
                                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                                    <span>💳</span>
                                    <span className="text-xs font-medium text-gray-700">Card</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                                    <span>🏦</span>
                                    <span className="text-xs font-medium text-gray-700">Bank Transfer</span>
                                </div>
                            </div>
                        </div>

                        {/* Paystack Button */}
                        <button
                            onClick={handlePaystack}
                            disabled={processing || !amount || parseFloat(amount) < 100}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <span>💳</span>
                                    Pay ₦{Number(amount || 0).toLocaleString()} via Paystack
                                </>
                            )}
                        </button>

                        <p className="text-center text-xs text-gray-400">
                            🔒 Secured by Paystack · Your card details are never stored
                        </p>
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="space-y-2 animate-fade-in">
                        {transactions.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
                                <div className="text-4xl mb-3">📋</div>
                                <p className="text-gray-400 text-sm">No transactions yet.</p>
                            </div>
                        ) : (
                            transactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="bg-white rounded-xl shadow-sm px-5 py-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.transaction_type === 'CREDIT'
                                            ? 'bg-green-100'
                                            : 'bg-red-100'
                                            }`}>
                                            <span className="text-lg">
                                                {tx.transaction_type === 'CREDIT' ? '⬇️' : '⬆️'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">
                                                {tx.description}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {new Date(tx.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${tx.transaction_type === 'CREDIT'
                                            ? 'text-green-600'
                                            : 'text-red-500'
                                            }`}>
                                            {tx.transaction_type === 'CREDIT' ? '+' : '-'}₦{Number(tx.amount).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Bal: ₦{Number(tx.balance_after).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}