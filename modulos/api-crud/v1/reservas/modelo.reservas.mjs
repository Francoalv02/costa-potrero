import pool from '../../../../conexion/conexion.db.mjs';

//
// ==== CONSULTAR DISPONIBILIDAD ===
//

// Obtener cabañas disponibles en el rango de fechas
export async function obtenerCabanasDisponibles(inicio, fin) {
  const query = `
    SELECT * FROM cabanas c
    WHERE NOT EXISTS (
      SELECT 1 FROM reservas r
      WHERE r.id_cabana = c.id_cabana
      AND ($1, $2) OVERLAPS (r.fechainicio, r.fechafin)
    )
  `;
  const result = await pool.query(query, [inicio, fin]);
  return result.rows;
}

export async function buscarProximaDisponibilidad(fecha_inicio) {
  const query = `
    SELECT MIN(fechafin + 1) AS fecha_inicio FROM reservas
    WHERE fechainicio >= $1
  `;
  const result = await pool.query(query, [fecha_inicio]);
  const nueva_fecha_inicio = result.rows[0]?.fecha_inicio;
  if (!nueva_fecha_inicio) return null;

  const nueva_fecha_fin = new Date(nueva_fecha_inicio);
  nueva_fecha_fin.setDate(nueva_fecha_fin.getDate() + 5);

  return {
    fecha_inicio: nueva_fecha_inicio.toISOString().split('T')[0],
    fecha_fin: nueva_fecha_fin.toISOString().split('T')[0]
  };
}
//
// ==== CRUD RESERVAS ====
//

// Obtener todas las reservas con datos completos
async function obtenerReservas() {
  try {
    const resultado = await pool.query(`
      SELECT 
        r.id_reserva AS id,
        h.id_dni,
        h.nombre,
        h.gmail AS email,
        c.nombre_cabana,
        r.fechaInicio,
        r.fechaFin,
        r.precioTotal
      FROM reservas r
      JOIN huespedes h ON r.id_dni = h.id_dni
      JOIN cabanas c ON r.id_cabana = c.id_cabana
      ORDER BY r.id_reserva
    `);
    return resultado;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Obtener reserva por ID
async function obtenerReserva(id) {
  try {
    const resultado = await pool.query(`
      SELECT 
        r.id_reserva AS id,
        h.id_dni,
        h.nombre,
        h.gmail AS email,
        r.id_cabana,
        r.fechaInicio,
        r.fechaFin,
        r.precioTotal
      FROM reservas r
      JOIN huespedes h ON r.id_dni = h.id_dni
      WHERE r.id_reserva = $1
    `, [id]);
    return resultado;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Crear reserva
async function crearReserva({ id_dni, id_cabana, fecha_inicio, fecha_fin, precio_total }) {
  try {
    const resultado = await pool.query(`
      INSERT INTO reservas (id_dni, id_cabana, fechaInicio, fechaFin, precioTotal)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_reserva AS id
    `, [id_dni, id_cabana, fecha_inicio, fecha_fin, precio_total]);
    return resultado;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Modificar reserva
async function modificarReserva({ id, id_dni, id_cabana, fecha_inicio, fecha_fin, precio_total }) {
  try {
    const resultado = await pool.query(`
      UPDATE reservas
      SET id_dni = $1,
          id_cabana = $2,
          fechaInicio = $3,
          fechaFin = $4,
          precioTotal = $5
      WHERE id_reserva = $6
      RETURNING id_reserva AS id
    `, [id_dni, id_cabana, fecha_inicio, fecha_fin, precio_total, id]);
    return resultado;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Eliminar reserva
async function eliminarReserva(id) {
  try {
    const resultado = await pool.query(`
      DELETE FROM reservas
      WHERE id_reserva = $1
      RETURNING id_reserva AS id
    `, [id]);
    return resultado;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
// Verificar si el huésped existe, si no lo crea
async function verificarOCrearHuesped({ id_dni, nombre, gmail }) {
  try {
    const existe = await pool.query(
      'SELECT * FROM huespedes WHERE id_dni = $1',
      [id_dni]
    );

    if (existe.rows.length === 0) {
      // Insertar huésped si no existe
      await pool.query(
        'INSERT INTO huespedes (id_dni, nombre, gmail) VALUES ($1, $2, $3)',
        [id_dni, nombre, gmail]
      );
    }
  } catch (error) {
    console.error('Error al verificar/crear huésped:', error);
    throw error;
  }
}

// Actualizar nombre y gmail del huésped
async function actualizarHuesped({ id_dni, nombre, gmail }) {
  try {
    const resultado = await pool.query(`
      UPDATE huespedes
      SET nombre = $1,
          gmail = $2
      WHERE id_dni = $3
      RETURNING id_dni
    `, [nombre, gmail, id_dni]);

    return resultado;
  } catch (error) {
    console.error('Error al actualizar huésped:', error);
    throw error;
  }
}



//
// ==== EXPORTACIONES ====
export {
  obtenerReservas,
  obtenerReserva,
  crearReserva,
  modificarReserva,
  eliminarReserva,
  verificarOCrearHuesped,
  actualizarHuesped 
};
