// Procesa un formulario HTML y devuelve un objeto con los datos
export function procesarFormulario(formulario) {
    const datos = {};
    new FormData(formulario).forEach((valor, clave) => {
        datos[clave] = valor;
    });
    return datos;
}

// Muestra un mensaje dentro de un elemento
export function mostrarMensaje(contenedor, mensaje) {
    contenedor.innerHTML = mensaje;
}

// Devuelve el ID obtenido desde la URL (por ejemplo editar.html?id=3 => 3)
export function obtenerIdDesdeURL() {
    const parametros = new URLSearchParams(window.location.search);
    return parametros.get('id');
}

// Trae un registro específico desde la API
export async function traerRegistro(url) {
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error('Error al traer registro');
    return await respuesta.json();
}

// Hace una petición POST para dar de alta un registro
export async function altaRegistro(url, metodo, datos) {
    return await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    
}

// Hace una petición PUT para editar un registro existente
export async function editarRegistro(url, metodo, datos) {
    return await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

// Elimina un registro (para usar en el listado si querés)
export async function eliminarRegistro(url) {
    return await fetch(url, {
        method: 'DELETE'
    });
}
