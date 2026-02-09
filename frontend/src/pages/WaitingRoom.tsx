import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export const WaitingRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [dots, setDots] = useState('.');

  // Simple polling for status change
  useQuery({
    queryKey: ['session-status', sessionId],
    queryFn: async () => {
      const res = await api.get(`/api/v1/sessions/${sessionId}`);
      const status = res.data.status;

      if (status === 'accepted' || status === 'active') {
        navigate(`/session/${sessionId}`);
      }
      if (status === 'rejected' || status === 'cancelled') {
        alert("Session was declined or cancelled.");
        navigate('/');
      }
      return res.data;
    },
    refetchInterval: 2000, // Poll every 2s
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleCancel = async () => {
    if (confirm("Are you sure you want to cancel this request?")) {
      try {
        await api.patch(`/api/v1/sessions/${sessionId}/status`, { status: 'cancelled' });
        navigate('/');
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md w-full border border-gray-100 relative overflow-hidden">
        {/* Animated top border */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF5A5F] to-[#E04F54] animate-pulse"></div>

        {/* Animated spinner */}
        <div className="w-24 h-24 bg-gradient-to-br from-[#FF5A5F]/10 to-[#E04F54]/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <div className="absolute inset-0 border-4 border-[#FF5A5F]/20 rounded-full animate-ping"></div>
          <div className="absolute inset-2 border-4 border-t-[#FF5A5F] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <span className="material-icons-round text-[#FF5A5F] text-5xl">schedule</span>
        </div>

        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Requesting Session</h2>
        <p className="text-gray-600 mb-8 text-lg">
          Waiting for consultant to accept{dots}
        </p>

        {/* Session info */}
        <div className="bg-gray-50 p-5 rounded-2xl text-left mb-8 text-sm space-y-3 border border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 flex items-center gap-2">
              <span className="material-icons-round text-lg text-gray-400">attach_money</span>
              Est. Cost:
            </span>
            <span className="font-bold text-gray-900">$2.50/min</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 flex items-center gap-2">
              <span className="material-icons-round text-lg text-gray-400">timer</span>
              Duration:
            </span>
            <span className="font-bold text-gray-900">15 mins</span>
          </div>
        </div>

        {/* Cancel button */}
        <button
          onClick={handleCancel}
          className="w-full py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2 active:scale-95"
        >
          <span className="material-icons-round">cancel</span>
          Cancel Request
        </button>

        {/* Demo note */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-xs text-blue-700 flex items-start gap-2">
            <span className="material-icons-round text-sm mt-0.5">info</span>
            <span>Demo: Auto-accepting is not enabled. Please open another window as consultant to accept.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
