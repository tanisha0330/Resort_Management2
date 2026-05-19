import React, { useState } from 'react';
import { updateRoomStatusInDB } from './api/roomService';

const STATUS_OPTIONS = ['Available', 'Booked', 'Maintenance', 'Checkin-Pending', 'Checkout-Pending', 'Cleaning'];

const ActionModal = ({ room, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      await updateRoomStatusInDB(room.id, newStatus);
      onSuccess(); // Close modal and refresh grid
    } catch (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 font-mono">
      <div className="bg-[#0B132B] border-4 border-white p-6 w-full max-w-sm text-white">
        <div className="flex justify-between items-center mb-6 border-b-2 border-white pb-2">
          <h2 className="text-xl font-bold uppercase">Manage Room {room.roomNumber}</h2>
          <button onClick={onClose} className="text-red-400 hover:text-white font-bold text-xl">X</button>
        </div>

        <div className="mb-6">
          <p className="text-xs text-gray-400 uppercase mb-1">Current Status</p>
          <p className="text-lg font-bold text-yellow-400 uppercase">{room.status}</p>
        </div>

        <p className="text-xs mb-3 uppercase font-bold border-b-2 border-gray-600 pb-1">Change Status To:</p>
        
        <div className="flex flex-col gap-2">
          {STATUS_OPTIONS.filter(s => s !== room.status).map((status) => (
            <button 
              key={status}
              disabled={loading}
              onClick={() => handleStatusChange(status)}
              className="bg-[#6E7B9B] border-2 border-white py-2 text-sm font-bold uppercase hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            >
              {status}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActionModal;