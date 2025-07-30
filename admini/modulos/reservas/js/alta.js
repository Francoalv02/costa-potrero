import {
  procesarFormulario,
  altaRegistro,
  mostrarMensaje
} from '../../../recursos/js/utilidades.js';

const formulario = document.getElementById('form-alta');
const mensajes = document.getElementById('mensajes');
const precioInput = document.getElementById('precio_total');
const selectCabana = document.getElementById('id_cabana');

// Almacena precios por ID cabaña
let preciosCabanas = {};

window.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const fechaInicio = params.get('fecha_inicio');
  const fechaFin = params.get('fecha_fin');
  const idCabana = params.get('id');

  await Promise.all([cargarOpcionesCabana(), cargarEstados()]);

  if (fechaInicio) document.getElementById('fecha_inicio').value = fechaInicio;
  if (fechaFin) document.getElementById('fecha_fin').value = fechaFin;
  if (idCabana) document.getElementById('id_cabana').value = idCabana;

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
      preciosCabanas[c.id_cabana] = c.precio; // Guardar precio
      const opcion = document.createElement('option');
      opcion.value = c.id_cabana;
      opcion.textContent = c.nombre_cabana;
      selectCabana.appendChild(opcion);
    });
  } catch (err) {
    console.error('Error al cargar cabañas:', err);
    mostrarMensaje(mensajes, 'Error al cargar las cabañas');
  }
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const datosFormulario = procesarFormulario(formulario);

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
    await fetch('/api/v1/huespedes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_dni: datosTransformados.id_dni,
        nombre: datosTransformados.nombre,
        gmail: datosTransformados.gmail
      })
    });

    const resReserva = await altaRegistro('/api/v1/reservas', 'POST', datosTransformados);
    const datos = await resReserva.json();
    mostrarMensaje(mensajes, datos.mensaje);
    formulario.reset();
    precioInput.value = '';
  } catch (error) {
    console.error(error);
    mostrarMensaje(mensajes, 'Datos incompletos o error al crear la reserva');
  }
});

async function cargarEstados() {
  const res = await fetch('/api/v1/estados');
  const estados = await res.json();
  const select = document.getElementById('estado');
  select.innerHTML = '';
  estados.forEach(est => {
    const option = document.createElement('option');
    option.value = est.id_estado;
    option.textContent = est.nombreestado;
    select.appendChild(option);
  });
}
