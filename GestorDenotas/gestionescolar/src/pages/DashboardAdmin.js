// src/pages/DashboardAdmin.js

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';

const DashboardAdmin = () => {
    const [stats, setStats] = useState({ profesores: 0, estudiantes: 0, cursos: 0 });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                // Contar Profesores
                const { count: countPro } = await supabase.from('Profesor').select('*', { count: 'exact', head: true });
                // Contar Estudiantes
                const { count: countEst } = await supabase.from('Estudiante').select('*', { count: 'exact', head: true });
                // Contar Cursos
                const { count: countCur } = await supabase.from('Curso').select('*', { count: 'exact', head: true });

                setStats({
                    profesores: countPro || 0,
                    estudiantes: countEst || 0,
                    cursos: countCur || 0
                });
            } catch (error) {
                console.error("Error cargando estadísticas admin:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div style={{textAlign:'center', padding:'50px', fontFamily:"'Playfair Display', serif", fontSize:'1.5em'}}>Cargando panel...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.headerSection}>
                <h2 style={styles.pageTitle}>Panel de Administración</h2>
                <p style={styles.subtitle}>Gestión centralizada de la comunidad educativa.</p>
            </div>

            {/* TARJETAS DE RESUMEN (KPIs) */}
            <div style={styles.kpiGrid}>
                <div style={styles.kpiCard}>
                    <span style={styles.kpiNumber}>{stats.estudiantes}</span>
                    <span style={styles.kpiLabel}>Estudiantes Matriculados</span>
                </div>
                <div style={styles.kpiCard}>
                    <span style={styles.kpiNumber}>{stats.profesores}</span>
                    <span style={styles.kpiLabel}>Docentes Activos</span>
                </div>
                <div style={styles.kpiCard}>
                    <span style={styles.kpiNumber}>{stats.cursos}</span>
                    <span style={styles.kpiLabel}>Cursos Creados</span>
                </div>
            </div>

            {/* HEMOS ELIMINADO LA SECCIÓN "HERRAMIENTAS DE GESTIÓN" 
               PORQUE YA EXISTEN EN LA BARRA DE NAVEGACIÓN SUPERIOR 
            */}

            <div style={styles.welcomeMessage}>
                <h3>¡Bienvenido Administrador!</h3>
                <p>Utilice el menú superior para acceder a las herramientas de gestión de Usuarios, Académico e Infraestructura.</p>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Lato', sans-serif" },
    headerSection: { textAlign: 'center', marginBottom: '50px' },
    pageTitle: { fontFamily: "'Playfair Display', serif", fontSize: '3.5em', color: '#001f3f', margin: '0 0 10px 0', fontWeight: '900' },
    subtitle: { fontSize: '1.3em', color: '#666' },
    
    // KPIs
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', marginBottom: '60px' },
    kpiCard: { backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderBottom: '5px solid #0055a5', textAlign: 'center' },
    kpiNumber: { display: 'block', fontFamily: "'Playfair Display', serif", fontSize: '3.5em', fontWeight: 'bold', color: '#003366', lineHeight: '1' },
    kpiLabel: { fontSize: '1.1em', color: '#666', marginTop: '10px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' },

    // Mensaje de bienvenida inferior
    welcomeMessage: {
        textAlign: 'center',
        marginTop: '40px',
        color: '#555',
        backgroundColor: '#f8f9fa',
        padding: '30px',
        borderRadius: '10px',
        border: '1px solid #eee'
    }
};

export default DashboardAdmin;