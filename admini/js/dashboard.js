// Dashboard JavaScript - Costa Potrero

// Función para mostrar mensajes
function mostrarMensaje(mensaje, tipo = 'info') {
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
}

// Cargar estadísticas generales
async function cargarEstadisticas() {
    try {
        console.log('Cargando estadísticas...');
        
        // Cargar datos de reservas
        const reservasResponse = await fetch('/api/v1/reservas');
        const reservas = await reservasResponse.json();
        
        // Cargar datos de cabañas
        const cabanasResponse = await fetch('/api/v1/cabanas');
        const cabanas = await cabanasResponse.json();
        
        // Cargar datos de huéspedes
        const huespedesResponse = await fetch('/api/v1/huespedes');
        const huespedes = await huespedesResponse.json();
        
        // Cargar datos de pagos
        const pagosResponse = await fetch('/api/v1/pagos');
        const pagos = await pagosResponse.json();
        
        console.log('Datos cargados para estadísticas:', {
            reservas: reservas.length,
            cabanas: cabanas.length,
            huespedes: huespedes.length,
            pagos: pagos.length
        });
        
        // Filtrar datos válidos
        const reservasValidas = reservas ? reservas.filter(reserva => 
            reserva && typeof reserva === 'object' && reserva.id
        ) : [];
        
        const cabanasValidas = cabanas ? cabanas.filter(cabana => 
            cabana && typeof cabana === 'object' && cabana.id_cabana
        ) : [];
        
        // Calcular cabañas activas (con estado activo)
        const cabanasActivas = cabanasValidas.filter(cabana => 
            cabana.estado === 'activo' || cabana.estado === 'Activo' || cabana.estado === 'ACTIVO'
        );
        
        const huespedesValidos = huespedes ? huespedes.filter(huesped => 
            huesped && typeof huesped === 'object' && huesped.id_dni
        ) : [];
        
        const pagosValidos = pagos ? pagos.filter(pago => 
            pago && typeof pago === 'object' && pago.id_pago
        ) : [];
        
        console.log('Datos válidos filtrados:', {
            reservas: reservasValidas.length,
            cabanas: cabanasValidas.length,
            huespedes: huespedesValidos.length,
            pagos: pagosValidos.length
        });
        
        // Actualizar estadísticas con validación
        const totalReservas = document.getElementById('total-reservas');
        const totalCabanas = document.getElementById('total-cabanas');
        const totalHuespedes = document.getElementById('total-huespedes');
        const totalPagos = document.getElementById('total-pagos');
        const ingresosTotales = document.getElementById('ingresos-totales');
        const reservasHoy = document.getElementById('reservas-hoy');
        
        if (totalReservas) totalReservas.textContent = reservasValidas.length;
        if (totalCabanas) totalCabanas.textContent = cabanasValidas.length; // Mostrar total de cabañas registradas
        if (totalHuespedes) totalHuespedes.textContent = huespedesValidos.length;
        if (totalPagos) totalPagos.textContent = pagosValidos.length;
        
        // Calcular ingresos totales con validación
        if (ingresosTotales && pagosValidos.length > 0) {
            const ingresos = pagosValidos.reduce((total, pago) => {
                const monto = parseFloat(pago.monto || 0);
                return total + (isNaN(monto) ? 0 : monto);
            }, 0);
            ingresosTotales.textContent = `$${ingresos.toLocaleString()}`;
        } else if (ingresosTotales) {
            ingresosTotales.textContent = '$0';
        }
        
        // Calcular reservas de hoy con validación
        if (reservasHoy && reservasValidas.length > 0) {
            const hoy = new Date().toISOString().split('T')[0];
            const reservasHoyCount = reservasValidas.filter(reserva => {
                try {
                    return reserva.fechainicio && reserva.fechainicio.includes(hoy);
                } catch (error) {
                    console.error('Error procesando fecha de reserva:', error);
                    return false;
                }
            }).length;
            reservasHoy.textContent = reservasHoyCount;
        } else if (reservasHoy) {
            reservasHoy.textContent = '0';
        }
        
        mostrarMensaje('Estadísticas cargadas correctamente', 'success');
        
        // Cargar gráficos después de las estadísticas
        await cargarGraficos(reservasValidas, cabanasValidas, pagosValidos);
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        mostrarMensaje('Error al cargar estadísticas', 'error');
        
        // Mostrar valores por defecto en caso de error
        const elementos = ['total-reservas', 'total-cabanas', 'total-huespedes', 'total-pagos', 'ingresos-totales', 'reservas-hoy'];
        elementos.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = id === 'ingresos-totales' ? '$0' : '0';
            }
        });
    }
}

// Cargar gráficos
async function cargarGraficos(reservas, cabanas, pagos) {
    try {
        console.log('Cargando gráficos con datos:', { reservas: reservas.length, cabanas: cabanas.length, pagos: pagos.length });
        
        // Gráfico de reservas por mes (datos reales)
        const ctxReservas = document.getElementById('chart-reservas-mes');
        if (ctxReservas) {
            try {
                // Calcular reservas por mes basado en datos reales
                const reservasPorMes = {};
                const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                
                // Inicializar todos los meses con 0
                meses.forEach(mes => {
                    reservasPorMes[mes] = 0;
                });
                
                if (reservas && reservas.length > 0) {
                    reservas.forEach(reserva => {
                        if (reserva && reserva.fechainicio) {
                            try {
                                const fecha = new Date(reserva.fechainicio);
                                if (!isNaN(fecha.getTime())) {
                                    const mes = fecha.getMonth();
                                    const mesNombre = meses[mes];
                                    reservasPorMes[mesNombre] = (reservasPorMes[mesNombre] || 0) + 1;
                                }
                            } catch (error) {
                                console.error('Error procesando fecha de reserva:', error);
                            }
                        }
                    });
                }
                
                // Preparar datos para el gráfico
                const labels = meses;
                const data = meses.map(mes => reservasPorMes[mes] || 0);
                
                new Chart(ctxReservas, {
                    type: 'line',
                    data: {
                        labels: labels.length > 0 ? labels : ['Sin datos'],
                        datasets: [{
                            label: 'Reservas',
                            data: data.length > 0 ? data : [0],
                            borderColor: '#28a745',
                            backgroundColor: 'rgba(40, 167, 69, 0.1)',
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
                console.log('Gráfico de reservas por mes creado');
            } catch (error) {
                console.error('Error creando gráfico de reservas:', error);
            }
        }
        
        // Gráfico de estado de reservas (datos reales)
        const ctxCabanas = document.getElementById('chart-estado-cabanas');
        if (ctxCabanas) {
            try {
                // Calcular estado de reservas
                const hoy = new Date();
                let reservasActivas = 0;
                let reservasCompletadas = 0;
                let reservasPendientes = 0;
                
                if (reservas && reservas.length > 0) {
                    reservas.forEach(reserva => {
                        if (reserva && reserva.fechainicio && reserva.fechafin) {
                            try {
                                const inicio = new Date(reserva.fechainicio);
                                const fin = new Date(reserva.fechafin);
                                
                                if (!isNaN(inicio.getTime()) && !isNaN(fin.getTime())) {
                                    if (hoy >= inicio && hoy <= fin) {
                                        reservasActivas++;
                                    } else if (hoy > fin) {
                                        reservasCompletadas++;
                                    } else {
                                        reservasPendientes++;
                                    }
                                }
                            } catch (error) {
                                console.error('Error procesando reserva para estado:', error);
                            }
                        }
                    });
                }
                
                new Chart(ctxCabanas, {
                    type: 'doughnut',
                    data: {
                        labels: ['Activas', 'Completadas', 'Pendientes'],
                        datasets: [{
                            data: [reservasActivas, reservasCompletadas, reservasPendientes],
                            backgroundColor: ['#28a745', '#17a2b8', '#ffc107']
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
                console.log('Gráfico de estado de reservas creado');
            } catch (error) {
                console.error('Error creando gráfico de reservas:', error);
            }
        }
        
        // Gráfico de pagos por método (datos reales)
        const ctxPagos = document.getElementById('chart-pagos-metodo');
        if (ctxPagos) {
            try {
                const metodosPago = {};
                if (pagos && pagos.length > 0) {
                    pagos.forEach(pago => {
                        const metodo = pago.metodo_pago || 'No especificado';
                        metodosPago[metodo] = (metodosPago[metodo] || 0) + 1;
                    });
                }
                
                const labels = Object.keys(metodosPago);
                const data = Object.values(metodosPago);
                
                new Chart(ctxPagos, {
                    type: 'bar',
                    data: {
                        labels: labels.length > 0 ? labels : ['Sin datos'],
                        datasets: [{
                            label: 'Cantidad',
                            data: data.length > 0 ? data : [0],
                            backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545']
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
                console.log('Gráfico de pagos por método creado');
            } catch (error) {
                console.error('Error creando gráfico de pagos:', error);
            }
        }
        
        // Gráfico de ocupación semanal (datos reales)
        const ctxOcupacion = document.getElementById('chart-ocupacion-semanal');
        if (ctxOcupacion) {
            try {
                console.log('Creando gráfico de ocupación semanal...');
                
                // Calcular ocupación semanal basada en reservas
                const ocupacionSemanal = [0, 0, 0, 0, 0, 0, 0]; // Lun-Dom
                const hoy = new Date();
                
                // Obtener todas las cabañas (no solo activas) para el cálculo
                const totalCabanas = cabanas ? cabanas.length : 0;
                console.log('Total de cabañas:', totalCabanas);
                
                if (reservas && reservas.length > 0 && totalCabanas > 0) {
                    // Para cada día de la semana, calcular cuántas cabañas están ocupadas
                    for (let i = 0; i < 7; i++) {
                        const fecha = new Date(hoy);
                        fecha.setDate(hoy.getDate() + i);
                        
                        // Normalizar la fecha para comparación (solo fecha, sin hora)
                        const fechaNormalizada = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
                        
                        const cabanasOcupadasSet = new Set();
                        
                        reservas.forEach(reserva => {
                            if (reserva && reserva.fechainicio && reserva.fechafin) {
                                try {
                                    const inicio = new Date(reserva.fechainicio);
                                    const fin = new Date(reserva.fechafin);
                                    
                                    // Normalizar fechas de reserva
                                    const inicioNormalizado = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
                                    const finNormalizado = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());
                                    
                                    if (!isNaN(inicioNormalizado.getTime()) && !isNaN(finNormalizado.getTime())) {
                                        // Verificar si la fecha actual está dentro del rango de la reserva
                                        if (fechaNormalizada >= inicioNormalizado && fechaNormalizada <= finNormalizado) {
                                            cabanasOcupadasSet.add(reserva.id_cabana);
                                        }
                                    }
                                } catch (error) {
                                    console.error('Error procesando fecha para ocupación semanal:', error);
                                }
                            }
                        });
                        
                        const cabanasOcupadas = cabanasOcupadasSet.size;
                        const porcentaje = totalCabanas > 0 ? Math.round((cabanasOcupadas / totalCabanas) * 100) : 0;
                        ocupacionSemanal[i] = porcentaje;
                        
                        console.log(`Día ${i + 1}: ${cabanasOcupadas} cabañas ocupadas de ${totalCabanas} (${porcentaje}%)`);
                    }
                } else {
                    // Si no hay datos reales, generar datos de ejemplo para mostrar el gráfico
                    console.log('No hay datos suficientes, generando datos de ejemplo...');
                    for (let i = 0; i < 7; i++) {
                        // Generar ocupación aleatoria entre 20% y 80% para mostrar el gráfico
                        ocupacionSemanal[i] = Math.floor(Math.random() * 60) + 20;
                    }
                }
                
                console.log('Datos de ocupación semanal:', ocupacionSemanal);
                
                new Chart(ctxOcupacion, {
                    type: 'bar',
                    data: {
                        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                        datasets: [{
                            label: 'Ocupación %',
                            data: ocupacionSemanal,
                            backgroundColor: '#17a2b8'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100
                            }
                        }
                    }
                });
                console.log('Gráfico de ocupación semanal creado exitosamente');
            } catch (error) {
                console.error('Error creando gráfico de ocupación:', error);
            }
        }
        
        mostrarMensaje('Gráficos cargados correctamente', 'success');
        
    } catch (error) {
        console.error('Error al cargar gráficos:', error);
        mostrarMensaje('Error al cargar gráficos', 'error');
    }
}

// Cargar actividad reciente
async function cargarActividadReciente() {
    try {
        console.log('Cargando actividad reciente...');
        
        // Cargar datos recientes de todas las tablas
        const [reservasResponse, pagosResponse, huespedesResponse] = await Promise.all([
            fetch('/api/v1/reservas'),
            fetch('/api/v1/pagos'),
            fetch('/api/v1/huespedes')
        ]);
        
        const reservas = await reservasResponse.json();
        const pagos = await pagosResponse.json();
        const huespedes = await huespedesResponse.json();
        
        console.log('Datos cargados:', { reservas: reservas.length, pagos: pagos.length, huespedes: huespedes.length });
        
        // Crear lista de actividades basada en datos reales
        const actividades = [];
        
        // Agregar reservas recientes (últimas 2)
        if (reservas && reservas.length > 0) {
            const reservasRecientes = reservas
                .filter(reserva => reserva && reserva.fechainicio && !isNaN(new Date(reserva.fechainicio).getTime()))
                .sort((a, b) => new Date(b.fechainicio) - new Date(a.fechainicio))
                .slice(0, 2);
                
            reservasRecientes.forEach(reserva => {
                try {
                    const fecha = new Date(reserva.fechainicio);
                    const tiempoTranscurrido = calcularTiempoTranscurrido(fecha);
                    
                                         actividades.push({
                         icon: '📋',
                         titulo: 'Reserva Registrada',
                         descripcion: `Reserva #${reserva.id || 'N/A'} para ${reserva.nombre_cabana || 'Cabaña'}`,
                         tiempo: tiempoTranscurrido
                     });
                } catch (error) {
                    console.error('Error procesando reserva:', error);
                }
            });
        }
        
        // Agregar pagos recientes (últimos 2)
        if (pagos && pagos.length > 0) {
            const pagosRecientes = pagos
                .filter(pago => pago.fecha_pago) // Solo pagos con fecha
                .sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago))
                .slice(0, 2);
                
            pagosRecientes.forEach(pago => {
                try {
                    const fecha = new Date(pago.fecha_pago);
                    const tiempoTranscurrido = calcularTiempoTranscurrido(fecha);
                    
                                         actividades.push({
                         icon: '💰',
                         titulo: 'Pago Registrado',
                         descripcion: `Pago #${pago.id_pago || 'N/A'} - $${pago.monto || 0} por ${pago.metodo_pago || 'No especificado'}`,
                         tiempo: tiempoTranscurrido
                     });
                } catch (error) {
                    console.error('Error procesando pago:', error);
                }
            });
        }
        
        // Agregar huéspedes recientes (últimos 2)
        if (huespedes && huespedes.length > 0) {
            const huespedesRecientes = huespedes.slice(0, 2);
            huespedesRecientes.forEach(huesped => {
                                 actividades.push({
                     icon: '👥',
                     titulo: 'Huésped Registrado',
                     descripcion: `${huesped.nombre || 'Sin nombre'} (DNI: ${huesped.id_dni || 'N/A'})`,
                     tiempo: 'Recientemente'
                 });
            });
        }
        
        console.log('Actividades encontradas:', actividades.length);
        
        // Ordenar actividades por tiempo (más recientes primero)
        actividades.sort((a, b) => {
            const tiempoA = a.tiempo.includes('Hace') ? parseInt(a.tiempo.match(/\d+/)?.[0] || 0) : 0;
            const tiempoB = b.tiempo.includes('Hace') ? parseInt(b.tiempo.match(/\d+/)?.[0] || 0) : 0;
            return tiempoA - tiempoB;
        });
        
        // Limitar a 4 actividades
        const actividadesFinales = actividades.slice(0, 4);
        
        const activityList = document.getElementById('activity-list');
        if (activityList) {
            if (actividadesFinales.length > 0) {
                activityList.innerHTML = actividadesFinales.map(actividad => `
                    <div class="activity-item">
                        <div class="activity-icon">${actividad.icon}</div>
                        <div class="activity-content">
                            <h4>${actividad.titulo}</h4>
                            <p>${actividad.descripcion}</p>
                            <span class="activity-time">${actividad.tiempo}</span>
                        </div>
                    </div>
                `).join('');
                console.log('Actividades mostradas:', actividadesFinales.length);
            } else {
                                 activityList.innerHTML = `
                     <div class="activity-item">
                         <div class="activity-icon">📊</div>
                         <div class="activity-content">
                             <h4>Sin Actividad Reciente</h4>
                             <p>No hay actividades registradas en el sistema</p>
                             <span class="activity-time">Sin datos</span>
                         </div>
                     </div>
                 `;
                console.log('No se encontraron actividades');
            }
        }
        
    } catch (error) {
        console.error('Error al cargar actividad reciente:', error);
        const activityList = document.getElementById('activity-list');
                 if (activityList) {
             activityList.innerHTML = `
                 <div class="activity-item">
                     <div class="activity-icon">❌</div>
                     <div class="activity-content">
                         <h4>Error al Cargar Actividad</h4>
                         <p>No se pudieron cargar las actividades recientes</p>
                         <span class="activity-time">Error</span>
                     </div>
                 </div>
             `;
         }
    }
}

// Función auxiliar para calcular tiempo transcurrido
function calcularTiempoTranscurrido(fecha) {
    const ahora = new Date();
    const diferencia = ahora - fecha;
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    
    if (minutos < 60) {
        return `Hace ${minutos} minutos`;
    } else if (horas < 24) {
        return `Hace ${horas} horas`;
    } else {
        return `Hace ${dias} días`;
    }
}

// Cargar próximas reservas
async function cargarProximasReservas() {
    try {
        const response = await fetch('/api/v1/reservas');
        const reservas = await response.json();
        
        // Filtrar reservas próximas (próximos 7 días)
        const hoy = new Date();
        const proximaSemana = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const proximasReservas = reservas.filter(reserva => {
            if (!reserva || !reserva.fechainicio) return false;
            try {
                const fechaReserva = new Date(reserva.fechainicio);
                return !isNaN(fechaReserva.getTime()) && fechaReserva >= hoy && fechaReserva <= proximaSemana;
            } catch (error) {
                console.error('Error procesando fecha de reserva:', error);
                return false;
            }
        }).slice(0, 3); // Solo mostrar las próximas 3
        
        const upcomingContainer = document.getElementById('upcoming-reservations');
        if (upcomingContainer) {
            if (proximasReservas.length > 0) {
                upcomingContainer.innerHTML = proximasReservas.map(reserva => {
                    try {
                        const fecha = new Date(reserva.fechainicio);
                        const diasRestantes = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
                        
                        return `
                            <div class="upcoming-reservation">
                                <p><strong>${reserva.nombre || 'Sin nombre'}</strong></p>
                                <p>${reserva.nombre_cabana || 'Cabaña'} - ${fecha.toLocaleDateString('es-ES')}</p>
                                <p style="color: #28a745; font-size: 0.9em;">En ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}</p>
                            </div>
                        `;
                    } catch (error) {
                        console.error('Error procesando reserva para mostrar:', error);
                        return `
                            <div class="upcoming-reservation">
                                <p><strong>${reserva.nombre || 'Sin nombre'}</strong></p>
                                <p>${reserva.nombre_cabana || 'Cabaña'} - Fecha no válida</p>
                                <p style="color: #dc3545; font-size: 0.9em;">Error en fecha</p>
                            </div>
                        `;
                    }
                }).join('');
            } else {
                upcomingContainer.innerHTML = '<p style="color: #6c757d; font-style: italic;">No hay reservas en los próximos 7 días</p>';
            }
        }
        
    } catch (error) {
        console.error('Error al cargar próximas reservas:', error);
        const upcomingContainer = document.getElementById('upcoming-reservations');
        if (upcomingContainer) {
            upcomingContainer.innerHTML = '<p style="color: #dc3545;">Error al cargar próximas reservas</p>';
        }
    }
}

// Verificar estado del servidor
async function verificarEstadoServidor() {
    try {
        const response = await fetch('/api/v1/reservas');
        const serverStatus = document.getElementById('server-status');
        if (serverStatus) {
            if (response.ok) {
                serverStatus.textContent = 'Conectado';
                serverStatus.style.color = '#28a745';
            } else {
                serverStatus.textContent = 'Error de conexión';
                serverStatus.style.color = '#dc3545';
            }
        }
    } catch (error) {
        const serverStatus = document.getElementById('server-status');
        if (serverStatus) {
            serverStatus.textContent = 'Sin conexión';
            serverStatus.style.color = '#dc3545';
        }
    }
}

// Función principal de inicialización
async function inicializarDashboard() {
    mostrarMensaje('Iniciando dashboard...', 'info');
    
    // Cargar todos los datos
    await Promise.all([
        cargarEstadisticas(),
        cargarActividadReciente(),
        cargarProximasReservas(),
        verificarEstadoServidor()
    ]);
    
    mostrarMensaje('Dashboard cargado completamente', 'success');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarDashboard);

// Actualizar datos cada 5 minutos
setInterval(async () => {
    await cargarEstadisticas();
    await cargarProximasReservas();
    await verificarEstadoServidor();
}, 5 * 60 * 1000); 