// src/pages/Login.js

import React, { useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo_gestion.png'; 

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Estados para el Modal de Recuperación
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetMessage, setResetMessage] = useState(null);

    // --- LOGIN NORMAL ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (authError) throw authError;

            const user = authData.user;
            const { data: profileData, error: profileError } = await supabase
                .from('perfiles')
                .select('rol, nombre_completo')
                .eq('id', user.id)
                .single();

            if (profileError || !profileData) throw new Error('Perfil no encontrado.');

            const userObject = {
                id: user.id,
                email: user.email,
                role: profileData.rol,
                name: profileData.nombre_completo
            };

            if (onLoginSuccess) onLoginSuccess(userObject);
            navigate('/auth/loading', { replace: true });

        } catch (error) {
            if (error.message.includes("Invalid login credentials")) {
                setError('Correo o contraseña incorrectos.');
            } else {
                setError(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    // --- RECUPERACIÓN DIRECTA (BACKEND) ---
    const handleDirectReset = async () => {
        if (!resetEmail || !newPassword) return alert("Completa ambos campos");
        
        setLoading(true);
        setResetMessage(null);

        try {
            // Llamamos a nuestro Backend para forzar el cambio
            const response = await fetch('https://gestion-escolar-ulos.onrender.com/api/auth/recovery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: resetEmail, 
                    newPassword: newPassword 
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Error al cambiar clave");

            alert("¡Contraseña actualizada! Ahora puedes ingresar.");
            setShowResetModal(false);
            setResetEmail('');
            setNewPassword('');

        } catch (error) {
            setResetMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.loginPageContainer}>
            <div style={styles.card}>
                <img src={logoImg} alt="Logo" style={styles.cardLogo} />

                <form onSubmit={handleLogin} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <span style={styles.icon}>👤</span>
                        <input
                            type="email"
                            placeholder="Correo Institucional"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={styles.input}
                            disabled={loading}
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <span style={styles.icon}>🔒</span>
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={styles.input}
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Cargando...' : 'INICIAR SESIÓN'}
                    </button>
                    
                    {error && <p style={styles.errorText}>{error}</p>}

                    <div style={styles.forgotContainer}>
                        <span onClick={() => setShowResetModal(true)} style={styles.forgotLink}>
                            ¿Olvidaste tu contraseña?
                        </span>
                    </div>
                </form>

                <div style={styles.helpTextContainer}>
                    <p style={styles.helpTitle}>Dominios permitidos:</p>
                    <p style={styles.helpText}>@estudiante.cl • @profesor.cl • @admin.cl</p>
                </div>
            </div>

            {/* --- MODAL DE RECUPERACIÓN --- */}
            {showResetModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>Recuperar Contraseña</h3>
                        <p style={{color:'#666', marginBottom:'20px', fontSize:'0.9em'}}>
                            Ingresa tu correo y define una nueva contraseña inmediatamente.
                        </p>
                        
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Correo Institucional:</label>
                            <input 
                                style={styles.inputModal} 
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                placeholder="ej: juan@estudiante.cl"
                            />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Nueva Contraseña:</label>
                            <input 
                                type="password"
                                style={styles.inputModal} 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>

                        {resetMessage && <p style={styles.errorText}>{resetMessage}</p>}

                        <div style={styles.footerBtns}>
                            <button style={styles.btnCancel} onClick={() => setShowResetModal(false)}>Cancelar</button>
                            <button style={styles.btnSave} onClick={handleDirectReset} disabled={loading}>
                                {loading ? 'Guardando...' : 'Cambiar Clave'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    loginPageContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #e0f2f7 0%, #bbdefb 100%)', fontFamily: "'Lato', sans-serif", padding: '20px' },
    card: { backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '50px 40px', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 15px 35px rgba(0,0,0,0.15)', border: '1px solid rgba(255, 255, 255, 0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    cardLogo: { width: '240px', marginBottom: '30px', backgroundColor: 'white', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', objectFit: 'contain' },
    form: { width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: { position: 'relative', display: 'flex', alignItems: 'center' },
    icon: { position: 'absolute', left: '15px', fontSize: '1.3em', color: '#607d8b', zIndex: 1 },
    input: { width: '100%', padding: '15px 15px 15px 50px', fontSize: '1em', border: '1px solid #cfd8dc', borderRadius: '30px', backgroundColor: '#f7f9fa', color: '#333', outline: 'none', boxSizing: 'border-box' },
    button: { padding: '15px', fontSize: '1.1em', fontWeight: 'bold', backgroundColor: '#4facfe', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 8px 20px rgba(79, 172, 254, 0.3)' },
    forgotContainer: { textAlign: 'right', marginTop: '-5px' },
    forgotLink: { color: '#607d8b', fontSize: '0.9em', cursor: 'pointer', fontWeight: 'bold' },
    errorText: { color: '#dc3545', textAlign: 'center', fontSize: '0.9em', marginTop: '10px', backgroundColor: '#ffe6e6', padding: '10px', borderRadius: '8px' },
    helpTextContainer: { marginTop: '30px', textAlign: 'center', borderTop: '1px solid #eceff1', paddingTop: '20px', width: '100%' },
    helpTitle: { color: '#78909c', fontSize: '0.9em', marginBottom: '5px', fontWeight: 'bold' },
    helpText: { color: '#90a4ae', fontSize: '0.85em', margin: 0 },
    
    // Estilos Modal
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '400px', maxWidth: '90%' },
    modalTitle: { margin: '0 0 15px 0', color: '#003366', textAlign: 'center' },
    formGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px', color: '#555', fontWeight: 'bold', fontSize: '0.9em' },
    inputModal: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' },
    footerBtns: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    btnSave: { backgroundColor: '#003366', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    btnCancel: { backgroundColor: '#ccc', color: '#333', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default Login;