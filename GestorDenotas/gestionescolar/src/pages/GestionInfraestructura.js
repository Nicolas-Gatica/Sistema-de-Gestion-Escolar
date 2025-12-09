// src/pages/GestionInfraestructura.js

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const GestionInfraestructura = () => {
    const [salas, setSalas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ nombre: '', tipo: 'Aula', capacidad: '', ubicacion: '' });

    useEffect(() => {
        fetchSalas();
    }, []);

    const fetchSalas = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('Sala').select('*').order('nombre');
        if (error) console.error(error);
        else setSalas(data);
        setLoading(false);
    };

    const handleGuardar = async () => {
        if (!formData.nombre) return alert("El nombre es obligatorio");
        
        const { error } = await supabase.from('Sala').insert([formData]);
        if (error) return alert(error.message);
        
        alert("Espacio registrado correctamente");
        setShowModal(false);
        setFormData({ nombre: '', tipo: 'Aula', capacidad: '', ubicacion: '' });
        fetchSalas();
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Eliminar este espacio?")) return;
        await supabase.from('Sala').delete().eq('id', id);
        fetchSalas();
    };

    // Iconos según tipo
    const getIcon = (tipo) => {
        if (tipo === 'Laboratorio') return '🔬';
        if (tipo === 'Deportes') return '🏀';
        if (tipo === 'Biblioteca') return '📚';
        return '🏫'; // Aula por defecto
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.pageTitle}>Infraestructura Escolar</h2>
            <p style={styles.subtitle}>Gestión de salas, laboratorios y espacios comunes.</p>

            <div style={{textAlign:'right', marginBottom:'30px'}}>
                <button style={styles.btnAdd} onClick={() => setShowModal(true)}>+ Nuevo Espacio</button>
            </div>

            {loading ? <p style={{textAlign:'center'}}>Cargando...</p> : (
                <div style={styles.grid}>
                    {salas.map((sala) => (
                        <div key={sala.id} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <span style={styles.icon}>{getIcon(sala.tipo)}</span>
                                <button style={styles.btnDelete} onClick={() => handleDelete(sala.id)}>🗑️</button>
                            </div>
                            <h3 style={styles.cardTitle}>{sala.nombre}</h3>
                            <div style={styles.cardBody}>
                                <p><strong>Tipo:</strong> {sala.tipo}</p>
                                <p><strong>Capacidad:</strong> {sala.capacidad} personas</p>
                                <p><strong>Ubicación:</strong> {sala.ubicacion || '-'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL */}
            {showModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3>Registrar Nuevo Espacio</h3>
                        <div style={styles.formGroup}>
                            <label>Nombre:</label>
                            <input style={styles.input} value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Laboratorio Computación" />
                        </div>
                        <div style={styles.formGroup}>
                            <label>Tipo:</label>
                            <select style={styles.input} value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                                <option value="Aula">Aula de Clases</option>
                                <option value="Laboratorio">Laboratorio</option>
                                <option value="Deportes">Gimnasio / Cancha</option>
                                <option value="Biblioteca">Biblioteca</option>
                                <option value="Oficina">Oficina / Sala Profes</option>
                            </select>
                        </div>
                        <div style={styles.formGroup}>
                            <label>Capacidad (Personas):</label>
                            <input type="number" style={styles.input} value={formData.capacidad} onChange={e => setFormData({...formData, capacidad: e.target.value})} />
                        </div>
                        <div style={styles.formGroup}>
                            <label>Ubicación (Opcional):</label>
                            <input style={styles.input} value={formData.ubicacion} onChange={e => setFormData({...formData, ubicacion: e.target.value})} placeholder="Ej: Piso 2, Ala Norte" />
                        </div>
                        <div style={styles.footerBtns}>
                            <button style={styles.btnCancel} onClick={() => setShowModal(false)}>Cancelar</button>
                            <button style={styles.btnSave} onClick={handleGuardar}>Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Lato', sans-serif'"},
    pageTitle: { fontFamily: "'Playfair Display', serif", fontSize: '3em', color: '#003366', textAlign: 'center', margin: '0' },
    subtitle: { textAlign: 'center', color: '#666', marginBottom: '40px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' },
    card: { backgroundColor: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #eee', transition: 'transform 0.2s' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    icon: { fontSize: '2.5em', backgroundColor: '#e3f2fd', padding: '10px', borderRadius: '50%' },
    cardTitle: { margin: '0 0 15px 0', color: '#003366', fontSize: '1.4em', fontFamily: "'Playfair Display', serif" },
    cardBody: { color: '#555', lineHeight: '1.6' },
    btnAdd: { backgroundColor: '#28a745', color: 'white', padding: '12px 25px', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' },
    btnDelete: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em' },
    
    // Modal Styles
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '400px' },
    formGroup: { marginBottom: '15px' },
    input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', marginTop: '5px', boxSizing: 'border-box' },
    footerBtns: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    btnSave: { backgroundColor: '#003366', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    btnCancel: { backgroundColor: '#ccc', color: '#333', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default GestionInfraestructura;