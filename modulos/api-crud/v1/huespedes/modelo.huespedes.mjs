import pool from '../../../../conexion/conexion.db.mjs';

// Obtener todos los huéspedes
async function obtenerTodos() {
  return await pool.query('SELECT * FROM Huespedes ORDER BY nombre');
}

// Obtener huésped por DNI
async function obtenerPorDNI(id_dni) {
  return await pool.query('SELECT * FROM Huespedes WHERE id_dni = $1', [id_dni]);
}

// Insertar o actualizar huésped
async function insertarOActualizar({ id_dni, nombre, telefono, gmail }) {
  return await pool.query(`
    INSERT INTO Huespedes (id_dni, nombre, telefono, gmail)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (id_dni) DO UPDATE SET
      nombre = EXCLUDED.nombre,
      telefono = EXCLUDED.telefono,
      gmail = EXCLUDED.gmail
  `, [id_dni, nombre, telefono, gmail]);
}

// Actualizar huésped
async function actualizar(id_dni, { nombre, gmail, telefono }) {
  try {
    const resultado = await pool.query(`
      UPDATE Huespedes
      SET nombre = $1,
          gmail = $2,
          telefono = $3
      WHERE id_dni = $4
      RETURNING id_dni
    `, [nombre, gmail, telefono, id_dni]);

    return resultado;
  } catch (error) {
    console.error('Error al actualizar huésped:', error);
    throw error;
  }
}

// Eliminar huésped
async function eliminar(id_dni) {
  // Primero, verificar si tiene reservas asociadas
  const reservas = await pool.query('SELECT 1 FROM reservas WHERE id_dni = $1 LIMIT 1', [id_dni]);
  
  if (reservas.rowCount > 0) {
    const error = new Error('No se puede eliminar el huésped porque tiene reservas asociadas');
    error.code = 'RESERVAS_ASOCIADAS';
    throw error;
  }

  // Si no tiene, lo eliminamos
  return await pool.query('DELETE FROM Huespedes WHERE id_dni = $1', [id_dni]);
}

// Exportaciones
export {
  obtenerTodos,
  obtenerPorDNI,
  insertarOActualizar,
  actualizar,
  eliminar
};
