// src/pages/HorarioEstudiante.js

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const HorarioEstudiante = () => {
    const [horario, setHorario] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cursoNombre, setCursoNombre] = useState('');
    const [error, setError] = useState(null);

    // Bloques de tiempo fijos para dibujar la tabla
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
            setError(null);
            try {
                // 1. Usuario actual
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("No autenticado");

                // 2. Obtener ID del Curso
                const { data: estudianteData, error: estError } = await supabase
                    .from('Estudiante')
                    .select('cursoId, Curso(nombre)')
                    .eq('user_uuid', user.id)
                    .single();

                if (estError) throw estError;
                if (!estudianteData?.cursoId) throw new Error("Sin curso asignado");

                setCursoNombre(estudianteData.Curso?.nombre);

                // 3. Obtener Horario (Nombres de columnas coinciden con el SQL)
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

                console.log("Datos Horario:", horarioData); // Check en consola
                setHorario(horarioData);

            } catch (err) {
                console.error(err);
                setError("No se pudo cargar el horario.");
            } finally {
                setLoading(false);
            }
        };

        fetchHorario();
    }, []);

    // Función para buscar si hay clase en un bloque específico
    const findClase = (diaIndex, horaInicioBloque) => {
        // diaIndex: 0=Lunes ... SQL: 1=Lunes
        const diaBD = diaIndex + 1;
        
        return horario.find(h => 
            h.diaSemana === diaBD && h.horaInicio === horaInicioBloque
        );
    };

    if (loading) return <div style={{padding:'50px', textAlign:'center'}}>Cargando...</div>;
    if (error) return <div style={{padding:'50px', textAlign:'center', color:'red'}}>{error}</div>;

    return (
        <div style={styles.fullWidthContainer}>
            <div style={styles.header}>
                <h1 style={styles.pageTitle}>Horario de Clases</h1>
                <span style={styles.cursoBadge}>{cursoNombre}</span>
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
                                {/* Celda Hora */}
                                <td style={styles.timeCell}>
                                    <span style={styles.timeText}>{bloque.inicio}</span>
                                    <span style={styles.timeSeparator}>-</span>
                                    <span style={styles.timeText}>{bloque.fin}</span>
                                </td>

                                {/* Celdas Días */}
                                {diasSemana.map((_, diaIndex) => {
                                    const clase = findClase(diaIndex, bloque.inicio);
                                    return (
                                        <td key={diaIndex} style={styles.classCell}>
                                            {clase ? (
                                                <div style={styles.classCard}>
                                                    <span style={styles.subjectName}>
                                                        {clase.Asignatura?.nombre}
                                                    </span>
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
    timeCell: {
        backgroundColor: '#f8f9fa',
        padding: '15px',
        textAlign: 'center',
        borderBottom: '1px solid #e0e0e0',
        borderRight: '2px solid #e0e0e0',
        color: '#444',
        verticalAlign: 'middle',
        height: '100px'
    },
    timeText: { display: 'block', fontSize: '1.1em', fontWeight: 'bold' },
    timeSeparator: { color: '#ccc', margin: '2px 0', fontSize: '0.8em' },
    classCell: {
        padding: '8px',
        borderBottom: '1px solid #eee',
        borderLeft: '1px solid #f0f0f0',
        backgroundColor: 'white',
        verticalAlign: 'middle',
    },
    classCard: {
        backgroundColor: '#e3f2fd',
        borderLeft: '6px solid #4facfe',
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
        minHeight: '80px'
    },
    subjectName: {
        fontWeight: '700',
        fontSize: '1.1em',
        textAlign: 'center',
        fontFamily: "'Lato', sans-serif",
        lineHeight: '1.3'
    },
    emptySlot: {
        height: '100%',
        width: '100%',
    }
};

export default HorarioEstudiante;