/*
Conecta capa de datos a respuesta clientes (reservas de cabañas)
*/
import * as modelo from './modelo.cabanas.mjs';

async function obtenerCabanas(req, res) {
    try {
        const resultado = await modelo.obtenerCabanas();
        if (resultado.rows.length > 0) {
            res.json(resultado.rows);
        } else {
            res.status(404).json({ mensaje: 'No se encontraron cabañas' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor al obtener cabaña' });
    }
}

async function obtenerCabana(req, res) {
    try {
        const { id } = req.params;
        const resultado = await modelo.obtenerCabana(id);
        if (resultado.rows.length > 0) {
            res.json(resultado.rows[0]);
        } else {
            res.status(404).json({ mensaje: 'Cabaña no encontrada' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor al obtener la cabaña' });
    }
}

async function crearCabana(req, res) {
    try {
        const {
            nombre_cabana,
            descripcion ,
            capacidad_personas

        } = req.body;

        if (!nombre_cabana|| !descripcion || !capacidad_personas ) {
            return res.status(400).json({ mensaje: 'Datos incompletos para crear la cabaña' });
        }

        const resultado = await modelo.crearCabana({
           nombre_cabana,
            descripcion ,
            capacidad_personas
        });

        const { id: idCabanaCreada } = resultado.rows[0];
        res.json({ mensaje: `La Cabaña fue creada correctamente` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor al crear la cabaña' });
    }
}

async function modificarCabana(req, res) {
    try {
        const { id: id_cabana } = req.params;

        const {
           nombre_cabana,
            descripcion ,
            capacidad_personas ,
        } = req.body;

        if (!id_cabana  || !nombre_cabana|| !descripcion || !capacidad_personas) {
            return res.status(400).json({ mensaje: 'Datos incompletos para modificar la cabaña' });
        }

        const resultado = await modelo.modificarCabana({
            id_cabana ,
           nombre_cabana,
            descripcion ,
            capacidad_personas ,
        });

        const { id: idCabanaModificada } = resultado.rows[0];
        res.json({ mensaje: `La Cabaña fue modificada correctamente` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor al modificar la cabaña' });
    }
}

async function eliminarCabana(req, res) {
    try {
        const { id } = req.params;
        const resultado = await modelo.eliminarCabana(id);

        if (resultado.rows.length > 0) {
            const { id: eliminarCabana } = resultado.rows[0];
            res.status(200).json({ mensaje: `La Cabaña fue eliminada correctamente` });
        } else {
            res.status(404).json({ mensaje: 'La Cabaña no encontrada' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor al eliminar la cabaña' });
    }
}

export {
    obtenerCabanas,
    obtenerCabana,
    crearCabana,
    modificarCabana,
    eliminarCabana,
};
