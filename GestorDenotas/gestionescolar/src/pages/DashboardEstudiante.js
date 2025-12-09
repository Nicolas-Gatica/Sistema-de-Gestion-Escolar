// src/pages/DashboardEstudiante.js

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const DashboardEstudiante = () => {
    const [perfil, setPerfil] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDatosPerfil = async () => {
            try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();
                
                if (!user) throw new Error("No hay usuario autenticado");

                // 1. Obtener Datos Personales + Curso
                // Nota: 'Curso ( nombre )' solo funciona si existe la Foreign Key en Supabase
                const { data: alumnoData, error: errorAlumno } = await supabase
                    .from('Estudiante')
                    .select(`
                        id,
                        user_uuid,
                        nombre,
                        apellido,
                        foto,
                        cursoId,
                        Curso ( nombre ) 
                    `)
                    .eq('user_uuid', user.id)
                    .single();

                if (errorAlumno) {
                    console.error("Error al cargar estudiante:", errorAlumno.message);
                    // Si falla la relación con Curso, intentamos traer solo al estudiante
                    // para que al menos se vea el nombre y la foto
                    if (!alumnoData) {
                         const { data: backupData } = await supabase
                            .from('Estudiante')
                            .select('*')
                            .eq('user_uuid', user.id)
                            .single();
                         setPerfil(backupData);
                    }
                } else {
                    setPerfil(alumnoData);
                }

                // 2. Obtener Notas
                const { data: notasData } = await supabase
                    .from('Calificacion')
                    .select('valor, Asignatura(nombre)')
                    .eq('estudiante_uuid', user.id);

                // 3. Obtener Asistencia
                const { data: asistenciaData } = await supabase
                    .from('Asistencia')
                    .select('estado')
                    .eq('estudiante_uuid', user.id);

                // 4. Obtener Observaciones
                const { data: obsData } = await supabase
                    .from('Observacion')
                    .select('estado')
                    .eq('estudiante_uuid', user.id);

                // --- CÁLCULOS DE ESTADÍSTICAS ---
                const asignaturasMap = {};
                let sumaTotalNotas = 0;
                
                if (notasData) {
                    notasData.forEach(n => {
                        const nombre = n.Asignatura?.nombre || 'Sin Asignatura';
                        if (!asignaturasMap[nombre]) asignaturasMap[nombre] = { suma: 0, count: 0 };
                        asignaturasMap[nombre].suma += n.valor;
                        asignaturasMap[nombre].count += 1;
                        sumaTotalNotas += n.valor;
                    });
                }

                const asignaturasStats = Object.keys(asignaturasMap).map(key => ({
                    nombre: key,
                    promedio: (asignaturasMap[key].suma / asignaturasMap[key].count).toFixed(1)
                }));

                const promedioGeneral = (notasData && notasData.length > 0) 
                    ? (sumaTotalNotas / notasData.length) 
                    : 0;
                
                const totalAsistencia = asistenciaData ? asistenciaData.length : 0;
                const presentes = asistenciaData ? asistenciaData.filter(a => a.estado === 'presente').length : 0;
                const porcentajeAsistencia = totalAsistencia > 0 ? Math.round((presentes / totalAsistencia) * 100) : 100;

                const positivas = obsData ? obsData.filter(o => o.estado === 'positiva').length : 0;
                const negativas = obsData ? obsData.filter(o => o.estado === 'negativa').length : 0;

                // Fórmula de Rendimiento
                let puntajeNotas = (promedioGeneral / 7.0) * 100; 
                let puntajeConducta = 100 - (negativas * 5); 
                if (puntajeConducta < 0) puntajeConducta = 0;

                const rendimientoGlobal = Math.round(
                    (puntajeNotas * 0.6) + 
                    (porcentajeAsistencia * 0.3) + 
                    (puntajeConducta * 0.1)
                );

                setStats({
                    asignaturas: asignaturasStats,
                    asistencia: porcentajeAsistencia,
                    positivas,
                    negativas,
                    promedioGeneral: promedioGeneral.toFixed(1),
                    rendimientoGlobal
                });

            } catch (error) {
                console.error("Error general:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDatosPerfil();
    }, []);

    if (loading) return <div style={{textAlign:'center', padding:'50px', fontFamily:"'Playfair Display', serif", fontSize:'1.5em'}}>Cargando tu ficha...</div>;

    if (!stats) return <div style={{textAlign:'center', padding:'50px'}}>No se encontraron datos académicos.</div>;

    return (
        <div style={styles.fullPageContainer}>
            {/* --- SECCIÓN IZQUIERDA (PERFIL) --- */}
            <div style={styles.leftPanel}>
                <div style={styles.scoreCircle}>
                    <div style={styles.scoreTextContainer}>
                        <span style={styles.scoreNumber}>{stats.rendimientoGlobal}</span>
                        <span style={styles.scoreTotal}>/100</span>
                    </div>
                    <span style={styles.scoreLabel}>PUNTAJE</span>
                </div>

                <div style={styles.imageContainer}>
                    {/* FOTO CON PROTECCIÓN DE ERROR */}
                    <img 
                        src={perfil?.foto ? perfil.foto : 'https://via.placeholder.com/300?text=Sin+Foto'} 
                        alt="Estudiante" 
                        style={styles.profileImage}
                        onError={(e) => { 
                            e.target.onerror = null; 
                            e.target.src = 'https://via.placeholder.com/300?text=Error+Foto'; 
                        }}
                    />
                </div>

                <div style={styles.profileInfo}>
                    {/* NOMBRE Y APELLIDO SEGUROS */}
                    <h2 style={styles.studentName}>
                        {perfil?.nombre || 'Estudiante'} {perfil?.apellido || ''}
                    </h2>
                    {/* NOMBRE DEL CURSO SEGURO */}
                    <p style={styles.studentCourse}>
                        {perfil?.Curso?.nombre || 'Sin Curso Asignado'}
                    </p>
                </div>
            </div>

            {/* --- SECCIÓN DERECHA (RESUMEN) --- */}
            <div style={styles.rightPanel}>
                
                <div style={styles.statsBlock}>
                    <h3 style={styles.sectionTitle}>Resumen Año Académico</h3>
                    <div style={styles.summaryGrid}>
                        <div style={styles.summaryItem}>
                            <span style={styles.summaryLabel}>Promedio General</span>
                            <span style={styles.summaryValueBig}>{stats.promedioGeneral}</span>
                        </div>
                        <div style={styles.summaryItem}>
                            <span style={styles.summaryLabel}>Asistencia</span>
                            <span style={{...styles.summaryValueBig, color: stats.asistencia < 85 ? '#dc3545' : '#28a745'}}>
                                {stats.asistencia}%
                            </span>
                        </div>
                        <div style={styles.summaryItem}>
                            <span style={styles.summaryLabel}>Conducta (+ / -)</span>
                            <span style={styles.summaryValueBig}>
                                <span style={{color:'#28a745'}}>{stats.positivas}</span> / 
                                <span style={{color:'#dc3545'}}> {stats.negativas}</span>
                            </span>
                        </div>
                    </div>
                </div>

                <div style={styles.statsBlockSecondary}>
                    <h3 style={styles.sectionTitle}>Rendimiento por Asignatura</h3>
                    <div style={styles.subjectGrid}>
                        {stats.asignaturas.length > 0 ? (
                            stats.asignaturas.map((asig, i) => (
                                <div key={i} style={styles.subjectCard}>
                                    <span style={styles.subjectName}>{asig.nombre}</span>
                                    <span style={{
                                        ...styles.subjectScore,
                                        color: asig.promedio < 4.0 ? '#dc3545' : '#003366'
                                    }}>
                                        {asig.promedio}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p style={{textAlign:'center', width:'100%', color:'#888'}}>No hay asignaturas registradas.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

// --- ESTILOS ---
const styles = {
    fullPageContainer: { display: 'flex', flexDirection: 'row', width: '100%', minHeight: 'calc(100vh - 140px)', backgroundColor: '#fff', fontFamily: "'Lato', sans-serif" },
    leftPanel: { flex: '0 0 35%', background: 'linear-gradient(180deg, #003366 0%, #001f3f 100%)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', boxShadow: '5px 0 15px rgba(0,0,0,0.1)', zIndex: 2 },
    scoreCircle: { border: '4px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '180px', height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginBottom: '40px', backgroundColor: 'rgba(255,255,255,0.05)' },
    scoreTextContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '5px' },
    scoreNumber: { fontFamily: "'Playfair Display', serif", fontSize: '2.5em', fontWeight: '700', color: '#ffffff' },
    scoreTotal: { fontFamily: "'Playfair Display', serif", fontSize: '2.5em', fontWeight: '400', color: 'rgba(255,255,255,0.7)', marginLeft: '5px' },
    scoreLabel: { fontSize: '0.9em', letterSpacing: '2px', opacity: 0.8, marginTop: '15px', fontWeight: 'bold' },
    imageContainer: { marginBottom: '30px' },
    profileImage: { width: '220px', height: '220px', borderRadius: '50%', objectFit: 'cover', border: '6px solid #ffffff', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' },
    profileInfo: { textAlign: 'center' },
    studentName: { fontFamily: "'Playfair Display', serif", fontSize: '2.5em', margin: '0 0 10px 0', fontWeight: '700', lineHeight: '1.1' },
    studentCourse: { fontSize: '1.8em', fontWeight: '700', color: '#4facfe', margin: 0, letterSpacing: '1px' },
    rightPanel: { flex: 1, padding: '50px', backgroundColor: '#f8f9fa', display: 'flex', flexDirection: 'column', gap: '40px', overflowY: 'auto' },
    statsBlock: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderLeft: '6px solid #003366' },
    statsBlockSecondary: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderLeft: '6px solid #4facfe', flex: 1 },
    sectionTitle: { fontFamily: "'Playfair Display', serif", fontSize: '2em', color: '#333', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '15px', textAlign: 'center' },
    summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', textAlign: 'center' },
    summaryItem: { display: 'flex', flexDirection: 'column' },
    summaryLabel: { color: '#666', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' },
    summaryValueBig: { fontFamily: "'Playfair Display', serif", fontSize: '3em', fontWeight: '700', color: '#003366' },
    subjectGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    subjectCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: '#fcfcfc', border: '1px solid #eee', borderRadius: '8px', transition: 'transform 0.2s' },
    subjectName: { fontSize: '1em', color: '#444', fontWeight: '500' },
    subjectScore: { fontFamily: "'Playfair Display', serif", fontSize: '1.5em', fontWeight: '700' }
};

export default DashboardEstudiante;