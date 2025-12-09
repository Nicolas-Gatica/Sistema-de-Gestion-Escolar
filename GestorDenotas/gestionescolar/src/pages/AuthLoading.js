// src/pages/AuthLoading.js

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Componente de pantalla de carga que recibe el rol
const AuthLoading = ({ userRole, userName }) => {
    const navigate = useNavigate();
    const [message, setMessage] = useState('Autenticando...');

    useEffect(() => {
        let destination = '/dashboard';
        let roleMessage = 'Estudiante/Apoderado';

        // 1. Determinar el mensaje y la ruta de destino
        if (userRole === 'admin') {
            roleMessage = 'Administrador';
            destination = '/admin';
        } else if (userRole === 'profesor') {
            roleMessage = 'Profesor';
            destination = '/profesor';
        } else if (userRole === 'estudiante') {
            roleMessage = 'Estudiante/Apoderado';
            destination = '/estudiante';
        }

        // 2. Mostrar el mensaje de bienvenida
        setMessage(`¡Bienvenido, ${userName}! Entrando como ${roleMessage}...`);

        // 3. Esperar 2 segundos y redirigir
        const timer = setTimeout(() => {
            navigate(destination, { replace: true });
        }, 2000); // 2 segundos de espera

        // Limpiar el temporizador si el componente se desmonta
        return () => clearTimeout(timer);
        
    }, [userRole, userName, navigate]);

    // Estilos para la pantalla de carga
    const styles = {
        container: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
            fontSize: '1.5em',
            color: '#333'
        }
    };

    return (
        <div style={styles.container}>
            <p>{message}</p>
        </div>
    );
};

export default AuthLoading;