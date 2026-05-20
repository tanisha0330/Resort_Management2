import React, { useState } from 'react';
import { updateRoomStatusInDB, updateCheckoutDate, clearRoomDB } from './api/roomService';

const STATUS_OPTIONS = ['Available', 'Booked', 'Maintenance', 'Checkin-Pending', 'Checkout-Pending', 'Cleaning'];

const ActionModal = ({ room, onClose, onSuccess, onBookClick }) => {
  const [loading, setLoading] = useState(false);
  const [newDate, setNewDate] = useState(''); 

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      if (newStatus === 'Available') {
        await clearRoomDB(room.id);
      } else {
        await updateRoomStatusInDB(room.id, newStatus);
      }
      onSuccess(); 
    } catch (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  const handleDateUpdate = async () => {
    if (!newDate) return;
    setLoading(true);
    try {
      await updateCheckoutDate(room.id, newDate);
      alert("Checkout date extended successfully!");
      onSuccess();
    } catch (error) {
      const realError = error.response?.data?.error || error.message;
      alert(`Extension Failed: ${realError}`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 font-mono">
      {/* Container is relative so the absolute X button stays in the top right */}
      <div className="bg-[#0B132B] border-4 border-white p-6 w-full max-w-2xl text-white relative">
        
        {/* UNIVERSAL CROSS BUTTON */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-red-400 hover:text-white font-bold text-2xl leading-none"
        >
          X
        </button>

        <div className="flex flex-col md:flex-row gap-6 mt-4">
          {/* LEFT COLUMN: Status Management */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6 border-b-2 border-white pb-2">
              <h2 className="text-xl font-bold uppercase">Manage Room {room.roomNumber}</h2>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-400 uppercase mb-1">Current Status</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-yellow-400 uppercase">{room.status}</p>
                {room.bookedTill && room.status === 'Booked' && (
                  <span className="text-[10px] bg-red-500 text-white px-2 py-1 border border-white">
                    {room.bookedTill}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs mb-3 uppercase font-bold border-b-2 border-gray-600 pb-1">Change Status To:</p>
            <div className="flex flex-col gap-2">
              {STATUS_OPTIONS.filter(s => s !== room.status).map((status) => (
                <button 
                  key={status}
                  disabled={loading}
                  onClick={() => {
                    if (status === 'Booked' && onBookClick) {
                      onBookClick();
                    } else {
                      handleStatusChange(status);
                    }
                  }}
                  className="bg-[#6E7B9B] border-2 border-white py-2 text-sm font-bold uppercase hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: Extension (Only shows if Booked) */}
          {room.status === 'Booked' && (
            <div className="flex-1 border-l-0 md:border-l-4 border-gray-600 pl-0 md:pl-6 flex flex-col justify-start">
               <div className="bg-[#1a264a] border-2 border-white p-4">
                 <p className="text-sm mb-4 uppercase font-bold text-blue-300 border-b-2 border-blue-300 pb-1">
                   Extend Booking
                 </p>
                 
                 <label className="text-[10px] uppercase text-gray-400 block mb-1">New Checkout Date</label>
                 <input 
                    type="date" 
                    style={{ colorScheme: 'dark' }}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#0B132B] border-2 border-white p-2 text-sm outline-none mb-4" 
                  />
                  
                  <button 
                    onClick={handleDateUpdate} 
                    disabled={loading || !newDate}
                    className="w-full bg-[#22c55e] border-2 border-white py-2 text-xs font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                  >
                    CONFIRM EXTENSION
                  </button>
               </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default ActionModal;