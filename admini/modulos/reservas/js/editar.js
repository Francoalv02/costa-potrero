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

// Cargar datos al iniciar
window.addEventListener('DOMContentLoaded', async () => {
    try {
        await cargarOpcionesCabana();

        const reserva = await traerRegistro(`/api/v1/reservas/${id}`);

        formulario.id_dni.value = reserva.id_dni;
        formulario.nombre.value = reserva.nombre;
        formulario.email.value = reserva.email;
        formulario.id_cabana.value = reserva.id_cabana;

        // Formatear fechas a yyyy-MM-dd (para input date)
        formulario.fecha_inicio.value = new Date(reserva.fechainicio).toISOString().split('T')[0];
        formulario.fecha_fin.value = new Date(reserva.fechafin).toISOString().split('T')[0];

        formulario.precio_total.value = reserva.preciototal;
        formulario.id_reserva.value = reserva.id;

    } catch (error) {
        console.error(error);
        mostrarMensaje(mensajes, 'Error al cargar los datos de la reserva');
    }
});

// Cargar las cabañas desde la API
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
    } catch (error) {
        console.error('Error al cargar cabañas:', error);
        mostrarMensaje(mensajes, 'No se pudieron cargar las cabañas');
    }
}


// Editar la reserva
formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const datosFormulario = procesarFormulario(formulario);

    const datosEditados = {
        id_dni: datosFormulario.id_dni,
        id_cabana: parseInt(datosFormulario.id_cabana),
        fecha_inicio: datosFormulario.fecha_inicio,
        fecha_fin: datosFormulario.fecha_fin,
        precio_total: parseFloat(datosFormulario.precio_total),
        nombre: datosFormulario.nombre, // <-- agregar
        gmail: datosFormulario.email     // <-- agregar
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
