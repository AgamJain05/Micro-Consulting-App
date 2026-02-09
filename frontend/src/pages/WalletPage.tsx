import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
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

  if (isLoading) return <div className="p-8 text-center text-gray-600">Loading wallet...</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center gap-3">
            <span className="material-icons-round text-[#FF5A5F] text-5xl">account_balance_wallet</span>
            My Wallet
          </h1>
          <p className="text-gray-600">Manage your credits and top up your balance</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-[#FF5A5F] to-[#E04F54] rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <p className="text-white/80 font-bold mb-2 text-sm uppercase tracking-wide">Current Balance</p>
            <h2 className="text-6xl font-extrabold mb-4">${Math.floor(userProfile?.credits || 0)}</h2>
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <span className="material-icons-round text-lg">verified_user</span>
              <span>Secure and encrypted</span>
            </div>
          </div>
        </div>

        {/* Top Up Card */}
        <div className="bg-white rounded-3xl p-8 shadow-soft border border-gray-100">
          <h3 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
            <span className="material-icons-round text-[#FF5A5F]">add_circle</span>
            Add Credits
          </h3>

          {/* Amount Selection */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[20, 50, 100].map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val)}
                className={`py-5 rounded-2xl font-bold border-2 transition-all ${amount === val
                    ? 'border-[#FF5A5F] bg-[#FF5A5F]/10 text-[#FF5A5F] shadow-md scale-105'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <div className="text-2xl font-extrabold">${val}</div>
                <div className="text-xs text-gray-500 mt-1">{val} credits</div>
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Or enter custom amount
            </label>
            <div className="relative">
              <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                attach_money
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="1"
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent transition-all text-gray-900"
                placeholder="Enter amount"
              />
            </div>
          </div>

          {/* Top Up Button */}
          <button
            onClick={() => topUpMutation.mutate(amount)}
            className="w-full py-4 bg-[#FF5A5F] text-white font-bold rounded-xl hover:bg-[#E04F54] transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={topUpMutation.isPending || amount <= 0}
          >
            {topUpMutation.isPending ? (
              <>
                <span className="material-icons-round animate-spin">refresh</span>
                Processing...
              </>
            ) : (
              <>
                <span className="material-icons-round">add</span>
                Add ${amount} Credits
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-1">
            <span className="material-icons-round text-sm">lock</span>
            Secure payment simulation. No actual charge.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <span className="material-icons-round text-blue-600 text-2xl">info</span>
              <div>
                <h4 className="font-bold text-blue-900 mb-1">How it works</h4>
                <p className="text-sm text-blue-700">Credits are used to pay for consulting sessions. 1 credit = $1</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <span className="material-icons-round text-green-600 text-2xl">savings</span>
              <div>
                <h4 className="font-bold text-green-900 mb-1">No expiration</h4>
                <p className="text-sm text-green-700">Your credits never expire and can be used anytime</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
