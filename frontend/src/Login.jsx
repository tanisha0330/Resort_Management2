import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            await login(username, password);
            navigate('/'); // On success, send them to the Dashboard!
        } catch (err) {
            setError('Invalid credentials. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B132B] flex items-center justify-center p-4 font-mono">
            <div className="bg-[#0B132B] border-4 border-white p-8 w-full max-w-md text-white shadow-[8px_8px_0px_rgba(255,255,255,0.2)]">
                
                <div className="text-center mb-8 border-b-2 border-white pb-4">
                    <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">Resort OS</h1>
                    <p className="text-xs text-gray-400 uppercase tracking-widest">Authorized Personnel Only</p>
                </div>

                {error && (
                    <div className="bg-red-500 text-white text-xs font-bold p-3 mb-6 uppercase text-center border-2 border-white">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-2">Admin Username</label>
                        <input 
                            type="text" 
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-[#6E7B9B] border-2 border-white p-3 outline-none text-white placeholder-gray-300 font-bold"
                            placeholder="Enter Username"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase mb-2">Access Code</label>
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#6E7B9B] border-2 border-white p-3 outline-none text-white font-bold tracking-widest"
                            placeholder="••••••••"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="mt-4 bg-[#3b82f6] border-2 border-white py-4 font-bold uppercase text-sm hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'AUTHENTICATING...' : 'INITIALIZE LOGIN'}
                    </button>
                </form>

            </div>
        </div>
    );
};

export default Login;