import { useState } from 'react';
import { X, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

interface Props {
  consultant: any;
  onClose: () => void;
}

export const RequestSessionModal = ({ consultant, onClose }: Props) => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(15);
  const [urgency, setUrgency] = useState('Normal');

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/v1/sessions/', {
        consultant_id: consultant.id || consultant._id,
        topic,
        description,
        duration_minutes: duration
      });
      return res.data;
    },
    onSuccess: (data) => {
      const sessionId = data.id || data._id;
      navigate(`/session/${sessionId}/waiting`);
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || "Failed to request session");
    }
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">New Session Request</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Consultant Info */}
          <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
              {consultant.first_name[0]}
            </div>
            <div>
              <div className="font-bold text-gray-900">{consultant.first_name} {consultant.last_name}</div>
              <div className="text-xs text-blue-600 font-medium">
                ${Math.round((consultant.price_per_minute || 0) * 60)}/hr • First 15m free
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What do you need help with?</label>
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. React Performance Optimization"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                placeholder="Describe your problem..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Est. Duration</label>
                <select 
                  value={duration} 
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                <select 
                  value={urgency} 
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option>Normal</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 font-semibold hover:bg-gray-200 rounded-xl transition"
          >
            Cancel
          </button>
          <button 
            onClick={() => mutation.mutate()}
            disabled={!topic || mutation.isPending}
            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {mutation.isPending ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

