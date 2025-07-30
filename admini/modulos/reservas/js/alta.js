import {
  procesarFormulario,
  altaRegistro,
  mostrarMensaje
} from '../../../recursos/js/utilidades.js';

const formulario = document.getElementById('form-alta');
const mensajes = document.getElementById('mensajes');
const precioInput = document.getElementById('precio_total');
const selectCabana = document.getElementById('id_cabana');

// Tarifas por cabaña (ajustalas según tus precios reales)
const tarifasPorCabana = {
  1: 15000,
  2: 12000,
  3: 20000,
  4: 18000
};

// Precargar desde URL y llenar opciones
window.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const fechaInicio = params.get('fecha_inicio');
  const fechaFin = params.get('fecha_fin');
  const idCabana = params.get('id');

  await cargarOpcionesCabana(); // ← Llenamos el select con cabañas

  if (fechaInicio) document.getElementById('fecha_inicio').value = fechaInicio;
  if (fechaFin) document.getElementById('fecha_fin').value = fechaFin;
  if (idCabana) document.getElementById('id_cabana').value = idCabana;

  calcularPrecio(); // Calcular de entrada si está todo completo
});

// Llenar lista desplegable desde la API
async function cargarOpcionesCabana() {
  try {
    const res = await fetch('/api/v1/cabanas');
    const cabanas = await res.json();

    cabanas.forEach(c => {
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

// Actualiza el precio cuando cambian fechas o cabaña
formulario.addEventListener('change', calcularPrecio);

function calcularPrecio() {
  const fechaInicio = new Date(document.getElementById('fecha_inicio').value);
  const fechaFin = new Date(document.getElementById('fecha_fin').value);
  const idCabana = parseInt(document.getElementById('id_cabana').value);

  if (!isNaN(idCabana) && fechaInicio && fechaFin && fechaFin > fechaInicio) {
    const dias = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
    const tarifa = tarifasPorCabana[idCabana] || 10000;
    precioInput.value = (dias * tarifa).toFixed(2);
  } else {
    precioInput.value = '';
  }
}

// Enviar datos al backend
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
    precio_total: parseFloat(datosFormulario.precio_total)
  };

  try {
    // 1. Verificar o crear huésped
    const resHuesped = await fetch('/api/v1/huespedes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_dni: datosTransformados.id_dni,
        nombre: datosTransformados.nombre,
        gmail: datosTransformados.gmail

      })
    });

    if (!resHuesped.ok) throw new Error('Error al registrar huésped');

    // 2. Crear reserva
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
