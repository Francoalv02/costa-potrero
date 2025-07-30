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

    formulario.id_dni.value = reserva.id_dni;
    formulario.nombre.value = reserva.nombre;
    formulario.email.value = reserva.email;
    formulario.id_cabana.value = reserva.id_cabana;
    formulario.fecha_inicio.value = new Date(reserva.fechainicio).toISOString().split('T')[0];
    formulario.fecha_fin.value = new Date(reserva.fechafin).toISOString().split('T')[0];
    formulario.precio_total.value = reserva.preciototal;
    formulario.id_reserva.value = reserva.id;
    formulario.estado.value = reserva.id_estado;

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
    cabanas.forEach(c => {
      preciosCabanas[c.id_cabana] = c.precio;
      const opcion = document.createElement('option');
      opcion.value = c.id_cabana;
      opcion.textContent = c.nombre_cabana;
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

  const datosEditados = {
    id_dni: datosFormulario.id_dni,
    id_cabana: parseInt(datosFormulario.id_cabana),
    fecha_inicio: datosFormulario.fecha_inicio,
    fecha_fin: datosFormulario.fecha_fin,
    precio_total: parseFloat(datosFormulario.precio_total),
    nombre: datosFormulario.nombre,
    gmail: datosFormulario.email,
    id_estado: parseInt(datosFormulario.estado)
  };

  try {
    const respuesta = await editarRegistro(`/api/v1/reservas/${id}`, 'PUT', datosEditados);
    const datos = await respuesta.json();
    mostrarMensaje(mensajes, datos.mensaje);
  } catch (error) {
    console.error(error);
    mostrarMensaje(mensajes, 'No se pudo editar la reserva');
  }
});
