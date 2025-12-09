// src/pages/GestionarCalificaciones.js

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const GestionarCalificaciones = () => {
    const [docente, setDocente] = useState(null);
    const [cursosDocente, setCursosDocente] = useState([]);
    const [alumnosCurso, setAlumnosCurso] = useState([]);
    const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
    
    const [cargando, setCargando] = useState(true); 
    const [errorMsg, setErrorMsg] = useState(null);

    // Estados para el Modal de Gestión de Notas
    const [showModal, setShowModal] = useState(false);
    const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
    const [notasAlumno, setNotasAlumno] = useState([]);
    const [nuevaNota, setNuevaNota] = useState('');
    const [notaEditando, setNotaEditando] = useState(null); // ID de la nota que se está editando

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

                const { data: horarioData, error: horarioError } = await supabase
                    .from('Horario')
                    .select('cursoId, Curso(nombre), asignaturaId, Asignatura(nombre)')
                    .eq('profesorId', profeData.id);

                if (horarioError) throw horarioError;

                if (!horarioData || horarioData.length === 0) {
                    setErrorMsg("No tienes cursos asignados en el horario actual.");
                }

                const cursosUnicos = [];
                const map = new Map();
                
                horarioData.forEach(item => {
                    const key = `${item.cursoId}-${item.asignaturaId}`;
                    if (!map.has(key)) {
                        map.set(key, true);
                        cursosUnicos.push({
                            id: item.cursoId, 
                            nombreCurso: item.Curso?.nombre,
                            asignatura: item.Asignatura?.nombre,
                            asignaturaId: item.asignaturaId 
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

    // --- CARGAR LISTA DE ALUMNOS (Vista Principal) ---
    const cargarAlumnos = async (curso) => {
        try {
            setCargando(true);
            const { data: estudiantes, error: errorEst } = await supabase
                .from('Estudiante')
                .select('id, user_uuid, nombre, apellido, foto')
                .eq('cursoId', curso.id)
                .order('apellido', { ascending: true });

            if (errorEst) throw errorEst;

            // Obtener promedios para la vista rápida
            const estudianteIds = estudiantes.map(e => e.user_uuid);
            const { data: notas } = await supabase
                .from('Calificacion')
                .select('estudiante_uuid, valor')
                .eq('asignaturaId', curso.asignaturaId)
                .in('estudiante_uuid', estudianteIds);

            const alumnosConPromedio = estudiantes.map(estudiante => {
                const misNotas = notas.filter(n => n.estudiante_uuid === estudiante.user_uuid);
                let promedio = "--";
                if (misNotas.length > 0) {
                    const suma = misNotas.reduce((acc, curr) => acc + curr.valor, 0);
                    promedio = (suma / misNotas.length).toFixed(1);
                }
                return { ...estudiante, promedio, cantidadNotas: misNotas.length };
            });
            
            setAlumnosCurso(alumnosConPromedio);
            setCursoSeleccionado(curso);

        } catch (error) {
            console.error("Error cargando alumnos:", error);
        } finally {
            setCargando(false);
        }
    };

    // --- ABRIR MODAL DE GESTIÓN ---
    const abrirGestionNotas = async (alumno) => {
        setAlumnoSeleccionado(alumno);
        // Cargar las notas específicas de este alumno en esta asignatura
        const { data } = await supabase
            .from('Calificacion')
            .select('*')
            .eq('estudiante_uuid', alumno.user_uuid)
            .eq('asignaturaId', cursoSeleccionado.asignaturaId)
            .order('fecha', { ascending: true });
        
        setNotasAlumno(data || []);
        setNuevaNota('');
        setNotaEditando(null);
        setShowModal(true);
    };

    // --- ACCIÓN 1: INGRESAR NOTA ---
    const handleIngresarNota = async () => {
        if (!nuevaNota || isNaN(nuevaNota) || nuevaNota < 1.0 || nuevaNota > 7.0) {
            alert("Ingrese una nota válida (1.0 - 7.0)");
            return;
        }

        try {
            const { error } = await supabase
                .from('Calificacion')
                .insert([{
                    estudiante_uuid: alumnoSeleccionado.user_uuid,
                    asignaturaId: cursoSeleccionado.asignaturaId,
                    valor: parseFloat(nuevaNota)
                }]);

            if (error) throw error;
            
            // Recargar notas del modal
            abrirGestionNotas(alumnoSeleccionado); 
            // Actualizar lista principal (para el promedio)
            cargarAlumnos(cursoSeleccionado); 

        } catch (error) {
            console.error("Error ingresando nota:", error);
            alert("Error al guardar.");
        }
    };

    // --- ACCIÓN 2: ACTUALIZAR NOTA ---
    const handleActualizarNota = async () => {
        if (!nuevaNota || isNaN(nuevaNota) || nuevaNota < 1.0 || nuevaNota > 7.0) return;

        try {
            const { error } = await supabase
                .from('Calificacion')
                .update({ valor: parseFloat(nuevaNota) })
                .eq('id', notaEditando);

            if (error) throw error;
            
            abrirGestionNotas(alumnoSeleccionado); 
            cargarAlumnos(cursoSeleccionado); 

        } catch (error) {
            alert("Error al actualizar.");
        }
    };

    // --- ACCIÓN 3: ELIMINAR NOTA ---
    const handleEliminarNota = async (notaId) => {
        if (!window.confirm("¿Estás seguro de eliminar esta nota?")) return;

        try {
            const { error } = await supabase
                .from('Calificacion')
                .delete()
                .eq('id', notaId);

            if (error) throw error;
            
            abrirGestionNotas(alumnoSeleccionado); 
            cargarAlumnos(cursoSeleccionado); 

        } catch (error) {
            alert("Error al eliminar.");
        }
    };

    if (cargando && !showModal) return <div style={{padding:'50px', textAlign:'center', fontFamily:"'Lato', sans-serif"}}>Cargando gestión...</div>;

    return (
        <div style={styles.container}>
            <h2 style={styles.pageTitle}>Gestionar Calificaciones</h2>
            
            {errorMsg && (
                <div style={styles.errorBox}><strong>Aviso:</strong> {errorMsg}</div>
            )}

            {/* SELECCIÓN DE CURSO */}
            {!cursoSeleccionado && cursosDocente.length > 0 && (
                <div style={styles.section}>
                    <p style={styles.instruction}>Seleccione un curso para gestionar:</p>
                    <div style={styles.gridCursos}>
                        {cursosDocente.map((curso, index) => (
                            <div key={index} style={styles.courseCard} onClick={() => cargarAlumnos(curso)}>
                                <h3 style={styles.courseName}>{curso.nombreCurso}</h3>
                                <p style={styles.courseSubject}>{curso.asignatura}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* LISTA DE ALUMNOS */}
            {cursoSeleccionado && (
                <div style={styles.section}>
                    <div style={styles.headerRow}>
                        <button onClick={() => setCursoSeleccionado(null)} style={styles.backButton}>← Volver</button>
                        <div style={{textAlign:'right'}}>
                            <h3 style={styles.subTitle}>{cursoSeleccionado.nombreCurso}</h3>
                            <span style={styles.subTitleSmall}>{cursoSeleccionado.asignatura}</span>
                        </div>
                    </div>

                    <div style={styles.tableCard}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Estudiante</th>
                                    <th style={styles.thCenter}>Notas</th>
                                    <th style={styles.thCenter}>Promedio</th>
                                    <th style={styles.thCenter}>Gestión</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alumnosCurso.map((alumno) => (
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
                                        <td style={styles.tdCenter}>{alumno.cantidadNotas}</td>
                                        <td style={styles.tdCenter}>
                                            <span style={{
                                                ...styles.gradeBadge,
                                                color: alumno.promedio !== '--' && parseFloat(alumno.promedio) < 4.0 ? '#dc3545' : '#0055a5',
                                                fontWeight: 'bold'
                                            }}>
                                                {alumno.promedio}
                                            </span>
                                        </td>
                                        <td style={styles.tdCenter}>
                                            <button style={styles.btnAction} onClick={() => abrirGestionNotas(alumno)}>
                                                Ver / Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- MODAL DE GESTIÓN DE NOTAS --- */}
            {showModal && alumnoSeleccionado && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3>Calificaciones: {alumnoSeleccionado.nombre} {alumnoSeleccionado.apellido}</h3>
                            <button onClick={() => setShowModal(false)} style={styles.closeButton}>✕</button>
                        </div>
                        
                        {/* LISTA DE NOTAS EXISTENTES */}
                        <div style={styles.notasGrid}>
                            {notasAlumno.map((nota, i) => (
                                <div key={nota.id} style={styles.notaItem}>
                                    <span style={styles.notaLabel}>Nota {i+1}</span>
                                    <span style={{...styles.notaValue, color: nota.valor < 4.0 ? 'red' : 'blue'}}>
                                        {nota.valor.toFixed(1)}
                                    </span>
                                    <div style={styles.notaActions}>
                                        <button 
                                            style={styles.actionBtnSmall} 
                                            onClick={() => { setNuevaNota(nota.valor); setNotaEditando(nota.id); }}
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            style={{...styles.actionBtnSmall, color:'red'}} 
                                            onClick={() => handleEliminarNota(nota.id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* FORMULARIO DE INGRESO/EDICIÓN */}
                        <div style={styles.inputArea}>
                            <h4 style={{marginTop:0}}>{notaEditando ? 'Editar Nota' : 'Ingresar Nueva Nota'}</h4>
                            <div style={{display:'flex', gap:'10px'}}>
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    min="1.0" 
                                    max="7.0"
                                    value={nuevaNota}
                                    onChange={(e) => setNuevaNota(e.target.value)}
                                    style={styles.inputNota}
                                    placeholder="Ej: 5.5"
                                />
                                {notaEditando ? (
                                    <>
                                        <button style={styles.btnSave} onClick={handleActualizarNota}>Guardar Cambios</button>
                                        <button style={styles.btnCancel} onClick={() => {setNotaEditando(null); setNuevaNota('');}}>Cancelar</button>
                                    </>
                                ) : (
                                    <button style={styles.btnAdd} onClick={handleIngresarNota}>+ Agregar</button>
                                )}
                            </div>
                        </div>

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
    gridCursos: { display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '25px' },
    courseCard: { backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '30px', minWidth: '240px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
    courseName: { margin: '0 0 10px 0', fontSize: '1.6em', color: '#003366', fontFamily: "'Playfair Display', serif", fontWeight: 'bold' },
    courseSubject: { margin: 0, color: '#007bff', fontWeight: '600', fontSize: '1.1em' },
    section: { animation: 'fadeIn 0.3s ease-in' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    subTitle: { fontFamily: "'Playfair Display', serif", fontSize: '1.8em', color: '#333', margin: 0 },
    subTitleSmall: { fontSize: '1.1em', color: '#007bff', fontWeight: '600' },
    backButton: { backgroundColor: 'transparent', border: '1px solid #003366', color: '#003366', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em', transition: 'all 0.2s' },
    tableCard: { backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 15px rgba(0,0,0,0.05)', border: '1px solid #e0e0e0' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { backgroundColor: '#0055a5', color: 'white', padding: '15px 20px', textAlign: 'left', fontFamily: "'Playfair Display', serif", fontSize: '1.1em', fontWeight: '600' },
    thCenter: { backgroundColor: '#0055a5', color: 'white', padding: '15px 20px', textAlign: 'center', fontFamily: "'Playfair Display', serif", fontSize: '1.1em', fontWeight: '600' },
    tr: { borderBottom: '1px solid #eee', backgroundColor: '#fff' },
    tdName: { padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: '600', color: '#333', fontSize: '1em' },
    tdCenter: { padding: '15px 20px', textAlign: 'center', verticalAlign: 'middle', fontSize: '1em' },
    avatar: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' },
    gradeBadge: { fontSize: '1.2em' },
    btnAction: { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9em', transition: 'background 0.2s' },
    
    // --- ESTILOS DEL MODAL ---
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '500px', maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' },
    closeButton: { background: 'none', border: 'none', fontSize: '1.5em', cursor: 'pointer', color: '#666' },
    notasGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginBottom: '30px' },
    notaItem: { backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e0e0e0' },
    notaLabel: { display: 'block', fontSize: '0.8em', color: '#666', marginBottom: '5px' },
    notaValue: { display: 'block', fontSize: '1.4em', fontWeight: 'bold' },
    notaActions: { marginTop: '5px', display: 'flex', justifyContent: 'center', gap: '10px' },
    actionBtnSmall: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1em', padding: '0' },
    inputArea: { backgroundColor: '#eef2f5', padding: '20px', borderRadius: '8px' },
    inputNota: { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: '80px', fontSize: '1.1em', textAlign: 'center' },
    btnAdd: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', flex: 1 },
    btnSave: { backgroundColor: '#ffc107', color: '#333', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', flex: 1 },
    btnCancel: { backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }
};

export default GestionarCalificaciones;