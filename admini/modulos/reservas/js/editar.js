import {
  procesarFormulario,
  mostrarMensaje,
  obtenerIdDesdeURL,
  traerRegistro,
  editarRegistro
} from '../../../recursos/js/utilidades.js';

const id = obtenerIdDesdeURL();
const formulario = document.getElementById('form-editar');
const mensajes = document.getElementById('mensajes');
const selectCabana = document.getElementById('id_cabana');
const selectEstado = document.getElementById('estado');
const precioInput = document.getElementById('precio_total');

// Guardar precios reales
let preciosCabanas = {};

window.addEventListener('DOMContentLoaded', async () => {
  try {
    await cargarOpcionesCabana();
    await cargarEstados();

    const reserva = await traerRegistro(`/api/v1/reservas/${id}`);
    console.log('Datos de la reserva cargados:', reserva);

    formulario.id_dni.value = reserva.id_dni;
    formulario.nombre.value = reserva.nombre;
    formulario.email.value = reserva.email;
    formulario.telefono.value = reserva.telefono || '';
    formulario.id_cabana.value = reserva.id_cabana;
    formulario.fecha_inicio.value = reserva.fechainicio ? new Date(reserva.fechainicio).toISOString().split('T')[0] : '';
    formulario.fecha_fin.value = reserva.fechafin ? new Date(reserva.fechafin).toISOString().split('T')[0] : '';
    formulario.precio_total.value = reserva.preciototal;
    formulario.id_reserva.value = reserva.id;
    formulario.estado.value = reserva.id_estado || '';

    calcularPrecio(); // Calcular por si hay diferencias
  } catch (error) {
    console.error(error);
    mostrarMensaje(mensajes, 'Error al cargar los datos de la reserva');
  }
});

// Cambios que recalculan el precio
formulario.addEventListener('change', calcularPrecio);

function calcularPrecio() {
  const fechaInicio = new Date(formulario.fecha_inicio.value);
  const fechaFin = new Date(formulario.fecha_fin.value);
  const idCabana = parseInt(formulario.id_cabana.value);

  if (!isNaN(idCabana) && fechaInicio && fechaFin && fechaFin > fechaInicio) {
    const dias = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
    const precioUnitario = preciosCabanas[idCabana] || 0;
    precioInput.value = (dias * precioUnitario).toFixed(2);
  } else {
    precioInput.value = '';
  }
}

async function cargarOpcionesCabana() {
  try {
    const res = await fetch('/api/v1/cabanas');
    const cabanas = await res.json();
    console.log('Cabañas cargadas:', cabanas);
    
    // Normalizar respuesta si viene como { success, data }
    const listaCabanas = Array.isArray(cabanas) ? cabanas : (cabanas?.data || []);
    
    listaCabanas.forEach(c => {
      const idCabana = c.id || c.id_cabana;
      const nombreCabana = c.nombre || c.nombre_cabana;
      const precio = c.precio || 0;
      
      preciosCabanas[idCabana] = precio;
      const opcion = document.createElement('option');
      opcion.value = idCabana;
      opcion.textContent = nombreCabana;
      selectCabana.appendChild(opcion);
    });
  } catch (error) {
    console.error('Error al cargar cabañas:', error);
    mostrarMensaje(mensajes, 'No se pudieron cargar las cabañas');
  }
}

async function cargarEstados() {
  try {
    const res = await fetch('/api/v1/estados');
    const estados = await res.json();
    console.log('Estados cargados:', estados);
    selectEstado.innerHTML = '';

    estados.forEach(est => {
      const option = document.createElement('option');
      option.value = est.id_estado;
      option.textContent = est.nombreestado;
      selectEstado.appendChild(option);
    });
  } catch (err) {
    console.error('Error al cargar estados:', err);
  }
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const datosFormulario = procesarFormulario(formulario);
  console.log('Datos del formulario:', datosFormulario);

  const datosEditados = {
    id_dni: datosFormulario.id_dni,
    id_cabana: parseInt(datosFormulario.id_cabana),
    fecha_inicio: datosFormulario.fecha_inicio,
    fecha_fin: datosFormulario.fecha_fin,
    precio_total: parseFloat(datosFormulario.precio_total),
    nombre: datosFormulario.nombre,
    gmail: datosFormulario.email,
    telefono: datosFormulario.telefono,
    id_estado: parseInt(datosFormulario.estado)
  };
  console.log('Datos a enviar:', datosEditados);

  try {
    const respuesta = await editarRegistro(`/api/v1/reservas/${id}`, 'PUT', datosEditados);
    const datos = await respuesta.json();
    console.log('Respuesta del servidor:', datos);
    mostrarMensaje(mensajes, datos.mensaje);
    
    // Redirigir después de editar exitosamente
    if (respuesta.ok) {
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
    }
  } catch (error) {
    console.error(error);
    mostrarMensaje(mensajes, 'No se pudo editar la reserva');
  }
});
