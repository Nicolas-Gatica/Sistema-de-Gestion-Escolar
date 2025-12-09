// src/pages/VerNotas.js

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';

// Importaciones para gráficos
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const VerNotas = () => {
  const [calificaciones, setCalificaciones] = useState([]);
  const [rendimientoMensual, setRendimientoMensual] = useState({ labels: [], datasets: [] });
  const [rendimientoFinal, setRendimientoFinal] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotas = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        // 1. CONSULTA
        const { data, error } = await supabase
          .from('Calificacion')
          .select(`
            id,
            valor,
            fecha,
            Asignatura(nombre)
          `)
          .eq('estudiante_uuid', user.id)
          .order('fecha', { ascending: true });

        if (error) throw error;

        // 2. PROCESAMIENTO (Tabla)
        const agrupado = {};
        data.forEach(item => {
            const nombre = item.Asignatura?.nombre || 'Sin Asignatura';
            if (!agrupado[nombre]) agrupado[nombre] = { nombre: nombre, notas: [], suma: 0 };
            agrupado[nombre].notas.push(item.valor);
            agrupado[nombre].suma += item.valor;
        });

        const datosTabla = Object.values(agrupado).map(item => ({
            asignatura: item.nombre,
            notasParciales: item.notas,
            promedio: (item.suma / item.notas.length).toFixed(1)
        }));
        setCalificaciones(datosTabla);

        // --- GRÁFICO 1: EVOLUCIÓN MENSUAL ---
        const mesesMap = {}; 
        data.forEach(n => {
            const dateObj = new Date(n.fecha);
            const mesNum = dateObj.getMonth(); 
            const mesNombre = dateObj.toLocaleString('es-ES', { month: 'long' });
            if (!mesesMap[mesNum]) mesesMap[mesNum] = { nombre: mesNombre, suma: 0, count: 0 };
            mesesMap[mesNum].suma += n.valor;
            mesesMap[mesNum].count += 1;
        });

        const mesesOrdenadosKeys = Object.keys(mesesMap).sort((a, b) => parseInt(a) - parseInt(b));
        
        const mensualLabels = mesesOrdenadosKeys.map(k => {
            const nombre = mesesMap[k].nombre;
            return nombre.charAt(0).toUpperCase() + nombre.slice(1);
        });
        const mensualData = mesesOrdenadosKeys.map(k => (mesesMap[k].suma / mesesMap[k].count).toFixed(1));
        const pointColors = mensualData.map(val => val < 4.0 ? '#dc3545' : '#0055a5');

        setRendimientoMensual({
            labels: mensualLabels,
            datasets: [
                {
                    label: 'Promedio Mensual',
                    data: mensualData,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 4,
                    borderColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return '#0055a5';
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, '#0055a5');   
                        gradient.addColorStop(0.5, '#0055a5'); 
                        gradient.addColorStop(0.5, '#dc3545'); 
                        gradient.addColorStop(1, '#dc3545');   
                        return gradient;
                    },
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return 'rgba(0, 85, 165, 0.2)';
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, 'rgba(0, 85, 165, 0.25)'); 
                        gradient.addColorStop(0.5, 'rgba(0, 85, 165, 0.05)'); 
                        gradient.addColorStop(0.5, 'rgba(220, 53, 69, 0.05)');
                        gradient.addColorStop(1, 'rgba(220, 53, 69, 0.25)');
                        return gradient;
                    },
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: pointColors,
                    pointBorderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                },
                {
                    label: 'Límite Aprobación (4.0)',
                    data: new Array(mensualLabels.length).fill(4.0),
                    borderColor: '#dc3545',
                    backgroundColor: '#dc3545',
                    borderDash: [6, 6],
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false
                }
            ],
        });

        // --- GRÁFICO 2: BARRAS FINALES ---
        const finalLabels = datosTabla.map(c => c.asignatura);
        const finalData = datosTabla.map(c => parseFloat(c.promedio));

        setRendimientoFinal({
            labels: finalLabels,
            datasets: [
                {
                    label: 'Promedio Final',
                    data: finalData,
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return '#4facfe';
                        
                        const value = context.raw; 
                        const isFailing = value < 4.0;
                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        
                        if (isFailing) {
                            gradient.addColorStop(0, 'rgba(220, 53, 69, 0.8)'); 
                            gradient.addColorStop(1, 'rgba(255, 107, 107, 0.9)'); 
                        } else {
                            gradient.addColorStop(0, '#003366'); 
                            gradient.addColorStop(1, '#4facfe'); 
                        }
                        return gradient;
                    },
                    borderColor: finalData.map(val => val < 4.0 ? '#dc3545' : '#0055a5'),
                    borderWidth: 2,
                    borderRadius: 8,
                    barThickness: 45, 
                    hoverBackgroundColor: finalData.map(val => val < 4.0 ? '#ff8787' : '#0055a5'),
                },
            ],
        });

      } catch (error) {
        console.error('Error al cargar notas:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotas();
  }, []);

  if (loading) return <p style={{textAlign:'center', padding:'50px', fontFamily:"'Playfair Display', serif", fontSize:'1.5em'}}>Cargando notas...</p>;

  // --- OPCIONES COMUNES DE ESTILO ---
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
          position: 'top',
          labels: { font: { family: "'Lato', sans-serif", size: 12 }, usePointStyle: true }
      },
      tooltip: {
          backgroundColor: 'rgba(0, 31, 63, 0.95)',
          titleFont: { family: "'Playfair Display', serif", size: 14 },
          bodyFont: { family: "'Lato', sans-serif", size: 13 },
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
              label: (context) => `Promedio: ${context.raw}`
          }
      }
    }
  };

  // Gráfico de LÍNEA
  const lineOptions = {
    ...commonOptions,
    scales: {
        y: { 
            min: 1, 
            max: 7,
            ticks: { padding: 15, font: { family: "'Lato', sans-serif", size: 13, weight: 'bold' }, color: '#555' },
            grid: { color: '#f0f0f0' }
        },
        x: { 
            grid: { display: false },
            ticks: { font: { family: "'Playfair Display', serif", size: 13, weight: 'bold' }, color: '#003366', padding: 10 }
        }
    }
  };

  // Gráfico de BARRAS (Estilo Actualizado)
  const barOptions = {
    ...commonOptions,
    plugins: { ...commonOptions.plugins, legend: { display: false } }, 
    scales: {
        y: { 
            min: 1, 
            max: 7, 
            ticks: { padding: 15, font: { family: "'Lato', sans-serif" } },
            grid: { color: '#f0f0f0' }
        },
        x: { 
            grid: { display: false },
            ticks: { 
                autoSkip: false, 
                maxRotation: 45, 
                minRotation: 45,
                // --- CAMBIO AQUÍ: ESTILO DE ETIQUETAS EJE X ---
                font: { 
                    family: "'Playfair Display', serif", // Fuente elegante
                    size: 12, 
                    weight: 'bold' // Negrita
                },
                color: '#003366', // Azul oscuro institucional
            } 
        }
    }
  };

  return (
    <div style={styles.fullWidthContainer}>
        <h1 style={styles.pageTitle}>Registro de Calificaciones</h1>

        <div style={styles.tableCard}>
            <table style={styles.modernTable}>
                <thead>
                    <tr>
                        <th style={{...styles.tableHeader, textAlign: 'left'}}>Asignatura</th>
                        <th style={{...styles.tableHeader, textAlign: 'center'}}>Notas Parciales</th>
                        <th style={{...styles.tableHeader, textAlign: 'center'}}>Promedio</th>
                    </tr>
                </thead>
                <tbody>
                    {calificaciones.map((cal, index) => (
                        <tr key={index} style={index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}>
                            <td style={styles.tableCellMain}>{cal.asignatura}</td>
                            <td style={styles.tableCellBadges}>
                                <div style={{display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap'}}>
                                    {cal.notasParciales.map((nota, i) => (
                                        <span key={i} style={{...styles.notaBadge, 
                                            backgroundColor: nota < 4.0 ? '#ffecec' : '#e3f2fd',
                                            color: nota < 4.0 ? '#d32f2f' : '#0277bd',
                                            border: nota < 4.0 ? '1px solid #ffcdd2' : '1px solid #b3e5fc'
                                        }}>
                                            {nota.toFixed(1)}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td style={{...styles.tableCell, textAlign: 'center'}}>
                                <span style={{
                                    ...styles.promedioText,
                                    color: parseFloat(cal.promedio) < 4.0 ? '#d32f2f' : '#0055a5'
                                }}>
                                    {cal.promedio}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <h2 style={styles.subSectionTitle}>Historial Académico</h2>
        <div style={styles.chartsContainer}>
            <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}>Evolución Mensual</h3>
                <div style={styles.chartWrapper}>
                    <Line data={rendimientoMensual} options={lineOptions} />
                </div>
            </div>

            <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}>Rendimiento Final por Asignatura</h3>
                <div style={styles.chartWrapper}>
                    <Bar data={rendimientoFinal} options={barOptions} />
                </div>
            </div>
        </div>

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
        marginBottom: '30px',
        borderBottom: '3px solid #0055a5',
        paddingBottom: '10px',
        display: 'inline-block'
    },
    tableCard: {
        backgroundColor: '#ffffff',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        marginBottom: '60px',
        border: '1px solid #e0e0e0',
    },
    modernTable: { width: '100%', borderCollapse: 'collapse' },
    tableHeader: {
        backgroundColor: '#0055a5',
        color: 'white',
        padding: '20px 30px',
        fontFamily: "'Playfair Display', serif",
        fontSize: '1.3em',
        fontWeight: '600',
        letterSpacing: '0.5px',
    },
    tableRowEven: { backgroundColor: '#ffffff' },
    tableRowOdd: { backgroundColor: '#f8faff' },
    tableCellMain: {
        padding: '20px 30px',
        color: '#333',
        fontSize: '1.1em',
        fontWeight: '700',
        borderBottom: '1px solid #eee',
        fontFamily: "'Playfair Display', serif",
        textAlign: 'left',
    },
    tableCellBadges: { padding: '20px 30px', borderBottom: '1px solid #eee' },
    tableCell: { padding: '20px 30px', borderBottom: '1px solid #eee' },
    notaBadge: {
        padding: '6px 14px',
        borderRadius: '20px',
        fontSize: '1em',
        fontWeight: '700',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    },
    promedioText: {
        fontWeight: '800',
        fontSize: '1.4em',
        fontFamily: "'Playfair Display', serif",
    },
    subSectionTitle: {
        fontFamily: "'Playfair Display', serif",
        fontSize: '2.5em',
        color: '#003366',
        textAlign: 'left',
        marginTop: '40px',
        marginBottom: '30px',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: '15px',
        fontWeight: '700',
    },
    chartsContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '40px',
        marginBottom: '50px',
    },
    chartCard: {
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        border: '1px solid #e0e0e0',
    },
    chartTitle: {
        fontFamily: "'Playfair Display', serif",
        fontSize: '1.6em',
        color: '#003366',
        marginBottom: '20px',
        textAlign: 'center',
        fontWeight: '700',
    },
    chartWrapper: { height: '350px', width: '100%' }
};

export default VerNotas;