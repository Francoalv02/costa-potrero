const form = document.getElementById('form-huesped');
const tabla = document.getElementById('tabla-huespedes');

async function cargarHuespedes() {
  const res = await fetch('/api/v1/huespedes');
  const datos = await res.json();
  tabla.innerHTML = '';

  datos.forEach(h => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${h.id_dni}</td>
      <td>${h.nombre}</td>
      <td>${h.telefono || ''}</td>
      <td>${h.gmail}</td>
      <td>
        <button class="eliminar"  onclick="eliminarHuesped('${h.id_dni}')">Eliminar</button>
        <button class="editar"  onclick="editarHuesped('${h.id_dni}')">Editar</button>

      </td>
    `;
    tabla.appendChild(fila);
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const datos = {
    id_dni: form.id_dni.value,
    nombre: form.nombre.value,
    telefono: form.telefono.value,
    gmail: form.gmail.value
  };

  await fetch('/api/v1/huespedes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });

  form.reset();
  cargarHuespedes();
});

window.editarHuesped = async (dni) => {
  const res = await fetch(`/api/v1/huespedes/${dni}`);
  const h = await res.json();
  form.id_dni.value = h.id_dni;
  form.nombre.value = h.nombre;
  form.telefono.value = h.telefono || '';
  form.gmail.value = h.gmail;
};

window.eliminarHuesped = async (dni) => {
  await fetch(`/api/v1/huespedes/${dni}`, { method: 'DELETE' });
  cargarHuespedes();
};

cargarHuespedes();
