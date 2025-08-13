// Variables globales
let solicitudes = [];

// Cargar solicitudes al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarSolicitudes();
    
    // Event listener para el botón de actualizar
    document.getElementById('btn-actualizar').addEventListener('click', cargarSolicitudes);
});

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
    if (!confirm('¿Estás seguro de que deseas aprobar esta solicitud?')) {
        return;
    }
    
    try {
        mostrarMensaje('🔄 Aprobando solicitud...', 'info');
        
        const response = await fetch(`/api/v1/solicitudes/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                estado: 'Aprobada',
                observaciones: 'Solicitud aprobada por el administrador'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarMensaje('✅ Solicitud aprobada exitosamente', 'success');
            cargarSolicitudes();
        } else {
            mostrarMensaje('❌ Error al aprobar la solicitud: ' + (data.mensaje || 'Error desconocido'), 'error');
        }
    } catch (error) {
        console.error('Error al aprobar solicitud:', error);
        mostrarMensaje('❌ Error al aprobar la solicitud', 'error');
    }
}

// Función para rechazar una solicitud
async function rechazarSolicitud(id) {
    const observaciones = prompt('Ingresa el motivo del rechazo (opcional):');
    
    if (!confirm('¿Estás seguro de que deseas rechazar esta solicitud?')) {
        return;
    }
    
    try {
        mostrarMensaje('🔄 Rechazando solicitud...', 'info');
        
        const response = await fetch(`/api/v1/solicitudes/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                estado: 'Rechazada',
                observaciones: observaciones || 'Solicitud rechazada por el administrador'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarMensaje('✅ Solicitud rechazada exitosamente', 'success');
            cargarSolicitudes();
        } else {
            mostrarMensaje('❌ Error al rechazar la solicitud: ' + (data.mensaje || 'Error desconocido'), 'error');
        }
    } catch (error) {
        console.error('Error al rechazar solicitud:', error);
        mostrarMensaje('❌ Error al rechazar la solicitud', 'error');
    }
}

// Función para eliminar una solicitud
async function eliminarSolicitud(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta solicitud? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        mostrarMensaje('🔄 Eliminando solicitud...', 'info');
        
        const response = await fetch(`/api/v1/solicitudes/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarMensaje('✅ Solicitud eliminada exitosamente', 'success');
            cargarSolicitudes();
        } else {
            mostrarMensaje('❌ Error al eliminar la solicitud: ' + (data.mensaje || 'Error desconocido'), 'error');
        }
    } catch (error) {
        console.error('Error al eliminar solicitud:', error);
        mostrarMensaje('❌ Error al eliminar la solicitud', 'error');
    }
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