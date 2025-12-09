// src/pages/GestionAcademica.js

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const GestionAcademica = () => {
    const [activeTab, setActiveTab] = useState('cursos'); // 'cursos' o 'asignaturas'
    const [cursos, setCursos] = useState([]);
    const [asignaturas, setAsignaturas] = useState([]);
    const [profesores, setProfesores] = useState([]); // Para asignar jefaturas
    const [loading, setLoading] = useState(true);
    
    // Estados del Modal
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null); // Si es null, es CREAR. Si tiene ID, es EDITAR.
    const [formData, setFormData] = useState({ nombre: '', jefeId: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Obtener Cursos (con el nombre del Profesor Jefe)
            const { data: cursosData, error: errorCursos } = await supabase
                .from('Curso')
                .select(`*, Profesor ( id, nombre, apellido )`)
                .order('nombre', { ascending: true });
            
            if (errorCursos) throw errorCursos;
            setCursos(cursosData);

            // 2. Obtener Asignaturas
            const { data: asigData, error: errorAsig } = await supabase
                .from('Asignatura')
                .select('*')
                .order('nombre', { ascending: true });

            if (errorAsig) throw errorAsig;
            setAsignaturas(asigData);

            // 3. Obtener Profesores (Para el selector de Jefatura)
            const { data: profData } = await supabase
                .from('Profesor')
                .select('id, nombre, apellido')
                .order('apellido');
            
            if (profData) setProfesores(profData);

        } catch (error) {
            console.error("Error cargando datos:", error);
            alert("Error cargando la información.");
        } finally {
            setLoading(false);
        }
    };

    // --- ABRIR MODAL (CREAR O EDITAR) ---
    const openModal = (item = null) => {
        if (item) {
            // Modo EDICIÓN
            setEditingId(item.id);
            setFormData({
                nombre: item.nombre,
                jefeId: item.jefeId || '' // Solo aplica para cursos
            });
        } else {
            // Modo CREACIÓN
            setEditingId(null);
            setFormData({ nombre: '', jefeId: '' });
        }
        setShowModal(true);
    };

    // --- GUARDAR (CREAR O ACTUALIZAR) ---
    const handleSave = async () => {
        if (!formData.nombre.trim()) return alert("El nombre es obligatorio.");

        const table = activeTab === 'cursos' ? 'Curso' : 'Asignatura';
        
        // Preparamos los datos a enviar
        const payload = { nombre: formData.nombre };
        
        // Si es curso, agregamos el jefeId (o null si está vacío)
        if (activeTab === 'cursos') {
            payload.jefeId = formData.jefeId ? parseInt(formData.jefeId) : null;
        }

        try {
            if (editingId) {
                // UPDATE
                const { error } = await supabase.from(table).update(payload).eq('id', editingId);
                if (error) throw error;
                alert(`${activeTab === 'cursos' ? 'Curso' : 'Asignatura'} actualizado correctamente.`);
            } else {
                // INSERT
                const { error } = await supabase.from(table).insert([payload]);
                if (error) throw error;
                alert(`${activeTab === 'cursos' ? 'Curso' : 'Asignatura'} creado correctamente.`);
            }

            setShowModal(false);
            fetchData(); // Recargar tablas

        } catch (error) {
            console.error("Error guardando:", error);
            alert("Error al guardar: " + error.message);
        }
    };

    // --- ELIMINAR ---
    const handleDelete = async (id) => {
        const tipo = activeTab === 'cursos' ? 'Curso' : 'Asignatura';
        if (!window.confirm(`¿Seguro que quieres eliminar este ${tipo}?`)) return;

        try {
            const table = activeTab === 'cursos' ? 'Curso' : 'Asignatura';
            const { error } = await supabase.from(table).delete().eq('id', id);
            
            if (error) throw error;
            fetchData(); // Recargar

        } catch (error) {
            console.error("Error eliminando:", error);
            alert("No se puede eliminar (posiblemente tenga datos asociados).");
        }
    };

    if (loading) return <div style={{padding:'50px', textAlign:'center'}}>Cargando gestión académica...</div>;

    return (
        <div style={styles.container}>
            <h2 style={styles.pageTitle}>Gestión Académica</h2>

            {/* PESTAÑAS */}
            <div style={styles.tabContainer}>
                <button 
                    style={activeTab === 'cursos' ? styles.tabActive : styles.tab}
                    onClick={() => setActiveTab('cursos')}
                >
                    📚 Cursos
                </button>
                <button 
                    style={activeTab === 'asignaturas' ? styles.tabActive : styles.tab}
                    onClick={() => setActiveTab('asignaturas')}
                >
                    📝 Asignaturas
                </button>
            </div>

            {/* CONTENIDO DE TABLAS */}
            <div style={styles.tableCard}>
                {activeTab === 'cursos' ? (
                    /* --- TABLA CURSOS --- */
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Nombre del Curso</th>
                                <th style={styles.th}>Profesor Jefe</th>
                                <th style={styles.thCenter}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cursos.map((curso) => (
                                <tr key={curso.id} style={styles.tr}>
                                    <td style={styles.tdBold}>{curso.nombre}</td>
                                    <td style={styles.td}>
                                        {curso.Profesor 
                                            ? `${curso.Profesor.nombre} ${curso.Profesor.apellido}` 
                                            : <span style={{color:'#999', fontStyle:'italic'}}>-- Sin asignar --</span>}
                                    </td>
                                    <td style={styles.tdCenter}>
                                        <button style={styles.btnAction} onClick={() => openModal(curso)}>✏️</button>
                                        <button style={styles.btnDelete} onClick={() => handleDelete(curso.id)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    /* --- TABLA ASIGNATURAS --- */
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Nombre Asignatura</th>
                                <th style={styles.thCenter}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {asignaturas.map((asig) => (
                                <tr key={asig.id} style={styles.tr}>
                                    <td style={styles.tdBold}>{asig.nombre}</td>
                                    <td style={styles.tdCenter}>
                                        <button style={styles.btnAction} onClick={() => openModal(asig)}>✏️</button>
                                        <button style={styles.btnDelete} onClick={() => handleDelete(asig.id)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* BOTÓN AGREGAR */}
            <div style={{textAlign:'right', marginTop:'20px'}}>
                <button style={styles.btnAdd} onClick={() => openModal(null)}>
                    + Agregar {activeTab === 'cursos' ? 'Curso' : 'Asignatura'}
                </button>
            </div>

            {/* --- MODAL --- */}
            {showModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>
                            {editingId ? 'Editar' : 'Crear'} {activeTab === 'cursos' ? 'Curso' : 'Asignatura'}
                        </h3>
                        
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Nombre:</label>
                            <input 
                                style={styles.input} 
                                placeholder={activeTab === 'cursos' ? "Ej: 1° Básico B" : "Ej: Matemáticas"}
                                value={formData.nombre}
                                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                            />
                        </div>

                        {/* SOLO SI ES CURSO MOSTRAMOS EL SELECTOR DE JEFE */}
                        {activeTab === 'cursos' && (
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Profesor Jefe:</label>
                                <select 
                                    style={styles.input}
                                    value={formData.jefeId}
                                    onChange={(e) => setFormData({...formData, jefeId: e.target.value})}
                                >
                                    <option value="">-- Sin Profesor Jefe --</option>
                                    {profesores.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div style={styles.footerBtns}>
                            <button style={styles.btnCancel} onClick={() => setShowModal(false)}>Cancelar</button>
                            <button style={styles.btnSave} onClick={handleSave}>Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- ESTILOS (Reutilizados para consistencia) ---
const styles = {
    container: { padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: "'Lato', sans-serif" },
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
    tdCenter: { padding: '15px 25px', textAlign: 'center' },
    
    btnAction: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em', marginRight: '15px' },
    btnDelete: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em', color: '#dc3545' },
    btnAdd: { backgroundColor: '#28a745', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '30px', fontSize: '1.1em', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(40,167,69,0.3)' },

    // Modal
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: 'white', padding: '40px', borderRadius: '15px', width: '500px', maxWidth: '95%', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
    modalTitle: { marginTop: 0, color: '#003366', fontFamily: "'Playfair Display', serif", fontSize: '1.8em', textAlign: 'center', marginBottom: '30px' },
    formGroup: { marginBottom: '20px' },
    label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#666' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box', fontSize: '1em' },
    footerBtns: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' },
    btnSave: { backgroundColor: '#003366', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    btnCancel: { backgroundColor: '#ccc', color: '#333', padding: '12px 30px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};

export default GestionAcademica;