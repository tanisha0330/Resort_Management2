import React, { useState } from 'react';
import { submitBooking } from './api/roomService';

const BookingModal = ({ room, selectedDate, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    adults: 1, 
    checkInDate: selectedDate.toISOString().split('T')[0],
    checkOutDate: new Date(selectedDate.getTime() + 86400000).toISOString().split('T')[0] // Defaults to next day
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await submitBooking({ ...formData, roomId: room.id });
      onSuccess(); // Close modal and refresh grid
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 font-mono">
      <div className="bg-[#0B132B] border-4 border-white p-6 w-full max-w-md text-white">
        <div className="flex justify-between items-center mb-6 border-b-2 border-white pb-2">
          <h2 className="text-xl font-bold uppercase">Book Room {room.roomNumber}</h2>
          <button onClick={onClose} className="text-red-400 hover:text-white font-bold text-xl">X</button>
        </div>

        {error && <p className="bg-red-500 text-white p-2 text-xs mb-4 uppercase">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm font-bold uppercase">
          <div className="grid grid-cols-2 gap-4">
            <input name="firstName" placeholder="First Name" required onChange={handleChange} className="bg-[#6E7B9B] border-2 border-white p-2 outline-none placeholder-gray-300" />
            <input name="lastName" placeholder="Last Name" required onChange={handleChange} className="bg-[#6E7B9B] border-2 border-white p-2 outline-none placeholder-gray-300" />
          </div>
          <input name="email" type="email" placeholder="Email Address" required onChange={handleChange} className="bg-[#6E7B9B] border-2 border-white p-2 outline-none placeholder-gray-300" />
          <input name="phone" placeholder="Phone Number" required onChange={handleChange} className="bg-[#6E7B9B] border-2 border-white p-2 outline-none placeholder-gray-300" />
          
          <div className="grid grid-cols-3 gap-4 items-end">
            <div className="col-span-2">
              <label className="text-[10px] mb-1 block">Check-Out Date</label>
              <input name="checkOutDate" type="date" required value={formData.checkOutDate} onChange={handleChange} style={{ colorScheme: 'dark' }} className="bg-[#6E7B9B] border-2 border-white p-2 outline-none w-full" />
            </div>
            <div>
              <label className="text-[10px] mb-1 block">Adults</label>
              <input name="adults" type="number" min="1" required value={formData.adults} onChange={handleChange} className="bg-[#6E7B9B] border-2 border-white p-2 outline-none w-full text-center" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="mt-4 bg-[#22c55e] border-2 border-white py-3 hover:bg-white hover:text-black transition-colors disabled:opacity-50">
            {loading ? 'PROCESSING...' : 'CONFIRM BOOKING'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;