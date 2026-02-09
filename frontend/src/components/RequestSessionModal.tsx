import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../store/toastStore';

interface Props {
  consultant: any;
  onClose: () => void;
}

type SessionMode = 'now' | 'scheduled';

export const RequestSessionModal = ({ consultant, onClose }: Props) => {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const [mode, setMode] = useState<SessionMode>('now');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(15);
  const [urgency, setUrgency] = useState('Normal');

  // Scheduling fields
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        consultant_id: consultant.id || consultant._id,
        topic,
        description,
        duration_minutes: duration
      };

      // Add scheduling info if scheduling for later
      if (mode === 'scheduled' && date && time) {
        payload.scheduled_at = new Date(`${date}T${time}`).toISOString();
        payload.status = 'scheduled';
      }

      const res = await api.post('/api/v1/sessions/', payload);
      return res.data;
    },
    onSuccess: (data) => {
      const sessionId = data.id || data._id;
      if (mode === 'scheduled') {
        addToast('success', `Your session has been scheduled for ${new Date(`${date}T${time}`).toLocaleString()}`);
        onClose();
        navigate('/sessions');
      } else {
        navigate(`/session/${sessionId}/waiting`);
      }
    },
    onError: (err: any) => {
      addToast('error', err.response?.data?.detail || "Failed to request session");
    }
  });

  const estimatedCost = (consultant.price_per_minute || 0) * duration;
  const isFormValid = mode === 'now' ? !!topic : !!(topic && date && time);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-fade-in overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FF5A5F] to-[#E04F54] p-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-2xl font-extrabold">New Session Request</h3>
            <button onClick={onClose} className="text-white/80 hover:text-white transition">
              <span className="material-icons-round">close</span>
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-white/20 backdrop-blur-sm rounded-xl">
            <button
              type="button"
              onClick={() => setMode('now')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition ${mode === 'now'
                  ? 'bg-white text-[#FF5A5F] shadow-md'
                  : 'text-white/80 hover:text-white'
                }`}
            >
              <span className="material-icons-round text-lg">bolt</span>
              Request Now
            </button>
            <button
              type="button"
              onClick={() => setMode('scheduled')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition ${mode === 'scheduled'
                  ? 'bg-white text-[#FF5A5F] shadow-md'
                  : 'text-white/80 hover:text-white'
                }`}
            >
              <span className="material-icons-round text-lg">schedule</span>
              Schedule Later
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Consultant Info */}
          <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-[#FF5A5F]/20 bg-[#FF5A5F]/5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl bg-gradient-to-br from-[#FF5A5F] to-[#E04F54] text-white shadow-md">
              {consultant.first_name[0]}
            </div>
            <div>
              <div className="font-bold text-gray-900">{consultant.first_name} {consultant.last_name}</div>
              <div className="text-xs font-bold text-[#FF5A5F]">
                ${Math.round((consultant.price_per_minute || 0) * 60)}/hr • First {consultant.free_minutes || 15}m free
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">What do you need help with? *</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-3 border border-gray-200 bg-white rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent placeholder-gray-400"
                placeholder="e.g. React Performance Optimization"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Details</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border border-gray-200 bg-white rounded-xl text-sm text-gray-900 outline-none h-24 resize-none focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent placeholder-gray-400"
                placeholder="Describe your problem..."
              />
            </div>

            {/* Schedule fields - only show in scheduled mode */}
            {mode === 'scheduled' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Date *</label>
                  <div className="relative">
                    <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                      calendar_today
                    </span>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={minDate}
                      className="w-full pl-10 pr-3 py-3 border border-gray-200 bg-white rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Time *</label>
                  <div className="relative">
                    <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                      schedule
                    </span>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-200 bg-white rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Est. Duration</label>
                <div className="relative">
                  <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                    timer
                  </span>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-3 border border-gray-200 bg-white rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent appearance-none"
                  >
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                  </select>
                  <span className="material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>
              {mode === 'now' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Urgency</label>
                  <div className="relative">
                    <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                      priority_high
                    </span>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-200 bg-white rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent outline-none appearance-none"
                    >
                      <option>Normal</option>
                      <option>High</option>
                      <option>Critical</option>
                    </select>
                    <span className="material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>
              )}
              {mode === 'scheduled' && (
                <div className="flex items-end">
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 w-full">
                    <div className="text-xs text-green-700 font-bold mb-1">Est. Cost</div>
                    <div className="text-xl font-extrabold text-green-700">${estimatedCost.toFixed(2)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!isFormValid || mutation.isPending}
            className="px-6 py-3 text-white font-bold rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 bg-[#FF5A5F] hover:bg-[#E04F54] active:scale-95"
          >
            {mutation.isPending ? (
              <>
                <span className="material-icons-round animate-spin">refresh</span>
                {mode === 'now' ? 'Sending...' : 'Scheduling...'}
              </>
            ) : (
              <>
                <span className="material-icons-round">
                  {mode === 'now' ? 'bolt' : 'schedule'}
                </span>
                {mode === 'now' ? 'Send Request' : 'Schedule Session'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
