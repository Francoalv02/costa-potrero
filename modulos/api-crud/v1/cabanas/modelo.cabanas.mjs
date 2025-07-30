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
        const resultado = await pool.query(
            'SELECT * FROM cabanas WHERE id_cabana = $1',
            [id_cabana]
        );
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
        const resultado = await pool.query(
            `
            DELETE FROM cabanas
            WHERE id_cabana = $1
            `,
            [id_cabana]
        );
        return resultado;
    } catch (error) {
        console.log(error);
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
