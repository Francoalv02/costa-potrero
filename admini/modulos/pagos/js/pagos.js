import {
  mostrarMensaje,
  altaRegistro,
  eliminarRegistro
} from '../../../recursos/js/utilidades.js';
import { cargarEstadisticas, exportarEstadisticasPDF } from './estadisticas.js';

const tablaPagos = document.getElementById('tabla-pagos');
const estadoPagoSelect = document.getElementById('estado_pago');
const filtroEstadoSelect = document.getElementById('filtro-estado');
const reservaSelect = document.getElementById('id_reserva');
const mensajeDiv = document.getElementById('mensajes');
const formulario = document.getElementById('formulario-pago');
const resultado = document.getElementById('resultado-busqueda');
const modalOverlay = document.getElementById('modal-overlay');
const btnBusquedaFlotante = document.getElementById('btn-busqueda-flotante');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');

// Elementos para el toggle del formulario
const btnToggleFormulario = document.getElementById('btn-toggle-formulario');

// Elementos para el modal de edición
const modalEditarOverlay = document.getElementById('modal-editar-overlay');
const btnCerrarModalEditar = document.getElementById('btn-cerrar-modal-editar');
const btnCancelarEditar = document.getElementById('btn-cancelar-editar');
const formEditarPago = document.getElementById('form-editar-pago');

// Cargar estados de pago
async function cargarEstadosPago() {
  try {
    const res = await fetch('/api/v1/estadopago');
    const estados = await res.json();

    estadoPagoSelect.innerHTML = '<option value="">Seleccione</option>';
    filtroEstadoSelect.innerHTML = '<option value="">Todos los estados</option>';
    
    // Cargar estados en el modal de edición
    const editarEstadoSelect = document.getElementById('editar-estado_pago');
    editarEstadoSelect.innerHTML = '<option value="">Seleccione un estado</option>';

    estados.forEach((estado) => {
      const option1 = document.createElement('option');
      option1.value = estado.id_estado_pago;
      option1.textContent = estado.nombre_estado_pago;
      estadoPagoSelect.appendChild(option1);

      const option2 = document.createElement('option');
      option2.value = estado.nombre_estado_pago.toLowerCase();
      option2.textContent = estado.nombre_estado_pago;
      filtroEstadoSelect.appendChild(option2);
      
      // Agregar opción al modal de edición
      const option3 = document.createElement('option');
      option3.value = estado.id_estado_pago;
      option3.textContent = estado.nombre_estado_pago;
      editarEstadoSelect.appendChild(option3);
    });
  } catch (error) {
    console.error('Error al cargar estados de pago:', error);
  }
}

// Cargar reservas
async function cargarReservas() {
  try {
    const res = await fetch('/api/v1/reservas');
    const reservas = await res.json();

    reservaSelect.innerHTML = '<option value="">Seleccione una reserva</option>';
    reservas.forEach((r) => {
      const option = document.createElement('option');
      option.value = r.id;
      option.textContent = `#${r.id} - ${r.nombre} (${r.nombre_cabana})`;
      reservaSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar reservas:', error);
  }
}

// Mostrar pagos en tabla
async function cargarPagos() {
  try {
    const res = await fetch('/api/v1/pagos');
    const pagos = await res.json();

    const filtro = filtroEstadoSelect.value.toLowerCase();
    tablaPagos.innerHTML = '';

    pagos
      .filter(p => !filtro || p.nombre_estado_pago.toLowerCase() === filtro)
      .forEach(p => {
        tablaPagos.innerHTML += `
          <tr>
            <td>${p.id_pago}</td>
            <td>#${p.id_reserva}</td>
            <td>${p.huesped}</td>
            <td>${p.fecha_pago}</td>
            <td>$${p.monto}</td>
            <td>${p.nombre_estado_pago}</td>
            <td>${p.metodo_pago ?? '-'}</td>
            <td>${p.observacion ?? '-'}</td>
            <td>
              <button class="btn-editar-reserva" onclick="editarPago(${p.id_pago})">✏️ Editar</button>
              <button class="btn-eliminar-reserva" onclick="eliminarPago(${p.id_pago})">🗑️ Eliminar</button>
            </td>
          </tr>
        `;
      });

    // Actualizar estadísticas después de cargar pagos
    await cargarEstadisticas();
  } catch (error) {
    console.error('Error al cargar pagos:', error);
    mostrarMensaje(mensajeDiv, 'No se pudo cargar el listado de pagos');
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
    resultado.innerHTML = '<div class="mensajes info">🔍 Buscando pago...</div>';
    
    const response = await fetch(`/api/v1/pagos/${idPago}`);
    const data = await response.json();
    
    if (response.ok) {
      // Mostrar resultado
      resultado.innerHTML = `
        <div class="gestion-pagos">
          <h2>💰 Detalles del Pago #${data.id_pago}</h2>
          
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
              <input type="text" value="${data.fecha_pago || 'N/A'}" readonly>
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
                <input type="text" value="Fecha Inicio: ${data.fechainicio || 'N/A'}" readonly style="font-size: 13px; padding: 10px 12px; border-radius: 15px; border: 2px solid #e9ecef; background: #f8f9fa; color: #2c3e50;">
                <input type="text" value="Fecha Fin: ${data.fechafin || 'N/A'}" readonly style="font-size: 13px; padding: 10px 12px; border-radius: 15px; border: 2px solid #e9ecef; background: #f8f9fa; color: #2c3e50;">
                <input type="text" value="Precio Total: $${data.preciototal || '0'}" readonly style="font-size: 13px; padding: 10px 12px; border-radius: 15px; border: 2px solid #e9ecef; background: #f8f9fa; color: #2c3e50;">
              </div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <label>Acciones:</label>
              <div class="acciones-container">
                <button class="btn-editar-reserva" onclick="editarPago(${data.id_pago})">✏️ Editar</button>
                <button class="btn-eliminar-reserva" onclick="eliminarPago(${data.id_pago})">🗑️ Eliminar</button>
              </div>
            </div>
            <div class="form-col">
              <label>Ver Reserva:</label>
              <div class="acciones-container">
                <a href="../reservas/index.html" class="btn-reservar-cabana">📋 Ver Reserva</a>
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
          <h3>❌ Pago no encontrado</h3>
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
        <h3>❌ Error al buscar el pago</h3>
        <p>Ocurrió un error al procesar la búsqueda</p>
        <button class="btn-estadisticas" onclick="modalOverlay.classList.remove('active')">Cerrar</button>
      </div>
    `;
  }
});

// Función para eliminar pago desde búsqueda
async function eliminarPago(id) {
  if (!confirm('¿Estás seguro de que quieres eliminar este pago?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/v1/pagos/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      mostrarMensaje(mensajeDiv, 'Pago eliminado exitosamente', 'success');
      // Recargar la tabla
      await cargarPagos();
      // Limpiar búsqueda
      resultado.innerHTML = '';
    } else {
      mostrarMensaje(mensajeDiv, 'Error al eliminar el pago', 'error');
    }
  } catch (error) {
    console.error(error);
    mostrarMensaje(mensajeDiv, 'Error al eliminar el pago', 'error');
  }
}

// Eliminar un pago
tablaPagos.addEventListener('click', async (evento) => {
  if (evento.target.classList.contains('eliminar')) {
    const idPago = evento.target.dataset.id;
    try {
      const respuesta = await eliminarRegistro(`/api/v1/pagos/${idPago}`);
      const datos = await respuesta.json();
      if (respuesta.ok) {
        evento.target.closest('tr').remove();
        mostrarMensaje(mensajeDiv, datos.mensaje);
        await cargarEstadisticas(); // Actualizar estadísticas
      } else {
        mostrarMensaje(mensajeDiv, 'No se pudo eliminar el pago');
      }
    } catch (error) {
      console.log(error);
      mostrarMensaje(mensajeDiv, 'Error al eliminar el pago');
    }
  }
});

// Registrar un nuevo pago
formulario.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(formulario);
  const datos = {
    id_reserva: formData.get('id_reserva'),
    id_estado_pago: formData.get('estado_pago'),
    metodo_pago: formData.get('metodo_pago'),
    observacion: formData.get('observacion')
  };

  try {
    const respuesta = await altaRegistro('/api/v1/pagos', datos);
    const resultado = await respuesta.json();
    
    if (respuesta.ok) {
      mostrarMensaje(mensajeDiv, resultado.mensaje, 'success');
      formulario.reset();
      await cargarPagos(); // Recargar tabla
      await cargarEstadisticas(); // Actualizar estadísticas
    } else {
      mostrarMensaje(mensajeDiv, resultado.mensaje || 'Error al registrar el pago', 'error');
    }
  } catch (error) {
    console.error(error);
    mostrarMensaje(mensajeDiv, 'Error al registrar el pago', 'error');
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
filtroEstadoSelect.addEventListener('change', cargarPagos);

// Toggle del formulario de registro de pago
btnToggleFormulario.addEventListener('click', () => {
  const formulario = document.getElementById('formulario-pago');
  const btnToggle = document.getElementById('btn-toggle-formulario');
  
  if (formulario.style.display === 'none' || formulario.style.display === '') {
    formulario.style.display = 'block';
    btnToggle.textContent = '▲';
  } else {
    formulario.style.display = 'none';
    btnToggle.textContent = '▼';
  }
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
    
    mostrarMensaje(mensajeDiv, '📝 Modo edición activado', 'info');
  } catch (error) {
    console.error('Error al cargar pago:', error);
    mostrarMensaje(mensajeDiv, '❌ Error al cargar datos del pago', 'error');
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
      mostrarMensaje(mensajeDiv, '✅ Pago actualizado exitosamente', 'success');
      modalEditarOverlay.classList.remove('active');
      formEditarPago.reset();
      await cargarPagos(); // Recargar tabla
      await cargarEstadisticas(); // Actualizar estadísticas
    } else {
      const errorData = await response.json();
      console.error('Error en respuesta:', errorData);
      mostrarMensaje(mensajeDiv, `❌ Error: ${errorData.mensaje || 'Error al actualizar el pago'}`, 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje(mensajeDiv, '❌ Error al procesar la solicitud', 'error');
  }
});

// Inicializar página
window.addEventListener('load', async () => {
  await cargarEstadosPago();
  await cargarReservas();
  await cargarPagos();
});
