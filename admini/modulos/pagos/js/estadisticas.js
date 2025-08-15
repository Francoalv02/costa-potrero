// Variables para los gráficos
let graficoEstados, graficoMetodos, graficoMensual, graficoPromedio;

// Colores para los gráficos
const colores = [
    '#4CAF50', '#2196F3', '#FF9800', '#F44336', 
    '#9C27B0', '#00BCD4', '#FFEB3B', '#795548'
];

// Función para actualizar las tarjetas de resumen
function actualizarTarjetasResumen(pagos) {
    try {
        if (!Array.isArray(pagos)) {
            console.error('Pagos no es un array:', pagos);
            return;
        }
        
        const totalPagos = pagos.length;
        
        // Calcular monto pagado (suma de todos los pagos registrados)
        const montoPagado = pagos.reduce((sum, pago) => {
            const monto = parseFloat(pago.monto_pagado || pago.monto || 0);
            return sum + monto;
        }, 0);
        
        // Calcular pago total (suma de todas las reservas)
        const pagoTotal = pagos.reduce((sum, pago) => {
            const montoTotal = parseFloat(pago.monto_total || 0);
            return sum + montoTotal;
        }, 0);
        
        // Calcular monto restante (diferencia entre total y pagado)
        const montoRestante = pagoTotal - montoPagado;
        
        // Contar pagos con "Señado" como pendientes y "Realizado" como completados
        const pagosPendientes = pagos.filter(p => {
            const estado = p.nombre_estado_pago?.toLowerCase() || '';
            return estado.includes('señado') || estado.includes('senado');
        }).length;
        
        const pagosCompletados = pagos.filter(p => {
            const estado = p.nombre_estado_pago?.toLowerCase() || '';
            return estado.includes('realizado') || estado.includes('completado');
        }).length;

        // Actualizar elementos del DOM
        const totalElement = document.getElementById('total-pagos');
        const montoPagadoElement = document.getElementById('monto-pagado');
        const montoRestanteElement = document.getElementById('monto-restante');
        const pagoTotalElement = document.getElementById('pago-total');
        
        if (totalElement) totalElement.textContent = totalPagos;
        if (montoPagadoElement) montoPagadoElement.textContent = `$${montoPagado.toLocaleString('es-AR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        if (montoRestanteElement) {
            montoRestanteElement.textContent = `$${montoRestante.toLocaleString('es-AR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
            // Aplicar color según el monto restante
            if (montoRestante > 0) {
                montoRestanteElement.style.color = '#dc3545'; // Rojo si hay deuda
            } else {
                montoRestanteElement.style.color = '#28a745'; // Verde si está completo
            }
        }
        if (pagoTotalElement) pagoTotalElement.textContent = `$${pagoTotal.toLocaleString('es-AR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        
        console.log('Tarjetas de resumen actualizadas:', {
            total: totalPagos,
            montoPagado: montoPagado,
            montoRestante: montoRestante,
            pagoTotal: pagoTotal,
            pagosPendientes: pagosPendientes,
            pagosCompletados: pagosCompletados
        });
        
    } catch (error) {
        console.error('Error al actualizar tarjetas de resumen:', error);
    }
}

// Función para crear gráfico de pagos por estado
function crearGraficoEstados(pagos) {
    try {
        const ctx = document.getElementById('grafico-estados');
        if (!ctx) {
            console.error('Elemento grafico-estados no encontrado');
            return;
        }
        
        // Agrupar pagos por estado
        const estados = {};
        pagos.forEach(pago => {
            const estado = pago.nombre_estado_pago || 'Sin especificar';
            estados[estado] = (estados[estado] || 0) + 1;
        });

        const labels = Object.keys(estados);
        const data = Object.values(estados);
        
        console.log('Datos para gráfico de estados:', { labels, data });

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
        
        console.log('Gráfico de estados creado correctamente');
        
    } catch (error) {
        console.error('Error al crear gráfico de estados:', error);
    }
}

// Función para crear gráfico de pagos por método
function crearGraficoMetodos(pagos) {
    try {
        const ctx = document.getElementById('grafico-metodos');
        if (!ctx) {
            console.error('Elemento grafico-metodos no encontrado');
            return;
        }
        
        // Agrupar pagos por método
        const metodos = {};
        pagos.forEach(pago => {
            const metodo = pago.metodo_pago || 'Sin especificar';
            metodos[metodo] = (metodos[metodo] || 0) + 1;
        });

        const labels = Object.keys(metodos);
        const data = Object.values(metodos);
        
        console.log('Datos para gráfico de métodos:', { labels, data });

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
                    borderColor: colores.slice(0, labels.length).map(color => color.replace('0.8', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed} pago(s)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
        
        console.log('Gráfico de métodos creado correctamente');
        
    } catch (error) {
        console.error('Error al crear gráfico de métodos:', error);
    }
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
        console.log('Cargando estadísticas de pagos...');
        
        const res = await fetch('/api/v1/pagos');
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const pagos = await res.json();
        console.log('Pagos recibidos para estadísticas:', pagos.length);

        // Actualizar tarjetas de resumen
        actualizarTarjetasResumen(pagos);

        // Crear gráficos
        crearGraficoEstados(pagos);
        crearGraficoMetodos(pagos);
        
        console.log('Estadísticas cargadas correctamente');

    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        
        // Mostrar mensaje de error en la interfaz
        const mensajes = document.getElementById('mensajes');
        if (mensajes) {
            mostrarMensaje(mensajes, '❌ Error al cargar las estadísticas', 'error');
        }
    }
}

// Función para exportar estadísticas a PDF usando jsPDF
async function exportarEstadisticasPDF() {
  try {
    // Verificar que jsPDF esté disponible
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      mostrarMensaje(document.getElementById('mensajes'), '❌ Error: jsPDF no está disponible', 'error');
      return;
    }

    // Mostrar mensaje de carga
    const mensajes = document.getElementById('mensajes');
    if (mensajes) {
      mostrarMensaje(mensajes, '📄 Generando reporte PDF de estadísticas...', 'info');
    }

    // Obtener datos actuales de las estadísticas
    const totalPagos = document.getElementById('total-pagos')?.textContent || '0';
    const montoPagado = document.getElementById('monto-pagado')?.textContent || '$0';
    const montoRestante = document.getElementById('monto-restante')?.textContent || '$0';
    const pagoTotal = document.getElementById('pago-total')?.textContent || '$0';

    // Crear el PDF
    const doc = new jsPDF();
    
    // Título principal
    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80);
    doc.text('Reporte de Estadísticas de Pagos', 14, 20);
    doc.text('Costa Potrero', 14, 30);
    
    // Información del reporte
    doc.setFontSize(12);
    doc.setTextColor(127, 140, 141);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 14, 45);
    doc.text(`Hora: ${new Date().toLocaleTimeString('es-ES')}`, 14, 55);
    
    // Resumen de estadísticas
    doc.setFontSize(16);
    doc.setTextColor(44, 62, 80);
    doc.text('Resumen de Estadísticas:', 14, 75);
    
    doc.setFontSize(12);
    doc.setTextColor(52, 73, 94);
    doc.text(`Total de Pagos: ${totalPagos}`, 14, 90);
    doc.text(`Monto Pagado: ${montoPagado}`, 14, 100);
    doc.text(`Monto Restante: ${montoRestante}`, 14, 110);
    doc.text(`Pago Total: ${pagoTotal}`, 14, 125);
    
    // Agregar gráficos como imágenes
    try {
      // Gráfico de estados
      const graficoEstados = document.getElementById('grafico-estados');
      if (graficoEstados) {
        const canvasEstados = graficoEstados;
        const imgDataEstados = canvasEstados.toDataURL('image/png');
        doc.addImage(imgDataEstados, 'PNG', 14, 140, 80, 60);
        doc.text('Gráfico: Pagos por Estado', 14, 205);
      }
      
      // Gráfico de métodos
      const graficoMetodos = document.getElementById('grafico-metodos');
      if (graficoMetodos) {
        const canvasMetodos = graficoMetodos;
        const imgDataMetodos = canvasMetodos.toDataURL('image/png');
        doc.addImage(imgDataMetodos, 'PNG', 110, 140, 80, 60);
        doc.text('Gráfico: Pagos por Método', 110, 205);
      }
    } catch (error) {
      console.error('Error al agregar gráficos:', error);
      doc.text('Nota: Los gráficos no pudieron ser incluidos', 14, 140);
    }
    
    // Información adicional
    doc.setFontSize(10);
    doc.setTextColor(127, 140, 141);
    doc.text('Este reporte incluye:', 14, 220);
    doc.text('• Resumen de pagos y montos', 14, 230);
    doc.text('• Gráficos de distribución por estado y método', 14, 240);
    doc.text('• Análisis financiero del sistema', 14, 250);
    
    // Pie de página
    doc.setFontSize(8);
    doc.text('Reporte generado automáticamente por el sistema de Costa Potrero', 14, 270);
    
    // Guardar el PDF
    const fecha = new Date().toISOString().split('T')[0];
    const hora = new Date().toLocaleTimeString('es-ES').replace(/:/g, '-');
    doc.save(`estadisticas_pagos_${fecha}_${hora}.pdf`);
    
    // Mostrar mensaje de éxito
    if (mensajes) {
      mostrarMensaje(mensajes, '✅ Reporte PDF de estadísticas generado exitosamente', 'success');
    }
    
  } catch (error) {
    console.error('Error al exportar estadísticas PDF:', error);
    
    // Mostrar mensaje de error
    const mensajes = document.getElementById('mensajes');
    if (mensajes) {
      mostrarMensaje(mensajes, '❌ Error al generar el reporte PDF de estadísticas', 'error');
    }
  }
}

// Función auxiliar para mostrar mensajes (si no está disponible)
function mostrarMensaje(container, mensaje, tipo = 'info') {
    if (!container) return;
    
    const mensajeElement = document.createElement('div');
    mensajeElement.className = `mensaje mensaje-${tipo}`;
    mensajeElement.textContent = mensaje;
    
    container.appendChild(mensajeElement);
    
    // Remover mensaje después de 5 segundos
    setTimeout(() => {
        if (mensajeElement.parentNode) {
            mensajeElement.parentNode.removeChild(mensajeElement);
        }
    }, 5000);
}

// Exportar funciones para uso en otros archivos
export { cargarEstadisticas, exportarEstadisticasPDF }; 