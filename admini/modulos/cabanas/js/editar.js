import {
  procesarFormulario,
  mostrarMensaje,
  obtenerIdDesdeURL,
  traerRegistro,
  editarRegistro
} from '../../../recursos/js/utilidades.js';

const id = obtenerIdDesdeURL();
const formulario = document.getElementById('form-editarCabana');
const mensajes = document.getElementById('mensajes');

// Cargar los datos de la cabaña en el formulario
window.addEventListener('load', async () => {
  try {
    const cabana = await traerRegistro(`/api/v1/cabanas/${id}`);
    formulario.nombre_cabana.value = cabana.nombre_cabana;
    formulario.descripcion.value = cabana.descripcion;
    formulario.capacidad_personas.value = cabana.capacidad_personas;
    formulario.precio.value = cabana.precio;
  } catch (error) {
    console.log(error);
    mostrarMensaje(mensajes, 'Error al cargar los datos de la cabaña');
  }
});

// Guardar los cambios
formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const datosFormulario = procesarFormulario(formulario);

  try {
    const respuesta = await editarRegistro(
      `/api/v1/cabanas/${id}`,
      'PUT',
      datosFormulario
    );
    const datos = await respuesta.json();
    mostrarMensaje(mensajes, datos.mensaje);
  } catch (error) {
    console.log(error);
    mostrarMensaje(mensajes, 'No se pudo editar la cabaña');
  }
});
