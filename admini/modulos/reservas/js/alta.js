import {
  procesarFormulario,
  altaRegistro,
  mostrarMensaje
} from '../../../recursos/js/utilidades.js';

const formulario = document.getElementById('form-alta');
const mensajes = document.getElementById('mensajes');
const precioInput = document.getElementById('precio_total');
const selectCabana = document.getElementById('id_cabana');
const infoCabana = document.getElementById('info-cabana');
const detallesCabana = document.getElementById('detalles-cabana');

// Almacena precios por ID cabaña
let preciosCabanas = {};
let cabanasInfo = {};

// Validar fechas
function validarFechas(fechaInicio, fechaFin) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  if (inicio < hoy) {
    return { valido: false, mensaje: '❌ La fecha de llegada no puede ser anterior a hoy' };
  }
  
  if (fin <= inicio) {
    return { valido: false, mensaje: '❌ La fecha de salida debe ser posterior a la fecha de llegada' };
  }
  
  const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
  if (dias > 30) {
    return { valido: false, mensaje: '❌ La estadía no puede ser mayor a 30 días' };
  }
  
  return { valido: true, dias };
}

window.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const fechaInicio = params.get('fecha_inicio');
  const fechaFin = params.get('fecha_fin');
  const idCabana = params.get('id');

  await Promise.all([cargarOpcionesCabana(), cargarEstados()]);

  if (fechaInicio) document.getElementById('fecha_inicio').value = fechaInicio;
  if (fechaFin) document.getElementById('fecha_fin').value = fechaFin;
  if (idCabana) {
    document.getElementById('id_cabana').value = idCabana;
    mostrarInfoCabana(idCabana);
  }

  calcularPrecio(); // Cálculo automático
});

formulario.addEventListener('change', calcularPrecio);

function calcularPrecio() {
  const fechaInicio = new Date(document.getElementById('fecha_inicio').value);
  const fechaFin = new Date(document.getElementById('fecha_fin').value);
  const idCabana = parseInt(document.getElementById('id_cabana').value);

  if (!isNaN(idCabana) && fechaInicio && fechaFin && fechaFin > fechaInicio) {
    const dias = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
    const precioUnitario = preciosCabanas[idCabana] || 0;
    const precioTotal = dias * precioUnitario;
    precioInput.value = precioTotal.toFixed(2);
    
    // Mostrar información de la cabaña
    if (idCabana) {
      mostrarInfoCabana(idCabana, dias, precioTotal);
    }
  } else {
    precioInput.value = '';
    infoCabana.style.display = 'none';
  }
}

function mostrarInfoCabana(idCabana, dias = null, precioTotal = null) {
  const cabana = cabanasInfo[idCabana];
  if (!cabana) return;
  
  const diasText = dias ? ` (${dias} día${dias > 1 ? 's' : ''})` : '';
  const precioText = precioTotal ? ` - Total: $${precioTotal.toFixed(2)}` : '';
  
  detallesCabana.innerHTML = `
    <div class="cabana-info-detalle">
      <p><strong>🏠 ${cabana.nombre_cabana}</strong></p>
      <p>👥 Capacidad: ${cabana.capacidad_personas} personas</p>
      <p>💰 Precio por día: $${cabana.precio}</p>
      <p>📝 ${cabana.descripcion || 'Sin descripción disponible'}</p>
      ${dias ? `<p><strong>📅 Estadía: ${dias} día${dias > 1 ? 's' : ''}${precioText}</strong></p>` : ''}
    </div>
  `;
  
  infoCabana.style.display = 'block';
}

async function cargarOpcionesCabana() {
  try {
    const res = await fetch('/api/v1/cabanas');
    const cabanas = await res.json();
    
    cabanas.forEach(c => {
      preciosCabanas[c.id_cabana] = c.precio; // Guardar precio
      cabanasInfo[c.id_cabana] = c; // Guardar información completa
      
      const opcion = document.createElement('option');
      opcion.value = c.id_cabana;
      opcion.textContent = `${c.nombre_cabana} - $${c.precio}/día`;
      selectCabana.appendChild(opcion);
    });
  } catch (err) {
    console.error('Error al cargar cabañas:', err);
    mostrarMensaje(mensajes, 'Error al cargar las cabañas', 'error');
  }
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  
  const datosFormulario = procesarFormulario(formulario);
  
  // Validar fechas
  const validacion = validarFechas(datosFormulario.fecha_inicio, datosFormulario.fecha_fin);
  if (!validacion.valido) {
    mostrarMensaje(mensajes, validacion.mensaje, 'error');
    return;
  }

  const datosTransformados = {
    id_dni: datosFormulario.id_dni,
    nombre: datosFormulario.nombre,
    gmail: datosFormulario.gmail,
    id_cabana: parseInt(datosFormulario.id_cabana),
    fecha_inicio: datosFormulario.fecha_inicio,
    fecha_fin: datosFormulario.fecha_fin,
    precio_total: parseFloat(datosFormulario.precio_total),
    id_estado: parseInt(document.getElementById('estado').value)
  };

  try {
    // Mostrar loading
    mostrarMensaje(mensajes, '🔄 Creando reserva...', 'info');
    
    // Crear huésped
    const resHuesped = await fetch('/api/v1/huespedes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_dni: datosTransformados.id_dni,
        nombre: datosTransformados.nombre,
        gmail: datosTransformados.gmail
      })
    });

    if (!resHuesped.ok) {
      throw new Error('Error al crear/actualizar huésped');
    }

    // Crear reserva
    const resReserva = await altaRegistro('/api/v1/reservas', 'POST', datosTransformados);
    const datos = await resReserva.json();
    
    mostrarMensaje(mensajes, `✅ ${datos.mensaje}`, 'success');
    
    // Limpiar formulario después de éxito
    setTimeout(() => {
      formulario.reset();
      precioInput.value = '';
      infoCabana.style.display = 'none';
    }, 2000);
    
  } catch (error) {
    console.error(error);
    mostrarMensaje(mensajes, '❌ Error al crear la reserva. Verifica los datos e intenta nuevamente.', 'error');
  }
});

async function cargarEstados() {
  try {
    const res = await fetch('/api/v1/estados');
    const estados = await res.json();
    const select = document.getElementById('estado');
    select.innerHTML = '<option value="">Seleccione estado</option>';
    
    estados.forEach(est => {
      const option = document.createElement('option');
      option.value = est.id_estado;
      option.textContent = est.nombreestado;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar estados:', error);
    mostrarMensaje(mensajes, 'Error al cargar los estados', 'error');
  }
}
