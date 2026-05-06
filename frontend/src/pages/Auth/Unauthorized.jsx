import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-orange-50 flex items-center justify-center">
            <div className="text-center">
                <div className="text-6xl mb-4">🚫</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
                <p className="text-gray-500 mb-6">You don't have permission to view this page.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-600"
                >
                    Go Back
                </button>
            </div>
        </div>
    );
}