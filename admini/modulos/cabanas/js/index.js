import {
    procesarFormulario,
    mostrarMensaje,
    traerRegistro,
    eliminarRegistro
} from '../../../recursos/js/utilidades.js';

const contenedorCabanas = document.getElementById('contenedor-cabanas');

// Mostrar las cabañas
window.addEventListener('load', async () => {
    try {
        const cabanas = await traerRegistro('/api/v1/cabanas/');
        cabanas.forEach((cabana) => {
            contenedorCabanas.innerHTML += `
                <tr>
                    <td>${cabana.id_cabana}</td>
                    <td>${cabana.nombre_cabana}</td>
                    <td>${cabana.descripcion}</td>
                    <td>${cabana.capacidad_personas}</td>
                    <td>
                        <button class="eliminar" data-id="${cabana.id_cabana}">Eliminar</button>
                        <a class="editar" href="editar.html?id=${cabana.id_cabana}">Editar</a>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.log(error);
        mostrarMensaje(document.getElementById('mensajes'), 'No se pudo cargar el listado de cabañas');
    }
});

// Eliminar una cabaña
contenedorCabanas.addEventListener('click', async (evento) => {
    if (evento.target.classList.contains('eliminar')) {
        const idCabana = evento.target.dataset.id;
        try {
            const respuesta = await eliminarRegistro(`/api/v1/cabanas/${idCabana}`);
            const datos = await respuesta.json();
            if (respuesta.ok) {
                evento.target.closest('tr').remove();
                mostrarMensaje(document.getElementById('mensajes'), datos.mensaje);
            } else {
                mostrarMensaje(document.getElementById('mensajes'), 'No se pudo eliminar la cabaña');
            }
        } catch (error) {
            console.log(error);
            mostrarMensaje(document.getElementById('mensajes'), 'Error al eliminar la cabaña');
        }
    }
});
