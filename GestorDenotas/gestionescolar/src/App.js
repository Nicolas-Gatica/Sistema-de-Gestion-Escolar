// src/App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'; // Asegúrate de que App.css no fuerce un fondo oscuro o centrado

import Login from './pages/login'; 
import AuthenticatedLayout from './pages/AuthenticatedLayout';
import AuthLoading from './pages/AuthLoading'; 

function App() {
    const [session, setSession] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userName, setUserName] = useState(null);

    // Carga de sesión desde localStorage
    useEffect(() => {
        const storedSession = localStorage.getItem('supabase-session');
        if (storedSession) {
            try {
                const storedUser = JSON.parse(storedSession); 
                setSession(storedUser);
                setUserRole(storedUser.role);
                setUserName(storedUser.name); 
            } catch (e) {
                console.error("Error parsing session from localStorage", e);
                localStorage.removeItem('supabase-session');
            }
        }
    }, []);

    // Manejar login exitoso
    const handleLoginSuccess = (user) => {
        setSession(user);
        setUserRole(user.role);
        setUserName(user.name); 
        localStorage.setItem('supabase-session', JSON.stringify(user));
    };

    // Manejar cierre de sesión
    const handleLogout = () => {
        setSession(null);
        setUserRole(null);
        setUserName(null);
        localStorage.removeItem('supabase-session');
    };

    return (
        <Router>
            {/* El <div className="App"> es el contenedor principal SIN cabecera */}
            <div className="App">
                <main>
                    <Routes>
                        {session ? (
                            // --- RUTAS SI HAY SESIÓN ACTIVA ---
                            <>
                                <Route
                                    path="/auth/loading"
                                    element={<AuthLoading userRole={userRole} userName={userName} />}
                                />
                                <Route
                                    path="/*"
                                    element={<AuthenticatedLayout 
                                                userRole={userRole} 
                                                userName={userName} 
                                                onLogout={handleLogout} 
                                            />}
                                />
                            </>
                        ) : (
                            // --- RUTAS SI NO HAY SESIÓN ---
                            <Route
                                path="/*"
                                element={<Login onLoginSuccess={handleLoginSuccess} />}
                            />
                        )}
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;