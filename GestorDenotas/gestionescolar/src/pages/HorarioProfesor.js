// src/pages/HorarioProfesor.js

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const HorarioProfesor = () => {
    const [horario, setHorario] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profesorNombre, setProfesorNombre] = useState('');
    const [error, setError] = useState(null);

    // Bloques horarios estándar
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
                // 1. Obtener usuario autenticado
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("No autenticado");

                // 2. Obtener datos del Profesor
                const { data: profeData, error: profeError } = await supabase
                    .from('Profesor')
                    .select('id, nombre, apellido')
                    .eq('user_uuid', user.id)
                    .single();

                if (profeError) throw profeError;
                setProfesorNombre(`${profeData.nombre} ${profeData.apellido}`);

                // 3. Obtener Horario filtrado por el PROFESOR
                // Traemos también el nombre del Curso para saber a quién le hace clases
                const { data: horarioData, error: horarioError } = await supabase
                    .from('Horario')
                    .select(`
                        diaSemana,
                        horaInicio,
                        horaFin,
                        Asignatura ( nombre ),
                        Curso ( nombre )
                    `)
                    .eq('profesorId', profeData.id)
                    .order('horaInicio', { ascending: true });

                if (horarioError) throw horarioError;

                setHorario(horarioData);

            } catch (error) {
                console.error("Error cargando horario:", error);
                setError("No se pudo cargar su carga académica.");
            } finally {
                setLoading(false);
            }
        };

        fetchHorario();
    }, []);

    // Función para encontrar la clase en el bloque
    const findClase = (diaIndex, horaInicio) => {
        const diaBD = diaIndex + 1; 
        return horario.find(h => 
            h.diaSemana === diaBD && h.horaInicio.startsWith(horaInicio)
        );
    };

    if (loading) return <div style={{textAlign:'center', padding:'50px', fontFamily:"'Playfair Display', serif", fontSize:'1.5em'}}>Cargando carga horaria...</div>;
    if (error) return <div style={{textAlign:'center', padding:'50px', color:'red'}}>{error}</div>;

    return (
        <div style={styles.fullWidthContainer}>
            <div style={styles.header}>
                <h1 style={styles.pageTitle}>Mi Carga Académica</h1>
                <span style={styles.profeBadge}>{profesorNombre}</span>
            </div>

            <div style={styles.tableCard}>
                <table style={styles.scheduleTable}>
                    <thead>
                        <tr>
                            <th style={styles.timeHeaderCell}>Bloque</th>
                            {diasSemana.map((dia, i) => (
                                <th key={i} style={styles.dayHeaderCell}>{dia}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {bloquesHorarios.map((bloque, index) => (
                            <tr key={index}>
                                {/* Hora */}
                                <td style={styles.timeCell}>
                                    <span style={styles.timeText}>{bloque.inicio}</span>
                                    <span style={styles.timeSeparator}>-</span>
                                    <span style={styles.timeText}>{bloque.fin}</span>
                                </td>

                                {/* Días */}
                                {diasSemana.map((_, diaIndex) => {
                                    const clase = findClase(diaIndex, bloque.inicio);
                                    return (
                                        <td key={diaIndex} style={styles.classCell}>
                                            {clase ? (
                                                <div style={styles.classCard}>
                                                    <span style={styles.subjectName}>{clase.Asignatura?.nombre}</span>
                                                    <div style={styles.courseTag}>
                                                        {clase.Curso?.nombre}
                                                    </div>
                                                </div>
                                            ) : (
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
        color: '#001f3f',
        margin: 0,
        fontWeight: '700',
    },
    profeBadge: {
        backgroundColor: '#28a745', // Verde para diferenciar del alumno
        color: 'white',
        padding: '10px 25px',
        borderRadius: '30px',
        fontSize: '1.2em',
        fontWeight: 'bold',
        fontFamily: "'Playfair Display', serif",
        boxShadow: '0 4px 10px rgba(40, 167, 69, 0.3)'
    },
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
        tableLayout: 'fixed',
    },
    // Encabezados
    timeHeaderCell: {
        backgroundColor: '#001f3f',
        color: '#a0c4ff',
        padding: '20px',
        width: '130px',
        fontFamily: "'Playfair Display', serif",
        fontSize: '1.1em',
        borderRight: '1px solid #003366',
        textAlign: 'center'
    },
    dayHeaderCell: {
        backgroundColor: '#0055a5',
        color: 'white',
        padding: '20px',
        fontFamily: "'Playfair Display', serif",
        fontSize: '1.4em',
        textAlign: 'center',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
    },
    // Celdas
    timeCell: {
        backgroundColor: '#f8f9fa',
        padding: '15px',
        textAlign: 'center',
        borderBottom: '1px solid #e0e0e0',
        borderRight: '2px solid #e0e0e0',
        color: '#444',
        fontWeight: 'bold',
        verticalAlign: 'middle',
        height: '120px'
    },
    timeText: { display: 'block', fontSize: '1.1em' },
    timeSeparator: { color: '#ccc', margin: '2px 0', fontSize: '0.8em' },
    classCell: {
        padding: '8px',
        borderBottom: '1px solid #eee',
        borderLeft: '1px solid #f0f0f0',
        backgroundColor: 'white',
        verticalAlign: 'middle',
    },
    // Tarjeta de Clase (Profesor)
    classCard: {
        backgroundColor: '#fff3cd', // Fondo amarillento/crema para diferenciar
        borderLeft: '6px solid #ffc107', // Borde Amarillo
        color: '#856404',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column', // Columna para poner Curso abajo
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
        boxSizing: 'border-box',
        padding: '10px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
        minHeight: '80px'
    },
    subjectName: {
        fontWeight: '700',
        fontSize: '1.1em',
        textAlign: 'center',
        fontFamily: "'Lato', sans-serif",
        lineHeight: '1.2',
        color: '#333'
    },
    courseTag: {
        marginTop: '5px',
        fontSize: '0.9em',
        color: '#0055a5',
        fontWeight: 'bold',
        backgroundColor: 'rgba(255,255,255,0.6)',
        padding: '2px 8px',
        borderRadius: '10px'
    },
    emptySlot: {
        height: '100%',
        width: '100%',
    }
};

export default HorarioProfesor;