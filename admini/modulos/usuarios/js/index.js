import {
  procesarFormulario,
  mostrarMensaje
} from '../../../recursos/js/utilidades.js';

// Variables globales
let usuarioEditando = null;

// Cargar usuarios desde la API
async function cargarUsuarios() {
  try {
    console.log('Cargando usuarios...');
    const res = await fetch('/api/v1/usuarios');
    
    if (!res.ok) {
      throw new Error(`Error al cargar usuarios: ${res.status}`);
    }
    
    const usuarios = await res.json();
    console.log('Usuarios cargados:', usuarios);
    
    mostrarUsuarios(usuarios);
    actualizarEstadisticas(usuarios);
  } catch (error) {
    console.error('Error cargando usuarios:', error);
    const mensajes = document.getElementById('mensajes');
    if (mensajes) {
      mostrarMensaje(mensajes, 'Error al cargar los usuarios', 'error');
    }
  }
}

// Mostrar usuarios en la tabla
function mostrarUsuarios(usuarios) {
  const contenedorUsuarios = document.getElementById('contenedor-usuarios');
  
  if (!contenedorUsuarios) {
    console.error('Contenedor de usuarios no encontrado');
    return;
  }
  
  if (!usuarios || usuarios.length === 0) {
    contenedorUsuarios.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 20px; color: #6c757d;">
          <h3>No hay usuarios registrados</h3>
          <p>Aún no se han creado usuarios en el sistema.</p>
        </td>
      </tr>
    `;
    return;
  }

  const html = usuarios.map(usuario => {
    const rolTexto = usuario.rol === 'admin' ? 'Administrador' : 'Cliente';
    
    return `
      <tr class="fila-usuario" data-id="${usuario.id}">
        <td>${usuario.id}</td>
        <td><strong>${usuario.usuario}</strong></td>
        <td><span class="rol-${usuario.rol}">${rolTexto}</span></td>
        <td class="acciones">
          <button class="btn-editar" onclick="editarUsuario(${usuario.id})" title="Editar Usuario">
            ✏️ Editar
          </button>
          <button class="btn-eliminar" onclick="mostrarModalConfirmacionEliminar(${usuario.id}, '${usuario.usuario}')" title="Eliminar Usuario">
            🗑️ Eliminar
          </button>
        </td>
      </tr>
    `;
  }).join('');

  contenedorUsuarios.innerHTML = html;
}

// Actualizar estadísticas
function actualizarEstadisticas(usuarios) {
  const total = usuarios.length;
  const admins = usuarios.filter(u => u.rol === 'admin').length;
  const clientes = usuarios.filter(u => u.rol === 'cliente').length;

  const totalElement = document.getElementById('total-usuarios');
  const adminElement = document.getElementById('total-admin');
  const clienteElement = document.getElementById('total-cliente');

  if (totalElement) totalElement.textContent = total;
  if (adminElement) adminElement.textContent = admins;
  if (clienteElement) clienteElement.textContent = clientes;
}

// Crear nuevo usuario
async function crearUsuario(datosUsuario) {
  try {
    console.log('Creando usuario:', datosUsuario);
    const res = await fetch('/api/v1/usuarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosUsuario)
    });

    const resultado = await res.json();
    
    if (!res.ok) {
      throw new Error(resultado.mensaje || 'Error al crear usuario');
    }

    const mensajes = document.getElementById('mensajes');
    mostrarMensaje(mensajes, 'Usuario creado exitosamente', 'success');
    cerrarModal();
    await cargarUsuarios();
  } catch (error) {
    console.error('Error creando usuario:', error);
    const mensajes = document.getElementById('mensajes');
    mostrarMensaje(mensajes, `Error al crear usuario: ${error.message}`, 'error');
  }
}

// Editar usuario
async function editarUsuario(id) {
  try {
    console.log('Cargando usuario para editar:', id);
    const res = await fetch(`/api/v1/usuarios/${id}`);
    
    if (!res.ok) {
      throw new Error('Usuario no encontrado');
    }
    
    const usuario = await res.json();
    console.log('Usuario cargado para editar:', usuario);
    
    // Llenar el formulario con los datos del usuario
    const usuarioInput = document.getElementById('usuario');
    const rolSelect = document.getElementById('rol');
    const claveInput = document.getElementById('clave');
    const confirmarClaveInput = document.getElementById('confirmar_clave');
    const modalTitulo = document.getElementById('modal-titulo');
    const btnGuardar = document.getElementById('btn-guardar');
    
    if (usuarioInput) usuarioInput.value = usuario.usuario;
    if (rolSelect) rolSelect.value = usuario.rol;
    
    // Campos de contraseña opcionales en edición
    if (claveInput) {
      claveInput.required = false;
      claveInput.placeholder = 'Dejar vacío para mantener actual';
    }
    if (confirmarClaveInput) {
      confirmarClaveInput.required = false;
      confirmarClaveInput.placeholder = 'Dejar vacío para mantener actual';
    }
    
    // Cambiar el título del modal
    if (modalTitulo) modalTitulo.textContent = 'Editar Usuario';
    if (btnGuardar) btnGuardar.textContent = 'Actualizar Usuario';
    
    // Guardar el ID del usuario que se está editando
    usuarioEditando = id;
    
    // Mostrar el modal
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) modalOverlay.classList.add('active');
  } catch (error) {
    console.error('Error cargando usuario:', error);
    const mensajes = document.getElementById('mensajes');
    mostrarMensaje(mensajes, `Error al cargar usuario: ${error.message}`, 'error');
  }
}

// Actualizar usuario
async function actualizarUsuario(id, datosUsuario) {
  try {
    console.log('Actualizando usuario:', id, datosUsuario);
    const res = await fetch(`/api/v1/usuarios/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosUsuario)
    });

    const resultado = await res.json();
    
    if (!res.ok) {
      throw new Error(resultado.mensaje || 'Error al actualizar usuario');
    }

    const mensajes = document.getElementById('mensajes');
    mostrarMensaje(mensajes, 'Usuario actualizado exitosamente', 'success');
    cerrarModal();
    await cargarUsuarios();
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    const mensajes = document.getElementById('mensajes');
    mostrarMensaje(mensajes, `Error al actualizar usuario: ${error.message}`, 'error');
  }
}

// Modal de confirmación para eliminar
function mostrarModalConfirmacionEliminar(idUsuario, nombreUsuario) {
  const modalOverlay = document.getElementById('modal-overlay');
  if (!modalOverlay) return;
  
  const contenidoModal = `
    <div class="modal-busqueda">
      <h3 style="color: #dc3545; text-align: center; margin-bottom: 20px;">
        🗑️ Eliminar Usuario
      </h3>
      
      <div style="text-align: center; margin-bottom: 20px;">
        <p style="font-size: 16px; margin-bottom: 10px;">
          ¿Estás seguro de que deseas eliminar al usuario?
        </p>
        <p style="font-weight: bold; color: #2c3e50; font-size: 18px;">
          ${nombreUsuario} (ID: ${idUsuario})
        </p>
        <p style="color: #dc3545; margin-top: 15px; font-weight: bold;">
          ⚠️ Esta acción no se puede deshacer
        </p>
      </div>
      
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button 
          onclick="cerrarModalEliminar()" 
          style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;"
        >
          Cancelar
        </button>
        <button 
          onclick="confirmarEliminarUsuario(${idUsuario})" 
          style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;"
        >
          Sí, Eliminar
        </button>
      </div>
    </div>
  `;
  
  modalOverlay.innerHTML = contenidoModal;
  modalOverlay.classList.add('active');
}

// Confirmar eliminación
async function confirmarEliminarUsuario(idUsuario) {
  try {
    console.log('Eliminando usuario:', idUsuario);
    
    const res = await fetch(`/api/v1/usuarios/${idUsuario}`, {
      method: 'DELETE'
    });
    
    const resultado = await res.json();
    
    if (!res.ok) {
      throw new Error(resultado.mensaje || 'Error al eliminar usuario');
    }
    
    const mensajes = document.getElementById('mensajes');
    mostrarMensaje(mensajes, '✅ Usuario eliminado exitosamente', 'success');
    
    cerrarModalEliminar();
    await cargarUsuarios();
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    const mensajes = document.getElementById('mensajes');
    mostrarMensaje(mensajes, `❌ Error al eliminar usuario: ${error.message}`, 'error');
  }
}

// Cerrar modal de eliminación
function cerrarModalEliminar() {
  const modalOverlay = document.getElementById('modal-overlay');
  if (!modalOverlay) return;
  
  // Restaurar el modal original
  modalOverlay.innerHTML = `
    <div class="modal-busqueda">
      <button class="btn-cerrar-modal" id="btn-cerrar-modal">×</button>
      <h3 id="modal-titulo">Crear Nuevo Usuario</h3>
      <form id="form-usuario" class="form-busqueda">
        <div class="form-row">
          <div class="form-col">
            <label for="usuario">Usuario *</label>
            <input type="text" id="usuario" name="usuario" required placeholder="Ej: admin2" maxlength="50">
          </div>
          <div class="form-col">
            <label for="clave">Clave *</label>
            <input type="password" id="clave" name="clave" required placeholder="Mínimo 3 caracteres" minlength="3">
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label for="confirmar_clave">Confirmar Clave *</label>
            <input type="password" id="confirmar_clave" name="confirmar_clave" required placeholder="Repetir clave" minlength="3">
          </div>
          <div class="form-col">
            <label for="rol">Rol *</label>
            <select id="rol" name="rol" required>
              <option value="admin">Administrador</option>
              <option value="cliente">Cliente</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <button type="submit" class="btn-estadisticas" id="btn-guardar">Crear Usuario</button>
          <button type="button" class="btn-estadisticas" style="background: #6c757d;" onclick="cerrarModal()">Cancelar</button>
        </div>
      </form>
    </div>
  `;
  
  // Restaurar event listeners
  setupEventListeners();
  modalOverlay.classList.remove('active');
}

// Cerrar modal
function cerrarModal() {
  const modalOverlay = document.getElementById('modal-overlay');
  const formUsuario = document.getElementById('form-usuario');
  const modalTitulo = document.getElementById('modal-titulo');
  const btnGuardar = document.getElementById('btn-guardar');
  const claveInput = document.getElementById('clave');
  const confirmarClaveInput = document.getElementById('confirmar_clave');
  
  if (modalOverlay) modalOverlay.classList.remove('active');
  if (formUsuario) formUsuario.reset();
  
  usuarioEditando = null;
  
  // Restaurar campos de contraseña
  if (claveInput && confirmarClaveInput) {
    claveInput.required = true;
    confirmarClaveInput.required = true;
    claveInput.placeholder = 'Mínimo 3 caracteres';
    confirmarClaveInput.placeholder = 'Repetir clave';
  }
  
  // Restaurar título del modal
  if (modalTitulo) modalTitulo.textContent = 'Crear Nuevo Usuario';
  if (btnGuardar) btnGuardar.textContent = 'Crear Usuario';
}

// Validar formulario
function validarFormulario(datos) {
  const errores = [];
  
  if (!datos.usuario || datos.usuario.trim().length < 3) {
    errores.push('El usuario debe tener al menos 3 caracteres');
  }
  
  if (!usuarioEditando) {
    if (!datos.clave || datos.clave.length < 3) {
      errores.push('La clave debe tener al menos 3 caracteres');
    }
    
    if (datos.clave !== datos.confirmar_clave) {
      errores.push('Las claves no coinciden');
    }
  } else {
    if (datos.clave && datos.clave.length < 3) {
      errores.push('La clave debe tener al menos 3 caracteres');
    }
    
    if (datos.clave && datos.clave !== datos.confirmar_clave) {
      errores.push('Las claves no coinciden');
    }
  }
  
  return errores;
}

// Función para manejar el envío del formulario
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const datos = procesarFormulario(e.target);
  
  // Validar formulario
  const errores = validarFormulario(datos);
  if (errores.length > 0) {
    const mensajes = document.getElementById('mensajes');
    mostrarMensaje(mensajes, errores.join('<br>'), 'error');
    return;
  }
  
  // Remover campo de confirmación antes de enviar
  delete datos.confirmar_clave;
  
  if (usuarioEditando) {
    await actualizarUsuario(usuarioEditando, datos);
  } else {
    await crearUsuario(datos);
  }
}

// Configurar event listeners
function setupEventListeners() {
  const btnNuevoUsuario = document.getElementById('btn-nuevo-usuario');
  const btnCerrarModal = document.getElementById('btn-cerrar-modal');
  const formUsuario = document.getElementById('form-usuario');
  const btnActualizarEstadisticas = document.getElementById('btn-actualizar-estadisticas');
  const btnExportarUsuarios = document.getElementById('btn-exportar-usuarios');

  if (btnNuevoUsuario) {
    btnNuevoUsuario.addEventListener('click', () => {
      cerrarModal();
      const modalOverlay = document.getElementById('modal-overlay');
      if (modalOverlay) modalOverlay.classList.add('active');
    });
  }

  if (btnCerrarModal) {
    btnCerrarModal.addEventListener('click', cerrarModal);
  }

  if (formUsuario) {
    formUsuario.addEventListener('submit', handleFormSubmit);
  }

  if (btnActualizarEstadisticas) {
    btnActualizarEstadisticas.addEventListener('click', async () => {
      await cargarUsuarios();
      const mensajes = document.getElementById('mensajes');
      mostrarMensaje(mensajes, 'Estadísticas actualizadas', 'success');
    });
  }

  if (btnExportarUsuarios) {
    btnExportarUsuarios.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/v1/usuarios/reporte');
        if (!res.ok) throw new Error('Error al generar reporte');
        
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `usuarios_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        const mensajes = document.getElementById('mensajes');
        mostrarMensaje(mensajes, 'Reporte generado exitosamente', 'success');
      } catch (error) {
        console.error('Error generando reporte:', error);
        const mensajes = document.getElementById('mensajes');
        mostrarMensaje(mensajes, 'Error al generar el reporte', 'error');
      }
    });
  }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Inicializando módulo de usuarios...');
  
  try {
    await cargarUsuarios();
    setupEventListeners();
    console.log('Módulo de usuarios inicializado correctamente');
  } catch (error) {
    console.error('Error inicializando página:', error);
  }
});

// Hacer funciones globales para onclick
window.editarUsuario = editarUsuario;
window.mostrarModalConfirmacionEliminar = mostrarModalConfirmacionEliminar;
window.confirmarEliminarUsuario = confirmarEliminarUsuario;
window.cerrarModalEliminar = cerrarModalEliminar;
window.cerrarModal = cerrarModal;