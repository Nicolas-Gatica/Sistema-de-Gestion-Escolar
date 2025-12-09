// src/pages/HojaDeVida.js

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const HojaDeVida = () => {
    const [observaciones, setObservaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchObservaciones = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Usuario no autenticado");

                const { data, error } = await supabase
                    .from('Observacion')
                    .select('*')
                    .eq('estudiante_uuid', user.id)
                    .order('fecha', { ascending: false });

                if (error) throw error;
                setObservaciones(data);

            } catch (err) {
                console.error(err);
                setError("No se pudo cargar la hoja de vida.");
            } finally {
                setLoading(false);
            }
        };

        fetchObservaciones();
    }, []);

    if (loading) return <div style={{textAlign:'center', padding:'50px', fontFamily:"'Playfair Display', serif", fontSize:'1.5em'}}>Cargando hoja de vida...</div>;
    if (error) return <div style={{textAlign:'center', padding:'50px', color:'red'}}>{error}</div>;

    return (
        <div style={styles.fullWidthContainer}>
            <h1 style={styles.pageTitle}>Hoja de Vida Escolar</h1>
            <p style={styles.subtitle}>Registro de anotaciones conductuales y desempeño académico.</p>

            {observaciones.length === 0 ? (
                <div style={styles.emptyState}>
                    <span style={{fontSize:'3em'}}>📝</span>
                    <p>El estudiante no tiene anotaciones registradas.</p>
                </div>
            ) : (
                <div style={styles.gridContainer}>
                    {observaciones.map((obs) => {
                        const isPositive = obs.estado === 'positiva';
                        return (
                            <div key={obs.id} style={styles.card}>
                                {/* Icono de Estado (Izquierda) */}
                                <div style={{
                                    ...styles.iconColumn,
                                    backgroundColor: isPositive ? '#e8f5e9' : '#ffebee',
                                    color: isPositive ? '#2e7d32' : '#c62828'
                                }}>
                                    <span style={styles.bigIcon}>
                                        {isPositive ? '✓' : '✕'}
                                    </span>
                                    <span style={styles.statusText}>
                                        {isPositive ? 'POSITIVA' : 'NEGATIVA'}
                                    </span>
                                </div>

                                {/* Contenido (Derecha) */}
                                <div style={styles.contentColumn}>
                                    <div style={styles.cardHeader}>
                                        <span style={styles.date}>
                                            {new Date(obs.fecha).toLocaleDateString('es-CL', { 
                                                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'
                                            })}
                                        </span>
                                    </div>
                                    {/* Texto actualizado con fuente y tamaño */}
                                    <p style={styles.text}>{obs.texto}</p>
                                </div>
                            </div>
                        );
                    })}
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
        marginBottom: '10px',
        borderBottom: '3px solid #0055a5',
        paddingBottom: '10px',
        display: 'inline-block'
    },
    subtitle: {
        fontSize: '1.2em',
        color: '#666',
        marginBottom: '40px',
        fontStyle: 'italic'
    },
    gridContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(550px, 1fr))', // Tarjetas un poco más anchas
        gap: '30px',
    },
    card: {
        display: 'flex',
        backgroundColor: '#fff',
        borderRadius: '15px',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        border: '1px solid #e0e0e0',
        minHeight: '160px' 
    },
    iconColumn: {
        width: '130px', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        borderRight: '1px solid rgba(0,0,0,0.05)'
    },
    bigIcon: {
        fontSize: '3.5em',
        fontWeight: '900',
        lineHeight: '1',
        marginBottom: '10px'
    },
    statusText: {
        fontSize: '0.85em',
        fontWeight: '800',
        letterSpacing: '1px',
        textTransform: 'uppercase'
    },
    contentColumn: {
        flex: 1,
        padding: '25px 30px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
    },
    cardHeader: {
        marginBottom: '15px', // Más separación entre fecha y texto
    },
    date: {
        fontSize: '0.9em',
        color: '#888',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        fontFamily: "'Lato', sans-serif",
    },
    // --- ESTILO DEL TEXTO DE LA ANOTACIÓN ---
    text: {
        fontSize: '1.35em', // Letra más grande (Antes era 1.15em)
        color: '#2c3e50',   // Gris oscuro azulado para mejor contraste
        lineHeight: '1.5',
        margin: 0,
        fontWeight: '400',  // Peso normal
        fontFamily: "'Lato', sans-serif", // Aseguramos la fuente del cuerpo
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px',
        backgroundColor: '#fff',
        borderRadius: '15px',
        color: '#888'
    }
};

export default HojaDeVida;