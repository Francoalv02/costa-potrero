import pool from '../../../../conexion/conexion.db.mjs';

// Obtener todos los estados de pago
async function obtenerEstadosPago() {
  const res = await pool.query('SELECT * FROM estadopago ORDER BY id_estado_pago');
  return res.rows;
}

// Crear un nuevo pago
async function crearPago({ id_reserva, id_estado_pago, metodo_pago, observacion }) {
  // Obtener el total de la reserva
  const res = await pool.query('SELECT preciototal FROM reservas WHERE id_reserva = $1', [id_reserva]);
  const total = res.rows[0]?.preciototal || 0;

  // Calcular el monto según el estado
  let monto = total;
  if (id_estado_pago === 2) monto = total / 2;
  else if (id_estado_pago === 3) monto = 0;

  const insert = await pool.query(
    `INSERT INTO pagos (id_reserva, monto, id_estado_pago, metodo_pago, observacion)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id_pago`,
    [id_reserva, monto, id_estado_pago, metodo_pago, observacion]
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
      p.monto,
      p.fecha_pago,
      ep.nombre_estado_pago,
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
  const res = await pool.query(`
    UPDATE pagos 
    SET id_estado_pago = $1, metodo_pago = $2, observacion = $3
    WHERE id_pago = $4
    RETURNING id_pago
  `, [id_estado_pago, metodo_pago, observacion, id_pago]);
  
  return res;
}

// Eliminar un pago
async function eliminarPago(id_pago) {
  await pool.query('DELETE FROM pagos WHERE id_pago = $1', [id_pago]);
}

export {
  obtenerEstadosPago,
  crearPago,
  obtenerPagos,
  obtenerPagoPorId,
  actualizarPago,
  eliminarPago
};
