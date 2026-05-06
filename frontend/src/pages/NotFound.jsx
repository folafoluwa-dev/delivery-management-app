import { useNavigate } from 'react-router-dom';

export default function NotFound() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-orange-50 flex items-center justify-center">
            <div className="text-center">
                <div className="text-8xl mb-4">🚚</div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
                <p className="text-gray-500 mb-6">Oops! This page got lost in delivery.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600"
                >
                    Go Back
                </button>
            </div>
        </div>
    );
}