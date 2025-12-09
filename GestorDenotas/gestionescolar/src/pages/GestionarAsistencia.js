// src/pages/GestionarAsistencia.js

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const GestionarAsistencia = () => {
    const [docente, setDocente] = useState(null);
    const [cursosDocente, setCursosDocente] = useState([]);
    const [alumnosCurso, setAlumnosCurso] = useState([]);
    const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
    
    // Estado para la fecha de la asistencia (Por defecto HOY)
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    
    // Mapa de asistencia: { 'uuid_alumno': 'presente' | 'ausente' }
    const [asistenciaMap, setAsistenciaMap] = useState({});
    
    const [cargando, setCargando] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [guardando, setGuardando] = useState(false);

    // 1. Cargar Cursos del Profesor (Igual que en Calificaciones)
    useEffect(() => {
        const fetchDatosDocente = async () => {
            try {
                setCargando(true);
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("No hay usuario autenticado.");

                const { data: profeData, error: profeError } = await supabase
                    .from('Profesor')
                    .select('id, nombre, apellido')
                    .eq('user_uuid', user.id)
                    .single();

                if (profeError) throw new Error("Perfil de profesor no encontrado.");
                setDocente(profeData);

                // Buscar cursos donde el profesor dicta clases
                const { data: horarioData, error: horarioError } = await supabase
                    .from('Horario')
                    .select('cursoId, Curso(nombre)')
                    .eq('profesorId', profeData.id);

                if (horarioError) throw horarioError;

                // Filtrar cursos únicos
                const cursosUnicos = [];
                const map = new Map();
                
                horarioData.forEach(item => {
                    if (!map.has(item.cursoId)) {
                        map.set(item.cursoId, true);
                        cursosUnicos.push({
                            id: item.cursoId,
                            nombreCurso: item.Curso?.nombre || "Curso Sin Nombre",
                        });
                    }
                });

                setCursosDocente(cursosUnicos);

            } catch (error) {
                console.error("Error:", error);
                setErrorMsg(error.message);
            } finally {
                setCargando(false);
            }
        };

        fetchDatosDocente();
    }, []);

    // 2. Cargar Alumnos y Estado de Asistencia para la fecha seleccionada
    useEffect(() => {
        if (cursoSeleccionado && fecha) {
            cargarAlumnosYAsistencia();
        }
    }, [cursoSeleccionado, fecha]);

    const cargarAlumnosYAsistencia = async () => {
        try {
            setCargando(true);
            
            // A. Obtener Alumnos
            const { data: estudiantes, error: errorEst } = await supabase
                .from('Estudiante')
                .select('id, user_uuid, nombre, apellido, foto')
                .eq('cursoId', cursoSeleccionado.id)
                .order('apellido', { ascending: true });

            if (errorEst) throw errorEst;

            // B. Obtener Asistencia existente para esa fecha
            const { data: asistenciaExistente, error: errorAsis } = await supabase
                .from('Asistencia')
                .select('estudiante_uuid, estado')
                .eq('fecha', fecha)
                .in('estudiante_uuid', estudiantes.map(e => e.user_uuid));

            if (errorAsis) throw errorAsis;

            // C. Construir mapa inicial (Si ya existe, cargarla. Si no, por defecto 'presente')
            const mapaInicial = {};
            estudiantes.forEach(est => {
                const registro = asistenciaExistente.find(a => a.estudiante_uuid === est.user_uuid);
                mapaInicial[est.user_uuid] = registro ? registro.estado : 'presente';
            });

            setAsistenciaMap(mapaInicial);
            setAlumnosCurso(estudiantes);

        } catch (error) {
            console.error("Error cargando asistencia:", error);
        } finally {
            setCargando(false);
        }
    };

    // Función para cambiar el estado localmente (Click en el botón)
    const toggleAsistencia = (uuid, estado) => {
        setAsistenciaMap(prev => ({
            ...prev,
            [uuid]: estado
        }));
    };

    // Función para GUARDAR en la Base de Datos
    const handleGuardarAsistencia = async () => {
        setGuardando(true);
        try {
            const estudiantesIds = alumnosCurso.map(e => e.user_uuid);

            // 1. Borrar registros previos de ese día para evitar duplicados
            // (Es una forma segura de hacer "upsert" sin configurar claves únicas en SQL)
            await supabase
                .from('Asistencia')
                .delete()
                .eq('fecha', fecha)
                .in('estudiante_uuid', estudiantesIds);

            // 2. Preparar los nuevos registros
            const nuevosRegistros = alumnosCurso.map(est => ({
                estudiante_uuid: est.user_uuid,
                fecha: fecha,
                estado: asistenciaMap[est.user_uuid]
            }));

            // 3. Insertar
            const { error } = await supabase
                .from('Asistencia')
                .insert(nuevosRegistros);

            if (error) throw error;

            alert("¡Asistencia guardada correctamente!");

        } catch (error) {
            console.error("Error guardando:", error);
            alert("Error al guardar la asistencia.");
        } finally {
            setGuardando(false);
        }
    };

    if (cargando && !cursoSeleccionado) return <div style={{padding:'50px', textAlign:'center'}}>Cargando...</div>;

    return (
        <div style={styles.container}>
            <h2 style={styles.pageTitle}>Gestionar Asistencia</h2>
            
            {errorMsg && <div style={styles.errorBox}><strong>Aviso:</strong> {errorMsg}</div>}

            {/* VISTA 1: SELECCIÓN DE CURSO */}
            {!cursoSeleccionado && (
                <div style={styles.section}>
                    <p style={styles.instruction}>Seleccione un curso para tomar lista:</p>
                    <div style={styles.gridCursos}>
                        {cursosDocente.map((curso, index) => (
                            <div 
                                key={index} 
                                style={styles.courseCard}
                                onClick={() => setCursoSeleccionado(curso)}
                            >
                                <h3 style={styles.courseName}>{curso.nombreCurso}</h3>
                                <p style={styles.courseSubject}>Listado General</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VISTA 2: TOMAR LISTA */}
            {cursoSeleccionado && (
                <div style={styles.section}>
                    {/* Cabecera de Gestión */}
                    <div style={styles.headerRow}>
                        <button onClick={() => setCursoSeleccionado(null)} style={styles.backButton}>
                            ← Volver
                        </button>
                        
                        <div style={styles.dateContainer}>
                            <label style={{marginRight:'10px', fontWeight:'bold'}}>Fecha:</label>
                            <input 
                                type="date" 
                                value={fecha} 
                                onChange={(e) => setFecha(e.target.value)}
                                style={styles.dateInput}
                            />
                        </div>

                        <div style={{textAlign:'right'}}>
                            <h3 style={styles.subTitle}>{cursoSeleccionado.nombreCurso}</h3>
                        </div>
                    </div>

                    {/* Tabla de Alumnos */}
                    <div style={styles.tableCard}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Estudiante</th>
                                    <th style={styles.thCenter}>Estado</th>
                                    <th style={styles.thCenter}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alumnosCurso.map((alumno) => {
                                    const estadoActual = asistenciaMap[alumno.user_uuid];
                                    return (
                                        <tr key={alumno.id} style={styles.tr}>
                                            <td style={styles.tdName}>
                                                <img 
                                                    src={alumno.foto || 'https://via.placeholder.com/40'} 
                                                    alt="foto" 
                                                    style={styles.avatar}
                                                    onError={(e) => e.target.src = 'https://via.placeholder.com/40'}
                                                />
                                                <span>{alumno.nombre} {alumno.apellido}</span>
                                            </td>
                                            
                                            <td style={styles.tdCenter}>
                                                <span style={{
                                                    ...styles.statusBadge,
                                                    backgroundColor: estadoActual === 'presente' ? '#e8f5e9' : '#ffebee',
                                                    color: estadoActual === 'presente' ? '#2e7d32' : '#c62828'
                                                }}>
                                                    {estadoActual === 'presente' ? 'PRESENTE' : 'AUSENTE'}
                                                </span>
                                            </td>

                                            <td style={styles.tdCenter}>
                                                <div style={styles.toggleContainer}>
                                                    <button 
                                                        style={estadoActual === 'presente' ? styles.btnActive : styles.btnInactive}
                                                        onClick={() => toggleAsistencia(alumno.user_uuid, 'presente')}
                                                    >
                                                        ✓
                                                    </button>
                                                    <button 
                                                        style={estadoActual === 'ausente' ? styles.btnActiveRed : styles.btnInactive}
                                                        onClick={() => toggleAsistencia(alumno.user_uuid, 'ausente')}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Botón de Guardar */}
                    <div style={styles.footerAction}>
                        <button 
                            onClick={handleGuardarAsistencia} 
                            style={styles.saveButton}
                            disabled={guardando}
                        >
                            {guardando ? 'Guardando...' : '💾 Guardar Asistencia'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: "'Lato', sans-serif" },
    pageTitle: { fontFamily: "'Playfair Display', serif", fontSize: '3em', color: '#003366', textAlign: 'center', marginBottom: '40px' },
    instruction: { textAlign: 'center', fontSize: '1.2em', color: '#666', marginBottom: '20px' },
    errorBox: { backgroundColor: '#ffebee', color: '#c62828', padding: '15px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px' },
    
    // Grid Cursos
    gridCursos: { display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '25px' },
    courseCard: { backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '30px', minWidth: '240px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
    courseName: { margin: '0 0 10px 0', fontSize: '1.6em', color: '#003366', fontFamily: "'Playfair Display', serif", fontWeight: 'bold' },
    courseSubject: { margin: 0, color: '#007bff', fontWeight: '600', fontSize: '1.1em' },

    // Sección Lista
    section: { animation: 'fadeIn 0.3s ease-in' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    subTitle: { fontFamily: "'Playfair Display', serif", fontSize: '1.8em', color: '#333', margin: 0 },
    backButton: { backgroundColor: 'transparent', border: '1px solid #003366', color: '#003366', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em' },
    
    dateContainer: { display: 'flex', alignItems: 'center' },
    dateInput: { padding: '8px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '1em', fontFamily: 'inherit' },

    // Tabla
    tableCard: { backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 15px rgba(0,0,0,0.05)', border: '1px solid #e0e0e0' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { backgroundColor: '#0055a5', color: 'white', padding: '15px 20px', textAlign: 'left', fontFamily: "'Playfair Display', serif", fontSize: '1.1em', fontWeight: '600' },
    thCenter: { backgroundColor: '#0055a5', color: 'white', padding: '15px 20px', textAlign: 'center', fontFamily: "'Playfair Display', serif", fontSize: '1.1em', fontWeight: '600' },
    tr: { borderBottom: '1px solid #eee', backgroundColor: '#fff' },
    tdName: { padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: '600', color: '#333', fontSize: '1em' },
    tdCenter: { padding: '15px 20px', textAlign: 'center', verticalAlign: 'middle', fontSize: '1em' },
    avatar: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' },
    
    statusBadge: { padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9em', display: 'inline-block', minWidth: '80px' },
    
    // Botones de Acción
    toggleContainer: { display: 'flex', justifyContent: 'center', gap: '10px' },
    btnActive: { backgroundColor: '#28a745', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2em' },
    btnActiveRed: { backgroundColor: '#dc3545', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2em' },
    btnInactive: { backgroundColor: '#f0f0f0', color: '#ccc', border: '1px solid #ddd', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2em' },

    footerAction: { marginTop: '30px', textAlign: 'right' },
    saveButton: { backgroundColor: '#003366', color: 'white', padding: '15px 40px', border: 'none', borderRadius: '30px', fontSize: '1.2em', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }
};

export default GestionarAsistencia;