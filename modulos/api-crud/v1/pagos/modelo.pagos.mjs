import pool from '../../../../conexion/conexion.db.mjs';

// Obtener todos los estados de pago
async function obtenerEstadosPago() {
  const res = await pool.query('SELECT * FROM estadopago ORDER BY id_estado_pago');
  return res.rows;
}

// Crear un nuevo pago
async function crearPago({ id_reserva, id_estado_pago, metodo_pago, observacion, monto, fecha_pago }) {
  // Obtener el total de la reserva
  const res = await pool.query('SELECT preciototal FROM reservas WHERE id_reserva = $1', [id_reserva]);
  const total = res.rows[0]?.preciototal || 0;

  // Calcular el monto según el estado si no viene provisto
  let montoFinal = (monto != null && !Number.isNaN(parseFloat(monto))) ? parseFloat(monto) : total;
  if (monto == null) {
    if (id_estado_pago === 2) montoFinal = total / 2; // Señado
    else if (id_estado_pago === 3) montoFinal = 0;    // No realizado
  }

  // Fecha de pago
  const fecha = fecha_pago ? new Date(fecha_pago) : new Date();

  const insert = await pool.query(
    `INSERT INTO pagos (id_reserva, monto, id_estado_pago, metodo_pago, observacion, fecha_pago)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id_pago`,
    [id_reserva, montoFinal, id_estado_pago, metodo_pago, observacion, fecha]
  );

  return insert;
}

// Obtener todos los pagos
async function obtenerPagos() {
  const res = await pool.query(`
    SELECT 
      p.id_pago,
      r.id_reserva,
      h.nombre AS huesped,
      c.nombre_cabana,
      p.monto AS monto_pagado,
      r.preciototal AS monto_total,
      p.fecha_pago,
      ep.nombre_estado_pago,
      ep.id_estado_pago,
      p.metodo_pago,
      p.observacion
    FROM pagos p
    JOIN reservas r ON p.id_reserva = r.id_reserva
    JOIN huespedes h ON r.id_dni = h.id_dni
    JOIN cabanas c ON r.id_cabana = c.id_cabana
    JOIN estadopago ep ON p.id_estado_pago = ep.id_estado_pago
    ORDER BY p.id_pago DESC
  `);
  return res.rows;
}

// Obtener un pago por ID
async function obtenerPagoPorId(id_pago) {
  const res = await pool.query(`
    SELECT 
      p.id_pago,
      r.id_reserva,
      h.nombre AS huesped,
      h.id_dni,
      c.nombre_cabana,
      c.id_cabana,
      p.monto,
      p.fecha_pago,
      ep.nombre_estado_pago,
      ep.id_estado_pago,
      p.metodo_pago,
      p.observacion,
      r.fechaInicio,
      r.fechaFin,
      r.precioTotal
    FROM pagos p
    JOIN reservas r ON p.id_reserva = r.id_reserva
    JOIN huespedes h ON r.id_dni = h.id_dni
    JOIN cabanas c ON r.id_cabana = c.id_cabana
    JOIN estadopago ep ON p.id_estado_pago = ep.id_estado_pago
    WHERE p.id_pago = $1
  `, [id_pago]);
  return res;
}

// Actualizar un pago
async function actualizarPago(id_pago, { id_estado_pago, metodo_pago, observacion }) {
  try {
    // Primero obtener el pago actual para saber la reserva
    const pagoActual = await pool.query('SELECT id_reserva FROM pagos WHERE id_pago = $1', [id_pago]);
    if (pagoActual.rows.length === 0) {
      throw new Error('Pago no encontrado');
    }
    
    const id_reserva = pagoActual.rows[0].id_reserva;
    
    // Obtener el precio total de la reserva
    const reserva = await pool.query('SELECT preciototal FROM reservas WHERE id_reserva = $1', [id_reserva]);
    if (reserva.rows.length === 0) {
      throw new Error('Reserva no encontrada');
    }
    
    const precioTotal = parseFloat(reserva.rows[0].preciototal || 0);
    
    // Calcular el nuevo monto según el estado
    let nuevoMonto = precioTotal;
    if (id_estado_pago === 2) { // Señado
      nuevoMonto = precioTotal / 2;
    } else if (id_estado_pago === 3) { // Realizado
      nuevoMonto = precioTotal;
    }
    
    // Actualizar el pago con el nuevo monto
    const res = await pool.query(`
      UPDATE pagos 
      SET id_estado_pago = $1, metodo_pago = $2, observacion = $3, monto = $4
      WHERE id_pago = $5
      RETURNING id_pago
    `, [id_estado_pago, metodo_pago, observacion, nuevoMonto, id_pago]);
    
    return res;
  } catch (error) {
    console.error('Error en actualizarPago:', error);
    throw error;
  }
}

// Eliminar un pago
async function eliminarPago(id_pago) {
  await pool.query('DELETE FROM pagos WHERE id_pago = $1', [id_pago]);
}

async function obtenerMetodosPago() {
  const res = await pool.query(`
    SELECT DISTINCT metodo_pago
    FROM pagos
    WHERE metodo_pago IS NOT NULL AND TRIM(metodo_pago) <> ''
    ORDER BY metodo_pago
  `);
  // Mapear a lista simple de strings
  return res.rows.map(r => r.metodo_pago);
}

export {
  obtenerEstadosPago,
  crearPago,
  obtenerPagos,
  obtenerPagoPorId,
  actualizarPago,
  eliminarPago,
  obtenerMetodosPago
};
