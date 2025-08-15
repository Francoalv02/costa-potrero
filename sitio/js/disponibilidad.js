// JavaScript para consulta de disponibilidad con nuevo diseño
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('form-disponibilidad');
  
  if (!form) {
    console.error('No se encontró el formulario de disponibilidad');
    return;
  }

  // Establecer fechas mínimas
  const fechaInicio = document.getElementById('fecha_inicio');
  const fechaFin = document.getElementById('fecha_fin');
  
  if (fechaInicio && fechaFin) {
    // Establecer fecha mínima como hoy
    const hoy = new Date().toISOString().split('T')[0];
    fechaInicio.min = hoy;
    fechaFin.min = hoy;
    
    // Actualizar fecha mínima de fin cuando cambie la fecha de inicio
    fechaInicio.addEventListener('change', function() {
      fechaFin.min = this.value;
      if (fechaFin.value && fechaFin.value <= this.value) {
        fechaFin.value = '';
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fecha_inicio = document.getElementById('fecha_inicio').value;
    const fecha_fin = document.getElementById('fecha_fin').value;

    // Validar fechas
    if (!fecha_inicio || !fecha_fin) {
      alert('Por favor, selecciona las fechas de llegada y salida.');
      return;
    }

    if (fecha_inicio >= fecha_fin) {
      alert('La fecha de salida debe ser posterior a la fecha de llegada.');
      return;
    }

    // Mostrar loading
    const resultado = document.getElementById('resultado');
    const cabanasDisponibles = document.getElementById('cabanas-disponibles');
    
    if (cabanasDisponibles) {
      cabanasDisponibles.innerHTML = `
        <div style="text-align: center; padding: 3rem; grid-column: 1 / -1;">
          <div class="loader" style="margin: 0 auto;"></div>
          <p style="color: var(--gray-dark); margin-top: 1rem;">Consultando disponibilidad...</p>
        </div>
      `;
    }
    
    if (resultado) {
      resultado.style.display = 'block';
    }

    try {
      console.log('Consultando disponibilidad para:', { fecha_inicio, fecha_fin });
      
      const res = await fetch('/api/v1/reservas/disponibilidad/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha_inicio, fecha_fin })
      });
      
      console.log('Respuesta del servidor:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Datos recibidos:', data);

      if (data.success && data.data && data.data.length > 0) {
        // Transformar datos para el nuevo formato
        const cabanasFormateadas = data.data.map(cabana => ({
          id: cabana.id_cabana,
          nombre: cabana.nombre_cabana,
          descripcion: cabana.descripcion || 'Cabaña equipada con todas las comodidades necesarias para tu estadía perfecta.',
          capacidad: cabana.capacidad_personas,
          precio: cabana.precio
        }));

        console.log('Cabañas formateadas:', cabanasFormateadas);
        mostrarCabanasDisponibles(cabanasFormateadas);
      } else {
        // No hay disponibilidad
        if (cabanasDisponibles) {
          cabanasDisponibles.innerHTML = `
            <div style="text-align: center; padding: 3rem; grid-column: 1 / -1;">
              <i class="fas fa-calendar-times" style="font-size: 4rem; color: var(--gray-light); margin-bottom: 1rem;"></i>
              <h3 style="color: var(--gray-dark); margin-bottom: 1rem;">No hay disponibilidad</h3>
              <p style="color: var(--gray-dark); margin-bottom: 1rem;">No hay cabañas disponibles para las fechas seleccionadas.</p>
              ${data.sugerencia ? `
                <div style="background: var(--light-color); padding: 1.5rem; border-radius: var(--border-radius); margin-top: 1rem;">
                  <h4 style="color: var(--primary-color); margin-bottom: 0.5rem;">
                    <i class="fas fa-lightbulb"></i> Sugerencia
                  </h4>
                  <p style="color: var(--gray-dark);">
                    Próxima disponibilidad: del ${data.sugerencia.fecha_inicio} al ${data.sugerencia.fecha_fin}
                  </p>
                </div>
              ` : ''}
            </div>
          `;
        }
        if (resultado) {
          resultado.style.display = 'block';
        }
      }
    } catch (err) {
      console.error('Error al consultar disponibilidad:', err);
      
      // Mostrar error con diseño moderno
      if (cabanasDisponibles) {
        cabanasDisponibles.innerHTML = `
          <div style="text-align: center; padding: 3rem; grid-column: 1 / -1;">
            <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: var(--accent-color); margin-bottom: 1rem;"></i>
            <h3 style="color: var(--gray-dark); margin-bottom: 1rem;">Error de conexión</h3>
            <p style="color: var(--gray-dark); margin-bottom: 1rem;">No se pudo consultar la disponibilidad. Intenta nuevamente.</p>
            <button onclick="location.reload()" class="btn-modern" style="background: var(--primary-color); border-color: var(--primary-color);">
              <i class="fas fa-redo"></i> Reintentar
            </button>
          </div>
        `;
      }
      if (resultado) {
        resultado.style.display = 'block';
      }
    }
  });
});

// Función para mostrar cabañas disponibles
function mostrarCabanasDisponibles(cabanas) {
  const cabanasDisponibles = document.getElementById('cabanas-disponibles');
  const resultado = document.getElementById('resultado');
  
  if (!cabanasDisponibles || !resultado) {
    console.error('No se encontraron los elementos necesarios para mostrar las cabañas');
    return;
  }

  console.log('Mostrando cabañas disponibles:', cabanas);
  cabanasDisponibles.innerHTML = '';
  
  cabanas.forEach((cabana, index) => {
    const card = document.createElement('div');
    card.className = 'cabana-card slide-in-left';
    card.style.cssText = `
      background: linear-gradient(135deg, var(--white) 0%, var(--light-color) 100%);
      border: 2px solid var(--primary-color);
      border-radius: var(--border-radius);
      padding: 2rem;
      box-shadow: var(--shadow);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    `;

    // Determinar la imagen basada en el nombre de la cabaña
    let imagenSrc = './recursos/cabanaLu.JPG'; // imagen por defecto
    if (cabana.nombre.toLowerCase().includes('ju')) {
      imagenSrc = './recursos/cabanaJu.JPG';
    } else if (cabana.nombre.toLowerCase().includes('pe')) {
      imagenSrc = './recursos/cabanaPeques.jpg';
    }

    // Formatear precio si existe
    const precioFormateado = cabana.precio ? 
      new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
      }).format(parseFloat(cabana.precio)) : '';

    card.innerHTML = `
      <div style="position: relative; margin-bottom: 1.5rem;">
        <img src="${imagenSrc}" alt="${cabana.nombre}" style="width: 100%; height: 200px; object-fit: cover; border-radius: var(--border-radius);">
        <div style="position: absolute; top: 10px; right: 10px; background: var(--success-color); color: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem; font-weight: 600;">
          <i class="fas fa-check-circle"></i> Disponible
        </div>
      </div>
      <h3 style="color: var(--primary-color); margin-bottom: 1rem; font-size: 1.5rem;">
        <i class="fas fa-home"></i> ${cabana.nombre}
      </h3>
      <p style="color: var(--gray-dark); margin-bottom: 1.5rem; line-height: 1.6;">
        ${cabana.descripcion}
      </p>
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem;">
        <span style="background: var(--light-color); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem;">
          <i class="fas fa-tv"></i> TV Cable
        </span>
        <span style="background: var(--light-color); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem;">
          <i class="fas fa-snowflake"></i> A/C
        </span>
        <span style="background: var(--light-color); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem;">
          <i class="fas fa-bed"></i> ${cabana.capacidad || '2'} Personas
        </span>
        ${cabana.precio ? `<span style="background: var(--accent-color); color: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem; font-weight: 600;">
          <i class="fas fa-dollar-sign"></i> ${precioFormateado}
        </span>` : ''}
      </div>
      <div style="text-align: center;">
        <button onclick="abrirModalSolicitud('${cabana.id}', '${cabana.nombre}', '${cabana.precio || ''}', '${document.getElementById('fecha_inicio').value}', '${document.getElementById('fecha_fin').value}')" class="btn-modern" style="background: var(--success-color); border-color: var(--success-color); width: 100%; padding: 1rem; font-size: 1.1rem;">
          <i class="fas fa-calendar-check"></i> Reservar Ahora
        </button>
      </div>
    `;

    // Efecto hover
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px)';
      this.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
    });

    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = 'var(--shadow)';
    });

    cabanasDisponibles.appendChild(card);
  });

  resultado.style.display = 'block';
  
  // Aplicar animaciones a las nuevas cards
  setTimeout(() => {
    document.querySelectorAll('.cabana-card').forEach((el, index) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }, 100);
}

// Función para abrir el modal de solicitud
function abrirModalSolicitud(cabanaId, cabanaNombre, precio, fechaInicio, fechaFin) {
  console.log('Abriendo modal para:', { cabanaId, cabanaNombre, precio, fechaInicio, fechaFin });
  
  // Crear el modal si no existe
  if (!document.getElementById('modal-solicitud')) {
    crearModalSolicitud();
  }
  
  // Llenar la información de la cabaña
  document.getElementById('modal-cabana-nombre').textContent = cabanaNombre;
  document.getElementById('modal-cabana-precio').textContent = precio ? 
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(parseFloat(precio)) : 'Consultar';
  document.getElementById('modal-fechas').textContent = `${fechaInicio} - ${fechaFin}`;
  
  // Establecer valores en el formulario
  document.getElementById('modal-cabana-id').value = cabanaId;
  document.getElementById('modal-fecha-inicio').value = fechaInicio;
  document.getElementById('modal-fecha-fin').value = fechaFin;
  document.getElementById('modal-precio-estimado').value = precio || '';
  
  // Mostrar el modal
  document.getElementById('modal-solicitud').classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Función para crear el modal de solicitud
function crearModalSolicitud() {
  const modalHTML = `
    <div id="modal-solicitud" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">
            📅 Solicitar Reserva
          </h3>
          <button class="modal-close" onclick="cerrarModalSolicitud()">
            ✕
          </button>
        </div>
        
        <div class="modal-body">
          <div class="modal-cabana-info">
            <h4>🏠 Información de la Cabaña</h4>
            <p><strong>Cabaña:</strong> <span id="modal-cabana-nombre"></span></p>
            <p><strong>Precio:</strong> <span id="modal-cabana-precio"></span></p>
            <p><strong>Fechas:</strong> <span id="modal-fechas"></span></p>
          </div>
          
          <form id="form-solicitud" class="modal-form">
            <input type="hidden" id="modal-cabana-id">
            <input type="hidden" id="modal-fecha-inicio">
            <input type="hidden" id="modal-fecha-fin">
            <input type="hidden" id="modal-precio-estimado">
            
            <div class="form-group">
              <label for="modal-nombre">
                👤 Nombre Completo *
              </label>
              <input type="text" id="modal-nombre" required placeholder="Tu nombre completo">
            </div>
            
            <div class="form-group">
              <label for="modal-email">
                📧 Email *
              </label>
              <input type="email" id="modal-email" required placeholder="tu@email.com">
            </div>
            
            <div class="form-group">
              <label for="modal-telefono">
                📞 Teléfono *
              </label>
              <input type="tel" id="modal-telefono" required placeholder="+54 351 123 4567">
            </div>
            
            <div class="form-group">
              <label for="modal-observaciones">
                💬 Observaciones (opcional)
              </label>
              <textarea id="modal-observaciones" rows="3" placeholder="Comentarios adicionales, horarios especiales, etc."></textarea>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button class="modal-btn modal-btn-secondary" onclick="cerrarModalSolicitud()">
            ❌ Cancelar
          </button>
          <button class="modal-btn modal-btn-primary" onclick="enviarSolicitud()">
            📤 Enviar Solicitud
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Agregar event listener para cerrar con ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      cerrarModalSolicitud();
    }
  });
  
  // Agregar event listener para cerrar haciendo clic fuera del modal
  document.getElementById('modal-solicitud').addEventListener('click', function(e) {
    if (e.target === this) {
      cerrarModalSolicitud();
    }
  });
}

// Función para cerrar el modal
function cerrarModalSolicitud() {
  const modal = document.getElementById('modal-solicitud');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Función para enviar la solicitud
async function enviarSolicitud() {
  const nombre = document.getElementById('modal-nombre').value.trim();
  const email = document.getElementById('modal-email').value.trim();
  const telefono = document.getElementById('modal-telefono').value.trim();
  const observaciones = document.getElementById('modal-observaciones').value.trim();
  const cabanaId = document.getElementById('modal-cabana-id').value;
  const fechaInicio = document.getElementById('modal-fecha-inicio').value;
  const fechaFin = document.getElementById('modal-fecha-fin').value;
  const precioEstimado = document.getElementById('modal-precio-estimado').value;
  
  // Validar campos requeridos
  if (!nombre || !email || !telefono) {
    alert('Por favor, completa todos los campos obligatorios.');
    return;
  }
  
  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('Por favor, ingresa un email válido.');
    return;
  }
  
  try {
    const datos = {
      nombre,
      gmail: email,
      telefono,
      id_cabana: cabanaId,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      precio_estimado: precioEstimado || null,
      observaciones: observaciones || null
    };
    
    console.log('Enviando solicitud:', datos);
    
    const response = await fetch('/api/v1/solicitudes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    
    const result = await response.json();
    
    if (result.success) {
      ('¡Solicitud enviada exitosamente! Te contactaremos pronto para confirmar los detalles.');
      cerrarModalSolicitud();
      
      // Limpiar formulario
      document.getElementById('form-solicitud').reset();
    } else {
      alert('Error al enviar la solicitud: ' + (result.mensaje || 'Error desconocido'));
    }
  } catch (error) {
    console.error('Error al enviar solicitud:', error);
    alert('Error al enviar la solicitud. Por favor, intenta nuevamente.');
  }
}

// Exponer funciones globalmente
window.mostrarCabanasDisponibles = mostrarCabanasDisponibles;
window.abrirModalSolicitud = abrirModalSolicitud;
window.cerrarModalSolicitud = cerrarModalSolicitud;
window.enviarSolicitud = enviarSolicitud;
