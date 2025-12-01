import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Loader2, XCircle } from 'lucide-react';

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
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md w-full border border-blue-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-600 animate-pulse"></div>
        
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <div className="absolute inset-0 border-4 border-blue-100 rounded-full animate-ping"></div>
          <Loader2 size={40} className="text-blue-600 animate-spin" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Requesting Session</h2>
        <p className="text-gray-500 mb-8">
          Waiting for consultant to accept{dots}
        </p>

        <div className="bg-gray-50 p-4 rounded-xl text-left mb-8 text-sm text-gray-600 space-y-2">
          <div className="flex justify-between">
            <span>Est. Cost:</span>
            <span className="font-semibold">$2.50/min</span>
          </div>
          <div className="flex justify-between">
            <span>Duration:</span>
            <span className="font-semibold">15 mins</span>
          </div>
        </div>

        <button 
          onClick={handleCancel}
          className="w-full py-3 border border-gray-200 text-gray-500 font-semibold rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2"
        >
          Cancel Request
        </button>
        
        <p className="text-xs text-gray-400 mt-4 italic">
          (Demo: Auto-accepting is not enabled. Please open another window as consultant to accept.)
        </p>
      </div>
    </div>
  );
};

