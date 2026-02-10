import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { RequestSessionModal } from '../components/RequestSessionModal';
import { useState } from 'react';
import { toast } from '../store/toastStore';

export const ConsultantProfile = () => {
    const { consultantId } = useParams<{ consultantId: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [showBookingModal, setShowBookingModal] = useState(false);

    const { data: consultant, isLoading } = useQuery({
        queryKey: ['consultant', consultantId],
        queryFn: async () => {
            const res = await api.get(`/api/v1/users/${consultantId}`);
            return res.data;
        },
        enabled: !!consultantId
    });

    const { data: reviews } = useQuery({
        queryKey: ['consultant-reviews', consultantId],
        queryFn: async () => {
            const res = await api.get(`/api/v1/reviews/consultant/${consultantId}`);
            return res.data;
        },
        enabled: !!consultantId
    });

    const handleBookNow = () => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (user.role === 'consultant') {
            toast.error('Consultants cannot book other consultants. Please create a client account to book sessions.');
            return;
        }

        setShowBookingModal(true);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-gray-600">Loading consultant profile...</div>
            </div>
        );
    }

    if (!consultant) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Consultant Not Found</h2>
                    <button
                        onClick={() => navigate('/consultants')}
                        className="text-[#FF5A5F] hover:underline"
                    >
                        Back to Consultants
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/consultants')}
                    className="flex items-center gap-2 text-gray-600 hover:text-[#FF5A5F] mb-6 font-bold transition"
                >
                    <span className="material-icons-round">arrow_back</span>
                    Back to Consultants
                </button>

                {/* Profile Header */}
                <div className="bg-white rounded-3xl p-8 shadow-soft border border-gray-100 mb-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <img
                                src={consultant.avatar_url || `https://ui-avatars.com/api/?name=${consultant.first_name}+${consultant.last_name}&background=random&size=200`}
                                alt={`${consultant.first_name} ${consultant.last_name}`}
                                className="w-32 h-32 rounded-3xl object-cover shadow-md"
                            />
                            <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white ${consultant.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                                {consultant.first_name} {consultant.last_name}
                            </h1>
                            <p className="text-[#FF5A5F] font-semibold text-lg mb-3">{consultant.headline}</p>

                            {/* Rating */}
                            {consultant.review_count > 0 && (
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i} className="material-icons-round text-yellow-400 text-xl">
                                                {i < Math.floor(consultant.rating) ? 'star' : 'star_border'}
                                            </span>
                                        ))}
                                    </div>
                                    <span className="font-bold text-gray-900">{consultant.rating?.toFixed(1)}</span>
                                    <span className="text-gray-500 text-sm">({consultant.review_count} reviews)</span>
                                </div>
                            )}

                            {/* Pricing */}
                            <div className="flex items-center gap-4 mb-4">
                                <div>
                                    <span className="text-3xl font-extrabold text-gray-900">
                                        ${Math.round((consultant.price_per_minute || 0) * 60)}
                                    </span>
                                    <span className="text-gray-500">/hr</span>
                                </div>
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-bold">
                                    First {consultant.free_minutes || 15}m free
                                </span>
                            </div>

                            {/* Book Button */}
                            <button
                                onClick={handleBookNow}
                                className="bg-[#FF5A5F] hover:bg-[#E04F54] text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
                            >
                                <span className="material-icons-round">videocam</span>
                                Book Now
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bio */}
                <div className="bg-white rounded-3xl p-8 shadow-soft border border-gray-100 mb-6">
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="material-icons-round text-[#FF5A5F]">person</span>
                        About
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                        {consultant.bio || "This consultant hasn't added a bio yet."}
                    </p>
                </div>

                {/* Skills */}
                {consultant.skills && consultant.skills.length > 0 && (
                    <div className="bg-white rounded-3xl p-8 shadow-soft border border-gray-100 mb-6">
                        <h2 className="text-2xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="material-icons-round text-[#FF5A5F]">code</span>
                            Skills
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {consultant.skills.map((skill: string) => (
                                <span key={skill} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reviews */}
                {reviews && reviews.length > 0 && (
                    <div className="bg-white rounded-3xl p-8 shadow-soft border border-gray-100">
                        <h2 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="material-icons-round text-[#FF5A5F]">star</span>
                            Reviews ({reviews.length})
                        </h2>
                        <div className="space-y-4">
                            {reviews.map((review: any) => (
                                <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className="material-icons-round text-yellow-400 text-sm">
                                                    {i < review.rating ? 'star' : 'star_border'}
                                                </span>
                                            ))}
                                        </div>
                                        <span className="font-bold text-gray-900">{review.client_name}</span>
                                        <span className="text-gray-400 text-sm">•</span>
                                        <span className="text-gray-500 text-sm">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-700">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            {showBookingModal && consultant && (
                <RequestSessionModal
                    consultant={consultant}
                    onClose={() => setShowBookingModal(false)}
                />
            )}
        </div>
    );
};
