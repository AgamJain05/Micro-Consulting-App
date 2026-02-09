import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { RequestSessionModal } from '../components/RequestSessionModal';

const CATEGORIES = [
    { name: "All", icon: "grid_view" },
    { name: "Dev", icon: "code" },
    { name: "Design", icon: "brush" },
    { name: "Marketing", icon: "trending_up" },
    { name: "Legal", icon: "gavel" },
    { name: "Finance", icon: "account_balance" },
    { name: "Startup", icon: "rocket_launch" }
];

export const ConsultantList = () => {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState("All");
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [selectedConsultant, setSelectedConsultant] = useState<any>(null);

    const { data: consultants, isLoading } = useQuery({
        queryKey: ['consultants', search, selectedCategory],
        queryFn: async () => {
            const params: any = {};
            if (search) params.search = search;
            if (selectedCategory && selectedCategory !== "All") params.category = selectedCategory;

            const res = await api.get('/api/v1/users/consultants', { params });
            return res.data;
        },
        retry: false
    });

    const handleRequestClick = (consultant: any) => {
        if (!user) {
            navigate('/login');
            return;
        }
        const id = consultant.id || consultant._id;
        if (!id) {
            alert("Error: Invalid consultant ID");
            return;
        }
        setSelectedConsultant(consultant);
    };

    return (
        <div className="bg-gray-100 min-h-screen font-body transition-colors duration-200">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Section with Glassmorphism */}
                <div className="bg-white rounded-3xl p-8 mb-12 shadow-soft relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-secondary/5 rounded-full blur-3xl"></div>

                    <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                            Find the perfect expert <br className="hidden md:block" /> for your next big idea.
                        </h1>
                        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                            Browse our friendly community of professionals or let our AI guide you to the right match instantly.
                        </p>

                        {/* Search Bar - Improved Alignment */}
                        <div className="bg-white p-2 rounded-full shadow-lg border border-gray-100 flex flex-col md:flex-row items-stretch max-w-3xl mx-auto transition-transform hover:scale-[1.01]">
                            <div className="flex-grow w-full md:w-auto px-6 py-3 flex flex-col justify-center min-h-[72px]">
                                <label className="block text-xs font-bold text-gray-800 tracking-wide mb-2" htmlFor="search">
                                    WHAT DO YOU NEED HELP WITH?
                                </label>
                                <input
                                    id="search"
                                    type="text"
                                    placeholder="e.g. 'Scale my FastAPI backend' or 'Review React code'"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-transparent border-none p-0 text-gray-600 placeholder-gray-400 focus:ring-0 text-base leading-relaxed outline-none"
                                />
                            </div>
                            {/* Divider */}
                            <div className="w-full h-px md:w-px md:h-auto md:self-stretch bg-gray-200 my-2 md:my-2"></div>
                            {/* AI Match Button */}
                            <div className="flex items-center md:pr-1">
                                <button className="bg-[#FF5A5F] hover:bg-[#E04F54] text-white rounded-full px-8 py-4 font-bold flex items-center justify-center gap-2 transition-colors w-full md:w-auto md:min-w-[160px] shadow-md">
                                    <span className="material-icons-round text-xl">auto_awesome</span>
                                    AI Match
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Carousel */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Explore Categories</h2>
                        <div className="flex gap-2">
                            <button className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
                                <span className="material-icons-round">chevron_left</span>
                            </button>
                            <button className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
                                <span className="material-icons-round">chevron_right</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex space-x-4 overflow-x-auto pb-4 hide-scrollbar">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setSelectedCategory(cat.name)}
                                className="flex-shrink-0 flex flex-col items-center gap-2 group min-w-[80px]"
                            >
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110 ${selectedCategory === cat.name
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white text-gray-500 border border-gray-200 shadow-sm group-hover:shadow-md'
                                    }`}>
                                    <span className="material-icons-round text-3xl">{cat.icon}</span>
                                </div>
                                <span className={`text-sm font-medium ${selectedCategory === cat.name
                                    ? 'font-bold text-gray-900 border-b-2 border-gray-900 pb-1'
                                    : 'text-gray-500 group-hover:text-gray-800'
                                    }`}>
                                    {cat.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Consultant Cards Grid */}
                {isLoading ? (
                    <div className="text-center py-20 text-gray-500">Loading experts...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {consultants?.map((consultant: any) => (
                            <div
                                key={consultant.id || consultant._id}
                                className="group bg-white rounded-3xl p-6 shadow-soft hover:shadow-hover transition-all duration-300 border border-gray-100 relative flex flex-col"
                            >
                                {/* Favorite Button */}
                                <button className="absolute top-5 right-5 text-gray-300 hover:text-[#FF5A5F] transition-colors">
                                    <span className="material-icons-round text-2xl">favorite_border</span>
                                </button>

                                {/* Header */}
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="relative flex-shrink-0">
                                        <img
                                            src={consultant.avatar_url || `https://ui-avatars.com/api/?name=${consultant.first_name}+${consultant.last_name}&background=random`}
                                            alt={consultant.first_name}
                                            className="w-16 h-16 rounded-2xl object-cover shadow-sm"
                                        />
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${consultant.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                                            }`}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight truncate">
                                            {consultant.first_name} {consultant.last_name}
                                        </h3>
                                        <p className="text-[#FF5A5F] font-semibold text-sm mb-1 truncate">{consultant.headline}</p>
                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                            <span className="material-icons-round text-yellow-400 text-base">star</span>
                                            <span className="font-bold text-gray-900">{consultant.rating?.toFixed(1) || "5.0"}</span>
                                            <span className="text-xs">({consultant.review_count || 0} reviews)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bio */}
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                    {consultant.bio || "Experienced consultant ready to help you solve your problems."}
                                </p>

                                {/* Skills */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {consultant.skills?.slice(0, 3).map((skill: string) => (
                                        <span key={skill} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg">
                                            {skill}
                                        </span>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div>
                                        <p className="text-2xl font-extrabold text-gray-900">
                                            ${Math.round((consultant.price_per_minute || 0) * 60)}
                                            <span className="text-sm font-normal text-gray-500">/hr</span>
                                        </p>
                                        <p className="text-xs text-green-600 font-bold">First {consultant.free_minutes || 15}m free</p>
                                    </div>
                                    <button
                                        onClick={() => handleRequestClick(consultant)}
                                        className="bg-[#FF5A5F] hover:bg-[#E04F54] text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all active:scale-95 whitespace-nowrap"
                                    >
                                        Book Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Trust Indicators */}
                <div className="mt-16 border-t border-gray-200 pt-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <span className="material-icons-round text-primary text-2xl">verified_user</span>
                            </div>
                            <h4 className="font-bold text-gray-900">Vetted Experts</h4>
                            <p className="text-sm text-gray-500">Every expert passes a rigorous quality check.</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <span className="material-icons-round text-primary text-2xl">lock</span>
                            </div>
                            <h4 className="font-bold text-gray-900">Secure Payments</h4>
                            <p className="text-sm text-gray-500">Your money is held safely until the job is done.</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <span className="material-icons-round text-primary text-2xl">support_agent</span>
                            </div>
                            <h4 className="font-bold text-gray-900">24/7 Support</h4>
                            <p className="text-sm text-gray-500">Our friendly team is always here to help.</p>
                        </div>
                    </div>
                </div>
            </main>

            {selectedConsultant && (
                <RequestSessionModal
                    consultant={selectedConsultant}
                    onClose={() => setSelectedConsultant(null)}
                />
            )}
        </div>
    );
};