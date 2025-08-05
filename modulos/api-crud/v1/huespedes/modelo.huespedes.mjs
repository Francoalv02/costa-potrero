import pool from '../../../../conexion/conexion.db.mjs';

export async function obtenerTodos() {
  return await pool.query('SELECT * FROM Huespedes ORDER BY nombre');
}

export async function obtenerPorDNI(id_dni) {
  return await pool.query('SELECT * FROM Huespedes WHERE id_dni = $1', [id_dni]);
}

export async function insertarOActualizar({ id_dni, nombre, telefono, gmail }) {
  return await pool.query(`
    INSERT INTO Huespedes (id_dni, nombre, telefono, gmail)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (id_dni) DO UPDATE SET
      nombre = EXCLUDED.nombre,
      telefono = EXCLUDED.telefono,
      gmail = EXCLUDED.gmail
  `, [id_dni, nombre, telefono, gmail]);
}

export async function actualizar(dniOriginal, { id_dni, nombre, telefono, gmail }) {
  return await pool.query(`
    UPDATE Huespedes 
    SET id_dni = $1, nombre = $2, telefono = $3, gmail = $4
    WHERE id_dni = $5
  `, [id_dni, nombre, telefono, gmail, dniOriginal]);
}

export async function eliminar(id_dni) {
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
