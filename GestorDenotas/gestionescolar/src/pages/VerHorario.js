// src/pages/VerHorario.js

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const VerHorario = () => {
    const [horario, setHorario] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cursoNombre, setCursoNombre] = useState('');
    const [error, setError] = useState(null);

    // Definimos los bloques exactos de tu colegio para que la tabla quede perfecta
    const bloquesHorarios = [
        { inicio: '08:30', fin: '10:00' },
        { inicio: '10:15', fin: '11:45' },
        { inicio: '12:00', fin: '13:30' },
        { inicio: '14:30', fin: '16:00' },
        { inicio: '16:15', fin: '17:45' }
    ];

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

    useEffect(() => {
        const fetchHorario = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("No autenticado");

                // 1. Obtener Curso del Estudiante
                const { data: estudianteData, error: estError } = await supabase
                    .from('Estudiante')
                    .select('cursoId, Curso(nombre)')
                    .eq('user_uuid', user.id)
                    .single();

                if (estError) throw estError;
                if (!estudianteData || !estudianteData.cursoId) {
                    throw new Error("Estudiante no asignado a un curso.");
                }

                setCursoNombre(estudianteData.Curso?.nombre);

                // 2. Obtener Horario
                const { data: horarioData, error: horarioError } = await supabase
                    .from('Horario')
                    .select(`
                        diaSemana,
                        horaInicio,
                        horaFin,
                        Asignatura ( nombre )
                    `)
                    .eq('cursoId', estudianteData.cursoId);

                if (horarioError) throw horarioError;
                setHorario(horarioData);

            } catch (error) {
                console.error("Error cargando horario:", error);
                setError("No se pudo cargar el horario.");
            } finally {
                setLoading(false);
            }
        };

        fetchHorario();
    }, []);

    // Función para encontrar la clase
    const findClase = (diaIndex, horaInicio) => {
        const diaBD = diaIndex + 1; // Lunes es 1 en la BD
        return horario.find(h => 
            h.diaSemana === diaBD && h.horaInicio.startsWith(horaInicio)
        );
    };

    if (loading) return <div style={{textAlign:'center', padding:'50px', fontFamily:"'Playfair Display', serif", fontSize:'1.5em'}}>Cargando horario...</div>;
    if (error) return <div style={{textAlign:'center', padding:'50px', color:'red'}}>{error}</div>;

    return (
        <div style={styles.fullWidthContainer}>
            <div style={styles.header}>
                {/* TÍTULO LIMPIO SIN ÍCONO */}
                <h1 style={styles.pageTitle}>Horario de Clases</h1>
                <span style={styles.cursoBadge}>{cursoNombre}</span>
            </div>

            <div style={styles.tableCard}>
                <table style={styles.scheduleTable}>
                    <thead>
                        <tr>
                            {/* Esquina superior vacía */}
                            <th style={styles.timeHeaderCell}>Bloque</th>
                            {diasSemana.map((dia, i) => (
                                <th key={i} style={styles.dayHeaderCell}>{dia}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {bloquesHorarios.map((bloque, index) => (
                            <tr key={index}>
                                {/* Columna de Horas */}
                                <td style={styles.timeCell}>
                                    <span style={styles.timeStart}>{bloque.inicio}</span>
                                    <span style={styles.timeEnd}>{bloque.fin}</span>
                                </td>

                                {/* Columnas de Días */}
                                {diasSemana.map((_, diaIndex) => {
                                    const clase = findClase(diaIndex, bloque.inicio);
                                    return (
                                        <td key={diaIndex} style={styles.classCell}>
                                            {clase ? (
                                                <div style={styles.classCard}>
                                                    <span style={styles.subjectName}>{clase.Asignatura.nombre}</span>
                                                </div>
                                            ) : (
                                                // Celda vacía (Recreo/Libre)
                                                <div style={styles.emptySlot}></div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const styles = {
    fullWidthContainer: {
        padding: '40px 60px',
        backgroundColor: '#f0f4f8',
        minHeight: 'calc(100vh - 140px)',
        fontFamily: "'Lato', sans-serif",
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: '15px',
    },
    pageTitle: {
        fontFamily: "'Playfair Display', serif",
        fontSize: '3em',
        color: '#001f3f', // Azul oscuro
        margin: 0,
        fontWeight: '700',
    },
    cursoBadge: {
        backgroundColor: '#0055a5',
        color: 'white',
        padding: '10px 25px',
        borderRadius: '30px',
        fontSize: '1.2em',
        fontWeight: 'bold',
        fontFamily: "'Playfair Display', serif",
        boxShadow: '0 4px 10px rgba(0,85,165,0.3)'
    },
    
    // --- ESTILOS DE LA TABLA ---
    tableCard: {
        backgroundColor: 'white',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        border: '1px solid #e0e0e0',
    },
    scheduleTable: {
        width: '100%',
        borderCollapse: 'collapse',
        tableLayout: 'fixed', // Mantiene columnas del mismo ancho
    },
    
    // Encabezados
    timeHeaderCell: {
        backgroundColor: '#001f3f', // Azul muy oscuro para la esquina
        color: '#a0c4ff',
        padding: '20px',
        width: '130px',
        fontFamily: "'Playfair Display', serif",
        fontSize: '1.1em',
        borderRight: '1px solid #003366',
        textTransform: 'uppercase',
        letterSpacing: '1px'
    },
    dayHeaderCell: {
        backgroundColor: '#0055a5', // Azul institucional
        color: 'white',
        padding: '20px',
        fontFamily: "'Playfair Display', serif",
        fontSize: '1.4em',
        textAlign: 'center',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
    },

    // Celdas de Hora (Izquierda)
    timeCell: {
        backgroundColor: '#f8f9fa',
        padding: '15px',
        textAlign: 'center',
        borderBottom: '1px solid #e0e0e0',
        borderRight: '2px solid #e0e0e0',
        color: '#444',
        verticalAlign: 'middle',
    },
    timeStart: {
        display: 'block',
        fontSize: '1.2em',
        fontWeight: '800',
        color: '#333',
        marginBottom: '4px'
    },
    timeEnd: {
        display: 'block',
        fontSize: '0.9em',
        color: '#888',
    },

    // Celdas de Clase (Cuerpo)
    classCell: {
        padding: '8px',
        borderBottom: '1px solid #eee',
        borderLeft: '1px solid #f0f0f0',
        backgroundColor: 'white',
        verticalAlign: 'middle',
        height: '100px', // Altura mínima para uniformidad
    },
    
    // Tarjeta de Asignatura
    classCard: {
        backgroundColor: '#e3f2fd', // Celeste muy suave
        borderLeft: '6px solid #4facfe', // Borde lateral de color
        color: '#003366',
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
        boxSizing: 'border-box',
        padding: '10px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
        transition: 'transform 0.2s',
    },
    subjectName: {
        fontWeight: '700',
        fontSize: '1.1em',
        textAlign: 'center',
        fontFamily: "'Lato', sans-serif",
        lineHeight: '1.3'
    },
    
    // Celda vacía
    emptySlot: {
        height: '100%',
        width: '100%',
        backgroundColor: '#fafafa',
        borderRadius: '6px',
    }
};

export default VerHorario;