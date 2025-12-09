// src/pages/AuthenticatedLayout.js

import React, { useState, useEffect } from 'react'; 
import { Routes, Route, Navigate, useNavigate, NavLink } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient'; 

// --- IMPORTAR LOGO ---
import logoImg from '../assets/logo_gestion.png'; 

// --- VISTAS COMUNES ---
import NuestraHistoria from './NuestraHistoria';

// --- VISTAS ADMIN ---
import DashboardAdmin from './DashboardAdmin'; 

// --- VISTAS PROFESOR ---
import DashboardProfesor from './DashboardProfesor'; 
import GestionarCalificaciones from './GestionarCalificaciones'; 
import GestionarAsistencia from './GestionarAsistencia';         
import GestionarHojaVida from './GestionarHojaVida';             
import HorarioProfesor from './HorarioProfesor';

// --- VISTAS ESTUDIANTE ---
import DashboardEstudiante from './DashboardEstudiante'; 
import HojaDeVida from './HojaDeVida'; 
import AnalisisRiesgo from './AnalisisRiesgo'; 
import VerNotas from './VerNotas';     
import HorarioEstudiante from './HorarioEstudiante';

// --- PLACEHOLDERS ADMIN (Para que los botones funcionen por ahora) ---
import GestionUsuarios from './GestionUsuarios';
import GestionAcademica from './GestionAcademica';
import GestionInfraestructura from './GestionInfraestructura';
// Componente base
const DashboardBase = ({ role, userName }) => (
    <div style={styles.contentArea}>
        <h2>Bienvenido</h2>
    </div>
);

const AuthenticatedLayout = ({ userRole, userName, onLogout }) => { 
    const navigate = useNavigate();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [userPhoto, setUserPhoto] = useState(null);
    
    useEffect(() => {
        const fetchPhoto = async () => {
            if (userRole === 'estudiante') {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data } = await supabase
                        .from('Estudiante')
                        .select('foto')
                        .eq('user_uuid', user.id)
                        .single();
                    if (data?.foto) setUserPhoto(data.foto);
                }
            }
        };
        fetchPhoto();
    }, [userRole]);

    const handleLogoutClick = async () => {
        try {
            await supabase.auth.signOut();
            onLogout(); 
            navigate('/', { replace: true }); 
        } catch (e) {
            console.error('Fallo al cerrar sesión:', e);
            onLogout(); 
            navigate('/', { replace: true });
        }
    };

    // --- CONFIGURACIÓN DE RUTAS ---
    let landingRoute = '/dashboard';
    let contentRoutes = null;
    let navOptions = []; 

    // 1. ADMIN (Menú Actualizado)
    if (userRole === 'admin') {
        landingRoute = '/admin'; // "Administración" es el home
        
        navOptions = [
            { path: '/admin', label: 'Administración' }, // Dashboard General
            { path: '/admin/usuarios', label: 'Usuarios' },
            { path: '/admin/academico', label: 'Académico' },
            { path: '/admin/infraestructura', label: 'Infraestructura' },
        ];

        contentRoutes = (
            <>
                {/* Ruta Base: DashboardAdmin */}
                <Route path="/admin" element={<DashboardAdmin />} />
                
                {/* Rutas Nuevas */}
                <Route path="/admin/usuarios" element={<GestionUsuarios />} />
                <Route path="/admin/academico" element={<GestionAcademica />} />
                <Route path="/admin/infraestructura" element={<GestionInfraestructura />} />
            </>
        );
    } 
    // 2. PROFESOR
    else if (userRole === 'profesor') {
        landingRoute = '/profesor/historia';
        
        navOptions = [
            { path: '/profesor/historia', label: 'Nuestra Historia' },
            { path: '/profesor', label: 'Mi Perfil' },
            { path: '/profesor/calificaciones', label: 'Gestionar Calificaciones' },
            { path: '/profesor/asistencia', label: 'Gestionar Asistencia' },
            { path: '/profesor/hoja-vida', label: 'Gestionar Hoja de Vida' },
            { path: '/profesor/horario', label: 'Horario' },
        ];

        contentRoutes = (
            <>
                <Route path="/profesor/historia" element={<NuestraHistoria />} />
                <Route path="/profesor" element={<DashboardProfesor />} />
                <Route path="/profesor/calificaciones" element={<GestionarCalificaciones />} />
                <Route path="/profesor/asistencia" element={<GestionarAsistencia />} />
                <Route path="/profesor/hoja-vida" element={<GestionarHojaVida />} />
                <Route path="/profesor/horario" element={<HorarioProfesor />} />
            </>
        );
    } 
    // 3. ESTUDIANTE
    else if (userRole === 'estudiante') {
        landingRoute = '/estudiante/historia'; 
        
        navOptions = [
            { path: '/estudiante/historia', label: 'Nuestra Historia' }, 
            { path: '/estudiante', label: 'Mi Perfil' }, 
            { path: '/estudiante/notas', label: 'Ver Notas' }, 
            { path: '/estudiante/horario', label: 'Horario' }, 
            { path: '/estudiante/hoja-de-vida', label: 'Hoja de Vida' }, 
            { path: '/estudiante/analisis-riesgo', label: 'Análisis de Riesgo' }, 
        ];

        contentRoutes = (
            <>
                <Route path="/estudiante/historia" element={<NuestraHistoria />} />
                <Route path="/estudiante" element={<DashboardEstudiante />} />
                <Route path="/estudiante/notas" element={<VerNotas />} />
                <Route path="/estudiante/horario" element={<HorarioEstudiante />} />
                <Route path="/estudiante/hoja-de-vida" element={<HojaDeVida />} />
                <Route path="/estudiante/analisis-riesgo" element={<AnalisisRiesgo />} />
            </>
        );
    }
    
    return (
        <div style={styles.layoutContainer}>
            <header style={styles.mainHeader}>
                <div style={styles.logoContainer}>
                    <img src={logoImg} alt="Gestión Escolar" style={styles.logoImage} />
                </div>
                <div style={styles.userMenuContainer}>
                    <button style={styles.userMenuButton} onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                        <span style={styles.userNameText}>{userName}</span>
                        <img src={userPhoto || 'https://via.placeholder.com/40'} alt="Perfil" style={styles.headerAvatar} />
                    </button>
                    {isUserMenuOpen && (
                        <div style={styles.userMenuDropdown}>
                            <button onClick={handleLogoutClick} style={{...styles.dropdownItem, ...styles.logoutButton}}>
                                Cerrar Sesión 🔒
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <nav style={styles.secondaryNavbar}>
                {navOptions.map((opt) => (
                    <NavLink 
                        key={opt.path} 
                        to={opt.path} 
                        end 
                        style={({ isActive }) => isActive ? { ...styles.navOption, ...styles.navOptionActive } : styles.navOption}
                    >
                        {opt.label}
                    </NavLink>
                ))}
            </nav>

            <main style={styles.content}>
                <Routes>
                    <Route path="/" element={<Navigate to={landingRoute} replace />} />
                    <Route path="/dashboard" element={<DashboardBase role={userRole} userName={userName} />} />
                    {contentRoutes}
                    <Route path="*" element={<Navigate to={landingRoute} replace />} />
                </Routes>
            </main>
        </div>
    );
};

// (ESTILOS IGUALES)
const styles = {
    layoutContainer: { display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: "'Lato', sans-serif" },
    mainHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#001f3f', color: 'white', padding: '0 30px', height: '80px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', zIndex: 10, borderBottom: '1px solid #003366' },
    logoContainer: { display: 'flex', alignItems: 'center', height: '100%', padding: '10px 0' },
    logoImage: { height: '60px', width: 'auto', objectFit: 'contain', backgroundColor: 'white', padding: '5px 15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
    userMenuContainer: { position: 'relative' },
    userMenuButton: { backgroundColor: 'transparent', color: 'white', border: 'none', padding: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px' },
    userNameText: { fontSize: '1.1em', fontWeight: '400', color: '#e0e0e0', fontFamily: "'Playfair Display', serif" },
    headerAvatar: { width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #4facfe' },
    userMenuDropdown: { position: 'absolute', top: '60px', right: '0', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '5px', width: '200px', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
    dropdownItem: { padding: '15px', color: '#333', textAlign: 'left', border: 'none', background: 'none', fontFamily: 'inherit', fontSize: '1em' },
    logoutButton: { width: '100%', backgroundColor: '#fff', color: '#dc3545', cursor: 'pointer', fontWeight: 'bold', borderTop: '1px solid #eee', transition: 'background 0.2s' },
    secondaryNavbar: { display: 'flex', backgroundColor: '#ffffff', padding: '0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderBottom: '1px solid #e0e0e0' },
    navOption: { flex: 1, textAlign: 'center', padding: '20px 0', textDecoration: 'none', color: '#555', fontWeight: '500', fontSize: '1.1em', fontFamily: "'Lato', sans-serif", transition: 'all 0.2s ease', borderBottom: '4px solid transparent' },
    navOptionActive: { color: '#0055a5', backgroundColor: '#f8faff', borderBottom: '4px solid #0055a5', fontWeight: '700' },
    content: { flex: 1, padding: '0', backgroundColor: '#f0f4f8' },
    contentArea: { padding: '40px', textAlign: 'center' }
};

export default AuthenticatedLayout;