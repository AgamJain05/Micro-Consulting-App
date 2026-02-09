import { useState } from 'react';
import { Calendar, X } from 'lucide-react';

interface ScheduleSessionModalProps {
  consultant: {
    id?: string;
    _id?: string;
    first_name: string;
    last_name: string;
    price_per_minute?: number;
  };
  onClose: () => void;
  onSchedule: (data: {
    consultant_id: string;
    topic: string;
    description?: string;
    duration_minutes: number;
    scheduled_at: string;
  }) => void;
  isLoading?: boolean;
}

export function ScheduleSessionModal({
  consultant,
  onClose,
  onSchedule,
  isLoading = false,
}: ScheduleSessionModalProps) {
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(15);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const consultantId = consultant.id || consultant._id || '';

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic || !date || !time) return;

    // Combine date and time into ISO string
    const scheduledAt = new Date(`${date}T${time}`).toISOString();

    onSchedule({
      consultant_id: consultantId,
      topic,
      description,
      duration_minutes: duration,
      scheduled_at: scheduledAt,
    });
  };

  const estimatedCost = (consultant.price_per_minute || 0) * duration;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4 flex justify-between items-center">
          <div className="flex items-center gap-3 text-white">
            <Calendar size={24} />
            <h3 className="text-lg font-bold">Schedule Session</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Consultant Info */}
          <div className="flex items-center gap-4 bg-purple-900/30 p-4 rounded-xl border border-purple-800">
            <div className="w-12 h-12 bg-purple-800 rounded-full flex items-center justify-center text-purple-200 font-bold text-lg">
              {consultant.first_name[0]}
            </div>
            <div>
              <div className="font-bold text-gray-100">
                {consultant.first_name} {consultant.last_name}
              </div>
              <div className="text-sm text-gray-400">
                ${(consultant.price_per_minute || 0).toFixed(2)}/min
              </div>
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Topic *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-3 border border-gray-700 bg-gray-800 rounded-xl text-sm text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none placeholder-gray-500"
              placeholder="What do you need help with?"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-gray-700 bg-gray-800 rounded-xl text-sm text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none h-24 resize-none placeholder-gray-500"
              placeholder="Provide more details about your problem..."
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={minDate}
                className="w-full p-3 border border-gray-700 bg-gray-800 rounded-xl text-sm text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Time *
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-3 border border-gray-700 bg-gray-800 rounded-xl text-sm text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full p-3 border border-gray-700 bg-gray-800 rounded-xl text-sm text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>

          {/* Cost Estimate */}
          <div className="bg-purple-900/30 border border-purple-800 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-400 font-medium">Estimated Cost</span>
              <span className="text-xl font-bold text-purple-300">${estimatedCost.toFixed(2)}</span>
            </div>
            <p className="text-xs text-purple-500 mt-1">
              Final cost may vary based on actual session duration
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-700 text-gray-400 rounded-xl font-semibold hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!topic || !date || !time || isLoading}
              className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                'Scheduling...'
              ) : (
                <>
                  <Calendar size={18} />
                  Schedule
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
