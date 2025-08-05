//import { mostrarMensaje } from './utilidades.sitio';

const form = document.getElementById('form-disponibilidad');
const resultado = document.getElementById('resultado');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  resultado.innerHTML = 'Buscando disponibilidad...';
  const fecha_inicio = document.getElementById('fecha_inicio').value;
  const fecha_fin = document.getElementById('fecha_fin').value;

  try {
    const res = await fetch('/api/v1/disponibilidad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha_inicio, fecha_fin })
    });
    const data = await res.json();
    resultado.innerHTML = '';

    if (data.disponibles.length > 0) {
      data.disponibles.forEach(cabana => {
        resultado.innerHTML += `
          <div>
            <p>Disponible: ${cabana.nombre_cabana} (ID: ${cabana.id_cabana})</p>
            <button onclick="">Contactar</button>
          </div>
        `;
      });
    } else {
      resultado.innerHTML = '<p>No hay cabañas disponibles en esas fechas.</p>';
      if (data.sugerencia) {
        resultado.innerHTML += `<p>Próxima disponibilidad sugerida: del ${data.sugerencia.fecha_inicio} al ${data.sugerencia.fecha_fin}</p>`;
      }
    }
  } catch (err) {
    console.error(err);
    mostrarMensaje(resultado, 'Error al consultar disponibilidad.');
  }
});
