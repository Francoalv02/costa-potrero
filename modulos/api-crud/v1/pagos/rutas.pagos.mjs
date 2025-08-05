import express from 'express';
import * as controlador from './controlador.pagos.mjs';

const router = express.Router();
router.use(express.json());

// Rutas API pagos
router.get('/api/v1/estadopago', controlador.obtenerEstadosPago);
router.post('/api/v1/pagos', controlador.crearPago);
router.get('/api/v1/pagos', controlador.obtenerPagos);
router.get('/api/v1/pagos/:id', controlador.obtenerPago);
router.put('/api/v1/pagos/:id', controlador.actualizarPago);
router.delete('/api/v1/pagos/:id', controlador.eliminarPago);
router.post('/api/v1/pagos/reporte', controlador.generarReportePagos);

export default router;
