import express from 'express';
import * as controlador from './controlador.pagos.mjs';

const router = express.Router();
router.use(express.json());

// Rutas API pagos
router.get('/estadopago', controlador.obtenerEstadosPago);
router.get('/metodospago', controlador.obtenerMetodos);
router.post('/', controlador.crearPago);
router.get('/', controlador.obtenerPagos);
router.get('/:id', controlador.obtenerPago);
router.put('/:id', controlador.actualizarPago);
router.delete('/:id', controlador.eliminarPago);
router.post('/reporte', controlador.generarReportePagos);
router.get('/reporte', controlador.generarReportePagos);

export default router;
