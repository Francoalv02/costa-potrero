import * as modelo from './modelo.reservas.mjs';

// --- CONSULTAR DISPONIBILIDAD ---
export async function consultarDisponibilidad(req, res) {
  const { fecha_inicio, fecha_fin } = req.body;
  if (!fecha_inicio || !fecha_fin) return res.status(400).json({ mensaje: 'Fechas requeridas' });
  try {
    const disponibles = await modelo.obtenerCabanasDisponibles(fecha_inicio, fecha_fin);
    if (disponibles.length > 0) {
      res.json({ disponibles });
    } else {
      const sugerencia = await modelo.buscarProximaDisponibilidad(fecha_inicio);
      res.status(404).json({ mensaje: 'Sin disponibilidad', sugerencia });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar disponibilidad' });
  }
}

// --- OBTENER TODAS LAS RESERVAS ---
async function obtenerReservas(req, res) {
  try {
    const resultado = await modelo.obtenerReservas();
    if (resultado.rows.length > 0) {
      res.json(resultado.rows);
    } else {
      res.status(404).json({ mensaje: 'No se encontraron reservas' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
}

// --- OBTENER UNA RESERVA POR ID ---
async function obtenerReserva(req, res) {
  try {
    const { id } = req.params;
    const resultado = await modelo.obtenerReserva(id);

    if (resultado.rows.length > 0) {
      res.json(resultado.rows[0]);
    } else {
      res.status(404).json({ mensaje: 'Reserva no encontrada' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
}

// --- CREAR NUEVA RESERVA (verifica huésped también) ---
 async function crearReservaHandler(req, res) {
  try {
    const { id_dni, nombre, gmail, id_cabana, fecha_inicio, fecha_fin, precio_total } = req.body;

    if (!id_dni || !nombre || !gmail || !id_cabana || !fecha_inicio || !fecha_fin || !precio_total) {
      return res.status(400).json({ mensaje: 'Datos incompletos' });
    }

    // Asegura huésped existente
    await modelo.verificarOCrearHuesped({ id_dni, nombre, gmail });

    // Crea la reserva
    const resultado = await modelo.crearReserva({ id_dni, id_cabana, fecha_inicio, fecha_fin, precio_total });

    res.status(201).json({ mensaje: `Reserva creada correctamente` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear la reserva' });
  }
}

// --- MODIFICAR RESERVA ---
// --- MODIFICAR RESERVA ---
async function modificarReserva(req, res) {
  try {
    const { id } = req.params;
    const { id_dni, id_cabana, fecha_inicio, fecha_fin, precio_total, nombre, gmail } = req.body;

    if (!id || !id_dni || !id_cabana || !fecha_inicio || !fecha_fin || !precio_total) {
      return res.status(400).json({ mensaje: 'Datos incompletos' });
    }

    // ✅ ACTUALIZAR DATOS DEL HUÉSPED
    await modelo.actualizarHuesped({ id_dni, nombre, gmail });

    // ✅ MODIFICAR RESERVA
    const resultado = await modelo.modificarReserva({
      id,
      id_dni,
      id_cabana,
      fecha_inicio,
      fecha_fin,
      precio_total
    });

    const { id: idReservaModificada } = resultado.rows[0];
    res.json({ mensaje: `Reserva ${idReservaModificada} modificada correctamente` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
}


// --- ELIMINAR RESERVA ---
async function eliminarReserva(req, res) {
  try {
    const { id } = req.params;
    const resultado = await modelo.eliminarReserva(id);

    if (resultado.rows.length > 0) {
      const { id: idReservaEliminada } = resultado.rows[0];
      res.status(200).json({ mensaje: `Reserva ${idReservaEliminada} eliminada correctamente` });
    } else {
      res.status(404).json({ mensaje: 'Reserva no encontrada' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
}

// --- EXPORTACIONES ---
export {
  obtenerReservas,
  obtenerReserva,
  crearReservaHandler,
  modificarReserva,
  eliminarReserva
};
