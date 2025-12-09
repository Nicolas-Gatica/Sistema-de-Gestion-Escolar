// src/pages/AnalisisRiesgo.js

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const AnalisisRiesgo = () => {
    const [analisis, setAnalisis] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Lógica del Algoritmo MEJORADA
    const calcularRiesgo = (notas, asistencias, observaciones) => {
        const MAX_NOTA = 7.0;
        
        // 1. Notas
        const sumaNotas = notas.reduce((acc, curr) => acc + curr.valor, 0);
        const promedio = notas.length > 0 ? sumaNotas / notas.length : 0;
        const notaPct = Math.max(0, Math.min(100, (promedio / MAX_NOTA) * 100));

        // 2. Conducta
        const positivas = observaciones.filter(o => o.estado === 'positiva').length;
        const negativas = observaciones.filter(o => o.estado === 'negativa').length;
        const totalObs = positivas + negativas;
        // Si no hay observaciones, asumimos comportamiento neutral (100%), si hay, calculamos % positivo
        const comportamientoPct = totalObs === 0 ? 100 : (positivas / totalObs) * 100;

        // 3. Asistencia
        const totalDias = asistencias.length;
        const diasPresente = asistencias.filter(a => a.estado === 'presente').length;
        const asistenciaPct = totalDias === 0 ? 100 : (diasPresente / totalDias) * 100;

        // 4. Algoritmo Base (Ponderación)
        const pesos = { nota: 0.5, asistencia: 0.3, comportamiento: 0.2 };
        const puntajeExito = (
            (notaPct * pesos.nota) +
            (asistenciaPct * pesos.asistencia) +
            (comportamientoPct * pesos.comportamiento)
        );

        // 5. Cálculo de Probabilidad Base (Inversa al éxito)
        let probReprobar = 100.0 - puntajeExito;

        // --- AJUSTE CRÍTICO: PENALIZACIONES ---
        // Si el promedio es rojo (< 4.0), aumentamos drásticamente el riesgo
        if (promedio < 4.0) {
            probReprobar += 25; // Penalización por nota roja
        }
        // Si la asistencia es crítica (< 85%), aumentamos el riesgo
        if (asistenciaPct < 85) {
            probReprobar += 15; // Penalización por inasistencia
        }

        // Asegurar que no pase de 100%
        probReprobar = Math.max(0, Math.min(100, probReprobar));

        // Estado Cualitativo e Icono
        let estadoTexto = "BAJA probabilidad de reprobar";
        let colorEstado = "#28a745"; // Verde
        let iconoEstado = "✓"; // Check

        if (probReprobar > 70) {
            estadoTexto = "ALTA probabilidad de reprobar";
            colorEstado = "#dc3545"; // Rojo
            iconoEstado = "✕"; // Cruz
        } else if (probReprobar > 40) {
            estadoTexto = "RIESGO MEDIO de reprobar";
            colorEstado = "#ffc107"; // Amarillo
            iconoEstado = "!"; // Exclamación
        }

        return {
            promedio: promedio.toFixed(1),
            asistenciaPct: asistenciaPct.toFixed(0),
            positivas,
            negativas,
            probabilidad: probReprobar.toFixed(1),
            estado: estadoTexto,
            color: colorEstado,
            icono: iconoEstado
        };
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const [notasRes, asisRes, obsRes] = await Promise.all([
                    supabase.from('Calificacion').select('valor').eq('estudiante_uuid', user.id),
                    supabase.from('Asistencia').select('estado').eq('estudiante_uuid', user.id),
                    supabase.from('Observacion').select('estado').eq('estudiante_uuid', user.id)
                ]);

                if (notasRes.error) throw notasRes.error;
                if (asisRes.error) throw asisRes.error;
                if (obsRes.error) throw obsRes.error;

                const resultado = calcularRiesgo(notasRes.data, asisRes.data, obsRes.data);
                setAnalisis(resultado);

            } catch (error) {
                console.error("Error calculando riesgo:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div style={{textAlign:'center', padding:'50px', fontFamily:"'Playfair Display', serif", fontSize:'1.5em'}}>Calculando riesgos...</div>;

    return (
        <div style={styles.fullWidthContainer}>
            <h1 style={styles.pageTitle}>Análisis de Riesgo Académico</h1>
            <p style={styles.subtitle}>Algoritmo predictivo basado en rendimiento, asistencia y conducta.</p>

            {analisis && (
                <div style={styles.contentWrapper}>
                    
                    {/* --- TARJETA PRINCIPAL (RESULTADO) --- */}
                    <div style={{...styles.mainCard, borderTop: `10px solid ${analisis.color}`}}>
                        
                        {/* Icono Grande */}
                        <div style={{...styles.iconCircle, borderColor: analisis.color, color: analisis.color}}>
                            {analisis.icono}
                        </div>

                        <h2 style={styles.probabilityTitle}>Probabilidad de Reprobación</h2>
                        <div style={{...styles.probabilityNumber, color: analisis.color}}>
                            {analisis.probabilidad}%
                        </div>
                        <p style={{...styles.statusText, color: analisis.color}}>
                            {analisis.estado}
                        </p>
                    </div>

                    {/* --- GRID DE FACTORES --- */}
                    <div style={styles.statsGrid}>
                        <div style={styles.statCard}>
                            <h4 style={styles.cardTitle}>Promedio Notas</h4>
                            <p style={{...styles.statValue, color: parseFloat(analisis.promedio) < 4.0 ? '#dc3545' : '#003366'}}>
                                {analisis.promedio}
                            </p>
                            <span style={styles.statLabel}>Ponderación 50%</span>
                        </div>
                        <div style={styles.statCard}>
                            <h4 style={styles.cardTitle}>Asistencia Total</h4>
                            <p style={{...styles.statValue, color: parseInt(analisis.asistenciaPct) < 85 ? '#dc3545' : '#003366'}}>
                                {analisis.asistenciaPct}%
                            </p>
                            <span style={styles.statLabel}>Ponderación 30%</span>
                        </div>
                        <div style={styles.statCard}>
                            <h4 style={styles.cardTitle}>Conducta</h4>
                            <div style={styles.conductaBox}>
                                <span style={{color:'#28a745'}}>Positivas: {analisis.positivas}</span>
                                <span style={{color:'#dc3545'}}>Negativas: {analisis.negativas}</span>
                            </div>
                            <span style={styles.statLabel}>Ponderación 20%</span>
                        </div>
                    </div>
                </div>
            )}
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
    pageTitle: {
        fontFamily: "'Playfair Display', serif",
        fontSize: '3em',
        color: '#001f3f',
        textAlign: 'center',
        marginBottom: '10px',
        fontWeight: '700',
    },
    subtitle: {
        textAlign: 'center',
        color: '#666',
        fontSize: '1.2em',
        marginBottom: '50px',
        fontStyle: 'italic'
    },
    contentWrapper: {
        maxWidth: '1000px',
        margin: '0 auto',
    },
    mainCard: {
        textAlign: 'center',
        padding: '50px',
        borderRadius: '15px',
        backgroundColor: '#fff',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        marginBottom: '50px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    iconCircle: {
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        border: '6px solid', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '5em', 
        fontWeight: 'bold',
        marginBottom: '20px',
    },
    probabilityTitle: {
        fontFamily: "'Playfair Display', serif",
        fontSize: '1.8em',
        color: '#333',
        marginBottom: '10px',
    },
    probabilityNumber: {
        fontSize: '5em',
        fontWeight: '900',
        lineHeight: '1',
        marginBottom: '15px',
        fontFamily: "'Lato', sans-serif",
    },
    statusText: {
        fontSize: '1.5em',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '1px',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '30px',
    },
    statCard: {
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '12px',
        textAlign: 'center',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        border: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontFamily: "'Playfair Display', serif",
        fontSize: '1.4em',
        color: '#003366',
        marginBottom: '15px',
        fontWeight: '600',
    },
    statValue: {
        fontSize: '3em',
        fontWeight: '700',
        margin: '0 0 10px 0',
    },
    conductaBox: {
        fontSize: '1.3em',
        fontWeight: '700',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        marginBottom: '10px'
    },
    statLabel: {
        fontSize: '1em',
        color: '#888',
        fontWeight: '400',
    }
};

export default AnalisisRiesgo;