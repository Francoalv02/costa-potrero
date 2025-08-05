// Variables para los gráficos
let graficoEstados, graficoMetodos, graficoMensual, graficoPromedio;

// Colores para los gráficos
const colores = [
    '#4CAF50', '#2196F3', '#FF9800', '#F44336', 
    '#9C27B0', '#00BCD4', '#FFEB3B', '#795548'
];

// Función para actualizar las tarjetas de resumen
function actualizarTarjetasResumen(pagos) {
    const totalPagos = pagos.length;
    const montoTotal = pagos.reduce((sum, pago) => sum + parseFloat(pago.monto), 0);
    const pagosPendientes = pagos.filter(p => p.nombre_estado_pago.toLowerCase().includes('pendiente')).length;
    const pagosCompletados = pagos.filter(p => p.nombre_estado_pago.toLowerCase().includes('completado')).length;

    document.getElementById('total-pagos').textContent = totalPagos;
    document.getElementById('monto-total').textContent = `$${montoTotal.toFixed(2)}`;
    document.getElementById('pagos-pendientes').textContent = pagosPendientes;
    document.getElementById('pagos-completados').textContent = pagosCompletados;
}

// Función para crear gráfico de pagos por estado
function crearGraficoEstados(pagos) {
    const ctx = document.getElementById('grafico-estados');
    
    // Agrupar pagos por estado
    const estados = {};
    pagos.forEach(pago => {
        const estado = pago.nombre_estado_pago;
        estados[estado] = (estados[estado] || 0) + 1;
    });

    const labels = Object.keys(estados);
    const data = Object.values(estados);

    if (graficoEstados) {
        graficoEstados.destroy();
    }

    graficoEstados = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colores.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 3,
                        font: {
                            size: 8
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Función para crear gráfico de pagos por método
function crearGraficoMetodos(pagos) {
    const ctx = document.getElementById('grafico-metodos');
    
    // Agrupar pagos por método
    const metodos = {};
    pagos.forEach(pago => {
        const metodo = pago.metodo_pago || 'Sin especificar';
        metodos[metodo] = (metodos[metodo] || 0) + 1;
    });

    const labels = Object.keys(metodos);
    const data = Object.values(metodos);

    if (graficoMetodos) {
        graficoMetodos.destroy();
    }

    graficoMetodos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cantidad de Pagos',
                data: data,
                backgroundColor: colores.slice(0, labels.length),
                borderColor: colores.slice(0, labels.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 7
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 7
                        }
                    }
                }
            }
        }
    });
}

// Función para crear gráfico de pagos por mes
function crearGraficoMensual(pagos) {
    const ctx = document.getElementById('grafico-mensual');
    
    // Agrupar pagos por mes
    const meses = {};
    const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    pagos.forEach(pago => {
        const fecha = new Date(pago.fecha_pago);
        const mes = fecha.getMonth();
        const año = fecha.getFullYear();
        const key = `${año}-${mes}`;
        
        if (!meses[key]) {
            meses[key] = {
                nombre: `${nombresMeses[mes]} ${año}`,
                monto: 0,
                cantidad: 0
            };
        }
        meses[key].monto += parseFloat(pago.monto);
        meses[key].cantidad += 1;
    });

    // Ordenar por fecha
    const sortedKeys = Object.keys(meses).sort();
    const labels = sortedKeys.map(key => meses[key].nombre);
    const montos = sortedKeys.map(key => meses[key].monto);

    if (graficoMensual) {
        graficoMensual.destroy();
    }

    graficoMensual = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monto Total ($)',
                data: montos,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 6
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        },
                        font: {
                            size: 6
                        }
                    }
                }
            }
        }
    });
}

// Función para crear gráfico de monto promedio por método
function crearGraficoPromedio(pagos) {
    const ctx = document.getElementById('grafico-promedio');
    
    // Calcular promedio por método
    const promedios = {};
    const conteos = {};
    
    pagos.forEach(pago => {
        const metodo = pago.metodo_pago || 'Sin especificar';
        const monto = parseFloat(pago.monto);
        
        if (!promedios[metodo]) {
            promedios[metodo] = 0;
            conteos[metodo] = 0;
        }
        
        promedios[metodo] += monto;
        conteos[metodo] += 1;
    });

    // Calcular promedios
    const labels = Object.keys(promedios);
    const data = labels.map(metodo => promedios[metodo] / conteos[metodo]);

    if (graficoPromedio) {
        graficoPromedio.destroy();
    }

    graficoPromedio = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monto Promedio ($)',
                data: data,
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                borderColor: '#4CAF50',
                borderWidth: 2,
                pointBackgroundColor: '#4CAF50',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        },
                        font: {
                            size: 6
                        }
                    },
                    pointLabels: {
                        font: {
                            size: 6
                        }
                    }
                }
            }
        }
    });
}

// Función principal para cargar todas las estadísticas
async function cargarEstadisticas() {
    try {
        const res = await fetch('/api/v1/pagos');
        const pagos = await res.json();

        // Actualizar tarjetas de resumen
        actualizarTarjetasResumen(pagos);

        // Crear gráficos
        crearGraficoEstados(pagos);
        crearGraficoMetodos(pagos);

    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Función para exportar estadísticas a PDF
function exportarEstadisticasPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text('Reporte de Estadísticas de Pagos', 14, 20);
    
    // Obtener datos de las tarjetas
    const totalPagos = document.getElementById('total-pagos').textContent;
    const montoTotal = document.getElementById('monto-total').textContent;
    const pagosPendientes = document.getElementById('pagos-pendientes').textContent;
    const pagosCompletados = document.getElementById('pagos-completados').textContent;
    
    // Resumen
    doc.setFontSize(12);
    doc.text('Resumen General:', 14, 35);
    doc.setFontSize(10);
    doc.text(`Total de Pagos: ${totalPagos}`, 14, 45);
    doc.text(`Monto Total: ${montoTotal}`, 14, 55);
    doc.text(`Pagos Pendientes: ${pagosPendientes}`, 14, 65);
    doc.text(`Pagos Completados: ${pagosCompletados}`, 14, 75);
    
    // Información adicional
    doc.setFontSize(12);
    doc.text('Información del Reporte:', 14, 95);
    doc.setFontSize(10);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 14, 105);
    doc.text(`Hora: ${new Date().toLocaleTimeString('es-ES')}`, 14, 115);
    
    // Nota
    doc.setFontSize(8);
    doc.text('Nota: Este reporte incluye gráficos interactivos que se pueden visualizar en la aplicación web.', 14, 130);
    
    doc.save('estadisticas_pagos.pdf');
}

// Exportar funciones para uso en otros archivos
export { cargarEstadisticas, exportarEstadisticasPDF }; 