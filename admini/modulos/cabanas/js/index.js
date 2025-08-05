import {
  procesarFormulario,
  mostrarMensaje,
  traerRegistro,
  eliminarRegistro
} from '../../../recursos/js/utilidades.js';

const contenedorCabanas = document.getElementById('contenedor-cabanas');
const resultado = document.getElementById('resultado-busqueda');
const mensajes = document.getElementById('mensajes');
const modalOverlay = document.getElementById('modal-overlay');
const btnBusquedaFlotante = document.getElementById('btn-busqueda-flotante');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');

document.getElementById('btn-reporte-cabanas').addEventListener('click', async () => {
  try {
    const respuesta = await fetch('/api/v1/cabanas/reporte');
    if (!respuesta.ok) throw new Error('No se pudo generar el reporte');

    const blob = await respuesta.blob();
    const url = window.URL.createObjectURL(blob);

    // Obtener el nombre del archivo del header Content-Disposition
    const contentDisposition = respuesta.headers.get('Content-Disposition');
    let filename = 'reporte_cabanas.pdf';
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
    mostrarMensaje(document.getElementById('mensajes'), '✅ Reporte generado exitosamente', 'success');
  } catch (error) {
    console.error(error);
    mostrarMensaje(document.getElementById('mensajes'), '❌ Error al generar el reporte', 'error');
  }
});

// Abrir modal de búsqueda
btnBusquedaFlotante.addEventListener('click', () => {
  modalOverlay.classList.add('active');
  document.getElementById('id_cabana').focus();
});

// Cerrar modal de búsqueda
btnCerrarModal.addEventListener('click', () => {
  modalOverlay.classList.remove('active');
  document.getElementById('id_cabana').value = '';
  resultado.innerHTML = '';
});

// Cerrar modal al hacer clic en el overlay
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.classList.remove('active');
    document.getElementById('id_cabana').value = '';
    resultado.innerHTML = '';
  }
});

// Cerrar modal con Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
    modalOverlay.classList.remove('active');
    document.getElementById('id_cabana').value = '';
    resultado.innerHTML = '';
  }
});

// Búsqueda por ID
const formBuscar = document.getElementById('form-buscar-cabana');
formBuscar.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const idCabana = document.getElementById('id_cabana').value;
  
  if (!idCabana || idCabana < 1) {
    mostrarMensaje(mensajes, 'Por favor ingresa un ID válido', 'error');
    return;
  }
  
  try {
    // Mostrar loading dentro del modal
    resultado.innerHTML = '<div class="mensajes info">🔍 Buscando cabaña...</div>';
    
    const response = await fetch(`/api/v1/cabanas/${idCabana}`);
    const data = await response.json();
    
    // Debug: mostrar los datos que llegan
    console.log('Datos de la cabaña:', data);
    
    if (response.ok) {
      // Mostrar resultado
      resultado.innerHTML = `
        <div class="gestion-pagos">
          <h2>🏠 Detalles de la Cabaña #${data.id_cabana}</h2>
          
          <div class="form-row">
            <div class="form-col">
              <label>ID de Cabaña:</label>
              <input type="text" value="${data.id_cabana}" readonly>
            </div>
            <div class="form-col">
              <label>Nombre de la Cabaña:</label>
              <input type="text" value="${data.nombre_cabana || 'N/A'}" readonly>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <label>Capacidad:</label>
              <input type="text" value="${data.capacidad_personas || 'N/A'} personas" readonly>
            </div>
            <div class="form-col">
              <label>Precio por Noche:</label>
              <input type="text" value="$${data.precio || '0'}" readonly>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <label>Descripción:</label>
              <textarea readonly style="width: 100%; height: 80px; padding: 12px 15px; border-radius: 20px; border: 2px solid #e9ecef; resize: none; background: #f8f9fa; color: #2c3e50; font-weight: 500;">${data.descripcion || 'Sin descripción disponible'}</textarea>
            </div>
            <div class="form-col">
              <label>Estado:</label>
              <input type="text" value="${data.estado || 'N/A'}" readonly>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <label>Acciones:</label>
              <div class="acciones-container">
                <a href="editar.html?id=${data.id_cabana}" class="btn-editar-reserva">✏️ Editar</a>
                <button class="btn-eliminar-reserva" onclick="eliminarCabana(${data.id_cabana})">🗑️ Eliminar</button>
              </div>
            </div>
            <div class="form-col">
              <label>Ver Reservas:</label>
              <div class="acciones-container">
                <a href="../reservas/index.html" class="btn-reservar-cabana">📋 Ver Reservas</a>
              </div>
            </div>
          </div>
        </div>
      `;
      
      mostrarMensaje(mensajes, 'Cabaña encontrada exitosamente', 'success');
      // NO cerrar modal automáticamente - dejar que el usuario lo cierre manualmente
    } else {
      // Mostrar mensaje de error dentro del modal
      resultado.innerHTML = `
        <div class="mensajes error">
          <h3>❌ Cabaña no encontrada</h3>
          <p>No se encontró una cabaña con el ID ${idCabana}</p>
          <button class="btn-estadisticas" onclick="modalOverlay.classList.remove('active')">Cerrar</button>
        </div>
      `;
    }
  } catch (error) {
    console.error(error);
    // Mostrar error dentro del modal
    resultado.innerHTML = `
      <div class="mensajes error">
        <h3>❌ Error al buscar la cabaña</h3>
        <p>Ocurrió un error al procesar la búsqueda</p>
        <button class="btn-estadisticas" onclick="modalOverlay.classList.remove('active')">Cerrar</button>
      </div>
    `;
  }
});

// Función para eliminar cabaña desde búsqueda
async function eliminarCabana(id) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta cabaña?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/v1/cabanas/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      mostrarMensaje(mensajes, 'Cabaña eliminada exitosamente', 'success');
      // Recargar la tabla
      await cargarCabanas();
      // Limpiar búsqueda
      resultado.innerHTML = '';
    } else {
      mostrarMensaje(mensajes, 'Error al eliminar la cabaña', 'error');
    }
  } catch (error) {
    console.error(error);
    mostrarMensaje(mensajes, 'Error al eliminar la cabaña', 'error');
  }
}

// Mostrar las cabañas
async function cargarCabanas() {
  try {
    const cabanas = await traerRegistro('/api/v1/cabanas/');
    
         // Crear HTML de una vez para mejor rendimiento
     const html = cabanas.map(cabana => `
       <tr>
         <td>${cabana.id_cabana}</td>
         <td>${cabana.nombre_cabana}</td>
         <td>${cabana.descripcion}</td>
         <td>${cabana.capacidad_personas}</td>
         <td>$${cabana.precio?.toLocaleString('es-AR') ?? 'Sin precio'}</td>
         <td>
           <button class="btn-eliminar-reserva" data-id="${cabana.id_cabana}">🗑️ Eliminar</button>
           <a class="btn-editar-reserva" href="editar.html?id=${cabana.id_cabana}">✏️ Editar</a>
         </td>
       </tr>
     `).join('');
    
    contenedorCabanas.innerHTML = html;
  } catch (error) {
    console.log(error);
    mostrarMensaje(document.getElementById('mensajes'), 'No se pudo cargar el listado de cabañas');
  }
}

// Eliminar una cabaña
contenedorCabanas.addEventListener('click', async (evento) => {
  if (evento.target.classList.contains('btn-eliminar-reserva')) {
    const idCabana = evento.target.dataset.id;
    
    // Confirmación rápida
    if (!confirm('¿Estás seguro de que quieres eliminar esta cabaña?')) {
      return;
    }
    
    try {
      const respuesta = await eliminarRegistro(`/api/v1/cabanas/${idCabana}`);
      const datos = await respuesta.json();
      if (respuesta.ok) {
        evento.target.closest('tr').remove();
        mostrarMensaje(document.getElementById('mensajes'), datos.mensaje);
      } else {
        mostrarMensaje(document.getElementById('mensajes'), 'No se pudo eliminar la cabaña');
      }
    } catch (error) {
      console.log(error);
      mostrarMensaje(document.getElementById('mensajes'), 'Error al eliminar la cabaña');
    }
  }
});

// Inicializar página
window.addEventListener('load', async () => {
  await cargarCabanas(); // 🔄 Cargar cabañas al iniciar
});
