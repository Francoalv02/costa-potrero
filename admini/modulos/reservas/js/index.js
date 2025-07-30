import {
    procesarFormulario,
    mostrarMensaje,
    traerRegistro,
    eliminarRegistro
} from '../../../recursos/js/utilidades.js';

const contenedorReservas = document.getElementById('contenedor-reservas');

// Mostrar las reservas
window.addEventListener('load', async () => {
    try {
        const reservas = await traerRegistro('/api/v1/reservas/');
        reservas.forEach((reserva) => {
            contenedorReservas.innerHTML += `
                <tr>
                    <td>${reserva.id}</td>
                    <td>${reserva.id_dni}</td>
                    <td>${reserva.nombre || 'N/A'}</td>
                    <td>${reserva.email || 'N/A'}</td>
                    <td>${reserva.fechainicio || 'N/A'}</td>
                    <td>${reserva.fechafin || 'N/A'}</td>
                    <td>${reserva.nombre_cabana || 'N/A'}</td>
                    <td>${reserva.preciototal || 'N/A'}</td>
                    <td>${reserva.nombreestado}</td>
                    <td>
                        <button class="eliminar" data-id="${reserva.id}">Eliminar</button>
                        <a class="editar" href="editar.html?id=${reserva.id}">Editar</a>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.log(error);
        mostrarMensaje(document.getElementById('mensajes'), 'No se pudo cargar el listado');
    }
});


// Eliminar una reserva
contenedorReservas.addEventListener('click', async (evento) => {
    if (evento.target.classList.contains('eliminar')) {
        const idReserva = evento.target.dataset.id;
        try {
            const respuesta = await eliminarRegistro(`/api/v1/reservas/${idReserva}`);
            const datos = await respuesta.json();
            if (respuesta.ok) {
                evento.target.closest('tr').remove();
                mostrarMensaje(document.getElementById('mensajes'), datos.mensaje);
            } else {
                mostrarMensaje(document.getElementById('mensajes'), 'No se pudo eliminar la reserva');
            }
        } catch (error) {
            console.log(error);
            mostrarMensaje(document.getElementById('mensajes'), 'Error al eliminar la reserva');
        }
    }
});
