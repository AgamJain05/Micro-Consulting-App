import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Wallet, Plus, CreditCard } from 'lucide-react';
import { useState } from 'react';

export const WalletPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(50);

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/api/v1/auth/me');
      return res.data;
    },
    enabled: !!user
  });

  const topUpMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await api.post('/api/v1/users/topup', { amount });
      return res.data;
    },
    onSuccess: () => {
      alert("Credits added successfully!");
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (err: any) => {
      alert("Failed to add credits: " + err.message);
    }
  });

  if (isLoading) return <div className="p-8 text-center">Loading wallet...</div>;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
        <Wallet className="text-blue-600" size={32} />
        My Wallet
      </h1>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg mb-8">
        <p className="text-blue-100 font-medium mb-2">Current Balance</p>
        <h2 className="text-5xl font-bold">${Math.floor(userProfile?.credits || 0)}</h2>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Add Credits</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[20, 50, 100].map((val) => (
            <button
              key={val}
              onClick={() => setAmount(val)}
              className={`py-4 rounded-xl font-bold border-2 transition ${
                amount === val 
                  ? 'border-blue-600 bg-blue-50 text-blue-600' 
                  : 'border-gray-100 text-gray-600 hover:border-gray-200'
              }`}
            >
              ${val}
            </button>
          ))}
        </div>

        <button
          onClick={() => topUpMutation.mutate(amount)}
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50"
          disabled={topUpMutation.isPending}
        >
          {topUpMutation.isPending ? (
            'Processing...' 
          ) : (
            <>
              <Plus size={20} />
              Add ${amount} Credits
            </>
          )}
        </button>
        <p className="text-center text-xs text-gray-400 mt-4">
          Secure payment simulation. No actual charge.
        </p>
      </div>
    </div>
  );
};

