import {
  procesarFormulario,
  mostrarMensaje,
  traerRegistro,
  eliminarRegistro
} from '../../../recursos/js/utilidades.js';

const contenedorReservas = document.getElementById('contenedor-reservas');
const resultado = document.getElementById('resultado-busqueda');
const mensajes = document.getElementById('mensajes');
const modalOverlay = document.getElementById('modal-overlay');
const btnBusquedaFlotante = document.getElementById('btn-busqueda-flotante');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');

// Variables para filtros
let reservasOriginales = [];
let filtrosAplicados = false;

// Cargar estados desde la BD y agregarlos al select
async function cargarEstados() {
  try {
    const respuesta = await fetch('/api/v1/estados');
    const estados = await respuesta.json();

    // Cargar en filtros
    const selectEstado = document.getElementById('filtro-estado');
    
    estados.forEach(estado => {
      const option = document.createElement('option');
      option.value = estado.nombreestado;
      option.textContent = estado.nombreestado;
      selectEstado.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar los estados:', error);
  }
}

// Cargar cabañas para filtros
async function cargarCabanas() {
  try {
    const respuesta = await fetch('/api/v1/cabanas');
    const cabanas = await respuesta.json();

    const selectCabana = document.getElementById('filtro-cabana');
    
    cabanas.forEach(cabana => {
      const option = document.createElement('option');
      option.value = cabana.nombre_cabana;
      option.textContent = cabana.nombre_cabana;
      selectCabana.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar las cabañas:', error);
  }
}

// Aplicar filtros
async function aplicarFiltros() {
  const fechaInicio = document.getElementById('filtro-fecha-inicio').value;
  const fechaFin = document.getElementById('filtro-fecha-fin').value;
  const estado = document.getElementById('filtro-estado').value;
  const cabana = document.getElementById('filtro-cabana').value;

  // Construir parámetros de filtro
  const filtros = {};
  if (fechaInicio) filtros.fechaInicio = fechaInicio;
  if (fechaFin) filtros.fechaFin = fechaFin;
  if (estado) filtros.estado = estado;
  if (cabana) filtros.cabana = cabana;

  try {
    // Mostrar loading
    mostrarMensaje(mensajes, '🔍 Aplicando filtros...', 'info');
    
    // Construir URL con filtros
    const params = new URLSearchParams();
    Object.keys(filtros).forEach(key => {
      params.append(key, filtros[key]);
    });

    const respuesta = await fetch(`/api/v1/reservas/filtros?${params.toString()}`);
    const reservasFiltradas = await respuesta.json();

    // Mostrar reservas filtradas
    mostrarReservas(reservasFiltradas);
    
    // Actualizar información de filtros
    actualizarInfoFiltros(filtros, reservasFiltradas.length);
    
    filtrosAplicados = true;
    mostrarMensaje(mensajes, `✅ Filtros aplicados. Se encontraron ${reservasFiltradas.length} reservas.`, 'success');
    
    // Hacer scroll hacia la grilla para mostrar los resultados
    setTimeout(() => {
      const grillaSection = document.querySelector('.section-grilla');
      if (grillaSection) {
        grillaSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 500);
    
  } catch (error) {
    console.error('Error al aplicar filtros:', error);
    mostrarMensaje(mensajes, '❌ Error al aplicar los filtros', 'error');
  }
}

// Limpiar filtros
function limpiarFiltros() {
  // Limpiar todos los campos de filtro
  document.getElementById('filtro-fecha-inicio').value = '';
  document.getElementById('filtro-fecha-fin').value = '';
  document.getElementById('filtro-estado').value = '';
  document.getElementById('filtro-cabana').value = '';

  // Cargar todas las reservas
  cargarReservas();
  
  // Actualizar información
  actualizarInfoFiltros({}, reservasOriginales.length);
  
  filtrosAplicados = false;
  mostrarMensaje(mensajes, '🗑️ Filtros limpiados. Mostrando todas las reservas.', 'info');
}

// Actualizar información de filtros aplicados
function actualizarInfoFiltros(filtros, cantidad) {
  const infoElement = document.getElementById('info-filtros');
  const filtrosAplicados = Object.keys(filtros).length;
  
  if (filtrosAplicados === 0) {
    infoElement.textContent = `Mostrando todas las reservas (${cantidad} total)`;
  } else {
    const filtrosTexto = [];
    if (filtros.fechaInicio) filtrosTexto.push(`Desde: ${filtros.fechaInicio}`);
    if (filtros.fechaFin) filtrosTexto.push(`Hasta: ${filtros.fechaFin}`);
    if (filtros.estado) filtrosTexto.push(`Estado: ${filtros.estado}`);
    if (filtros.cabana) filtrosTexto.push(`Cabaña: ${filtros.cabana}`);
    
    infoElement.textContent = `Filtros: ${filtrosTexto.join(', ')} (${cantidad} resultados)`;
  }
}

// Toggle filtros (colapsar/expandir)
function toggleFiltros() {
  const filtrosContent = document.getElementById('filtros-content');
  const btnToggle = document.getElementById('btn-toggle-filtros');
  
  if (filtrosContent.classList.contains('expanded')) {
    // Colapsar
    filtrosContent.classList.remove('expanded');
    filtrosContent.classList.add('collapsed');
    btnToggle.classList.add('collapsed');
    btnToggle.textContent = '▶';
  } else {
    // Expandir
    filtrosContent.classList.remove('collapsed');
    filtrosContent.classList.add('expanded');
    btnToggle.classList.remove('collapsed');
    btnToggle.textContent = '▼';
  }
}

// Mostrar reservas (función reutilizable)
function mostrarReservas(reservas) {
  if (reservas.length === 0) {
    contenedorReservas.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 20px; color: #6c757d;">
          <h3>📭 No se encontraron reservas</h3>
          <p>No hay reservas que coincidan con los criterios de búsqueda.</p>
        </td>
      </tr>
    `;
    return;
  }

  const html = reservas.map(reserva => `
    <tr>
      <td>${reserva.id}</td>
      <td>${reserva.id_dni}</td>
      <td>${reserva.nombre || 'N/A'}</td>
      <td>${reserva.email || 'N/A'}</td>
      <td>${reserva.fechainicio || 'N/A'}</td>
      <td>${reserva.fechafin || 'N/A'}</td>
      <td>${reserva.nombre_cabana || 'N/A'}</td>
      <td>$${reserva.preciototal || '0'}</td>
      <td>${reserva.nombreestado}</td>
      <td>
        <div class="acciones-reserva">
          <button class="btn-eliminar-reserva" data-id="${reserva.id}">🗑️ Eliminar</button>
          <a class="btn-editar-reserva" href="editar.html?id=${reserva.id}">✏️ Editar</a>
        </div>
      </td>
    </tr>
  `).join('');
  
  contenedorReservas.innerHTML = html;
}

// Generar reportes con filtros aplicados
document.getElementById('btn-reporte-reservas').addEventListener('click', async () => {
  try {
    // Usar los filtros aplicados actualmente
    const fechaInicio = document.getElementById('filtro-fecha-inicio').value;
    const fechaFin = document.getElementById('filtro-fecha-fin').value;
    const estado = document.getElementById('filtro-estado').value;

    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    if (estado) params.append('estado', estado);

    const respuesta = await fetch(`/api/v1/reservas/reporte?${params.toString()}`);
    if (!respuesta.ok) throw new Error('No se pudo generar el reporte');

    const blob = await respuesta.blob();
    const url = window.URL.createObjectURL(blob);

    // Obtener el nombre del archivo del header Content-Disposition
    const contentDisposition = respuesta.headers.get('Content-Disposition');
    let filename = 'reporte_reservas.pdf';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    window.URL.revokeObjectURL(url);
    mostrarMensaje(mensajes, '✅ Reporte generado exitosamente', 'success');
  } catch (error) {
    console.error(error);
    mostrarMensaje(mensajes, '❌ Error al generar el reporte', 'error');
  }
});

// Event listeners para filtros
document.getElementById('btn-aplicar-filtros').addEventListener('click', aplicarFiltros);
document.getElementById('btn-limpiar-filtros').addEventListener('click', limpiarFiltros);
document.getElementById('btn-toggle-filtros').addEventListener('click', toggleFiltros);

// Inicializar estados
document.addEventListener('DOMContentLoaded', () => {
    const filtrosContent = document.getElementById('filtros-content');
    filtrosContent.classList.add('expanded');
});

// Abrir modal de búsqueda
btnBusquedaFlotante.addEventListener('click', () => {
  modalOverlay.classList.add('active');
  document.getElementById('id_reserva').focus();
});

// Cerrar modal de búsqueda
btnCerrarModal.addEventListener('click', () => {
  modalOverlay.classList.remove('active');
  document.getElementById('id_reserva').value = '';
  resultado.innerHTML = '';
});

// Cerrar modal al hacer clic en el overlay
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.classList.remove('active');
    document.getElementById('id_reserva').value = '';
    resultado.innerHTML = '';
  }
});

// Cerrar modal con Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
    modalOverlay.classList.remove('active');
    document.getElementById('id_reserva').value = '';
    resultado.innerHTML = '';
  }
});

// Búsqueda por ID
const formBuscar = document.getElementById('form-buscar-reserva');
formBuscar.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const idReserva = document.getElementById('id_reserva').value;
  
  if (!idReserva || idReserva < 1) {
    mostrarMensaje(mensajes, 'Por favor ingresa un ID válido', 'error');
    return;
  }
  
  try {
    // Mostrar loading dentro del modal
    resultado.innerHTML = '<div class="mensajes info">🔍 Buscando reserva...</div>';
    
    const response = await fetch(`/api/v1/reservas/${idReserva}`);
    const data = await response.json();
    
    // Debug: mostrar los datos que llegan
    console.log('Datos de la reserva:', data);
    console.log('fechainicio:', data.fechainicio);
    console.log('fechafin:', data.fechafin);
    console.log('preciototal:', data.preciototal);
    
    if (response.ok) {
      // Mostrar resultado
      resultado.innerHTML = `
        <div class="gestion-pagos">
          <h2>📋 Detalles de la Reserva #${data.id}</h2>
          
          <div class="form-row">
            <div class="form-col">
              <label>ID de Reserva:</label>
              <input type="text" value="${data.id}" readonly>
            </div>
            <div class="form-col">
              <label>DNI del Huésped:</label>
              <input type="text" value="${data.id_dni}" readonly>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <label>Nombre del Huésped:</label>
              <input type="text" value="${data.nombre || 'N/A'}" readonly>
            </div>
            <div class="form-col">
              <label>Email:</label>
              <input type="email" value="${data.email || 'N/A'}" readonly>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <label>ID de Cabaña:</label>
              <input type="text" value="${data.id_cabana}" readonly>
            </div>
            <div class="form-col">
              <label>Estado:</label>
              <input type="text" value="${data.NombreEstado || 'N/A'}" readonly>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <label>Fecha de Inicio:</label>
              <input type="text" value="${data.fechainicio ? new Date(data.fechainicio).toLocaleDateString('es-ES') : 'N/A'}" readonly>
            </div>
            <div class="form-col">
              <label>Fecha de Fin:</label>
              <input type="text" value="${data.fechafin ? new Date(data.fechafin).toLocaleDateString('es-ES') : 'N/A'}" readonly>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <label>Precio Total:</label>
              <input type="text" value="$${data.preciototal ? parseFloat(data.preciototal).toFixed(2) : '0.00'}" readonly>
            </div>
            <div class="form-col">
              <label>Acciones:</label>
              <div class="acciones-container">
                <a href="editar.html?id=${data.id}" class="btn-editar-reserva">✏️ Editar</a>
                <button class="btn-eliminar-reserva" onclick="eliminarReserva(${data.id})">🗑️ Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      mostrarMensaje(mensajes, 'Reserva encontrada exitosamente', 'success');
      // NO cerrar modal automáticamente - dejar que el usuario lo cierre manualmente
    } else {
      // Mostrar mensaje de error dentro del modal
      resultado.innerHTML = `
        <div class="mensajes error">
          <h3>❌ Reserva no encontrada</h3>
          <p>No se encontró una reserva con el ID ${idReserva}</p>
          <button class="btn-estadisticas" onclick="modalOverlay.classList.remove('active')">Cerrar</button>
        </div>
      `;
    }
  } catch (error) {
    console.error(error);
    // Mostrar error dentro del modal
    resultado.innerHTML = `
      <div class="mensajes error">
        <h3>❌ Error al buscar la reserva</h3>
        <p>Ocurrió un error al procesar la búsqueda</p>
        <button class="btn-estadisticas" onclick="modalOverlay.classList.remove('active')">Cerrar</button>
      </div>
    `;
  }
});

// Función para eliminar reserva desde búsqueda
async function eliminarReserva(id) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta reserva?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/v1/reservas/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      mostrarMensaje(mensajes, 'Reserva eliminada exitosamente', 'success');
      // Recargar la tabla
      await cargarReservas();
      // Limpiar búsqueda
      resultado.innerHTML = '';
    } else {
      mostrarMensaje(mensajes, 'Error al eliminar la reserva', 'error');
    }
  } catch (error) {
    console.error(error);
    mostrarMensaje(mensajes, 'Error al eliminar la reserva', 'error');
  }
}

// Mostrar las reservas optimizado
async function cargarReservas() {
  try {
    const reservas = await traerRegistro('/api/v1/reservas/');
    reservasOriginales = reservas; // Guardar para filtros
    
    mostrarReservas(reservas);
    actualizarInfoFiltros({}, reservas.length);
  } catch (error) {
    console.log(error);
    mostrarMensaje(document.getElementById('mensajes'), 'No se pudo cargar el listado');
  }
}

// Eliminar una reserva optimizado
contenedorReservas.addEventListener('click', async (evento) => {
  if (evento.target.classList.contains('btn-eliminar-reserva')) {
    const idReserva = evento.target.dataset.id;
    
    // Confirmación rápida
    if (!confirm('¿Estás seguro de que quieres eliminar esta reserva?')) {
      return;
    }
    
    try {
      const respuesta = await eliminarRegistro(`/api/v1/reservas/${idReserva}`);
      const datos = await respuesta.json();
      if (respuesta.ok) {
        evento.target.closest('tr').remove();
        mostrarMensaje(document.getElementById('mensajes'), datos.mensaje);
      } else {
        mostrarMensaje(document.getElementById('mensajes'), 'No se pudo eliminar la reserva');
      }
    } catch (error) {
      console.log(error);
      mostrarMensaje(document.getElementById('mensajes'), 'Error al eliminar la reserva');
    }
  }
});

// Inicializar página
window.addEventListener('load', async () => {
  await Promise.all([
    cargarEstados(),
    cargarCabanas()
  ]);
  await cargarReservas();
  
  // Inicializar filtros como expandidos
  const filtrosContent = document.getElementById('filtros-content');
  filtrosContent.classList.add('expanded');
});
