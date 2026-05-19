import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import RoomGrid from './RoomGrid';
import Login from './Login';

// This acts as our "Bouncer". If you don't have a user token, you get kicked to /login
const PrivateRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B132B] text-white flex items-center justify-center font-mono">
                CHECKING CREDENTIALS...
            </div>
        );
    }

    return user ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Public Route */}
                <Route path="/login" element={<Login />} />

                {/* Protected Dashboard Route */}
                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <RoomGrid />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </AuthProvider>
    );
}

export default App;