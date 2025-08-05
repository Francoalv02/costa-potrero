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
  setTimeout(() => contenedor.innerHTML = '', 3000);
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

// Alta genérica de registro (POST)
export async function altaRegistro(url, metodo, datos) {
  return await fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
}

// Edición de registro (PUT)
export async function editarRegistro(url, metodo, datos) {
  return await fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
}

// Eliminar registro (DELETE)
export async function eliminarRegistro(url) {
  return await fetch(url, {
    method: 'DELETE'
  });
}

// Alta específica de pago (igual que altaRegistro pero más explícito)
export async function registrarPago(datos) {
  try {
    const res = await fetch('/api/v1/pagos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    return res;
  } catch (error) {
    console.error('Error al registrar pago:', error);
    return { ok: false };
  }
}
