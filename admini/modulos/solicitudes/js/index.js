// Variables globales
let solicitudes = [];
let solicitudSeleccionada = null;

// Cargar solicitudes al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarSolicitudes();
    
    // Event listener para el botón de actualizar
    document.getElementById('btn-actualizar').addEventListener('click', cargarSolicitudes);
    
    // Configurar event listeners para los modales
    configurarModales();
});

// Función para configurar los modales
function configurarModales() {
    // Modal de Aprobar
    const modalAprobar = document.getElementById('modal-aprobar-overlay');
    const btnCerrarAprobar = document.getElementById('btn-cerrar-modal-aprobar');
    const btnCancelarAprobar = document.getElementById('btn-cancelar-aprobar');
    const btnConfirmarAprobar = document.getElementById('btn-confirmar-aprobar');
    
    // Modal de Rechazar
    const modalRechazar = document.getElementById('modal-rechazar-overlay');
    const btnCerrarRechazar = document.getElementById('btn-cerrar-modal-rechazar');
    const btnCancelarRechazar = document.getElementById('btn-cancelar-rechazar');
    const btnConfirmarRechazar = document.getElementById('btn-confirmar-rechazar');
    
    // Modal de Eliminar
    const modalEliminar = document.getElementById('modal-eliminar-overlay');
    const btnCerrarEliminar = document.getElementById('btn-cerrar-modal-eliminar');
    const btnCancelarEliminar = document.getElementById('btn-cancelar-eliminar');
    const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');
    
    // Event listeners para cerrar modales
    btnCerrarAprobar.addEventListener('click', () => cerrarModal(modalAprobar));
    btnCancelarAprobar.addEventListener('click', () => cerrarModal(modalAprobar));
    btnCerrarRechazar.addEventListener('click', () => cerrarModal(modalRechazar));
    btnCancelarRechazar.addEventListener('click', () => cerrarModal(modalRechazar));
    btnCerrarEliminar.addEventListener('click', () => cerrarModal(modalEliminar));
    btnCancelarEliminar.addEventListener('click', () => cerrarModal(modalEliminar));
    
    // Event listeners para confirmar acciones
    btnConfirmarAprobar.addEventListener('click', confirmarAprobacion);
    btnConfirmarRechazar.addEventListener('click', confirmarRechazo);
    btnConfirmarEliminar.addEventListener('click', confirmarEliminacion);
    
    // Cerrar modales al hacer clic en el overlay
    modalAprobar.addEventListener('click', (e) => {
        if (e.target === modalAprobar) cerrarModal(modalAprobar);
    });
    modalRechazar.addEventListener('click', (e) => {
        if (e.target === modalRechazar) cerrarModal(modalRechazar);
    });
    modalEliminar.addEventListener('click', (e) => {
        if (e.target === modalEliminar) cerrarModal(modalEliminar);
    });
}

// Función para cerrar un modal
function cerrarModal(modal) {
    modal.classList.remove('active');
    // Limpiar campos
    const textareas = modal.querySelectorAll('textarea');
    textareas.forEach(textarea => textarea.value = '');
    solicitudSeleccionada = null;
}

// Función para abrir un modal
function abrirModal(modal) {
    modal.classList.add('active');
}

// Función para confirmar aprobación
async function confirmarAprobacion() {
    if (!solicitudSeleccionada) return;
    
    const observaciones = document.getElementById('observaciones-aprobar').value;
    
    try {
        mostrarMensaje('🔄 Aprobando solicitud...', 'info');
        
        const response = await fetch(`/api/v1/solicitudes/${solicitudSeleccionada}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                estado: 'Aprobada',
                observaciones: observaciones || 'Solicitud aprobada por el administrador'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarMensaje('✅ Solicitud aprobada exitosamente', 'success');
            cerrarModal(document.getElementById('modal-aprobar-overlay'));
            cargarSolicitudes();
        } else {
            mostrarMensaje('❌ Error al aprobar la solicitud: ' + (data.mensaje || 'Error desconocido'), 'error');
        }
    } catch (error) {
        console.error('Error al aprobar solicitud:', error);
        mostrarMensaje('❌ Error al aprobar la solicitud', 'error');
    }
}

// Función para confirmar rechazo
async function confirmarRechazo() {
    if (!solicitudSeleccionada) return;
    
    const motivo = document.getElementById('motivo-rechazo').value;
    
    if (!motivo.trim()) {
        mostrarMensaje('❌ Debes ingresar un motivo para el rechazo', 'error');
        return;
    }
    
    try {
        mostrarMensaje('🔄 Rechazando solicitud...', 'info');
        
        const response = await fetch(`/api/v1/solicitudes/${solicitudSeleccionada}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                estado: 'Rechazada',
                observaciones: motivo
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarMensaje('✅ Solicitud rechazada exitosamente', 'success');
            cerrarModal(document.getElementById('modal-rechazar-overlay'));
            cargarSolicitudes();
        } else {
            mostrarMensaje('❌ Error al rechazar la solicitud: ' + (data.mensaje || 'Error desconocido'), 'error');
        }
    } catch (error) {
        console.error('Error al rechazar solicitud:', error);
        mostrarMensaje('❌ Error al rechazar la solicitud', 'error');
    }
}

// Función para confirmar eliminación
async function confirmarEliminacion() {
    if (!solicitudSeleccionada) return;
    
    try {
        mostrarMensaje('🔄 Eliminando solicitud...', 'info');
        
        const response = await fetch(`/api/v1/solicitudes/${solicitudSeleccionada}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarMensaje('✅ Solicitud eliminada exitosamente', 'success');
            cerrarModal(document.getElementById('modal-eliminar-overlay'));
            cargarSolicitudes();
        } else {
            mostrarMensaje('❌ Error al eliminar la solicitud: ' + (data.mensaje || 'Error desconocido'), 'error');
        }
    } catch (error) {
        console.error('Error al eliminar solicitud:', error);
        mostrarMensaje('❌ Error al eliminar la solicitud', 'error');
    }
}

// Función para cargar las solicitudes
async function cargarSolicitudes() {
    try {
        mostrarMensaje('🔄 Cargando solicitudes...', 'info');
        
        const response = await fetch('/api/v1/solicitudes');
        const data = await response.json();
        
        if (data.success) {
            solicitudes = data.data;
            mostrarSolicitudes(solicitudes);
            mostrarMensaje(`✅ ${solicitudes.length} solicitudes cargadas`, 'success');
        } else {
            console.error('Error al cargar solicitudes:', data.mensaje);
            mostrarMensaje('❌ Error al cargar las solicitudes', 'error');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarMensaje('❌ Error de conexión al cargar las solicitudes', 'error');
    }
}

// Función para mostrar las solicitudes en la tabla
function mostrarSolicitudes(solicitudesAMostrar) {
    const tbody = document.getElementById('tabla-solicitudes');
    
    if (solicitudesAMostrar.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem; color: #6c757d;">
                    📭 No hay solicitudes para mostrar
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = solicitudesAMostrar.map(solicitud => {
        const fechaSolicitud = new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES');
        const fechaInicio = new Date(solicitud.fecha_inicio).toLocaleDateString('es-ES');
        const fechaFin = new Date(solicitud.fecha_fin).toLocaleDateString('es-ES');
        const precio = solicitud.precio_estimado ? 
            new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 0
            }).format(parseFloat(solicitud.precio_estimado)) : 'Consultar';
        
        const estadoClass = getEstadoClass(solicitud.estado);
        
        return `
            <tr>
                <td>#${solicitud.id_solicitud}</td>
                <td><strong>${solicitud.nombre}</strong></td>
                <td>
                    📧 ${solicitud.gmail}<br>
                    📞 ${solicitud.telefono}
                </td>
                <td>${solicitud.nombre_cabana || 'Cabaña #' + solicitud.id_cabana}</td>
                <td>
                    <strong>Desde:</strong> ${fechaInicio}<br>
                    <strong>Hasta:</strong> ${fechaFin}
                </td>
                <td><strong>${precio}</strong></td>
                <td>
                    <span class="${estadoClass}">
                        ${solicitud.estado}
                    </span>
                </td>
                <td>${fechaSolicitud}</td>
                <td>
                    <button class="btn-estadisticas" style="background: #28a745; margin: 0.25rem;" onclick="aprobarSolicitud(${solicitud.id_solicitud})">
                        ✅ Aprobar
                    </button>
                    <button class="btn-estadisticas" style="background: #dc3545; margin: 0.25rem;" onclick="rechazarSolicitud(${solicitud.id_solicitud})">
                        ❌ Rechazar
                    </button>
                    <button class="btn-estadisticas" style="background: #6c757d; margin: 0.25rem;" onclick="eliminarSolicitud(${solicitud.id_solicitud})">
                        🗑️ Eliminar
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Función para obtener la clase CSS del estado
function getEstadoClass(estado) {
    switch (estado) {
        case 'Pendiente':
            return 'estado-pendiente';
        case 'Aprobada':
            return 'estado-aprobada';
        case 'Rechazada':
            return 'estado-rechazada';
        default:
            return 'estado-default';
    }
}

// Función para aprobar una solicitud
async function aprobarSolicitud(id) {
    solicitudSeleccionada = id;
    abrirModal(document.getElementById('modal-aprobar-overlay'));
}

// Función para rechazar una solicitud
async function rechazarSolicitud(id) {
    solicitudSeleccionada = id;
    abrirModal(document.getElementById('modal-rechazar-overlay'));
}

// Función para eliminar una solicitud
async function eliminarSolicitud(id) {
    solicitudSeleccionada = id;
    abrirModal(document.getElementById('modal-eliminar-overlay'));
}

// Función para mostrar mensajes
function mostrarMensaje(mensaje, tipo = 'info') {
    const mensajesDiv = document.getElementById('mensajes');
    
    // Crear elemento de mensaje
    const mensajeElement = document.createElement('div');
    mensajeElement.className = `mensaje mensaje-${tipo}`;
    mensajeElement.textContent = mensaje;
    
    // Agregar al contenedor
    mensajesDiv.appendChild(mensajeElement);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        if (mensajeElement.parentNode) {
            mensajeElement.parentNode.removeChild(mensajeElement);
        }
    }, 5000);
} 