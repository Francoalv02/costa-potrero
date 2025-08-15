/*
Acceso a la capa de datos: reservas de cabañas
*/

import pool from '../../../../conexion/conexion.db.mjs';

async function obtenerCabanas() {
    try {
        const resultado = await pool.query(
            'SELECT * FROM cabanas ORDER BY 1'
        );
        return resultado;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function obtenerCabana(id_cabana) {
    try {
        // Consulta simple sin JOIN, ya que la tabla cabanas puede no tener id_estado
        const resultado = await pool.query(`
            SELECT 
                id_cabana,
                nombre_cabana,
                descripcion,
                capacidad_personas,
                precio,
                'Disponible' as estado
            FROM cabanas
            WHERE id_cabana = $1
        `, [id_cabana]);
        return resultado;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function crearCabana(cabana) {
    try {
        const {
            nombre_cabana,
            descripcion,
            capacidad_personas,
            precio // ✅ agregado
        } = cabana;

        const resultado = await pool.query(
            `
            INSERT INTO cabanas
                (nombre_cabana, descripcion, capacidad_personas, precio)
            VALUES
                ($1, $2, $3, $4)
            RETURNING id_cabana
            `,
            [nombre_cabana, descripcion, capacidad_personas, precio] // ✅ agregado
        );

        return resultado;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function modificarCabana(cabana) {
    try {
        const {
            id_cabana,
            nombre_cabana,
            descripcion,
            capacidad_personas,
            precio // ✅ agregado
        } = cabana;

        const resultado = await pool.query(
            `
            UPDATE cabanas
            SET
                nombre_cabana = $1,
                descripcion = $2,
                capacidad_personas = $3,
                precio = $4
            WHERE id_cabana = $5
            RETURNING id_cabana
            `,
            [nombre_cabana, descripcion, capacidad_personas, precio, id_cabana] // ✅ actualizado
        );

        return resultado;
    } catch (error) {
        console.log(error);
        throw error;
    }
}



 async function eliminarCabana(id_cabana) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Normalizamos a entero por las dudas
    const id = parseInt(id_cabana, 10);
    if (Number.isNaN(id)) {
      const err = new Error('ID de cabaña inválido');
      err.code = 'ID_INVALIDO';
      throw err;
    }

    // 1) ¿Tiene reservas?
    const { rows: [ rowCountRes ] } = await client.query(
      `SELECT COUNT(*)::int AS total FROM reservas WHERE id_cabana = $1`,
      [id]
    );

    if (rowCountRes.total > 0) {
      await client.query('ROLLBACK');
      const err = new Error('La cabaña no se puede eliminar porque tiene reservas asociadas.');
      err.code = 'TIENE_RESERVAS';
      err.detail = `Tiene ${rowCountRes.total} reserva(s).`;
      throw err;
    }

    // 2) No tiene reservas → limpiamos solicitudes para no chocar con la FK
    await client.query(
      `DELETE FROM solicitudes_reserva WHERE id_cabana = $1`,
      [id]
    );

    // 3) Eliminamos la cabaña
    const del = await client.query(
      `DELETE FROM cabanas WHERE id_cabana = $1 RETURNING id_cabana`,
      [id]
    );

    if (del.rowCount === 0) {
      await client.query('ROLLBACK');
      const err = new Error('Cabaña no encontrada');
      err.code = 'NO_ENCONTRADA';
      throw err;
    }

    await client.query('COMMIT');
    return del; // del.rows[0].id_cabana
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    throw e;
  } finally {
    client.release();
  }
}


export {
    obtenerCabana,
    obtenerCabanas,
    crearCabana,
    modificarCabana,
    eliminarCabana
};
