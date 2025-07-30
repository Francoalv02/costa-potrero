import * as modelo from './modelo.huespedes.mjs';

export async function obtenerHuespedes(req, res) {
  try {
    const resultado = await modelo.obtenerTodos();
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener huéspedes' });
  }
}

export async function obtenerUno(req, res) {
  try {
    const resultado = await modelo.obtenerPorDNI(req.params.id_dni);
    if (resultado.rows.length === 0) return res.status(404).json({ mensaje: 'No encontrado' });
    res.json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error' });
  }
}

export async function crearOActualizar(req, res) {
  try {
    const { id_dni, nombre, telefono, gmail } = req.body;
    if (!id_dni || !nombre || !gmail) return res.status(400).json({ mensaje: 'Datos incompletos' });

    await modelo.insertarOActualizar({ id_dni, nombre, telefono, gmail });
    res.status(200).json({ mensaje: 'Huésped guardado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al guardar huésped' });
  }
}

export async function eliminar(req, res) {
  try {
    const resultado = await modelo.eliminar(req.params.id_dni);
    if (resultado.rowCount === 0)
      return res.status(404).json({ mensaje: 'Huésped no encontrado' });

    res.status(200).json({ mensaje: 'Huésped eliminado correctamente' });
  } catch (err) {
    console.error(err);
    if (err.code === 'RESERVAS_ASOCIADAS') {
      res.status(400).json({ mensaje: err.message });
    } else {
      res.status(500).json({ mensaje: 'Error al eliminar huésped' });
    }
  }
}
