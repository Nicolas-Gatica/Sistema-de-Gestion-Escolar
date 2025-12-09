// src/pages/GestionUsuarios.js

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const GestionUsuarios = () => {
    const [activeTab, setActiveTab] = useState('profesores'); 
    const [profesores, setProfesores] = useState([]);
    const [estudiantes, setEstudiantes] = useState([]);
    const [cursos, setCursos] = useState([]); 
    const [asignaturas, setAsignaturas] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Estado para saber si estamos editando (tiene ID) o creando (null)
    const [editingId, setEditingId] = useState(null);

    // Estados del Formulario (Unificado)
    const [formData, setFormData] = useState({
        nombre: '', 
        apellido: '', 
        email: '', 
        password: '', 
        edad: '', 
        sexo: '',
        jefaturaCursoId: '', // Exclusivo Profe
        cursoEstudianteId: '' // Exclusivo Estudiante
    });
    
    // Estados para Horario (Solo Profe)
    const [clasesParaAgregar, setClasesParaAgregar] = useState([]); 
    const [nuevaClase, setNuevaClase] = useState({
        cursoId: '', asignaturaId: '', diaSemana: '1', horaInicio: '08:30', horaFin: '10:00'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Cargar Profesores
            const { data: dataProf } = await supabase
                .from('Profesor')
                .select(`*, Curso!jefeId ( id, nombre ), Horario ( id, diaSemana, horaInicio, horaFin, cursoId, asignaturaId, Curso(nombre), Asignatura(nombre) )`)
                .order('apellido', { ascending: true });

            if (dataProf) {
                const procesados = dataProf.map(p => ({
                    ...p,
                    // Formateamos para la tabla
                    asignaturasStr: [...new Set(p.Horario.map(h => h.Asignatura?.nombre).filter(Boolean))].join(', ') || '🚫 Sin asignaturas',
                    jefaturaStr: p.Curso?.nombre || '—',
                    // Guardamos el ID de la jefatura para el modo edición
                    jefaturaId: p.Curso?.id || ''
                }));
                setProfesores(procesados);
            }

            // 2. Cargar Estudiantes
            const { data: dataEst } = await supabase
                .from('Estudiante')
                .select(`*, Curso ( id, nombre )`)
                .order('apellido', { ascending: true });
            
            if (dataEst) setEstudiantes(dataEst);

            // 3. Listas Auxiliares
            const { data: cur } = await supabase.from('Curso').select('*').order('nombre');
            if (cur) setCursos(cur);
            const { data: asig } = await supabase.from('Asignatura').select('*').order('nombre');
            if (asig) setAsignaturas(asig);

        } catch (error) {
            console.error("Error cargando datos:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- ABRIR MODAL EN MODO CREAR ---
    const openCreateModal = () => {
        setEditingId(null); // Null significa "Crear Nuevo"
        setFormData({ 
            nombre: '', apellido: '', email: '', password: '', edad: '', sexo: '', 
            jefaturaCursoId: '', cursoEstudianteId: '' 
        });
        setClasesParaAgregar([]);
        setShowModal(true);
    };

    // --- ABRIR MODAL EN MODO EDITAR ---
    const openEditModal = (usuario) => {
        setEditingId(usuario.id); // Guardamos el ID para saber a quién actualizar
        
        // Rellenamos el formulario con los datos actuales
        if (activeTab === 'profesores') {
            setFormData({
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                password: '', // No mostramos la pass, solo si quiere cambiarla
                edad: usuario.edad,
                sexo: usuario.sexo,
                jefaturaCursoId: usuario.jefaturaId // ID del curso que jefatura
            });
            
            // Cargamos su horario actual para editarlo
            // Mapeamos el formato de la BD al formato visual de la lista
            const horarioVisual = usuario.Horario.map(h => ({
                id: h.id, // ID real en la BD (para borrar luego)
                cursoId: h.cursoId,
                asignaturaId: h.asignaturaId,
                cursoNombre: h.Curso?.nombre,
                asigNombre: h.Asignatura?.nombre,
                diaNombre: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"][h.diaSemana - 1],
                diaSemana: h.diaSemana,
                horaInicio: h.horaInicio,
                horaFin: h.horaFin
            }));
            setClasesParaAgregar(horarioVisual);

        } else {
            // Estudiante
            setFormData({
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email || '', // A veces no viene en la tabla Estudiante si no se guardó, pero el user_uuid sí
                password: '',
                edad: usuario.edad,
                sexo: usuario.sexo,
                cursoEstudianteId: usuario.cursoId
            });
        }
        setShowModal(true);
    };

    // --- LÓGICA HORARIO (SOLO PROFE) ---
    const agregarClaseALista = () => {
        if (!nuevaClase.cursoId || !nuevaClase.asignaturaId) return alert("Selecciona Curso y Asignatura");
        
        const cursoNombre = cursos.find(c => c.id === parseInt(nuevaClase.cursoId))?.nombre;
        const asigNombre = asignaturas.find(a => a.id === parseInt(nuevaClase.asignaturaId))?.nombre;
        const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

        const nueva = {
            ...nuevaClase,
            cursoNombre,
            asigNombre,
            diaNombre: dias[parseInt(nuevaClase.diaSemana) - 1],
            esNueva: true // Marca para saber que hay que insertarla al guardar
        };

        setClasesParaAgregar([...clasesParaAgregar, nueva]);
    };

    const removerClaseDeLista = async (index, clase) => {
        if (clase.id && !clase.esNueva) {
            // Si la clase ya existía en la BD (tiene ID y no es nueva), la borramos directo
            if(window.confirm("Esta clase ya está guardada. ¿Borrarla permanentemente?")) {
                await supabase.from('Horario').delete().eq('id', clase.id);
            } else {
                return; // Cancelar
            }
        }
        // La sacamos de la lista visual
        const lista = [...clasesParaAgregar];
        lista.splice(index, 1);
        setClasesParaAgregar(lista);
    };

    // --- GUARDAR (CREAR O EDITAR) ---
    const handleGuardar = async () => {
        if (!formData.nombre || !formData.apellido) return alert("Faltan datos obligatorios");

        // 1. MODO CREACIÓN (Llamada al Backend)
        if (!editingId) {
            // ... (Lógica de creación igual que antes, usando el backend)
            if (!formData.email || !formData.password) return alert("Email y contraseña requeridos para crear");
            
            const endpoint = activeTab === 'profesores' ? '/api/users/profesores' : '/api/users/estudiantes';
            const payload = {
                ...formData,
                horario: clasesParaAgregar
            };

            try {
                const response = await fetch(`https://gestion-escolar-ulos.onrender.com${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) throw new Error("Error en el servidor");
                alert("Usuario creado exitosamente");
            } catch (e) {
                return alert(e.message);
            }

        } else {
            // 2. MODO EDICIÓN (Directo a Supabase)
            // Es más fácil actualizar directo la tabla que hacer un endpoint complejo de update
            try {
                const table = activeTab === 'profesores' ? 'Profesor' : 'Estudiante';
                
                // Actualizar datos básicos
                const updates = {
                    nombre: formData.nombre,
                    apellido: formData.apellido,
                    edad: parseInt(formData.edad),
                    sexo: formData.sexo
                };
                
                if (activeTab === 'estudiantes') {
                    updates.cursoId = parseInt(formData.cursoEstudianteId);
                }

                const { error } = await supabase.from(table).update(updates).eq('id', editingId);
                if (error) throw error;

                // Si es Profe, actualizar Jefatura
                if (activeTab === 'profesores') {
                    // 1. Quitar jefatura anterior
                    await supabase.from('Curso').update({ jefeId: null }).eq('jefeId', editingId);
                    // 2. Poner nueva
                    if (formData.jefaturaCursoId) {
                        await supabase.from('Curso').update({ jefeId: editingId }).eq('id', formData.jefaturaCursoId);
                    }

                    // 3. Insertar Clases NUEVAS del Horario
                    // (Las viejas que se borraron ya se manejaron en removerClaseDeLista)
                    const clasesNuevas = clasesParaAgregar.filter(c => c.esNueva).map(c => ({
                        profesorId: editingId,
                        cursoId: parseInt(c.cursoId),
                        asignaturaId: parseInt(c.asignaturaId),
                        diaSemana: parseInt(c.diaSemana),
                        horaInicio: c.horaInicio,
                        horaFin: c.horaFin
                    }));

                    if (clasesNuevas.length > 0) {
                        await supabase.from('Horario').insert(clasesNuevas);
                    }
                }

                // Actualizar nombre en perfiles (para que se vea bien arriba)
                // Primero obtenemos el uuid
                const { data: user } = await supabase.from(table).select('user_uuid').eq('id', editingId).single();
                if (user) {
                    await supabase.from('perfiles').update({
                        nombre_completo: `${formData.nombre} ${formData.apellido}`
                    }).eq('id', user.user_uuid);
                }

                alert("Usuario actualizado correctamente");

            } catch (e) {
                return alert("Error al actualizar: " + e.message);
            }
        }

        setShowModal(false);
        setClasesParaAgregar([]);
        fetchData();
    };

    const handleDelete = async (id, tabla) => {
        if (!window.confirm("¿Estás seguro de eliminar este usuario?")) return;
        
        const endpoint = tabla === 'Profesor' ? `/api/users/profesores/${id}` : `/api/users/estudiantes/${id}`;
        try {
            const response = await fetch(`https://gestion-escolar-ulos.onrender.com${endpoint}`, { method: 'DELETE' });
            if (!response.ok) throw new Error("Error al eliminar");
            fetchData();
        } catch (e) {
            // Fallback
            await supabase.from(tabla).delete().eq('id', id);
            fetchData();
        }
    };

    if (loading) return <div style={{padding:'50px', textAlign:'center'}}>Cargando...</div>;

    return (
        <div style={styles.container}>
            <h2 style={styles.pageTitle}>Gestión de Usuarios</h2>

            {/* PESTAÑAS */}
            <div style={styles.tabContainer}>
                <button style={activeTab === 'profesores' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('profesores')}>👨‍🏫 Profesores</button>
                <button style={activeTab === 'estudiantes' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('estudiantes')}>🎓 Estudiantes</button>
            </div>

            {/* TABLA */}
            <div style={styles.tableCard}>
                {activeTab === 'profesores' ? (
                    <table style={styles.table}>
                        <thead>
                            <tr><th style={styles.th}>Nombre</th><th style={styles.th}>Email</th><th style={styles.th}>Jefatura</th><th style={styles.th}>Asignaturas</th><th style={styles.thCenter}>Acciones</th></tr>
                        </thead>
                        <tbody>
                            {profesores.map((p) => (
                                <tr key={p.id} style={styles.tr}>
                                    <td style={styles.tdBold}>{p.nombre} {p.apellido}</td>
                                    <td style={styles.td}>{p.email}</td>
                                    <td style={styles.td}>{p.jefaturaStr}</td>
                                    <td style={styles.td}>{p.asignaturasStr}</td>
                                    <td style={styles.tdCenter}>
                                        <button style={styles.btnAction} onClick={() => openEditModal(p)}>✏️</button>
                                        <button style={styles.btnDelete} onClick={() => handleDelete(p.id, 'Profesor')}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr><th style={styles.th}>Nombre</th><th style={styles.th}>Curso</th><th style={styles.thCenter}>Acciones</th></tr>
                        </thead>
                        <tbody>
                            {estudiantes.map((e) => (
                                <tr key={e.id} style={styles.tr}>
                                    <td style={styles.tdName}>{e.nombre} {e.apellido}</td>
                                    <td style={styles.td}><span style={styles.cursoBadge}>{e.Curso?.nombre || '-'}</span></td>
                                    <td style={styles.tdCenter}>
                                        <button style={styles.btnAction} onClick={() => openEditModal(e)}>✏️</button>
                                        <button style={styles.btnDelete} onClick={() => handleDelete(e.id, 'Estudiante')}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div style={{textAlign:'right', marginTop:'20px'}}>
                <button style={styles.btnAdd} onClick={openCreateModal}>
                    + Agregar Nuevo {activeTab === 'profesores' ? 'Profesor' : 'Estudiante'}
                </button>
            </div>

            {/* --- MODAL UNIFICADO (CREAR/EDITAR) --- */}
            {showModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>{editingId ? 'Editar' : 'Nuevo'} {activeTab === 'profesores' ? 'Profesor' : 'Estudiante'}</h3>
                        
                        <div style={styles.formGrid}>
                            <input style={styles.input} placeholder="Nombre" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                            <input style={styles.input} placeholder="Apellido" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} />
                            
                            {/* Email y Pass solo editables al crear (o deshabilitados al editar para simplificar) */}
                            {!editingId && (
                                <>
                                    <input style={styles.input} placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                    <input style={styles.input} type="password" placeholder="Contraseña" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                                </>
                            )}

                            <input style={styles.input} placeholder="Edad" type="number" value={formData.edad} onChange={e => setFormData({...formData, edad: e.target.value})} />
                            <select style={styles.input} value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})}>
                                <option value="">Sexo</option><option value="M">Masculino</option><option value="F">Femenino</option>
                            </select>
                        </div>

                        {/* CAMPOS ESPECÍFICOS */}
                        {activeTab === 'profesores' ? (
                            <>
                                <h4 style={styles.sectionHeader}>Asignación Académica</h4>
                                <div style={{marginBottom:'15px'}}>
                                    <label style={styles.label}>Profesor Jefe de:</label>
                                    <select style={styles.inputFull} value={formData.jefaturaCursoId} onChange={e => setFormData({...formData, jefaturaCursoId: e.target.value})}>
                                        <option value="">-- Ninguno --</option>
                                        {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
                                </div>
                                <div style={styles.horarioBox}>
                                    <p style={{fontWeight:'bold', margin:'0 0 10px 0', color:'#003366'}}>Horario de Clases:</p>
                                    
                                    {/* Formulario para agregar clase (Visible siempre) */}
                                    <div style={styles.formGridSmall}>
                                        <select style={styles.inputSmall} value={nuevaClase.cursoId} onChange={e => setNuevaClase({...nuevaClase, cursoId: e.target.value})}>
                                            <option value="">Curso</option>{cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                        </select>
                                        <select style={styles.inputSmall} value={nuevaClase.asignaturaId} onChange={e => setNuevaClase({...nuevaClase, asignaturaId: e.target.value})}>
                                            <option value="">Materia</option>{asignaturas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                        </select>
                                        <select style={styles.inputSmall} value={nuevaClase.diaSemana} onChange={e => setNuevaClase({...nuevaClase, diaSemana: e.target.value})}>
                                            <option value="1">Lun</option><option value="2">Mar</option><option value="3">Mié</option><option value="4">Jue</option><option value="5">Vie</option>
                                        </select>
                                        <input type="time" style={styles.inputSmall} value={nuevaClase.horaInicio} onChange={e => setNuevaClase({...nuevaClase, horaInicio: e.target.value})} />
                                        <input type="time" style={styles.inputSmall} value={nuevaClase.horaFin} onChange={e => setNuevaClase({...nuevaClase, horaFin: e.target.value})} />
                                        <button style={styles.btnAddSmall} onClick={agregarClaseALista}>+</button>
                                    </div>

                                    {/* Lista de Clases (Existentes + Nuevas) */}
                                    <ul style={styles.classList}>
                                        {clasesParaAgregar.map((c, i) => (
                                            <li key={i} style={styles.classItem}>
                                                <small>
                                                    {c.cursoNombre} - {c.asigNombre} ({c.diaNombre} {c.horaInicio})
                                                    {c.esNueva && <span style={{color:'green', marginLeft:'5px'}}>(Nuevo)</span>}
                                                </small>
                                                <button onClick={() => removerClaseDeLista(i, c)} style={styles.btnRemove}>✕</button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        ) : (
                            /* CAMPOS ESTUDIANTE */
                            <div style={{marginTop:'20px'}}>
                                <h4 style={styles.sectionHeader}>Matrícula</h4>
                                <div style={{marginBottom:'15px'}}>
                                    <label style={styles.label}>Curso:</label>
                                    <select style={styles.inputFull} value={formData.cursoEstudianteId} onChange={e => setFormData({...formData, cursoEstudianteId: e.target.value})}>
                                        <option value="">-- Seleccionar Curso --</option>
                                        {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div style={styles.footerBtns}>
                            <button style={styles.btnCancel} onClick={() => setShowModal(false)}>Cancelar</button>
                            <button style={styles.btnSave} onClick={handleGuardar}>
                                {editingId ? 'Guardar Cambios' : 'Crear Usuario'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- ESTILOS (Mismos) ---
const styles = {
    container: { padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Lato', sans-serif" },
    pageTitle: { fontFamily: "'Playfair Display', serif", fontSize: '3em', color: '#003366', textAlign: 'center', marginBottom: '40px' },
    tabContainer: { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' },
    tab: { padding: '12px 30px', fontSize: '1.1em', border: '2px solid #003366', backgroundColor: 'white', color: '#003366', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' },
    tabActive: { padding: '12px 30px', fontSize: '1.1em', border: '2px solid #003366', backgroundColor: '#003366', color: 'white', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,51,102,0.3)' },
    tableCard: { backgroundColor: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e0e0e0' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { backgroundColor: '#f8f9fa', padding: '20px 25px', textAlign: 'left', color: '#003366', fontFamily: "'Playfair Display', serif", fontSize: '1.1em', fontWeight: 'bold', borderBottom: '2px solid #e0e0e0' },
    thCenter: { backgroundColor: '#f8f9fa', padding: '20px 25px', textAlign: 'center', color: '#003366', fontFamily: "'Playfair Display', serif", fontSize: '1.1em', fontWeight: 'bold', borderBottom: '2px solid #e0e0e0' },
    tr: { borderBottom: '1px solid #eee', transition: 'background 0.2s' },
    td: { padding: '15px 25px', fontSize: '1em', color: '#555' },
    tdBold: { padding: '15px 25px', fontSize: '1em', fontWeight: 'bold', color: '#333' },
    tdName: { padding: '15px 25px', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: 'bold', color: '#333' },
    tdCenter: { padding: '15px 25px', textAlign: 'center' },
    avatar: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' },
    cursoBadge: { backgroundColor: '#e3f2fd', color: '#007bff', padding: '5px 12px', borderRadius: '15px', fontSize: '0.9em', fontWeight: 'bold' },
    btnAction: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em', marginRight: '15px', color: '#ff9f43' },
    btnDelete: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em', color: '#aab7c4', transition: 'color 0.2s' },
    btnAdd: { backgroundColor: '#28a745', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '30px', fontSize: '1.1em', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(40,167,69,0.3)' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: 'white', padding: '40px', borderRadius: '15px', width: '700px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
    modalTitle: { marginTop: 0, color: '#003366', fontFamily: "'Playfair Display', serif", fontSize: '2em', textAlign: 'center', marginBottom: '30px' },
    sectionHeader: { marginTop: '25px', marginBottom: '15px', color: '#555', borderBottom: '1px solid #eee', paddingBottom: '5px', fontFamily: "'Playfair Display', serif", fontSize: '1.2em' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box', fontSize: '1em' },
    inputFull: { padding: '12px', borderRadius: '8px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box', fontSize: '1em' },
    label: { display: 'block', fontSize: '0.9em', color: '#666', marginBottom: '5px', fontWeight: 'bold' },
    horarioBox: { backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px', border: '1px solid #e0e0e0' },
    formGridSmall: { display: 'flex', gap: '10px', alignItems: 'center' },
    inputSmall: { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '0.9em', flex: 1 },
    btnAddSmall: { backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', width: '36px', height: '36px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2em' },
    classItem: { background: '#fff', padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    btnRemove: { color: '#dc3545', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' },
    footerBtns: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    btnSave: { backgroundColor: '#003366', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1em' },
    btnCancel: { backgroundColor: '#ccc', color: '#333', padding: '12px 30px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1em' }
};

export default GestionUsuarios;