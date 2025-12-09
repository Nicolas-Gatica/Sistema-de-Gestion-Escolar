// src/pages/NuestraHistoria.js
import React from 'react';

// --- BLOQUES DE CONTENIDO ---

// 1. Bloque: Autor y Motivación
const SeccionAutor = () => (
    <section style={{ ...styles.sectionBlock, ...styles.bgDarkBlue }}>
        <div style={styles.content}>
            <h2 style={styles.bigTitle}>Sobre el Proyecto</h2>
            <div style={styles.separatorLight}></div>
            
            {/* Texto unificado */}
            <p style={styles.bodyTextLight}>
                Este Sistema de Gestión Escolar es una iniciativa académica desarrollada por <strong>Nicolás Gatica Salvo</strong>, estudiante de Ingeniería Civil Informática en la Universidad Católica del Maule.
            </p>
            <p style={styles.bodyTextLight}>
                Nace con el propósito firme de modernizar la gestión académica en los colegios municipales de la Región del Maule, abordando las ineficiencias de los métodos tradicionales.
            </p>
            
            <div style={{marginTop: '60px'}}></div> 
            
            <h3 style={styles.subTitleLight}>Nuestra Motivación</h3>
            <p style={styles.bodyTextLight}>
                Buscamos eliminar las brechas comunicacionales que impiden un acceso fluido a la información. Queremos una educación donde la tecnología sea el puente entre la familia y la escuela, garantizando transparencia y acceso oportuno a los datos académicos.
            </p>
        </div>
    </section>
);

// 2. Bloque: Beneficios
const SeccionBeneficios = () => (
    <section style={{ ...styles.sectionBlock, ...styles.bgLightGray }}>
        <div style={styles.content}>
            <h2 style={{...styles.bigTitle, color: '#003366'}}>Beneficios Institucionales</h2>
            <div style={styles.separatorDark}></div>
            
            <div style={styles.benefitBox}>
                <h3 style={styles.benefitTitle}>Modernización y Productividad</h3>
                <p style={styles.bodyTextDark}>
                    Permite a los establecimientos digitalizar completamente sus registros. Esto optimiza significativamente la administración, seguridad y custodia de la información estudiantil crítica, reduciendo la carga administrativa manual.
                </p>
            </div>

            <div style={styles.benefitBox}>
                <h3 style={styles.benefitTitle}>Detección Temprana de Riesgos</h3>
                <p style={styles.bodyTextDark}>
                    Mediante algoritmos de análisis predictivo, los educadores pueden identificar rápidamente a estudiantes en situación de riesgo académico. Esto facilita la implementación de estrategias pedagógicas oportunas y personalizadas antes de que sea tarde.
                </p>
            </div>
        </div>
    </section>
);

// 3. Bloque: Agradecimientos
const SeccionAgradecimientos = () => (
    <section style={{ ...styles.sectionBlock, ...styles.bgBlue }}>
        <div style={styles.content}>
            <h2 style={styles.bigTitle}>Agradecimientos</h2>
            <div style={styles.separatorLight}></div>
            <p style={styles.italicText}>
                A la Universidad Católica del Maule, por fomentar un ambiente de excelencia académica e innovación constante.
            </p>
            <p style={styles.bodyTextLight}>
                Un reconocimiento especial al profesor <strong>Héctor Tejo Uval</strong>, por su guía experta y mentoría durante el desarrollo de este proyecto, impulsando siempre los más altos estándares de calidad profesional.
            </p>
        </div>
    </section>
);


// --- COMPONENTE PRINCIPAL ---

const NuestraHistoria = () => {
    return (
        <div style={styles.pageContainer}>
            <SeccionAutor />
            <SeccionBeneficios />
            <SeccionAgradecimientos />
        </div>
    );
};

// --- ESTILOS UNIFICADOS ---
const styles = {
    pageContainer: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    sectionBlock: {
        padding: '100px 20px', 
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'center',
    },
    // Colores
    bgDarkBlue: {
        backgroundColor: '#002244', 
        color: '#ffffff',
    },
    bgLightGray: {
        backgroundColor: '#eef2f5', 
        color: '#1a1a1a',
    },
    bgBlue: {
        backgroundColor: '#0055a5', 
        color: '#ffffff',
    },
    
    // Contenedor
    content: {
        maxWidth: '1100px', 
        width: '100%',
        textAlign: 'left',
    },
    
    // --- TIPOGRAFÍA (Titulos) ---
    bigTitle: {
        fontFamily: "'Playfair Display', serif",
        fontSize: '4.5em', 
        fontWeight: '900', 
        marginBottom: '25px',
        lineHeight: '1.1',
        letterSpacing: '-1px',
    },
    subTitleLight: {
        fontFamily: "'Playfair Display', serif",
        fontSize: '3em', 
        marginTop: '20px',
        marginBottom: '20px',
        color: '#a0c4ff', 
    },
    benefitTitle: {
        fontFamily: "'Playfair Display', serif",
        fontSize: '2.2em', 
        color: '#003366',
        marginBottom: '15px',
        borderLeft: '6px solid #0055a5', 
        paddingLeft: '20px',
    },
    
    // --- TIPOGRAFÍA (Cuerpos de Texto UNIFICADOS) ---
    // Texto claro sobre fondo oscuro
    bodyTextLight: {
        fontFamily: "'Lato', sans-serif",
        fontSize: '1.6em', // Tamaño unificado grande
        fontWeight: '400', // Grosor normal (ni fino ni negrita)
        lineHeight: '1.6',
        marginBottom: '30px',
        opacity: 0.95,
    },
    // Texto oscuro sobre fondo claro
    bodyTextDark: {
        fontFamily: "'Lato', sans-serif",
        fontSize: '1.6em', // Mismo tamaño
        fontWeight: '400', // Mismo grosor
        lineHeight: '1.6',
        marginBottom: '30px',
        color: '#333',
    },
    // Texto itálico (mismo tamaño y grosor)
    italicText: {
        fontFamily: "'Playfair Display', serif", // Mantenemos serif para la cita
        fontSize: '2em', 
        fontStyle: 'italic',
        marginBottom: '40px',
        lineHeight: '1.4',
        opacity: 0.9,
    },

    // Decoración
    separatorLight: {
        width: '120px', 
        height: '6px', 
        backgroundColor: '#4facfe', 
        marginBottom: '40px',
    },
    separatorDark: {
        width: '120px',
        height: '6px',
        backgroundColor: '#003366', 
        marginBottom: '40px',
    },
    benefitBox: {
        marginBottom: '60px',
        paddingBottom: '30px',
        borderBottom: '2px solid #ddd', 
    }
};

export default NuestraHistoria;