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
const tipoBusqueda = document.getElementById('tipo_busqueda');
const grupoBuscarId = document.getElementById('grupo-buscar-id');
const grupoBuscarDni = document.getElementById('grupo-buscar-dni');
const grupoBuscarNombre = document.getElementById('grupo-buscar-nombre');
const inputId = document.getElementById('id_reserva');
const inputDni = document.getElementById('dni_buscar');
const inputNombre = document.getElementById('nombre_buscar');

// Variables globales para gráficos
let graficoMes = null;
let graficoEstado = null;
let graficoCabanas = null;

// Variables para filtros
let reservasOriginales = [];
let filtrosAplicados = false;

// Cargar estados desde la BD y agregarlos al select
async function cargarEstados() {
  try {
    const respuesta = await fetch('/api/v1/estados');
    if (!respuesta.ok) {
      throw new Error(`HTTP error! status: ${respuesta.status}`);
    }
    
    const estados = await respuesta.json();
    console.log('Estados recibidos de la API:', estados);

    // Cargar en filtros
    const selectEstado = document.getElementById('filtro-estado');
    
    if (Array.isArray(estados)) {
      // Limpiar opciones existentes (mantener solo la primera)
      while (selectEstado.children.length > 1) {
        selectEstado.removeChild(selectEstado.lastChild);
      }
      
    estados.forEach(estado => {
      const option = document.createElement('option');
      option.value = estado.nombreestado;
      option.textContent = estado.nombreestado;
      selectEstado.appendChild(option);
    });
      
      console.log('Estados cargados en filtros:', estados.length);
    } else {
      console.error('Formato de estados inválido:', estados);
    }
  } catch (error) {
    console.error('Error al cargar los estados:', error);
    // Cargar estados por defecto si hay error
    const selectEstado = document.getElementById('filtro-estado');
    const estadosDefault = ['Reservada', 'Check In', 'Limpieza', 'Check Out'];
    
    estadosDefault.forEach(estado => {
      const option = document.createElement('option');
      option.value = estado;
      option.textContent = estado;
      selectEstado.appendChild(option);
    });
    console.log('Estados por defecto cargados:', estadosDefault.length);
  }
}

// Cargar cabañas para filtros
async function cargarCabanas() {
  try {
    const respuesta = await fetch('/api/v1/cabanas');
    const data = await respuesta.json();
    
    // Manejar el formato de respuesta {success: true, data: [...]}
    const cabanas = data.success ? data.data : data;

    const selectCabana = document.getElementById('filtro-cabana');
    
    if (Array.isArray(cabanas)) {
      cabanas.forEach(cabana => {
        const option = document.createElement('option');
        option.value = cabana.nombre_cabana || cabana.nombre;
        option.textContent = cabana.nombre_cabana || cabana.nombre;
        selectCabana.appendChild(option);
      });
      console.log('Cabañas cargadas en filtros:', cabanas.length);
    } else {
      console.error('Formato de cabañas inválido:', cabanas);
    }
  } catch (error) {
    console.error('Error al cargar las cabañas:', error);
  }
}

// Aplicar filtros
async function aplicarFiltros() {
  console.log('Función aplicarFiltros ejecutada');
  
  const fechaInicio = document.getElementById('filtro-fecha-inicio').value;
  const fechaFin = document.getElementById('filtro-fecha-fin').value;
  const estado = document.getElementById('filtro-estado').value;
  const cabana = document.getElementById('filtro-cabana').value;

  console.log('Valores de filtros:', { fechaInicio, fechaFin, estado, cabana });

  // Construir parámetros de filtro
  const filtros = {};
  if (fechaInicio) filtros.fechaInicio = fechaInicio;
  if (fechaFin) filtros.fechaFin = fechaFin;
  if (estado) filtros.estado = estado;
  if (cabana) filtros.cabana = cabana;

  console.log('Objeto filtros construido:', filtros);

  try {
    // Mostrar loading
    mostrarMensaje(mensajes, '🔍 Aplicando filtros...', 'info');
    
    // Construir URL con filtros
    const params = new URLSearchParams();
    Object.keys(filtros).forEach(key => {
      params.append(key, filtros[key]);
    });

    const url = `/api/v1/reservas/filtros?${params.toString()}`;
    console.log('URL de filtros construida:', url);

    const respuesta = await fetch(url);
    console.log('Respuesta del servidor:', respuesta.status, respuesta.statusText);
    
    if (!respuesta.ok) {
      // Si es un 404, significa que no se encontraron reservas con esos filtros
      if (respuesta.status === 404) {
        const mensaje = generarMensajeSinResultados(filtros);
        mostrarReservas([]); // Mostrar tabla vacía
        actualizarInfoFiltros(filtros, 0);
        filtrosAplicados = true;
        mostrarMensaje(mensajes, mensaje, 'info');
        return;
      }
      throw new Error(`HTTP error! status: ${respuesta.status}`);
    }
    
    const reservasFiltradas = await respuesta.json();
    console.log('Reservas filtradas recibidas:', reservasFiltradas);

    // Si no hay reservas filtradas, mostrar mensaje apropiado
    if (!reservasFiltradas || reservasFiltradas.length === 0) {
      const mensaje = generarMensajeSinResultados(filtros);
      mostrarReservas([]); // Mostrar tabla vacía
      actualizarInfoFiltros(filtros, 0);
      filtrosAplicados = true;
      mostrarMensaje(mensajes, mensaje, 'info');
      return;
    }

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
    
    // Si es un error de red o servidor, mostrar mensaje genérico
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      mostrarMensaje(mensajes, '❌ Error de conexión. Verifica tu conexión a internet.', 'error');
    } else {
      mostrarMensaje(mensajes, `❌ Error al aplicar los filtros: ${error.message}`, 'error');
    }
  }
}

// Función para generar mensajes personalizados cuando no hay resultados
function generarMensajeSinResultados(filtros) {
  const filtrosAplicados = [];
  
  if (filtros.fechaInicio && filtros.fechaFin) {
    filtrosAplicados.push(`fechas del ${filtros.fechaInicio} al ${filtros.fechaFin}`);
  } else if (filtros.fechaInicio) {
    filtrosAplicados.push(`desde el ${filtros.fechaInicio}`);
  } else if (filtros.fechaFin) {
    filtrosAplicados.push(`hasta el ${filtros.fechaFin}`);
  }
  
  if (filtros.estado) {
    filtrosAplicados.push(`estado "${filtros.estado}"`);
  }
  
  if (filtros.cabana) {
    filtrosAplicados.push(`cabaña "${filtros.cabana}"`);
  }
  
  if (filtrosAplicados.length === 0) {
    return '📭 No se encontraron reservas con los filtros aplicados.';
  }
  
  const filtrosTexto = filtrosAplicados.join(' y ');
  return `📭 No se encontraron reservas con ${filtrosTexto}.`;
}

// Limpiar filtros
function limpiarFiltros() {
  console.log('Función limpiarFiltros ejecutada');
  console.log('reservasOriginales actual:', reservasOriginales);
  
  // Limpiar todos los campos de filtro
  document.getElementById('filtro-fecha-inicio').value = '';
  document.getElementById('filtro-fecha-fin').value = '';
  document.getElementById('filtro-estado').value = '';
  document.getElementById('filtro-cabana').value = '';

  // Cargar todas las reservas
  cargarReservas();
  
  // Actualizar información
  const cantidad = reservasOriginales ? reservasOriginales.length : 0;
  actualizarInfoFiltros({}, cantidad);
  
  filtrosAplicados = false;
  mostrarMensaje(mensajes, '🗑️ Filtros limpiados. Mostrando todas las reservas.', 'info');
}

// Actualizar información de filtros aplicados
function actualizarInfoFiltros(filtros, cantidad) {
  console.log('actualizarInfoFiltros llamado con:', { filtros, cantidad });
  
  const infoElement = document.getElementById('info-filtros');
  if (!infoElement) {
    console.error('Elemento info-filtros no encontrado');
    return;
  }
  
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
  
  console.log('Info de filtros actualizada:', infoElement.textContent);
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

// Función para obtener el siguiente estado en el ciclo de vida
function obtenerSiguienteEstado(estadoActual) {
  const cicloEstados = ['Reservada', 'Check In', 'Limpieza', 'Check Out'];
  const indexActual = cicloEstados.findIndex(estado => 
    estado.toLowerCase() === estadoActual.toLowerCase()
  );
  
  if (indexActual === -1 || indexActual === cicloEstados.length - 1) {
    return null; // No hay siguiente estado
  }
  
  // Permitir saltar de Check In directamente a Check Out
  if (estadoActual.toLowerCase() === 'check in') {
    return 'Check Out';
  }
  
  return cicloEstados[indexActual + 1];
}

// Función para generar botones de estado según el ciclo de vida
function generarBotonesEstado(reserva) {
  const estadoActual = reserva.nombreestado || 'Reservada';
  const siguienteEstado = obtenerSiguienteEstado(estadoActual);
  
  if (!siguienteEstado) {
    return `<span class="estado-final" onclick="window.location.href='editar.html?id=${reserva.id}'" style="cursor: pointer;" title="Haz clic para editar la reserva">${estadoActual}</span>`;
  }
  
  return `
    <span class="estado-actual" onclick="window.location.href='editar.html?id=${reserva.id}'" style="cursor: pointer;" title="Haz clic para editar la reserva">${estadoActual}</span>
    <button class="btn-siguiente-estado" onclick="avanzarEstado(${reserva.id}, '${siguienteEstado}')" title="Avanzar a ${siguienteEstado}">
      → ${siguienteEstado}
    </button>
  `;
}

// Mostrar reservas (función reutilizable)
function mostrarReservas(reservas) {
  console.log('Mostrando reservas:', reservas);
  console.log('Tipo de reservas:', typeof reservas);
  console.log('Es array:', Array.isArray(reservas));
  
  if (!reservas) {
    console.error('reservas es null o undefined');
    contenedorReservas.innerHTML = `
      <tr>
        <td colspan="11" style="text-align: center; padding: 20px; color: #6c757d;">
          <h3>❌ Error: No se recibieron datos</h3>
          <p>No se pudieron cargar las reservas.</p>
        </td>
      </tr>
    `;
    return;
  }
  
  if (reservas.length === 0) {
    // Verificar si hay filtros aplicados para mostrar mensaje apropiado
    const filtrosAplicados = document.getElementById('info-filtros');
    let mensaje = '';
    
    if (filtrosAplicados && filtrosAplicados.textContent.includes('Filtros:')) {
      // Hay filtros aplicados
      mensaje = `
        <h3>📭 No se encontraron reservas</h3>
        <p>No hay reservas que coincidan con los filtros aplicados.</p>
        <p><strong>Sugerencia:</strong> Intenta con otros filtros o <button onclick="limpiarFiltros()" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">limpiar todos los filtros</button> para ver todas las reservas.</p>
      `;
    } else {
      // No hay filtros aplicados
      mensaje = `
        <h3>📭 No se encontraron reservas</h3>
        <p>No hay reservas registradas en el sistema.</p>
      `;
    }
    
    contenedorReservas.innerHTML = `
      <tr>
        <td colspan="11" style="text-align: center; padding: 20px; color: #6c757d;">
          ${mensaje}
        </td>
      </tr>
    `;
    return;
  }

  const html = reservas.map(reserva => {
    console.log('Procesando reserva:', reserva.id, 'Tipo ID:', typeof reserva.id);
    return `
      <tr class="fila-reserva" data-id="${reserva.id}">
        <td>${reserva.id}</td>
        <td>${reserva.id_dni}</td>
        <td>${reserva.nombre || 'N/A'}</td>
        <td>${reserva.email || 'N/A'}</td>
        <td>${formatearFecha(reserva.fechainicio)}</td>
        <td>${formatearFecha(reserva.fechafin)}</td>
        <td>${reserva.nombre_cabana || 'N/A'}</td>
        <td>$${reserva.preciototal || '0'}</td>
        <td>${generarBotonesEstado(reserva)}</td>
        <td>
          <div class="acciones-reserva">
            <button class="btn-eliminar-reserva" data-id="${reserva.id}">🗑️ Eliminar</button>
            <a class="btn-editar-reserva" href="editar.html?id=${reserva.id}">✏️ Editar</a>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  contenedorReservas.innerHTML = html;
  console.log('HTML generado para reservas, filas creadas:', contenedorReservas.children.length);
}

// Click en fila: abrir detalles en overlay
contenedorReservas.addEventListener('click', async (e) => {
  const fila = e.target.closest('tr.fila-reserva');
  if (!fila) return;
  // Evitar que los clicks sobre acciones (botones/enlaces) disparen detalles
  if (e.target.closest('.acciones-reserva')) return;

  const id = fila.dataset.id;
  console.log('Click en fila, ID extraído:', id, 'Tipo:', typeof id);
  
  // Validar que el ID sea un número válido
  if (!id || isNaN(parseInt(id))) {
    console.error('ID inválido en fila:', id);
    mostrarMensaje(mensajes, '❌ ID de reserva inválido', 'error');
    return;
  }
  
  try {
    console.log('Llamando a API con ID:', id);
    const res = await fetch(`/api/v1/reservas/${id}`);
    if (!res.ok) throw new Error('No se pudo cargar la reserva');
    const data = await res.json();

    // Reutilizamos el modal existente para mostrar detalles
    modalOverlay.classList.add('active');
    resultado.innerHTML = `
      <div class="gestion-pagos">
        <h2>📋 Detalles de la Reserva #${data.id}</h2>
        <div class="form-row">
          <div class="form-col"><label>DNI</label><input type="text" value="${data.id_dni}" readonly></div>
          <div class="form-col"><label>Huésped</label><input type="text" value="${data.nombre || 'N/A'}" readonly></div>
        </div>
        <div class="form-row">
          <div class="form-col"><label>Email</label><input type="text" value="${data.email || 'N/A'}" readonly></div>
          <div class="form-col"><label>Estado</label><input type="text" value="${data.NombreEstado || data.nombreestado || 'N/A'}" readonly></div>
        </div>
        <div class="form-row">
          <div class="form-col"><label>Cabaña</label><input type="text" value="${data.nombre_cabana || 'N/A'}" readonly></div>
          <div class="form-col"><label>Precio Total</label><input type="text" value="$${data.preciototal ? parseFloat(data.preciototal).toFixed(2) : '0.00'}" readonly></div>
        </div>
        <div class="form-row">
          <div class="form-col"><label>Desde</label><input type="text" value="${formatearFecha(data.fechainicio)}" readonly></div>
          <div class="form-col"><label>Hasta</label><input type="text" value="${formatearFecha(data.fechafin)}" readonly></div>
        </div>
        <div class="form-row">
          <div class="form-col" style="width:100%">
            <div class="acciones-container">
              <a href="editar.html?id=${data.id}" class="btn-editar-reserva">✏️ Editar</a>
              <a href="../pagos/alta.html?id_reserva=${data.id}" class="btn-estadisticas">💰 Registrar Pago</a>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error al cargar detalles de reserva:', err);
    mostrarMensaje(mensajes, '❌ No se pudieron cargar los detalles de la reserva', 'error');
  }
});

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
// Estos se moverán dentro del DOMContentLoaded

// Inicializar estados
document.addEventListener('DOMContentLoaded', () => {
    const filtrosContent = document.getElementById('filtros-content');
    filtrosContent.classList.add('expanded');
    
    // Event listeners para filtros (mover aquí para asegurar que el DOM esté listo)
    document.getElementById('btn-aplicar-filtros').addEventListener('click', aplicarFiltros);
    document.getElementById('btn-limpiar-filtros').addEventListener('click', limpiarFiltros);
    document.getElementById('btn-toggle-filtros').addEventListener('click', toggleFiltros);
    document.getElementById('vista-reservas').addEventListener('change', async (e) => {
      console.log('Vista cambiada a:', e.target.value);
      await cargarReservas();
      await cargarEstadisticasReservas();
    });
});

// Abrir modal de búsqueda
btnBusquedaFlotante.addEventListener('click', () => {
  modalOverlay.classList.add('active');
  // reset campos
  tipoBusqueda.value = 'id';
  mostrarCampoBusqueda('id');
  inputId.value = '';
  inputDni.value = '';
  inputNombre.value = '';
  inputId.focus();
});

// Cerrar modal de búsqueda
btnCerrarModal.addEventListener('click', () => {
  modalOverlay.classList.remove('active');
  inputId.value = '';
  inputDni.value = '';
  inputNombre.value = '';
  resultado.innerHTML = '';
});

// Cerrar modal al hacer clic en el overlay
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.classList.remove('active');
    inputId.value = '';
    inputDni.value = '';
    inputNombre.value = '';
    resultado.innerHTML = '';
  }
});

// Cerrar modal con Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
    modalOverlay.classList.remove('active');
    inputId.value = '';
    inputDni.value = '';
    inputNombre.value = '';
    resultado.innerHTML = '';
  }
});

// Interacción: cambio de tipo de búsqueda
function mostrarCampoBusqueda(tipo) {
  grupoBuscarId.style.display = tipo === 'id' ? 'block' : 'none';
  grupoBuscarDni.style.display = tipo === 'dni' ? 'block' : 'none';
  grupoBuscarNombre.style.display = tipo === 'nombre' ? 'block' : 'none';
}

if (tipoBusqueda) {
  tipoBusqueda.addEventListener('change', (e) => {
    mostrarCampoBusqueda(e.target.value);
    // enfocar el campo activo
    if (e.target.value === 'id') inputId.focus();
    if (e.target.value === 'dni') inputDni.focus();
    if (e.target.value === 'nombre') inputNombre.focus();
  });
}

// Búsqueda por ID / DNI / Nombre
const formBuscar = document.getElementById('form-buscar-reserva');
formBuscar.addEventListener('submit', async (e) => {
  e.preventDefault();
  const tipo = tipoBusqueda.value;

  try {
    // Mostrar loading dentro del modal
    resultado.innerHTML = '<div class="mensajes info">🔍 Buscando...</div>';

    if (tipo === 'id') {
      const idReserva = parseInt(inputId.value, 10);
      if (!idReserva || idReserva < 1) {
        mostrarMensaje(mensajes, 'Ingresá un ID válido', 'error');
        return;
      }
      const response = await fetch(`/api/v1/reservas/${idReserva}`);
      const data = await response.json();
      if (!response.ok) throw new Error('No encontrada');
      renderDetalleReserva(data);
      mostrarMensaje(mensajes, 'Reserva encontrada', 'success');
      return;
    }

    // Para DNI y Nombre, usamos el endpoint general y filtramos en servidor si existiera; si no, filtramos en cliente
    let reservas = [];
    try {
      const resp = await fetch('/api/v1/reservas');
      reservas = await resp.json();
      if (!Array.isArray(reservas)) reservas = [];
    } catch (_) {
      reservas = reservasOriginales || [];
    }

    let filtradas = reservas;
    if (tipo === 'dni') {
      const q = (inputDni.value || '').trim();
      if (!q) {
        mostrarMensaje(mensajes, 'Ingresá un DNI', 'error');
        return;
      }
      filtradas = reservas.filter(r => String(r.id_dni).includes(q));
    } else if (tipo === 'nombre') {
      const q = (inputNombre.value || '').trim().toLowerCase();
      if (!q) {
        mostrarMensaje(mensajes, 'Ingresá un nombre', 'error');
        return;
      }
      filtradas = reservas.filter(r => (r.nombre || '').toLowerCase().includes(q));
    }

    if (!filtradas.length) {
      resultado.innerHTML = `
        <div class="mensajes error">
          <h3>Sin resultados</h3>
          <p>No se encontraron reservas para la búsqueda.</p>
        </div>`;
      return;
    }

    // Mostrar listado clicable dentro del modal
    const items = filtradas.map(r => `
      <div class="item-resultado" data-id="${r.id}">
        <div><strong>#${r.id}</strong> - ${r.nombre || 'N/A'} (${r.id_dni})</div>
        <div>${r.fechainicio || ''} → ${r.fechafin || ''} | ${r.nombre_cabana || ''}</div>
      </div>
    `).join('');
    resultado.innerHTML = `
      <div class="lista-resultados">
        ${items}
      </div>
    `;

    // Delegación: click en un resultado para ver detalle
    resultado.querySelectorAll('.item-resultado').forEach(el => {
      el.addEventListener('click', async () => {
        const idSel = el.dataset.id;
        const respDet = await fetch(`/api/v1/reservas/${idSel}`);
        if (!respDet.ok) return;
        const dataDet = await respDet.json();
        renderDetalleReserva(dataDet);
      });
    });
  } catch (error) {
    console.error(error);
    resultado.innerHTML = `
      <div class="mensajes error">
        <h3>Error</h3>
        <p>No se pudo realizar la búsqueda.</p>
      </div>`;
  }
});

function renderDetalleReserva(data) {
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
          <input type="text" value="${data.NombreEstado || data.nombreestado || 'N/A'}" readonly>
        </div>
      </div>
      <div class="form-row">
        <div class="form-col">
          <label>Fecha de Inicio:</label>
          <input type="text" value="${formatearFecha(data.fechainicio)}" readonly>
        </div>
        <div class="form-col">
          <label>Fecha de Fin:</label>
          <input type="text" value="${formatearFecha(data.fechafin)}" readonly>
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
            <a href="../pagos/alta.html?id_reserva=${data.id}" class="btn-estadisticas">Registrar Pago</a>
          </div>
        </div>
      </div>
    </div>`;
}

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

// Cargar reservas desde la API
async function cargarReservas() {
  try {
    const vistaReservas = document.getElementById('vista-reservas').value;
    const url = vistaReservas === 'activas' ? '/api/v1/reservas/activas' : '/api/v1/reservas';
    
    console.log('Cargando reservas desde:', url);
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al cargar reservas');
    
    const reservas = await res.json();
    console.log('Reservas cargadas:', reservas);
    
    // Guardar en reservasOriginales para poder restaurar después de filtrar
    reservasOriginales = reservas;
    console.log('reservasOriginales actualizada:', reservasOriginales.length, 'reservas');
    
    mostrarReservas(reservas);
    actualizarInfoFiltros({}, reservas.length);
  } catch (error) {
    console.error('Error cargando reservas:', error);
    mostrarMensaje(mensajes, 'Error al cargar las reservas', 'error');
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
window.addEventListener('DOMContentLoaded', async () => {
  try {
    await cargarEstados();
    await cargarCabanas();
    await cargarReservas();
    await cargarEstadisticasReservas();
  } catch (error) {
    console.error('Error inicializando página:', error);
  }
});

// --------- ESTADÍSTICAS Y GRÁFICOS (Reservas) ---------
async function cargarEstadisticasReservas() {
  try {
    const vistaReservas = document.getElementById('vista-reservas').value;
    const url = vistaReservas === 'activas' ? '/api/v1/reservas/activas' : '/api/v1/reservas';
    
    console.log('Cargando estadísticas desde:', url);
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al cargar estadísticas');
    
    const reservas = await res.json();
    console.log('Reservas para estadísticas:', reservas);
    
    if (!Array.isArray(reservas)) return;

    // Tarjetas
    const total = reservas.length;
    const ingresos = reservas.reduce((s, r) => s + (parseFloat(r.preciototal) || 0), 0);
    const totalCabanas = reservas.length;

    console.log('Estadísticas calculadas:', { total, ingresos, totalCabanas });

    const el = (id) => document.getElementById(id);
    if (el('res-total')) el('res-total').textContent = total;
    if (el('res-ingresos')) el('res-ingresos').textContent = `$${ingresos.toFixed(2)}`;
    if (el('res-cabanas')) el('res-cabanas').textContent = totalCabanas;

    // Gráfico por mes (12 meses)
    const meses = new Array(12).fill(0);
    reservas.forEach(r => {
      const d = r.fechainicio ? new Date(r.fechainicio) : null;
      if (d && !isNaN(d)) meses[d.getMonth()] += 1;
    });

    const ctxMes = document.getElementById('res-grafico-mes');
    if (ctxMes) {
      if (graficoMes) graficoMes.destroy();
      graficoMes = new Chart(ctxMes, {
        type: 'bar',
        data: {
          labels: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
          datasets: [{
            label: 'Reservas',
            data: meses,
            backgroundColor: '#4CAF50',
            borderColor: '#4CAF50'
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
    }

    // Gráfico por estado
    const conteoEstados = reservas.reduce((acc, r) => {
      const est = (r.NombreEstado || r.nombreestado || 'Sin estado');
      acc[est] = (acc[est] || 0) + 1;
      return acc;
    }, {});

    const ctxEstado = document.getElementById('res-grafico-estado');
    if (ctxEstado) {
      if (graficoEstado) graficoEstado.destroy();
      const labels = Object.keys(conteoEstados);
      const data = Object.values(conteoEstados);
      const colores = ['#4CAF50','#2196F3','#FF9800','#F44336','#9C27B0','#00BCD4'];
      graficoEstado = new Chart(ctxEstado, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colores.slice(0, labels.length), borderWidth: 2, borderColor: '#fff' }] },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    // Gráfico de cabañas más reservadas
    const conteoCabanas = reservas.reduce((acc, r) => {
      const cabana = r.nombre_cabana || r.nombre_cabana || 'Cabaña ' + r.id_cabana;
      acc[cabana] = (acc[cabana] || 0) + 1;
      return acc;
    }, {});

    const ctxCabanas = document.getElementById('res-grafico-cabanas');
    if (ctxCabanas) {
      if (graficoCabanas) graficoCabanas.destroy();
      const labels = Object.keys(conteoCabanas);
      const data = Object.values(conteoCabanas);
      const colores = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD'];
      graficoCabanas = new Chart(ctxCabanas, {
        type: 'bar',
        data: { 
          labels, 
          datasets: [{ 
            data, 
            backgroundColor: colores.slice(0, labels.length),
            borderColor: colores.slice(0, labels.length),
            borderWidth: 1
          }] 
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
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
    }
  } catch (e) {
    console.error('Error cargando estadísticas de reservas:', e);
  }
}

// Botones de acción estadísticas
document.getElementById('btn-actualizar-res-estadisticas')?.addEventListener('click', cargarEstadisticasReservas);

document.getElementById('btn-exportar-res-estadisticas')?.addEventListener('click', async () => {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) {
    mostrarMensaje(mensajes, '❌ Error: jsPDF no está disponible', 'error');
    return;
  }

  try {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text('Reporte de Estadísticas de Reservas', 14, 20);
    
    // Información general
    const total = document.getElementById('res-total')?.textContent || '0';
    const ingresos = document.getElementById('res-ingresos')?.textContent || '$0';
    
    
    doc.setFontSize(12);
    doc.text('Resumen General:', 14, 35);
    doc.setFontSize(10);
    doc.text(`Total de Reservas: ${total}`, 14, 45);
    doc.text(`Ingresos Totales: ${ingresos}`, 14, 55);
    
    
    // Información del reporte
    doc.setFontSize(12);
    doc.text('Información del Reporte:', 14,65);
    doc.setFontSize(10);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 14, 75);
    doc.text(`Hora: ${new Date().toLocaleTimeString('es-ES')}`, 14, 85);
    
    // Agregar gráficos como imágenes
    const graficoMes = document.getElementById('res-grafico-mes');
    const graficoEstado = document.getElementById('res-grafico-estado');
    const graficoCabanas = document.getElementById('res-grafico-cabanas');
    
    if (graficoMes) {
      try {
        const canvasMes = graficoMes;
        const imgDataMes = canvasMes.toDataURL('image/png');
        doc.addImage(imgDataMes, 'PNG', 14, 85, 80, 40);
        doc.text('Gráfico: Reservas por Mes', 14, 130);
      } catch (e) {
        console.error('Error al agregar gráfico de meses:', e);
      }
    }
    
    if (graficoEstado) {
      try {
        const canvasEstado = graficoEstado;
        const imgDataEstado = canvasEstado.toDataURL('image/png');
        doc.addImage(imgDataEstado, 'PNG', 110, 85, 80, 40);
        doc.text('Gráfico: Estado de Reservas', 110, 130);
      } catch (e) {
        console.error('Error al agregar gráfico de estados:', e);
      }
    }
    
    if (graficoCabanas) {
      try {
        const canvasCabanas = graficoCabanas;
        const imgDataCabanas = canvasCabanas.toDataURL('image/png');
        doc.addImage(imgDataCabanas, 'PNG', 14, 145, 150, 60);
        doc.text('Gráfico: Cabañas Más Reservadas', 14, 210);
      } catch (e) {
        console.error('Error al agregar gráfico de cabañas:', e);
      }
    }
    
    // Guardar el PDF
    const fecha = new Date().toISOString().split('T')[0];
    doc.save(`estadisticas_reservas_${fecha}.pdf`);
    
    mostrarMensaje(mensajes, '✅ Estadísticas exportadas exitosamente', 'success');
  } catch (error) {
    console.error('Error al exportar estadísticas:', error);
    mostrarMensaje(mensajes, '❌ Error al exportar estadísticas', 'error');
  }
});

// Función para avanzar el estado de una reserva
async function avanzarEstado(idReserva, nuevoEstado) {
  try {
    const response = await fetch(`/api/v1/reservas/${idReserva}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nuevoEstado })
    });

    if (response.ok) {
      const data = await response.json();
      mostrarMensaje(mensajes, `✅ ${data.mensaje}`, 'success');
      
      // Recargar las reservas
      await cargarReservas();
    } else {
      const error = await response.json();
      mostrarMensaje(mensajes, `❌ ${error.mensaje}`, 'error');
    }
  } catch (error) {
    console.error('Error avanzando estado:', error);
    mostrarMensaje(mensajes, '❌ Error al actualizar el estado', 'error');
  }
}

// Hacer la función global para que funcione en onclick
window.avanzarEstado = avanzarEstado;
