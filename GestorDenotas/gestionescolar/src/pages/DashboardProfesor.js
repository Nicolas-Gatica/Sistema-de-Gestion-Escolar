// src/pages/DashboardProfesor.js

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
// Importaciones para gráficos
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const DashboardProfesor = () => {
    const [profesor, setProfesor] = useState(null);
    const [stats, setStats] = useState({ cursosCount: 0, alumnosCount: 0 });
    
    // Estados para los DOS gráficos
    const [datosRendimiento, setDatosRendimiento] = useState(null);
    const [datosRiesgo, setDatosRiesgo] = useState(null); 
    
    const [loading, setLoading] = useState(true);
    
    // Porcentajes centrales
    const [porcentajeAprobacion, setPorcentajeAprobacion] = useState(0);
    const [alumnosEnRiesgo, setAlumnosEnRiesgo] = useState(0); 

    useEffect(() => {
        const fetchDatosProfesor = async () => {
            try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();
                
                // 1. Obtener datos del Profesor (Incluyendo foto)
                const { data: profeData, error: profeError } = await supabase
                    .from('Profesor')
                    .select('*')
                    .eq('user_uuid', user.id)
                    .single();

                if (profeError) throw profeError;
                setProfesor(profeData);

                // 2. Obtener Cursos y Asignaturas
                const { data: horarioData, error: horarioError } = await supabase
                    .from('Horario')
                    .select('cursoId, asignaturaId')
                    .eq('profesorId', profeData.id);

                if (horarioError) throw horarioError;
                
                const cursosUnicosIds = [...new Set(horarioData.map(c => c.cursoId))];
                const asignaturasIds = [...new Set(horarioData.map(c => c.asignaturaId))];

                // 3. Obtener Alumnos
                let totalAlumnos = 0;
                let estudiantes = [];

                if (cursosUnicosIds.length > 0) {
                    const { data: estData, error: estError } = await supabase
                        .from('Estudiante')
                        .select('id, user_uuid')
                        .in('cursoId', cursosUnicosIds);
                    
                    if (estError) throw estError;
                    estudiantes = estData;
                    totalAlumnos = estudiantes.length;
                }

                // SI HAY ALUMNOS, TRAEMOS TODA LA DATA PARA LOS CÁLCULOS
                if (totalAlumnos > 0) {
                    const uuids = estudiantes.map(e => e.user_uuid);

                    // A. Traer Notas
                    const { data: notas } = await supabase
                        .from('Calificacion')
                        .select('estudiante_uuid, valor')
                        .in('estudiante_uuid', uuids)
                        .in('asignaturaId', asignaturasIds); 

                    // B. Traer Asistencia
                    const { data: asistencias } = await supabase
                        .from('Asistencia')
                        .select('estudiante_uuid, estado')
                        .in('estudiante_uuid', uuids);

                    // C. Traer Conducta
                    const { data: observaciones } = await supabase
                        .from('Observacion')
                        .select('estudiante_uuid, estado')
                        .in('estudiante_uuid', uuids);

                    // --- CÁLCULO POR ALUMNO ---
                    let contAprobados = 0;
                    let contReprobados = 0;
                    
                    let riesgoBajo = 0;
                    let riesgoMedio = 0;
                    let riesgoAlto = 0;

                    estudiantes.forEach(est => {
                        const misNotas = notas.filter(n => n.estudiante_uuid === est.user_uuid);
                        const misAsis = asistencias.filter(a => a.estudiante_uuid === est.user_uuid);
                        const misObs = observaciones.filter(o => o.estudiante_uuid === est.user_uuid);

                        // 1. Promedio 
                        let promedio = 0;
                        if (misNotas.length > 0) {
                            const suma = misNotas.reduce((a, b) => a + b.valor, 0);
                            promedio = suma / misNotas.length;
                        }
                        if (promedio >= 4.0) contAprobados++;
                        else contReprobados++;

                        // 2. Riesgo
                        const notaPct = Math.min(100, (promedio / 7.0) * 100);
                        const totalDias = misAsis.length;
                        const presentes = misAsis.filter(a => a.estado === 'presente').length;
                        const asisPct = totalDias > 0 ? (presentes / totalDias) * 100 : 100;
                        const pos = misObs.filter(o => o.estado === 'positiva').length;
                        const neg = misObs.filter(o => o.estado === 'negativa').length;
                        const totalObs = pos + neg;
                        const condPct = totalObs > 0 ? (pos / totalObs) * 100 : 100;

                        let puntaje = (notaPct * 0.5) + (asisPct * 0.3) + (condPct * 0.2);
                        let probReprobar = 100 - puntaje;

                        if (promedio < 4.0) probReprobar += 25;
                        if (asisPct < 85) probReprobar += 15;
                        
                        probReprobar = Math.max(0, Math.min(100, probReprobar));

                        if (probReprobar > 70) riesgoAlto++;
                        else if (probReprobar > 40) riesgoMedio++;
                        else riesgoBajo++;
                    });

                    setStats({ cursosCount: cursosUnicosIds.length, alumnosCount: totalAlumnos });
                    setPorcentajeAprobacion(totalAlumnos > 0 ? ((contAprobados / totalAlumnos) * 100).toFixed(0) : 0);
                    setAlumnosEnRiesgo(riesgoAlto);

                    setDatosRendimiento({
                        labels: ['Aprobados', 'Reprobados'],
                        datasets: [{
                            data: [contAprobados, contReprobados],
                            backgroundColor: ['#5CB85C', '#D9534F'],
                            hoverBackgroundColor: ['#4CAF50', '#C62828'],
                            borderColor: 'white',
                            borderWidth: 2,
                        }],
                    });

                    setDatosRiesgo({
                        labels: ['Bajo', 'Medio', 'Alto'],
                        datasets: [{
                            data: [riesgoBajo, riesgoMedio, riesgoAlto],
                            backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
                            hoverBackgroundColor: ['#218838', '#e0a800', '#c82333'],
                            borderColor: 'white',
                            borderWidth: 2,
                        }],
                    });
                }

            } catch (error) {
                console.error("Error cargando dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDatosProfesor();
    }, []);

    if (loading) return <div style={{textAlign:'center', padding:'50px', fontFamily:"'Playfair Display', serif", fontSize:'1.5em'}}>Cargando panel docente...</div>;

    const chartOptions = {
        cutout: '70%',
        plugins: {
            legend: { position: 'bottom', labels: { font: { family: "'Lato', sans-serif", size: 12 }, usePointStyle: true } }
        }
    };

    const textCenterAprobacion = {
        id: 'textCenterAprobacion',
        beforeDatasetsDraw(chart) {
            const { ctx } = chart;
            ctx.save();
            const x = chart.getDatasetMeta(0).data[0].x;
            const y = chart.getDatasetMeta(0).data[0].y;
            ctx.font = 'bolder 2em "Playfair Display", serif';
            ctx.fillStyle = '#003366';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${porcentajeAprobacion}%`, x, y - 10);
            ctx.font = '0.8em "Lato", sans-serif';
            ctx.fillStyle = '#666';
            ctx.fillText('APROBACIÓN', x, y + 15);
        }
    };

    const textCenterRiesgo = {
        id: 'textCenterRiesgo',
        beforeDatasetsDraw(chart) {
            const { ctx } = chart;
            ctx.save();
            const x = chart.getDatasetMeta(0).data[0].x;
            const y = chart.getDatasetMeta(0).data[0].y;
            ctx.font = 'bolder 2em "Playfair Display", serif';
            ctx.fillStyle = '#dc3545';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${alumnosEnRiesgo}`, x, y - 10);
            ctx.font = '0.8em "Lato", sans-serif';
            ctx.fillStyle = '#666';
            ctx.fillText('CRÍTICOS', x, y + 15);
        }
    };

    return (
        <div style={styles.fullPageContainer}>
            {/* PANEL IZQUIERDO */}
            <div style={styles.leftPanel}>
                
                {/* --- CAMBIO: FOTO DE PERFIL --- */}
                <div style={styles.imageContainer}>
                    <img 
                        src={profesor?.foto || 'https://via.placeholder.com/150?text=Sin+Foto'} 
                        alt="Foto Profesor" 
                        style={styles.profileImage}
                        onError={(e) => { 
                            e.target.onerror = null; 
                            e.target.src = 'https://via.placeholder.com/150?text=Error'; 
                        }}
                    />
                </div>

                <div style={styles.profileInfo}>
                    <h2 style={styles.profesorName}>{profesor?.nombre} {profesor?.apellido}</h2>
                    <p style={styles.profesorRole}>Docente Titular</p>
                    <p style={styles.profesorEmail}>{profesor?.email}</p>
                </div>
            </div>

            {/* PANEL DERECHO */}
            <div style={styles.rightPanel}>
                <h3 style={styles.sectionTitle}>Resumen Académico</h3>
                
                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <span style={styles.statNumber}>{stats.cursosCount}</span>
                        <span style={styles.statLabel}>Cursos</span>
                    </div>
                    <div style={styles.statCard}>
                        <span style={styles.statNumber}>{stats.alumnosCount}</span>
                        <span style={styles.statLabel}>Alumnos</span>
                    </div>
                </div>

                <div style={styles.chartsRow}>
                    <div style={styles.chartCard}>
                        <h4 style={styles.chartTitle}>Rendimiento General</h4>
                        <div style={styles.chartWrapper}>
                            {datosRendimiento && (
                                <Doughnut 
                                    data={datosRendimiento} 
                                    options={chartOptions} 
                                    plugins={[textCenterAprobacion]} 
                                />
                            )}
                        </div>
                    </div>

                    <div style={styles.chartCard}>
                        <h4 style={styles.chartTitle}>Análisis de Riesgo</h4>
                        <div style={styles.chartWrapper}>
                            {datosRiesgo && (
                                <Doughnut 
                                    data={datosRiesgo} 
                                    options={chartOptions} 
                                    plugins={[textCenterRiesgo]} 
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    fullPageContainer: {
        display: 'flex',
        flexDirection: 'row', 
        width: '100%',
        minHeight: 'calc(100vh - 140px)', 
        backgroundColor: '#fff',
        fontFamily: "'Lato', sans-serif",
    },
    leftPanel: {
        flex: '0 0 30%', 
        background: 'linear-gradient(180deg, #003366 0%, #001f3f 100%)', 
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        boxShadow: '5px 0 15px rgba(0,0,0,0.1)', 
        zIndex: 2,
    },
    // Estilos nuevos para la imagen
    imageContainer: {
        marginBottom: '30px',
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        overflow: 'hidden',
        border: '4px solid rgba(255,255,255,0.3)',
        backgroundColor: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    },
    profileImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    profesorName: { fontFamily: "'Playfair Display', serif", fontSize: '2.2em', margin: '0 0 10px 0', fontWeight: '700', textAlign: 'center' },
    profesorRole: { fontSize: '1.2em', color: '#4facfe', fontWeight: 'bold', margin: 0, textAlign: 'center' },
    profesorEmail: { marginTop: '10px', color: '#ccc', fontSize: '0.9em', textAlign: 'center' },
    
    rightPanel: {
        flex: 1, 
        padding: '40px 50px',
        backgroundColor: '#f8f9fa', 
        overflowY: 'auto', 
    },
    sectionTitle: {
        fontFamily: "'Playfair Display', serif",
        fontSize: '2em', color: '#003366', marginBottom: '30px',
        borderBottom: '2px solid #e0e0e0', paddingBottom: '10px'
    },
    statsGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px', marginBottom: '40px'
    },
    statCard: {
        backgroundColor: 'white', padding: '20px', borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'center', borderLeft: '5px solid #0055a5'
    },
    statNumber: { display: 'block', fontSize: '2.5em', fontWeight: 'bold', color: '#003366', fontFamily: "'Playfair Display', serif" },
    statLabel: { color: '#666', fontSize: '1em', textTransform: 'uppercase', letterSpacing: '1px' },

    chartsRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '30px',
        justifyContent: 'center'
    },
    chartCard: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        border: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: '1 1 350px', 
        maxWidth: '450px'
    },
    chartTitle: {
        fontFamily: "'Playfair Display', serif",
        fontSize: '1.5em',
        color: '#003366',
        marginBottom: '20px'
    },
    chartWrapper: {
        width: '100%',
        height: '300px',
        display: 'flex',
        justifyContent: 'center'
    }
};

export default DashboardProfesor;