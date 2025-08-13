import express from 'express';
import * as controlador from './controlador.reservas.mjs';

const router = express.Router();

// Rutas para reservas
router.get('/', controlador.obtenerReservas);
router.get('/activas', controlador.obtenerReservasActivas);
router.get('/ultima', controlador.obtenerUltimaReserva);
router.get('/filtros', controlador.obtenerReservasConFiltros); // MOVER ANTES DE /:id
router.get('/reporte', controlador.generarReporteReservas);

// Rutas con parámetros (deben ir DESPUÉS de las rutas específicas)
router.get('/:id', controlador.obtenerReserva);
router.post('/', controlador.crearReservaHandler);
router.put('/:id', controlador.modificarReserva);
router.patch('/:id/estado', controlador.actualizarEstadoCiclo);
router.delete('/:id', controlador.eliminarReserva);

// Rutas adicionales
router.post('/disponibilidad/consultar', controlador.consultarDisponibilidad);

export default router;
