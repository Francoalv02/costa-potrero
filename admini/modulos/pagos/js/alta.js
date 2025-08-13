import { mostrarMensaje } from '../../../recursos/js/utilidades.js';

const mensajes = document.getElementById('mensajes');
const form = document.getElementById('form-alta-pago');

const selReserva = document.getElementById('id_reserva');
const selEstado = document.getElementById('id_estado_pago');
const selMetodo = document.getElementById('metodo_pago');
const inpMonto = document.getElementById('monto');
const inpFecha = document.getElementById('fecha_pago');
const txtObs = document.getElementById('observacion');

let totalReserva = 0;

async function cargarReservas() {
  try {
    console.log('Cargando reservas...');
    
    // obtener todas las reservas
    const r = await fetch('/api/v1/reservas');
    
    if (!r.ok) {
      throw new Error(`HTTP error! status: ${r.status}`);
    }
    
    const data = await r.json();
    const reservas = Array.isArray(data) ? data : (data?.data || []);
    
    console.log('Reservas recibidas:', reservas.length, 'reservas');

    if (!reservas.length) {
      selReserva.innerHTML = '<option value="">Sin reservas</option>';
      mostrarMensaje(mensajes, 'No hay reservas disponibles');
      return;
    }

    // ordenar por id desc por si acaso
    reservas.sort((a,b) => (b.id || b.id_reserva) - (a.id || a.id_reserva));

    // construir opciones
    selReserva.innerHTML = '';
    reservas.forEach(res => {
      const id = res.id || res.id_reserva;
      const nombre = res.nombre || '';
      const cab = res.nombre_cabana || '';
      const total = parseFloat(res.preciototal || res.precioTotal || 0) || 0;
      const op = document.createElement('option');
      op.value = id;
      op.textContent = `#${id} - ${nombre} - ${cab} - $${total.toLocaleString('es-AR')}`;
      op.dataset.total = String(total);
      selReserva.appendChild(op);
    });

    // Seleccionar por parámetro si vino, si no, la primera (última reserva)
    const idParam = new URLSearchParams(window.location.search).get('id_reserva');
    if (idParam && Array.from(selReserva.options).some(o => o.value === idParam)) {
      selReserva.value = idParam;
      console.log('Reserva seleccionada por parámetro:', idParam);
    } else {
      selReserva.selectedIndex = 0;
      console.log('Primera reserva seleccionada por defecto');
    }

    // actualizar total
    totalReserva = parseFloat(selReserva.options[selReserva.selectedIndex].dataset.total || '0') || 0;
    inpMonto.value = (totalReserva || 0).toFixed(2);
    
    console.log('Reservas cargadas correctamente, total de primera reserva:', totalReserva);
    
  } catch (e) {
    console.error('Error al cargar reservas:', e);
    mostrarMensaje(mensajes, 'Error al cargar reservas');
    selReserva.innerHTML = '<option value="">Error al cargar</option>';
  }
}

selReserva.addEventListener('change', () => {
  totalReserva = parseFloat(selReserva.options[selReserva.selectedIndex].dataset.total || '0') || 0;
  inpMonto.value = (totalReserva || 0).toFixed(2);
  ajustarMonto();
});

async function cargarEstados() {
  try {
    console.log('Cargando estados de pago...');
    const r = await fetch('/api/v1/pagos/estadopago');
    
    if (!r.ok) {
      throw new Error(`HTTP error! status: ${r.status}`);
    }
    
    const estados = await r.json();
    console.log('Estados recibidos:', estados);
    
    selEstado.innerHTML = '<option value="">Seleccione</option>';
    
    if (Array.isArray(estados)) {
      estados.forEach(e => {
        const op = document.createElement('option');
        op.value = e.id_estado_pago;
        op.textContent = e.nombre_estado_pago;
        selEstado.appendChild(op);
      });
      console.log('Estados cargados correctamente:', estados.length, 'estados');
    } else {
      console.error('Formato de estados inválido:', estados);
      mostrarMensaje(mensajes, 'Formato de estados inválido');
    }
  } catch (e) {
    console.error('Error al cargar estados de pago:', e);
    mostrarMensaje(mensajes, 'Error al cargar estados de pago');
  }
}

async function cargarMetodos() {
  try {
    console.log('Cargando métodos de pago...');
    const r = await fetch('/api/v1/pagos/metodospago');
    
    if (!r.ok) {
      throw new Error(`HTTP error! status: ${r.status}`);
    }
    
    const metodos = await r.json();
    console.log('Métodos recibidos:', metodos);
    
    selMetodo.innerHTML = '<option value="">Seleccione un método</option>';
    
    if (Array.isArray(metodos)) {
      metodos.forEach(m => {
        const op = document.createElement('option');
        op.value = m;
        op.textContent = m;
        selMetodo.appendChild(op);
      });
      console.log('Métodos de la BD cargados:', metodos.length, 'métodos');
    } else {
      console.error('Formato de métodos inválido:', metodos);
    }
    
    // Agregar métodos por defecto si no están en la BD
    const metodosDefault = ['Efectivo', 'Transferencia', 'Tarjeta', 'MercadoPago'];
    metodosDefault.forEach(m => {
      if (!Array.from(selMetodo.options).some(o => o.value === m)) {
        const op = document.createElement('option');
        op.value = m;
        op.textContent = m;
        selMetodo.appendChild(op);
      }
    });
    
    // Establecer valor por defecto
    selMetodo.value = 'Efectivo';
    console.log('Métodos cargados correctamente');
    
  } catch (e) {
    console.error('Error al cargar métodos de pago:', e);
    mostrarMensaje(mensajes, 'Error al cargar métodos de pago');
    
    // Cargar métodos por defecto en caso de error
    selMetodo.innerHTML = '<option value="">Seleccione un método</option>';
    ['Efectivo', 'Transferencia', 'Tarjeta', 'MercadoPago'].forEach(m => {
      const op = document.createElement('option');
      op.value = m;
      op.textContent = m;
      selMetodo.appendChild(op);
    });
    selMetodo.value = 'Efectivo';
  }
}

function ajustarMonto() {
  const txt = (selEstado.options[selEstado.selectedIndex]?.textContent || '').toLowerCase();
  let monto = totalReserva;
  if (txt.includes('señ') || txt.includes('sena') || txt.includes('se\u0000f1a')) monto = totalReserva / 2;
  if (txt.includes('realizado')) monto = 0;
  inpMonto.value = (monto || 0).toFixed(2);
}

window.addEventListener('load', async () => {
  try {
    console.log('Inicializando página de alta de pagos...');
    
    // Establecer fecha actual
    const hoy = new Date().toISOString().split('T')[0];
    inpFecha.value = hoy;
    console.log('Fecha establecida:', hoy);
    
    // Cargar datos en paralelo
    console.log('Cargando datos de la BD...');
    await Promise.all([
      cargarReservas(), 
      cargarEstados(), 
      cargarMetodos()
    ]);
    
    // Ajustar monto inicial
    ajustarMonto();
    console.log('Inicialización completada');
    
  } catch (error) {
    console.error('Error en la inicialización:', error);
    mostrarMensaje(mensajes, 'Error al inicializar la página');
  }
});

selEstado.addEventListener('change', ajustarMonto);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id_reserva = parseInt(selReserva.value);
  const id_estado_pago = parseInt(selEstado.value);
  const metodo_pago = selMetodo.value;
  const observacion = txtObs.value;
  const monto = parseFloat(inpMonto.value) || undefined;
  const fecha_pago = inpFecha.value;

  if (!id_reserva || Number.isNaN(id_estado_pago) || !metodo_pago) {
    mostrarMensaje(mensajes, 'Complete estado y método de pago');
    return;
  }

  try {
    const r = await fetch('/api/v1/pagos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_reserva, id_estado_pago, metodo_pago, observacion, monto, fecha_pago })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.mensaje || 'No se pudo registrar el pago');

    mostrarMensaje(mensajes, '✅ Pago registrado');
    setTimeout(() => (window.location.href = '../reservas/index.html'), 1200);
  } catch (err) {
    console.error(err);
    mostrarMensaje(mensajes, 'Error al registrar pago');
  }
});
