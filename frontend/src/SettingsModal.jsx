import React, { useState } from 'react';
import { bulkCreateRooms } from './api/roomService';

const SettingsModal = ({ onClose, onSuccess }) => {
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await bulkCreateRooms(count);
      onSuccess();
    } catch (error) {
      alert("Error creating rooms. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 font-mono">
      <div className="bg-[#0B132B] border-4 border-white p-6 w-full max-w-sm text-white">
        <div className="flex justify-between items-center mb-6 border-b-2 border-white pb-2">
          <h2 className="text-xl font-bold uppercase">System Settings</h2>
          <button onClick={onClose} className="text-red-400 hover:text-white font-bold text-xl">X</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase mb-2">Auto-Generate Rooms</label>
            <p className="text-[10px] text-gray-400 mb-2">Enter the number of rooms you want to add to the database.</p>
            <input 
              type="number" 
              min="1" max="100" 
              required
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-full bg-[#6E7B9B] border-2 border-white p-2 outline-none text-white font-bold"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 bg-[#3b82f6] border-2 border-white py-2 font-bold uppercase text-sm hover:bg-white hover:text-black transition-colors disabled:opacity-50"
          >
            {loading ? 'GENERATING...' : 'GENERATE ROOMS'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;