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
    try {
        // Primero verificar si hay reservas asociadas
        const reservasAsociadas = await pool.query(
            `SELECT COUNT(*) as total FROM reservas WHERE id_cabana = $1`,
            [id_cabana]
        );
        
        if (reservasAsociadas.rows[0].total > 0) {
            const error = new Error('No se puede eliminar la cabaña porque tiene reservas asociadas');
            error.code = 'RESERVAS_ASOCIADAS';
            error.detail = `La cabaña tiene ${reservasAsociadas.rows[0].total} reserva(s) asociada(s)`;
            throw error;
        }
        
        // Si no hay reservas, proceder con la eliminación
        const resultado = await pool.query(
            `DELETE FROM cabanas WHERE id_cabana = $1 RETURNING id_cabana`,
            [id_cabana]
        );
        
        if (resultado.rowCount === 0) {
            const error = new Error('Cabaña no encontrada');
            error.code = 'NO_ENCONTRADA';
            throw error;
        }
        
        return resultado;
    } catch (error) {
        console.log('Error en eliminarCabana:', error);
        throw error;
    }
}

export {
    obtenerCabana,
    obtenerCabanas,
    crearCabana,
    modificarCabana,
    eliminarCabana
};
