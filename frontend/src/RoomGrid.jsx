
import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
import { fetchRoomsForDate, updateRoomStatusInDB } from '../src/api/roomService';
import './assets/RoomGrid.css';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import BookingModal from './BookingModal';
import ActionModal from './ActionModal';



const STATUS_CYCLE = ['Available', 'Booked', 'Maintenance', 'Checkin-Pending', 'Checkout-Pending', 'Cleaning'];
const STATUS_COLORS = {
  'Available': 'bg-[#22c55e]', 
  'Booked': 'bg-[#ef4444]',
  'Maintenance': 'bg-[#94a3b8]',
  'Checkin-Pending': 'bg-[#3b82f6]',
  'Checkout-Pending': 'bg-[#a855f7]',
  'Cleaning': 'bg-[#eab308]'
};

const RoomGrid = () => {
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchRoomInput, setSearchRoomInput] = useState('');
  const [searchDateInput, setSearchDateInput] = useState('');
  const [activeSearch, setActiveSearch] = useState(null);
  const [searchResultData, setSearchResultData] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [filterOption, setFilterOption] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);

  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['rooms', selectedDate],
    queryFn: () => fetchRoomsForDate(selectedDate),
    staleTime: 5000,
  });

  const rooms = data || [];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- REAL-TIME WEBSOCKET LISTENER ---
  useEffect(() => {
    // Connect to the Django Daphne server
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000/ws/rooms/';
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('📡 Connected to Real-Time Hotel Network!');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.message === 'refresh_rooms') {
        console.log("🔄 Real-time update received! Refreshing grid...");
        // This tells React Query to instantly fetch fresh data from the API
        queryClient.invalidateQueries(['rooms']); 
      }
    };

    socket.onclose = () => {
      console.log('Disconnected from Real-Time Network.');
    };

    // Cleanup the connection when the component unmounts
    return () => socket.close();
  }, [queryClient]);
  

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

 const handleRoomClick = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    if (room.status === 'Available') {
      setSelectedRoomForBooking(room);
      setIsModalOpen(true);
    } else {
      setSelectedRoomForBooking(room);
      setIsActionModalOpen(true); // Open the new Action Modal!
    }
  };

  const handleSearch = async () => {
    if (!searchRoomInput || !searchDateInput) {
      alert("Please enter both Room Number and Date!");
      return;
    }
    setIsSearching(true);
    const searchDateObj = new Date(searchDateInput);
    searchDateObj.setHours(0, 0, 0, 0);
    const dateData = await fetchRoomsForDate(searchDateObj);
    setSearchResultData(dateData);
    setActiveSearch({ 
      roomNum: searchRoomInput.toUpperCase().trim(),
      date: searchDateInput,
      displayDate: searchDateObj.toLocaleDateString('en-GB')
    });
    setIsSearching(false);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-white font-mono">LOADING ROOM DATA...</div>;

  const filteredMainRooms = rooms.filter(room => {
    if (filterOption === 'All') return true;
    if (filterOption === 'Available') return room.status === 'Available';
    if (filterOption === 'Occupied') return ['Booked', 'Checkin-Pending'].includes(room.status);
    if (filterOption === 'Maintenance') return room.status === 'Maintenance';
    return true;
  });
  const maintenanceRooms = rooms.filter(r => r.status === 'Maintenance');
  const checkinRooms = rooms.filter(r => r.status === 'Checkin-Pending');
  const checkoutRooms = rooms.filter(r => r.status === 'Checkout-Pending');

  const formattedDate = selectedDate.toLocaleDateString('en-GB').toUpperCase();
  const formattedTime = currentTime.toLocaleTimeString('en-GB', { hour12: false });

  return (
    <div className="min-h-screen bg-[#0B132B] p-4 text-white font-mono flex flex-col">
      
      {/* HEADER SECTION WITH COLOR LEGEND */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-8 gap-4">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter">Room Availability</h1>
        
        <div className="flex flex-wrap gap-3 text-[10px] md:text-xs font-bold uppercase border-2 border-white p-2 bg-[#6E7B9B]">
          <div className="flex items-center gap-2"><div className="w-4 h-4 border border-white bg-[#22c55e]"></div> Available</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 border border-white bg-[#ef4444]"></div> Booked</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 border border-white bg-[#3b82f6]"></div> Check-in Pend</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 border border-white bg-[#a855f7]"></div> Checkout Pend</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 border border-white bg-[#eab308]"></div> Cleaning</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 border border-white bg-[#94a3b8]"></div> Maintenance</div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1">
        {/* LEFT PANEL */}
        <div className="w-full lg:w-[75%] border-4 border-white p-2 flex flex-col gap-4 bg-[#0B132B]">
          
          <div className="border-2 border-white p-2 flex justify-between font-bold text-sm bg-[#0B132B] items-center">
            <div className="flex items-center gap-4">
              <button onClick={handlePrevDay} className="text-2xl hover:text-yellow-400 cursor-pointer transition-colors">&lt;</button>
              <span>VIEWING DATA FOR: {`{${formattedDate}}`}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>TIME : {`{ ${formattedTime} }`}</span>
              <button onClick={handleNextDay} className="text-2xl hover:text-yellow-400 cursor-pointer transition-colors">&gt;</button>
            </div>
          </div>

          <div className="bg-[#6E7B9B] border-2 border-white p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-bold uppercase">
            <div className="flex flex-col gap-1">
              <p>TOTAL ROOMS: {rooms.length}</p>
              <p>Active Rooms : {rooms.filter(r => r.status !== 'Maintenance').length}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p>Booked/Occupied : {rooms.filter(r => r.status === 'Booked').length}</p>
              <p>Available : {rooms.filter(r => r.status === 'Available').length}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p>Check-ins Pend : {checkinRooms.length}</p>
              <p>Checkouts Pend : {checkoutRooms.length}</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 flex-1">
           {/* MAIN GRID */}
            <div className="flex-[2] border-2 border-white bg-[#6E7B9B] p-2 flex flex-col">
              <select 
                value={filterOption}
                onChange={(e) => setFilterOption(e.target.value)}
                className="bg-[#0B132B] text-white border-2 border-white text-xs font-bold p-2 mb-4 outline-none uppercase w-max cursor-pointer"
              >
                <option value="All">ALL ROOMS ▼</option>
                <option value="Available">AVAILABLE ONLY</option>
                <option value="Occupied">OCCUPIED / BOOKED</option>
                <option value="Maintenance">UNDER MAINTENANCE</option>
              </select>
              
              {rooms.length === 0 ? (
                <div className="flex-1 flex items-center justify-center border-4 border-dashed border-[#0B132B] m-2 bg-[#94a3b8]">
                  <span className="text-[#0B132B] font-extrabold text-2xl md:text-3xl tracking-widest uppercase px-6 py-3 bg-white border-2 border-[#0B132B]">
                    No Data Available
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-8 gap-1 flex-1 content-start overflow-y-auto pr-1" style={{ maxHeight: '400px' }}>
                  {filteredMainRooms.map(room => (
                    <div key={room.id} 
                      onClick={() => handleRoomClick(room.id)}
                      className={`h-10 border-2 border-white flex items-center justify-center text-[10px] font-bold transition-transform hover:scale-105 cursor-pointer ${STATUS_COLORS[room.status]}`}
                      title={`Guest: ${room.guest} | Details: ${room.details}`}>
                      {room.roomNumber}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MAINTENANCE SECTION */}
            <div className="flex-[0.5] border-2 border-white bg-[#6E7B9B] flex flex-col" style={{ maxHeight: '470px' }}>
              <div className="text-center text-xs font-bold py-2 border-b-2 border-white sticky top-0 bg-[#6E7B9B] z-10">
                Maintenance ({maintenanceRooms.length})
              </div>
              <div className="p-2 grid grid-cols-2 gap-2 content-start overflow-y-auto flex-1">
                {maintenanceRooms.map(room => (
                  <div key={room.id} 
                    onClick={() => handleRoomClick(room.id)}
                    className={`h-8 border-2 border-white flex items-center justify-center text-[10px] font-bold cursor-pointer hover:scale-105 ${STATUS_COLORS[room.status]}`}>
                    {room.roomNumber}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-[1] flex flex-col gap-4">
              <div className="border-2 border-white bg-[#6E7B9B] flex-1 flex flex-col" style={{ maxHeight: '227px' }}>
                <div className="text-center text-xs font-bold py-2 border-b-2 border-white sticky top-0 bg-[#6E7B9B] z-10">
                  Check-ins Pend ({checkinRooms.length})
                </div>
                <div className="p-2 grid grid-cols-3 gap-2 content-start overflow-y-auto flex-1">
                  {checkinRooms.map(room => (
                    <div key={room.id} 
                      onClick={() => handleRoomClick(room.id)}
                      className={`h-8 border-2 border-white flex items-center justify-center text-[10px] font-bold cursor-pointer hover:scale-105 ${STATUS_COLORS[room.status]}`}>
                      {room.roomNumber}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-2 border-white bg-[#6E7B9B] flex-1 flex flex-col" style={{ maxHeight: '227px' }}>
                <div className="text-center text-xs font-bold py-2 border-b-2 border-white sticky top-0 bg-[#6E7B9B] z-10">
                  Checkouts Pend ({checkoutRooms.length})
                </div>
                <div className="p-2 grid grid-cols-3 gap-2 content-start overflow-y-auto flex-1">
                  {checkoutRooms.map(room => (
                    <div key={room.id} 
                      onClick={() => handleRoomClick(room.id)}
                      className={`h-8 border-2 border-white flex items-center justify-center text-[10px] font-bold cursor-pointer hover:scale-105 ${STATUS_COLORS[room.status]}`}>
                      {room.roomNumber}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-[25%] bg-[#6E7B9B] border-4 border-white p-4 flex flex-col gap-6">
          
          <div className="bg-[#0B132B] border-2 border-white p-4 flex flex-col items-center custom-calendar-container">
            <span className="text-[10px] font-bold tracking-widest mb-2">CALENDAR</span>
            <Calendar 
              onChange={setSelectedDate} 
              value={selectedDate} 
              className="w-full bg-[#6E7B9B] border-2 border-white font-mono text-white"
            />
          </div>

          <div className="flex flex-col gap-2 font-bold mt-4">
            <p className="text-xs uppercase">Check By Room Number:</p>
            <input 
              type="text" 
              placeholder="Enter Room (e.g. A003)" 
              value={searchRoomInput}
              onChange={(e) => setSearchRoomInput(e.target.value)}
              className="bg-[#0B132B] border-2 border-white p-2 text-xs outline-none placeholder-gray-400" 
            />
            
            <input 
              type="date" 
              value={searchDateInput}
              onChange={(e) => setSearchDateInput(e.target.value)}
              style={{ colorScheme: 'dark' }}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
              className="bg-[#0B132B] border-2 border-white p-2 text-xs outline-none mt-2 cursor-pointer placeholder-gray-400 text-white" 
            />
            
            <button 
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-[#0B132B] border-2 border-white py-2 mt-2 uppercase text-xs hover:bg-white hover:text-black transition-all cursor-pointer disabled:opacity-50">
              {isSearching ? 'SEARCHING...' : 'DONE'}
            </button>

            {/* DYNAMIC RESULTS BOX - ASYNC API READY */}
            {activeSearch && (
              <div className="bg-[#0B132B] border-2 border-white p-4 text-[10px] font-bold space-y-2 mt-2 transition-all">
                <p className="text-yellow-400 mb-2 border-b-2 border-yellow-400 pb-1">RESULT FOR : {activeSearch.roomNum}</p>
                
                {searchResultData && searchResultData.length === 0 ? (
                  <>
                    <p className="border-b-2 border-white pb-1">Date: {activeSearch.displayDate}</p>
                    <p className="text-red-400 pt-1">Data is not available for this date.</p>
                  </>
                ) : searchResultData ? (
                  (() => {
                    const foundRoom = searchResultData.find(r => r.roomNumber === activeSearch.roomNum);
                    return foundRoom ? (
                      <>
                        <p className="border-b-2 border-white pb-1">Date: {activeSearch.displayDate}</p>
                        <p className="border-b-2 border-white pb-1">Status: {foundRoom.status}</p>
                        <p className="border-b-2 border-white pb-1">Guest: {foundRoom.guest}</p>
                        <p className="border-b-2 border-white pb-1">Notes: {foundRoom.details}</p>
                      </>
                    ) : (
                      <p className="border-b-2 border-red-400 pb-1 text-red-400">Room Not Found (Enter A001-A062)</p>
                    );
                  })()
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* RENDER MODAL IF OPEN */}
      {isModalOpen && (
        <BookingModal 
          room={selectedRoomForBooking} 
          selectedDate={selectedDate}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            queryClient.invalidateQueries(['rooms', selectedDate]); // This instantly refreshes the grid!
          }}
        />
      )}

      {/* RENDER ACTION MODAL IF OPEN */}
      {isActionModalOpen && (
        <ActionModal 
          room={selectedRoomForBooking} 
          onClose={() => setIsActionModalOpen(false)}
          onSuccess={() => {
            setIsActionModalOpen(false);
            queryClient.invalidateQueries(['rooms', selectedDate]);
          }}
        />
      )}


    </div>
  );
};

export default RoomGrid;