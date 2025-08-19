import {
  mostrarMensaje,
  altaRegistro,
  eliminarRegistro
} from '../../../recursos/js/utilidades.js';
import { cargarEstadisticas, exportarEstadisticasPDF } from './estadisticas.js';

// Función para formatear fechas (solo fecha, sin hora)
function formatearFecha(fecha) {
  if (!fecha) return 'N/A';
  try {
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('es-ES');
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'N/A';
  }
}

const tablaPagos = document.getElementById('tabla-pagos');
const filtroEstadoSelect = document.getElementById('filtro-estado');
const mensajeDiv = document.getElementById('mensajes');
const resultado = document.getElementById('resultado-busqueda');
const modalOverlay = document.getElementById('modal-overlay');
const btnBusquedaFlotante = document.getElementById('btn-busqueda-flotante');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');

// Elementos para el modal de edición
const modalEditarOverlay = document.getElementById('modal-editar-overlay');
const btnCerrarModalEditar = document.getElementById('btn-cerrar-modal-editar');
const btnCancelarEditar = document.getElementById('btn-cancelar-editar');
const formEditarPago = document.getElementById('form-editar-pago');

// Cargar estados de pago (para filtro y modal de edición)
async function cargarEstadosPago() {
  try {
    console.log('Iniciando cargarEstadosPago...');
    
    // Verificar que los elementos del DOM existan
    if (!filtroEstadoSelect) {
      console.error('filtroEstadoSelect no encontrado');
      return;
    }
    
    console.log('Elementos del DOM encontrados correctamente');
    
    const res = await fetch('/api/v1/pagos/estadopago');
    console.log('Respuesta de la API estados:', res.status);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const estados = await res.json();
    console.log('Estados recibidos:', estados);

    filtroEstadoSelect.innerHTML = '<option value="">Todos los estados</option>';
    
    // Cargar estados en el modal de edición
    const editarEstadoSelect = document.getElementById('editar-estado_pago');
    if (editarEstadoSelect) {
      editarEstadoSelect.innerHTML = '<option value="">Seleccione un estado</option>';
    } else {
      console.error('editar-estado_pago no encontrado');
    }

    if (Array.isArray(estados)) {
    estados.forEach((estado) => {
        console.log('Procesando estado:', estado);

        // Opción para el filtro
      const option2 = document.createElement('option');
      option2.value = estado.nombre_estado_pago.toLowerCase();
      option2.textContent = estado.nombre_estado_pago;
      filtroEstadoSelect.appendChild(option2);
        
        // Opción para el modal de edición
        if (editarEstadoSelect) {
          const option3 = document.createElement('option');
          option3.value = estado.id_estado_pago;
          option3.textContent = estado.nombre_estado_pago;
          editarEstadoSelect.appendChild(option3);
        }
      });
      
      console.log('Estados cargados correctamente en filtro:', filtroEstadoSelect.children.length, 'opciones');
    } else {
      console.error('Formato de estados inválido:', estados);
    }
  } catch (error) {
    console.error('Error al cargar estados de pago:', error);
  }
}

// Mostrar pagos en tabla
async function cargarPagos() {
  try {
    console.log('Iniciando cargarPagos...');
    
    // Verificar que los elementos del DOM existan
    if (!tablaPagos) {
      console.error('tablaPagos no encontrado');
      return;
    }
    
    if (!filtroEstadoSelect) {
      console.error('filtroEstadoSelect no encontrado');
      return;
    }
    
    console.log('Elementos del DOM encontrados correctamente');
    
    const res = await fetch('/api/v1/pagos');
    console.log('Respuesta de la API pagos:', res.status);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const pagos = await res.json();
    console.log('Pagos recibidos:', pagos);

    const filtro = filtroEstadoSelect.value.toLowerCase();
    console.log('Filtro aplicado:', filtro);
    
    tablaPagos.innerHTML = '';

    if (Array.isArray(pagos)) {
      const pagosFiltrados = pagos.filter(p => !filtro || p.nombre_estado_pago.toLowerCase() === filtro);
      console.log('Pagos filtrados:', pagosFiltrados.length, 'de', pagos.length);
      
      pagosFiltrados.forEach(p => {
        // Determinar el color de fondo según el estado
        const estadoColor = obtenerColorEstado(p.nombre_estado_pago);
        const montoTotal = parseFloat(p.monto_total || 0);
        
        // Calcular pago restante según el estado
        let pagoRestante, pagoRestanteColor, pagoRestanteTexto;
        
        if (p.nombre_estado_pago.toLowerCase() === 'realizado' || p.nombre_estado_pago.toLowerCase() === 'completado') {
          // Pago completo - no hay restante
          pagoRestante = 0;
          pagoRestanteColor = '#28a745'; // Verde
          pagoRestanteTexto = 'Completado';
        } else if (p.nombre_estado_pago.toLowerCase() === 'señado' || p.nombre_estado_pago.toLowerCase() === 'señado') {
          // Pago parcial - falta la mitad
          pagoRestante = montoTotal / 2;
          pagoRestanteColor = '#dc3545'; // Rojo
          pagoRestanteTexto = new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0
          }).format(pagoRestante);
        } else {
          // Otros estados
          pagoRestante = montoTotal;
          pagoRestanteColor = '#6c757d'; // Gris
          pagoRestanteTexto = new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0
          }).format(pagoRestante);
        }
        
        // Formatear monto total
        const montoTotalFormateado = new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
          minimumFractionDigits: 0
        }).format(montoTotal);
        
        tablaPagos.innerHTML += `
          <tr style="background-color: ${estadoColor};">
            <td>${p.id_pago}</td>
            <td>#${p.id_reserva}</td>
            <td>${p.huesped}</td>
            <td>${formatearFecha(p.fecha_pago)}</td>
            <td>
              <span class="estado-badge" style="
                background-color: ${estadoColor === '#fff3cd' ? '#ffc107' : '#28a745'};
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.85em;
                font-weight: bold;
              ">
                ${p.nombre_estado_pago}
              </span>
            </td>
            <td style="font-weight: bold; color: #495057; font-size: 14px;">
              ${montoTotalFormateado}
            </td>
            <td style="font-weight: bold; color: ${pagoRestanteColor}; font-size: 14px; text-align: center;">
              ${pagoRestanteTexto}
            </td>
            <td>${p.metodo_pago ?? '-'}</td>
            <td>${p.observacion ?? '-'}</td>
            <td>
              <button class="btn-editar-reserva" onclick="editarPago(${p.id_pago})">Editar</button>
              <button class="btn-eliminar-reserva" data-id="${p.id_pago}">Eliminar</button>
            </td>
          </tr>
        `;
      });
    } else {
      console.error('Formato de pagos inválido:', pagos);
    }

    // Actualizar estadísticas después de cargar pagos
    await cargarEstadisticas();
    console.log('Pagos cargados correctamente');
  } catch (error) {
    console.error('Error al cargar pagos:', error);
    mostrarMensaje(mensajeDiv, 'No se pudo cargar el listado de pagos');
  }
}

// Función para obtener el color de fondo según el estado del pago
function obtenerColorEstado(estado) {
  const estadoLower = estado.toLowerCase();
  
  switch (estadoLower) {
    case 'señado':
    case 'señado':
      return '#fff3cd'; // Amarillo claro para pagos parciales
    case 'realizado':
    case 'completado':
      return '#d4edda'; // Verde claro para pagos completos
    case 'pendiente':
      return '#f8d7da'; // Rojo claro para pagos pendientes
    default:
      return '#ffffff'; // Blanco por defecto
  }
}

// Abrir modal de búsqueda
btnBusquedaFlotante.addEventListener('click', () => {
  modalOverlay.classList.add('active');
  document.getElementById('id_pago').focus();
});

// Cerrar modal de búsqueda
btnCerrarModal.addEventListener('click', () => {
  modalOverlay.classList.remove('active');
  document.getElementById('id_pago').value = '';
  resultado.innerHTML = '';
});

// Cerrar modal al hacer clic en el overlay
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.classList.remove('active');
    document.getElementById('id_pago').value = '';
    resultado.innerHTML = '';
  }
});

// Cerrar modal con Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (modalOverlay.classList.contains('active')) {
      modalOverlay.classList.remove('active');
      document.getElementById('id_pago').value = '';
      resultado.innerHTML = '';
    }
    if (modalEditarOverlay.classList.contains('active')) {
      modalEditarOverlay.classList.remove('active');
      formEditarPago.reset();
    }
  }
});

// Búsqueda por ID
const formBuscar = document.getElementById('form-buscar-pago');
formBuscar.addEventListener('submit', async (e) => {
  e.preventDefault();

  const idPago = document.getElementById('id_pago').value;
  
  if (!idPago || idPago < 1) {
    mostrarMensaje(mensajeDiv, 'Por favor ingresa un ID válido', 'error');
    return;
  }
  
  try {
    // Mostrar loading dentro del modal
    resultado.innerHTML = '<div class="mensajes info">Buscando pago...</div>';
    
    const response = await fetch(`/api/v1/pagos/${idPago}`);
    const data = await response.json();
    
    if (response.ok) {
      // Mostrar resultado
      resultado.innerHTML = `
        <div class="gestion-pagos">
          <h2>Detalles del Pago #${data.id_pago}</h2>
          
          <div class="form-row">
            <div class="form-col">
              <label>ID de Pago:</label>
              <input type="text" value="${data.id_pago}" readonly>
            </div>
            <div class="form-col">
              <label>ID de Reserva:</label>
              <input type="text" value="${data.id_reserva}" readonly>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <label>Huésped:</label>
              <input type="text" value="${data.huesped || 'N/A'}" readonly>
            </div>
            <div class="form-col">
              <label>DNI:</label>
              <input type="text" value="${data.id_dni || 'N/A'}" readonly>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <label>Cabaña:</label>
              <input type="text" value="${data.nombre_cabana || 'N/A'}" readonly>
            </div>
            <div class="form-col">
              <label>ID Cabaña:</label>
              <input type="text" value="${data.id_cabana || 'N/A'}" readonly>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <label>Monto Pagado:</label>
              <input type="text" value="$${data.monto || '0'}" readonly>
            </div>
            <div class="form-col">
              <label>Estado del Pago:</label>
              <input type="text" value="${data.nombre_estado_pago || 'N/A'}" readonly>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <label>Método de Pago:</label>
              <input type="text" value="${data.metodo_pago || 'N/A'}" readonly>
            </div>
            <div class="form-col">
              <label>Fecha de Pago:</label>
              <input type="text" value="${formatearFecha(data.fecha_pago)}" readonly>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <label>Observación:</label>
              <textarea readonly style="width: 100%; height: 60px; padding: 12px 15px; border-radius: 20px; border: 2px solid #e9ecef; resize: none; background: #f8f9fa; color: #2c3e50; font-weight: 500;">${data.observacion || 'Sin observaciones'}</textarea>
            </div>
            <div class="form-col">
              <label>Datos de la Reserva:</label>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <input type="text" value="Fecha Inicio: ${formatearFecha(data.fechainicio)}" readonly style="font-size: 13px; padding: 10px 12px; border-radius: 15px; border: 2px solid #e9ecef; background: #f8f9fa; color: #2c3e50;">
                <input type="text" value="Fecha Fin: ${formatearFecha(data.fechafin)}" readonly style="font-size: 13px; padding: 10px 12px; border-radius: 15px; border: 2px solid #e9ecef; background: #f8f9fa; color: #2c3e50;">
                <input type="text" value="Precio Total: $${data.preciototal || '0'}" readonly style="font-size: 13px; padding: 10px 12px; border-radius: 15px; border: 2px solid #e9ecef; background: #f8f9fa; color: #2c3e50;">
              </div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <label>Acciones:</label>
              <div class="acciones-container">
                <button class="btn-editar-reserva" onclick="editarPago(${data.id_pago})">Editar</button>
                <button class="btn-eliminar-reserva" onclick="eliminarPago(${data.id_pago})">Eliminar</button>
              </div>
            </div>
            <div class="form-col">
              <label>Ver Reserva:</label>
              <div class="acciones-container">
                <a href="../reservas/index.html" class="btn-reservar-cabana">Ver Reserva</a>
              </div>
            </div>
          </div>
        </div>
      `;
      
      mostrarMensaje(mensajeDiv, 'Pago encontrado exitosamente', 'success');
  } else {
      // Mostrar mensaje de error dentro del modal
      resultado.innerHTML = `
        <div class="mensajes error">
          <h3>Pago no encontrado</h3>
          <p>No se encontró un pago con el ID ${idPago}</p>
          <button class="btn-estadisticas" onclick="modalOverlay.classList.remove('active')">Cerrar</button>
        </div>
      `;
    }
  } catch (error) {
    console.error(error);
    // Mostrar error dentro del modal
    resultado.innerHTML = `
      <div class="mensajes error">
        <h3>Error al buscar el pago</h3>
        <p>Ocurrió un error al procesar la búsqueda</p>
        <button class="btn-estadisticas" onclick="modalOverlay.classList.remove('active')">Cerrar</button>
      </div>
    `;
  }
});

// Función para eliminar pago desde búsqueda
async function eliminarPago(id) {
  try {
    const response = await fetch(`/api/v1/pagos/${id}`, {
      method: 'DELETE'
    });
    
    const datos = await response.json();
    
    if (response.ok) {
      mostrarMensaje(mensajeDiv, 'Pago eliminado exitosamente', 'success');
      // Recargar la tabla
      await cargarPagos();
      // Limpiar búsqueda
      resultado.innerHTML = '';
    } else {
      // Manejar diferentes tipos de error
      if (datos.tipo === 'TIENE_RESERVAS') {
        mostrarMensaje(mensajeDiv, ` ${datos.mensaje}`, 'error');
        if (datos.detalle) {
          mostrarMensaje(mensajeDiv, ` ${datos.detalle}`, 'info');
        }
      } else if (datos.tipo === 'NO_ENCONTRADO') {
        mostrarMensaje(mensajeDiv, ` ${datos.mensaje}`, 'error');
      } else {
        mostrarMensaje(mensajeDiv, ` ${datos.mensaje || 'Error al eliminar el pago'}`, 'error');
      }
    }
  } catch (error) {
    console.error('Error al eliminar pago:', error);
    mostrarMensaje(mensajeDiv, 'Error de conexión al eliminar el pago', 'error');
  }
}

// Eliminar un pago (delegación en la grilla)
tablaPagos.addEventListener('click', async (evento) => {
  if (evento.target.classList.contains('btn-eliminar-reserva')) {
    const idPago = evento.target.dataset.id;
    if (!idPago) return;
    await eliminarPago(idPago);
  }
});


// Generar Reportes
document.getElementById('btn-reporte-pagos').addEventListener('click', async () => {
  try {
    const estadoFiltro = document.getElementById('filtro-estado').value.toLowerCase();

    // Obtener pagos desde el backend
    const res = await fetch('/api/v1/pagos');
    const pagos = await res.json();

    // Filtrar pagos si hay un estado seleccionado
    const pagosFiltrados = pagos.filter(p =>
      !estadoFiltro || p.nombre_estado_pago.toLowerCase() === estadoFiltro
    );

    if (pagosFiltrados.length === 0) {
      alert('No hay pagos para mostrar en el reporte.');
      return;
    }

    // Crear reporte usando el backend
    const reporteResponse = await fetch('/api/v1/pagos/reporte', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        estado: estadoFiltro || null
      })
    });

    if (reporteResponse.ok) {
      const blob = await reporteResponse.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Generar fecha actual para el nombre del archivo
      const fechaActual = new Date();
      const dia = fechaActual.getDate().toString().padStart(2, '0');
      const mes = (fechaActual.getMonth() + 1).toString().padStart(2, '0');
      const año = fechaActual.getFullYear();
      const fechaFormateada = `${dia}-${mes}-${año}`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_pagos_${fechaFormateada}.pdf`;
      link.click();
      
      window.URL.revokeObjectURL(url);
      mostrarMensaje(mensajeDiv, 'Reporte generado exitosamente', 'success');
    } else {
      throw new Error('Error al generar el reporte');
    }
  } catch (error) {
    console.error(error);
    mostrarMensaje(mensajeDiv, 'Error al generar el reporte', 'error');
  }
});

// Event listeners para estadísticas
document.getElementById('btn-actualizar-estadisticas').addEventListener('click', async () => {
  await cargarEstadisticas();
  mostrarMensaje(mensajeDiv, 'Estadísticas actualizadas', 'success');
});

document.getElementById('btn-exportar-estadisticas').addEventListener('click', async () => {
  try {
    await exportarEstadisticasPDF();
    mostrarMensaje(mensajeDiv, 'Estadísticas exportadas exitosamente', 'success');
  } catch (error) {
    console.error(error);
    mostrarMensaje(mensajeDiv, 'Error al exportar estadísticas', 'error');
  }
});

// Filtro de estado
filtroEstadoSelect.addEventListener('change', async (e) => {
  console.log('Filtro de estado cambiado a:', e.target.value);
  await cargarPagos();
});


// Funciones para el modal de edición
btnCerrarModalEditar.addEventListener('click', () => {
  modalEditarOverlay.classList.remove('active');
  formEditarPago.reset();
});

btnCancelarEditar.addEventListener('click', () => {
  modalEditarOverlay.classList.remove('active');
  formEditarPago.reset();
});

// Cerrar modal editar al hacer clic en el overlay
modalEditarOverlay.addEventListener('click', (e) => {
  if (e.target === modalEditarOverlay) {
    modalEditarOverlay.classList.remove('active');
    formEditarPago.reset();
  }
});

// Función global para editar pago
window.editarPago = async (idPago) => {
  try {
    console.log('Iniciando edición para pago:', idPago);
    
    const res = await fetch(`/api/v1/pagos/${idPago}`);
    console.log('Respuesta de la API:', res.status);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const pago = await res.json();
    console.log('Datos del pago:', pago);
    
    // Llenar formulario de edición con datos del pago
    document.getElementById('editar-id_pago').value = pago.id_pago;
    document.getElementById('editar-id_reserva').value = pago.id_reserva;
    document.getElementById('editar-estado_pago').value = pago.id_estado_pago || '';
    document.getElementById('editar-metodo_pago').value = pago.metodo_pago || '';
    document.getElementById('editar-observacion').value = pago.observacion || '';
    
    console.log('Formulario llenado correctamente');
    
    // Abrir modal de edición
    modalEditarOverlay.classList.add('active');
    
    mostrarMensaje(mensajeDiv, 'Modo edición activado', 'info');
  } catch (error) {
    console.error('Error al cargar pago:', error);
    mostrarMensaje(mensajeDiv, 'Error al cargar datos del pago', 'error');
  }
};

// Manejar envío del formulario de edición
formEditarPago.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const datos = {
    id_pago: document.getElementById('editar-id_pago').value,
    id_reserva: document.getElementById('editar-id_reserva').value,
    estado_pago: document.getElementById('editar-estado_pago').value,
    metodo_pago: document.getElementById('editar-metodo_pago').value,
    observacion: document.getElementById('editar-observacion').value
  };

  try {
    console.log('Enviando datos de actualización:', datos);
    
    const response = await fetch(`/api/v1/pagos/${datos.id_pago}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    console.log('Respuesta de actualización:', response.status);

    if (response.ok) {
      mostrarMensaje(mensajeDiv, 'Pago actualizado exitosamente', 'success');
      modalEditarOverlay.classList.remove('active');
      formEditarPago.reset();
      await cargarPagos(); // Recargar tabla
      await cargarEstadisticas(); // Actualizar estadísticas
    } else {
      const errorData = await response.json();
      console.error('Error en respuesta:', errorData);
      mostrarMensaje(mensajeDiv, `Error: ${errorData.mensaje || 'Error al actualizar el pago'}`, 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje(mensajeDiv, 'Error al procesar la solicitud', 'error');
  }
});

// Inicializar página
window.addEventListener('load', async () => {
  console.log('Página de pagos cargada, iniciando...');
  
  try {
    console.log('Llamando a cargarEstadosPago...');
  await cargarEstadosPago();
    console.log('Estados de pago cargados');
    
    console.log('Llamando a cargarPagos...');
  await cargarPagos();
    console.log('Pagos cargados');
    
    console.log('Inicialización completada');
  } catch (error) {
    console.error('Error en la inicialización:', error);
  }
});
