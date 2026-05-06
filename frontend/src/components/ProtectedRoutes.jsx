import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { SkeletonList, SkeletonStats } from './Skeleton.jsx';

export default function ProtectedRoute({ children, role }) {
    const { user, loading } = useAuth();

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50">
            <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-white text-3xl">🚚</span>
            </div>
            <SkeletonList count={3} />
            <SkeletonStats />
        </div>
    );

    if (!user) return <Navigate to="/login" replace />;
    if (role && user.role !== role) return <Navigate to="/unauthorized" replace />;

    return children;
}