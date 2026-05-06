export function SkeletonLine({ width = 'w-full', height = 'h-4' }) {
    return (
        <div className={`${width} ${height} bg-gray-200 rounded-lg animate-pulse`} />
    );
}

export function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-6 bg-gray-200 rounded-full w-16" />
            </div>
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-4/5" />
            <div className="flex justify-between pt-2 border-t border-gray-100">
                <div className="h-3 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
        </div>
    );
}

export function SkeletonStats() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm p-5 animate-pulse space-y-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                    <div className="h-6 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonList({ count = 3 }) {
    return (
        <div className="space-y-3">
            {[...Array(count)].map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

export function SkeletonProfile() {
    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full" />
                <div className="space-y-2 flex-1">
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-4/5" />
            </div>
        </div>
    );
}