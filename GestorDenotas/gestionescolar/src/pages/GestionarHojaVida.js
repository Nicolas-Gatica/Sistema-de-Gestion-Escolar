// src/pages/GestionarHojaVida.js

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const GestionarHojaVida = () => {
    const [docente, setDocente] = useState(null);
    const [cursosDocente, setCursosDocente] = useState([]);
    const [alumnosCurso, setAlumnosCurso] = useState([]);
    const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
    
    const [cargando, setCargando] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    // Estados del Modal
    const [showModal, setShowModal] = useState(false);
    const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
    const [observaciones, setObservaciones] = useState([]);
    
    // Formulario
    const [nuevoTexto, setNuevoTexto] = useState('');
    const [nuevoTipo, setNuevoTipo] = useState('positiva'); 
    const [nuevaFecha, setNuevaFecha] = useState(new Date().toISOString().split('T')[0]);

    // 1. Cargar Datos Docente
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

                if (profeError) throw new Error("Perfil no encontrado.");
                setDocente(profeData);

                const { data: horarioData, error: horarioError } = await supabase
                    .from('Horario')
                    .select('cursoId, Curso(nombre)')
                    .eq('profesorId', profeData.id);

                if (horarioError) throw horarioError;

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

    // 2. Cargar Alumnos
    const cargarAlumnos = async (curso) => {
        try {
            setCargando(true);
            const { data: estudiantes, error } = await supabase
                .from('Estudiante')
                .select('id, user_uuid, nombre, apellido, foto')
                .eq('cursoId', curso.id)
                .order('apellido', { ascending: true });

            if (error) throw error;
            setAlumnosCurso(estudiantes);
            setCursoSeleccionado(curso);
        } catch (error) {
            console.error("Error cargando alumnos:", error);
        } finally {
            setCargando(false);
        }
    };

    // 3. Cargar Historial (Función Reutilizable)
    const cargarHistorial = async (uuidAlumno) => {
        try {
            const { data, error } = await supabase
                .from('Observacion')
                .select('*')
                .eq('estudiante_uuid', uuidAlumno)
                .order('fecha', { ascending: false }); 
            
            if (error) throw error;
            setObservaciones(data || []);
        } catch (error) {
            console.error("Error cargando historial:", error);
        }
    };

    // 4. Abrir Modal
    const abrirGestion = (alumno) => {
        setAlumnoSeleccionado(alumno);
        cargarHistorial(alumno.user_uuid); // Cargar datos frescos
        
        // Resetear form
        setNuevoTexto('');
        setNuevoTipo('positiva');
        setNuevaFecha(new Date().toISOString().split('T')[0]);
        setShowModal(true);
    };

    // 5. Guardar
    const handleGuardar = async () => {
        if (!nuevoTexto.trim()) return alert("Escribe el detalle.");
        if (!docente?.id) return alert("Error: No se identificó al profesor.");

        try {
            const { error } = await supabase
                .from('Observacion')
                .insert([{
                    estudiante_uuid: alumnoSeleccionado.user_uuid,
                    profesorId: docente.id, // Ahora sí existe la columna
                    texto: nuevoTexto,
                    estado: nuevoTipo,
                    fecha: nuevaFecha
                }]);

            if (error) throw error;

            // RECARGAR LA LISTA INMEDIATAMENTE
            await cargarHistorial(alumnoSeleccionado.user_uuid);
            
            // Limpiar campo de texto para la siguiente
            setNuevoTexto('');

        } catch (error) {
            console.error("Error guardando:", error);
            alert("Error al guardar. Verifique la consola.");
        }
    };

    // 6. Eliminar
    const handleEliminar = async (id) => {
        if(!window.confirm("¿Borrar esta anotación?")) return;
        try {
            const { error } = await supabase.from('Observacion').delete().eq('id', id);
            if (error) throw error;
            
            // RECARGAR LA LISTA
            await cargarHistorial(alumnoSeleccionado.user_uuid);
        } catch (e) { 
            console.error(e); 
            alert("No se pudo eliminar.");
        }
    };

    if (cargando && !showModal) return <div style={{padding:'50px', textAlign:'center', fontFamily:"'Lato', sans-serif"}}>Cargando gestión...</div>;

    return (
        <div style={styles.container}>
            <h2 style={styles.pageTitle}>Gestionar Hoja de Vida</h2>
            
            {errorMsg && <div style={styles.errorBox}><strong>Aviso:</strong> {errorMsg}</div>}

            {!cursoSeleccionado && (
                <div style={styles.section}>
                    <p style={styles.instruction}>Seleccione un curso para gestionar conducta:</p>
                    <div style={styles.gridCursos}>
                        {cursosDocente.map((curso, index) => (
                            <div key={index} style={styles.courseCard} onClick={() => cargarAlumnos(curso)}>
                                <h3 style={styles.courseName}>{curso.nombreCurso}</h3>
                                <p style={styles.courseSubject}>Hoja de Vida</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {cursoSeleccionado && (
                <div style={styles.section}>
                    <div style={styles.headerRow}>
                        <button onClick={() => setCursoSeleccionado(null)} style={styles.backButton}>← Volver</button>
                        <h3 style={styles.subTitle}>{cursoSeleccionado.nombreCurso}</h3>
                    </div>

                    <div style={styles.tableCard}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Estudiante</th>
                                    <th style={styles.thCenter}>Acción</th>
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
                                        <td style={styles.tdCenter}>
                                            <button style={styles.btnAction} onClick={() => abrirGestion(alumno)}>
                                                Ver / Anotar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL */}
            {showModal && alumnoSeleccionado && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3>Hoja de Vida: {alumnoSeleccionado.nombre} {alumnoSeleccionado.apellido}</h3>
                            <button onClick={() => setShowModal(false)} style={styles.closeButton}>✕</button>
                        </div>

                        <div style={styles.inputArea}>
                            <h4 style={{marginTop:0, marginBottom:'15px', color:'#003366'}}>Nueva Anotación</h4>
                            
                            <div style={{marginBottom: '15px'}}>
                                <label style={{display:'block', marginBottom:'5px', fontWeight:'bold', color:'#666'}}>Fecha:</label>
                                <input 
                                    type="date" 
                                    value={nuevaFecha}
                                    onChange={(e) => setNuevaFecha(e.target.value)}
                                    style={styles.dateInput}
                                />
                            </div>

                            <div style={styles.typeSelector}>
                                <button 
                                    style={nuevoTipo === 'positiva' ? styles.typeBtnPositiveActive : styles.typeBtn}
                                    onClick={() => setNuevoTipo('positiva')}
                                >
                                    ✓ POSITIVA
                                </button>
                                <button 
                                    style={nuevoTipo === 'negativa' ? styles.typeBtnNegativeActive : styles.typeBtn}
                                    onClick={() => setNuevoTipo('negativa')}
                                >
                                    ✕ NEGATIVA
                                </button>
                            </div>

                            <textarea 
                                rows="3"
                                placeholder="Describa el comportamiento o situación..."
                                value={nuevoTexto}
                                onChange={(e) => setNuevoTexto(e.target.value)}
                                style={styles.textArea}
                            />
                            
                            <button style={styles.btnSave} onClick={handleGuardar}>Guardar Anotación</button>
                        </div>
                        
                        <h4 style={{margin:'20px 0 10px', color:'#003366'}}>Historial</h4>
                        <div style={styles.historyList}>
                            {observaciones.length === 0 ? (
                                <p style={{color:'#999', fontStyle:'italic', textAlign:'center'}}>Sin anotaciones registradas.</p>
                            ) : (
                                observaciones.map((obs) => (
                                    <div key={obs.id} style={styles.obsItem}>
                                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                                            <span style={obs.estado === 'positiva' ? styles.tagPositive : styles.tagNegative}>
                                                {obs.estado.toUpperCase()}
                                            </span>
                                            <span style={styles.date}>
                                                {new Date(obs.fecha).toLocaleDateString('es-CL')}
                                            </span>
                                        </div>
                                        <p style={styles.obsText}>{obs.texto}</p>
                                        <div style={{textAlign:'right', marginTop:'5px'}}>
                                            <button onClick={() => handleEliminar(obs.id)} style={styles.btnDelete}>Eliminar</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

// (Estilos se mantienen igual, asegurando consistencia)
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
    backButton: { backgroundColor: 'transparent', border: '1px solid #003366', color: '#003366', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em', transition: 'all 0.2s' },
    tableCard: { backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 15px rgba(0,0,0,0.05)', border: '1px solid #e0e0e0' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { backgroundColor: '#0055a5', color: 'white', padding: '15px 20px', textAlign: 'left', fontFamily: "'Playfair Display', serif", fontSize: '1.1em', fontWeight: '600' },
    thCenter: { backgroundColor: '#0055a5', color: 'white', padding: '15px 20px', textAlign: 'center', fontFamily: "'Playfair Display', serif", fontSize: '1.1em', fontWeight: '600' },
    tr: { borderBottom: '1px solid #eee', backgroundColor: '#fff' },
    tdName: { padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: '600', color: '#333', fontSize: '1em' },
    tdCenter: { padding: '15px 20px', textAlign: 'center', verticalAlign: 'middle', fontSize: '1em' },
    avatar: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' },
    btnAction: { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9em', transition: 'background 0.2s' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '600px', maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' },
    closeButton: { background: 'none', border: 'none', fontSize: '1.5em', cursor: 'pointer', color: '#666' },
    inputArea: { backgroundColor: '#f0f4f8', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0' },
    dateInput: { padding: '8px', borderRadius: '5px', border: '1px solid #ccc', width: '100%', boxSizing:'border-box' },
    typeSelector: { display: 'flex', gap: '10px', marginBottom: '15px' },
    typeBtn: { flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '5px', background: 'white', cursor: 'pointer', fontWeight: 'bold', color: '#666' },
    typeBtnPositiveActive: { flex: 1, padding: '10px', border: '1px solid #28a745', borderRadius: '5px', background: '#e8f5e9', color: '#28a745', fontWeight: 'bold', cursor: 'pointer' },
    typeBtnNegativeActive: { flex: 1, padding: '10px', border: '1px solid #dc3545', borderRadius: '5px', background: '#ffebee', color: '#dc3545', fontWeight: 'bold', cursor: 'pointer' },
    textArea: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', marginBottom: '15px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
    btnSave: { width: '100%', backgroundColor: '#003366', color: 'white', padding: '12px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    historyList: { display: 'flex', flexDirection: 'column', gap: '10px' },
    obsItem: { border: '1px solid #eee', borderRadius: '8px', padding: '15px', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' },
    tagPositive: { color: '#28a745', fontWeight: 'bold', fontSize: '0.85em', backgroundColor: '#e8f5e9', padding: '2px 8px', borderRadius: '4px' },
    tagNegative: { color: '#dc3545', fontWeight: 'bold', fontSize: '0.85em', backgroundColor: '#ffebee', padding: '2px 8px', borderRadius: '4px' },
    date: { color: '#999', fontSize: '0.85em', fontStyle: 'italic' },
    obsText: { margin: '5px 0', fontSize: '1.1em', color: '#333' },
    btnDelete: { background: 'none', border: 'none', color: '#dc3545', fontSize: '0.85em', cursor: 'pointer', textDecoration: 'underline' }
};

export default GestionarHojaVida;