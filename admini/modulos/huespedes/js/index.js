const tabla = document.getElementById('tabla-huespedes');
const mensajes = document.getElementById('mensajes');

// Elementos de modales
const btnBusquedaFlotante = document.getElementById('btn-busqueda-flotante');
const modalOverlay = document.getElementById('modal-overlay');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');
const formBuscarHuesped = document.getElementById('form-buscar-huesped');
const resultadoBusqueda = document.getElementById('resultado-busqueda');

// Modal agregar
const btnAgregarHuesped = document.getElementById('btn-agregar-huesped');
const modalAgregarOverlay = document.getElementById('modal-agregar-overlay');
const btnCerrarModalAgregar = document.getElementById('btn-cerrar-modal-agregar');
const formAgregarHuesped = document.getElementById('form-agregar-huesped');
const btnCancelarAgregar = document.getElementById('btn-cancelar-agregar');

// Modal editar
const modalEditarOverlay = document.getElementById('modal-editar-overlay');
const btnCerrarModalEditar = document.getElementById('btn-cerrar-modal-editar');
const formEditarHuesped = document.getElementById('form-editar-huesped');
const btnCancelarEditar = document.getElementById('btn-cancelar-editar');

// Botón de reporte
const btnReporteHuespedes = document.getElementById('btn-reporte-huespedes');

// Modal de confirmación
const modalConfirmacionOverlay = document.getElementById('modal-confirmacion-overlay');
const btnCerrarModalConfirmacion = document.getElementById('btn-cerrar-modal-confirmacion');
const btnModificarExistente = document.getElementById('btn-modificar-existente');
const btnCancelarConfirmacion = document.getElementById('btn-cancelar-confirmacion');

// Variables para controlar el modo de edición
let dniEditando = null;
let datosPendientes = null;

// Función para mostrar mensajes
function mostrarMensaje(mensaje, tipo = 'info') {
    mensajes.innerHTML = `<div class="mensajes ${tipo}">${mensaje}</div>`;
    setTimeout(() => {
        mensajes.innerHTML = '';
    }, 3000);
}

// ===== FUNCIONES PARA MODALES =====

// Abrir modal de búsqueda
btnBusquedaFlotante.addEventListener('click', () => {
    modalOverlay.classList.add('active');
    document.getElementById('id_dni_buscar').focus();
});

// Cerrar modal de búsqueda
btnCerrarModal.addEventListener('click', () => {
    modalOverlay.classList.remove('active');
    document.getElementById('id_dni_buscar').value = '';
    resultadoBusqueda.innerHTML = '';
});

// Cerrar modal al hacer clic en el overlay
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.classList.remove('active');
        document.getElementById('id_dni_buscar').value = '';
        resultadoBusqueda.innerHTML = '';
    }
});

// Abrir modal de agregar
btnAgregarHuesped.addEventListener('click', () => {
    modalAgregarOverlay.classList.add('active');
    document.getElementById('agregar-dni').focus();
});

// Cerrar modal de agregar
btnCerrarModalAgregar.addEventListener('click', () => {
    modalAgregarOverlay.classList.remove('active');
    formAgregarHuesped.reset();
});

btnCancelarAgregar.addEventListener('click', () => {
    modalAgregarOverlay.classList.remove('active');
    formAgregarHuesped.reset();
});

// Cerrar modal agregar al hacer clic en el overlay
modalAgregarOverlay.addEventListener('click', (e) => {
    if (e.target === modalAgregarOverlay) {
        modalAgregarOverlay.classList.remove('active');
        formAgregarHuesped.reset();
    }
});

// Cerrar modal de editar
btnCerrarModalEditar.addEventListener('click', () => {
    modalEditarOverlay.classList.remove('active');
    formEditarHuesped.reset();
});

btnCancelarEditar.addEventListener('click', () => {
    modalEditarOverlay.classList.remove('active');
    formEditarHuesped.reset();
});

// Cerrar modal editar al hacer clic en el overlay
modalEditarOverlay.addEventListener('click', (e) => {
    if (e.target === modalEditarOverlay) {
        modalEditarOverlay.classList.remove('active');
        formEditarHuesped.reset();
    }
});

// Cerrar modal de confirmación
btnCerrarModalConfirmacion.addEventListener('click', () => {
    modalConfirmacionOverlay.classList.remove('active');
    datosPendientes = null;
});

btnCancelarConfirmacion.addEventListener('click', () => {
    modalConfirmacionOverlay.classList.remove('active');
    datosPendientes = null;
    mostrarMensaje('Operación cancelada', 'info');
});

// Cerrar modal confirmación al hacer clic en el overlay
modalConfirmacionOverlay.addEventListener('click', (e) => {
    if (e.target === modalConfirmacionOverlay) {
        modalConfirmacionOverlay.classList.remove('active');
        datosPendientes = null;
    }
});

// Modificar huésped existente
btnModificarExistente.addEventListener('click', async () => {
    if (!datosPendientes) return;
    
    try {
        const updateResponse = await fetch(`/api/v1/huespedes/${datosPendientes.id_dni}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosPendientes)
        });

        if (updateResponse.ok) {
            mostrarMensaje('Huésped actualizado exitosamente', 'success');
            modalConfirmacionOverlay.classList.remove('active');
            modalAgregarOverlay.classList.remove('active');
            formAgregarHuesped.reset();
            cargarHuespedes();
            datosPendientes = null;
        } else {
            const errorData = await updateResponse.json();
            mostrarMensaje(`Error: ${errorData.mensaje || 'Error al actualizar el huésped'}`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al procesar la solicitud', 'error');
    }
});

// Cerrar modales con Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        modalOverlay.classList.remove('active');
        modalAgregarOverlay.classList.remove('active');
        modalEditarOverlay.classList.remove('active');
        modalConfirmacionOverlay.classList.remove('active');
        document.getElementById('id_dni_buscar').value = '';
        resultadoBusqueda.innerHTML = '';
        formAgregarHuesped.reset();
        formEditarHuesped.reset();
        datosPendientes = null;
    }
});

async function cargarHuespedes() {
  try {
    console.log('Cargando huéspedes...');
  const res = await fetch('/api/v1/huespedes');
    console.log('Respuesta de la API:', res.status);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
  const datos = await res.json();
    console.log('Datos recibidos:', datos);
    mostrarHuespedes(datos);
  } catch (error) {
    console.error('Error al cargar huéspedes:', error);
    mostrarMensaje('Error al cargar los huéspedes', 'error');
  }
}

function mostrarHuespedes(huéspedes) {
  console.log('Mostrando huéspedes:', huéspedes);
  console.log('Tabla encontrada:', tabla);
  
  tabla.innerHTML = '';

  huéspedes.forEach((h, index) => {
    console.log(`Procesando huésped ${index + 1}:`, h);
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${h.id_dni}</td>
      <td>${h.nombre}</td>
      <td>${h.telefono || ''}</td>
      <td>${h.gmail}</td>
      <td>
        <button class="btn-eliminar-reserva" onclick="eliminarHuesped('${h.id_dni}')">Eliminar</button>
        <button class="btn-editar-reserva" onclick="editarHuesped('${h.id_dni}')">Editar</button>
      </td>
    `;
    tabla.appendChild(fila);
  });
  
  console.log('Total de filas agregadas:', tabla.rows.length);
}

// ===== FORMULARIOS DE MODALES =====

// Búsqueda de huésped
formBuscarHuesped.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const dniBuscar = document.getElementById('id_dni_buscar').value;
  
  if (!dniBuscar) {
    mostrarMensaje('Por favor ingresa un DNI válido', 'error');
    return;
  }
  
  try {
    resultadoBusqueda.innerHTML = '<div class="mensajes info">Buscando huésped...</div>';
    
    const response = await fetch(`/api/v1/huespedes/${dniBuscar}`);
    const data = await response.json();
    
    if (response.ok) {
      resultadoBusqueda.innerHTML = `
        <div class="gestion-pagos">
          <h2>Detalles del Huésped</h2>
          
          <div class="form-row">
            <div class="form-col">
              <label>DNI:</label>
              <input type="text" value="${data.id_dni}" readonly>
            </div>
            <div class="form-col">
              <label>Nombre:</label>
              <input type="text" value="${data.nombre || 'N/A'}" readonly>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <label>Teléfono:</label>
              <input type="text" value="${data.telefono || 'N/A'}" readonly>
            </div>
            <div class="form-col">
              <label>Email:</label>
              <input type="text" value="${data.gmail || 'N/A'}" readonly>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <label>Acciones:</label>
              <div class="acciones-container">
                <button class="btn-editar-reserva" onclick="editarHuesped('${data.id_dni}')">Editar</button>
                <button class="btn-eliminar-reserva" onclick="eliminarHuesped('${data.id_dni}')">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      mostrarMensaje('Huésped encontrado exitosamente', 'success');
    } else {
      resultadoBusqueda.innerHTML = `
        <div class="mensajes error">
          <h3>Huésped no encontrado</h3>
          <p>No se encontró un huésped con el DNI ${dniBuscar}</p>
        </div>
      `;
    }
  } catch (error) {
    console.error(error);
    resultadoBusqueda.innerHTML = `
      <div class="mensajes error">
        <h3>Error al buscar el huésped</h3>
        <p>Ocurrió un error al procesar la búsqueda</p>
        <button class="btn-estadisticas" onclick="modalOverlay.classList.remove('active')">Cerrar</button>
      </div>
    `;
  }
});

// Agregar huésped
formAgregarHuesped.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const datos = {
    id_dni: document.getElementById('agregar-dni').value,
    nombre: document.getElementById('agregar-nombre').value,
    telefono: document.getElementById('agregar-telefono').value,
    gmail: document.getElementById('agregar-email').value
  };

  try {
    // Primero verificar si el DNI ya existe
    const checkResponse = await fetch(`/api/v1/huespedes/${datos.id_dni}`);
    
    if (checkResponse.ok) {
      // El DNI ya existe, mostrar modal con datos actuales
      const huespedExistente = await checkResponse.json();
      
      // Llenar el modal de confirmación con los datos existentes
      document.getElementById('dni-duplicado').textContent = datos.id_dni;
      document.getElementById('nombre-existente').value = huespedExistente.nombre;
      document.getElementById('telefono-existente').value = huespedExistente.telefono || 'No registrado';
      document.getElementById('email-existente').value = huespedExistente.gmail;
      
      // Guardar los datos pendientes para la actualización
      datosPendientes = datos;
      
      // Mostrar el modal de confirmación
      modalConfirmacionOverlay.classList.add('active');
      
    } else {
      // El DNI no existe, crear nuevo huésped
      const response = await fetch('/api/v1/huespedes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });

      if (response.ok) {
        mostrarMensaje('Huésped agregado exitosamente', 'success');
        modalAgregarOverlay.classList.remove('active');
        formAgregarHuesped.reset();
        cargarHuespedes();
      } else {
        const errorData = await response.json();
        mostrarMensaje(`Error: ${errorData.mensaje || 'Error al agregar el huésped'}`, 'error');
      }
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje('Error al procesar la solicitud', 'error');
  }
});

// Editar huésped
formEditarHuesped.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const datos = {
    id_dni: document.getElementById('editar-dni').value,
    nombre: document.getElementById('editar-nombre').value,
    telefono: document.getElementById('editar-telefono').value,
    gmail: document.getElementById('editar-email').value
  };

  try {
    console.log('Enviando datos de actualización:', datos);
    console.log('DNI editando:', dniEditando);
    
    const response = await fetch(`/api/v1/huespedes/${dniEditando}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    console.log('Respuesta de actualización:', response.status);

    if (response.ok) {
      mostrarMensaje('Huésped actualizado exitosamente', 'success');
      modalEditarOverlay.classList.remove('active');
      formEditarHuesped.reset();
  cargarHuespedes();
      dniEditando = null;
    } else {
      const errorData = await response.json();
      console.error('Error en respuesta:', errorData);
      mostrarMensaje(`Error: ${errorData.mensaje || 'Error al actualizar el huésped'}`, 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje('Error al procesar la solicitud', 'error');
  }
});

// Función global para editar huésped
window.editarHuesped = async (dni) => {
  try {
    console.log('Iniciando edición para DNI:', dni);
    
    // Verificar que el modal existe
    if (!modalEditarOverlay) {
      console.error('Modal de edición no encontrado');
      return;
    }
    
  const res = await fetch(`/api/v1/huespedes/${dni}`);
    console.log('Respuesta de la API:', res.status);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
  const h = await res.json();
    console.log('Datos del huésped:', h);
    
    // Llenar formulario de edición con datos del huésped
    const dniInput = document.getElementById('editar-dni');
    const nombreInput = document.getElementById('editar-nombre');
    const telefonoInput = document.getElementById('editar-telefono');
    const emailInput = document.getElementById('editar-email');
    
    console.log('Elementos del formulario:', {
      dniInput: !!dniInput,
      nombreInput: !!nombreInput,
      telefonoInput: !!telefonoInput,
      emailInput: !!emailInput
    });
    
    if (dniInput && nombreInput && telefonoInput && emailInput) {
      dniInput.value = h.id_dni;
      nombreInput.value = h.nombre;
      telefonoInput.value = h.telefono || '';
      emailInput.value = h.gmail;
      
      console.log('Formulario llenado correctamente');
      
      // Guardar DNI para la actualización
      dniEditando = dni;
      
      // Abrir modal de edición
      modalEditarOverlay.classList.add('active');
      
      mostrarMensaje('Modo edición activado', 'info');
    } else {
      console.error('No se encontraron todos los campos del formulario');
      mostrarMensaje('Error: No se encontraron los campos del formulario', 'error');
    }
  } catch (error) {
    console.error('Error al cargar huésped:', error);
    mostrarMensaje('Error al cargar datos del huésped', 'error');
  }
};

// Función global para eliminar huésped
window.eliminarHuesped = async (dni) => {
 
  try {
    const response = await fetch(`/api/v1/huespedes/${dni}`, { method: 'DELETE' });
    
    if (response.ok) {
      mostrarMensaje('Huésped eliminado exitosamente', 'success');
  cargarHuespedes();
    } else {
      const errorData = await response.json();
      mostrarMensaje(`Error: ${errorData.mensaje || 'Error al eliminar'}`, 'error');
    }
  } catch (error) {
    console.error('Error al eliminar huésped:', error);
    mostrarMensaje('Error al eliminar el huésped', 'error');
  }
};

// Función para generar reporte de huéspedes
async function generarReporteHuespedes() {
    try {
        console.log('Iniciando generación de reporte...');
        mostrarMensaje('Generando reporte...', 'info');
        
        // Hacer la petición al servidor
        const respuesta = await fetch('/api/v1/huespedes/reporte');
        console.log('Respuesta del servidor:', respuesta.status, respuesta.statusText);
        
        if (!respuesta.ok) {
            throw new Error(`Error ${respuesta.status}: ${respuesta.statusText}`);
        }

        // Obtener el blob del PDF
        const blob = await respuesta.blob();
        console.log('Blob recibido:', blob.size, 'bytes');
        
        // Crear URL del blob
        const url = window.URL.createObjectURL(blob);
        
        // Obtener nombre del archivo
        const contentDisposition = respuesta.headers.get('Content-Disposition');
        let filename = 'reporte_huespedes.pdf';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }
        console.log('Descargando archivo:', filename);

        // Crear link de descarga
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Limpiar URL
        window.URL.revokeObjectURL(url);
        
        mostrarMensaje('Reporte generado exitosamente', 'success');
    } catch (error) {
        console.error('Error al generar reporte:', error);
        mostrarMensaje(`Error: ${error.message}`, 'error');
    }
}

// Event listener para reporte
console.log('Configurando event listener para reporte, botón:', btnReporteHuespedes);
if (btnReporteHuespedes) {
    btnReporteHuespedes.addEventListener('click', generarReporteHuespedes);
    console.log('Event listener configurado correctamente');
} else {
    console.error('No se encontró el botón de reporte');
}

// Cargar huéspedes al iniciar
console.log('Iniciando carga de huéspedes...');
cargarHuespedes();
