import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Search, Sparkles, Star, MessageSquare, Wallet } from 'lucide-react';
import { RequestSessionModal } from '../components/RequestSessionModal';

const CATEGORIES = ["All", "Development", "Design", "Marketing", "Legal", "Finance", "Startup Strategy"];

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

  // Refresh user profile to get latest credits
  const { data: userProfile } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/api/v1/auth/me');
      return res.data;
    },
    enabled: !!user
  });

  const handleRequestClick = (consultant: any) => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Robust ID check
    const id = consultant.id || consultant._id;
    if (!id) {
      alert("Error: Invalid consultant ID");
      return;
    }
    setSelectedConsultant(consultant);
  };

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4 pb-20">
      {/* Header & Search */}
      <div className="mb-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Find an Expert</h1>
            <p className="text-gray-600 mt-2">Browse our directory or use AI to match your specific problem.</p>
          </div>
          {user && (
            <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-sm">
              <Wallet size={18} />
              <span>${Math.floor(userProfile?.credits || 0)} Credits</span>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="e.g. 'I need help scaling a FastAPI backend' or 'Review my React architecture'"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition shadow-md shadow-indigo-200">
            <Sparkles className="w-5 h-5" />
            AI Match
          </button>
        </div>

        {/* Categories */}
        <div className="mt-8 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-500">Loading experts...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {consultants?.map((consultant: any) => (
            <div key={consultant.id || consultant._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition p-6 flex flex-col h-full">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  <div className="relative">
                    <img 
                      src={consultant.avatar_url || `https://ui-avatars.com/api/?name=${consultant.first_name}+${consultant.last_name}&background=random`} 
                      alt={consultant.first_name}
                      className="w-12 h-12 rounded-full object-cover border border-gray-100"
                    />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      consultant.status === 'online' ? 'bg-green-500' : 
                      consultant.status === 'busy' ? 'bg-red-500' : 'bg-gray-400'
                    }`}></span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{consultant.first_name} {consultant.last_name}</h3>
                    <p className="text-blue-600 font-medium text-sm">{consultant.headline}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900 text-lg">${Math.round((consultant.price_per_minute || 0) * 60)} <span className="text-sm font-normal text-gray-500">/hr</span></div>
                  <div className="text-xs text-gray-500">First 15m free</div>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4 text-sm">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-gray-900">{consultant.rating?.toFixed(1) || "5.0"}</span>
                <span className="text-gray-500">({consultant.review_count || 0} reviews)</span>
              </div>

              {/* Bio */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
                {consultant.bio || "Experienced consultant ready to help you solve your problems."}
              </p>

              {/* Skills */}
              <div className="flex flex-wrap gap-2 mb-6">
                {consultant.skills?.slice(0, 3).map((skill: string) => (
                  <span key={skill} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium">
                    {skill}
                  </span>
                ))}
                {consultant.skills?.length > 3 && (
                  <span className="bg-gray-50 text-gray-500 px-2 py-1 rounded-md text-xs font-medium">
                    +{consultant.skills.length - 3}
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {consultant.category || "Development"}
                </span>
                
                <button 
                  onClick={() => handleRequestClick(consultant)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition shadow-sm shadow-blue-200"
                >
                  <MessageSquare className="w-4 h-4" />
                  Request
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedConsultant && (
        <RequestSessionModal 
          consultant={selectedConsultant} 
          onClose={() => setSelectedConsultant(null)} 
        />
      )}
    </div>
  );
};
