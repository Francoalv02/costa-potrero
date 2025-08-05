import express from 'express';
import * as controlador from './controlador.huespedes.mjs';

const router = express.Router();

router.use(express.json());

router.get('/api/v1/huespedes', controlador.obtenerHuespedes);
router.get('/api/v1/huespedes/reporte', controlador.generarReporteHuespedes);
router.get('/api/v1/huespedes/:id_dni', controlador.obtenerUno);
router.post('/api/v1/huespedes', controlador.crearOActualizar);
router.put('/api/v1/huespedes/:id_dni', controlador.actualizar);
router.delete('/api/v1/huespedes/:id_dni', controlador.eliminar);

export default router;
