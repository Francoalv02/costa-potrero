import express from 'express';
import * as controlador from './controlador.huespedes.mjs';

const router = express.Router();

router.use(express.json());

router.get('/', controlador.obtenerHuespedes);
router.get('/reporte', controlador.generarReporteHuespedes);
router.get('/:id_dni', controlador.obtenerUno);
router.post('/', controlador.crearOActualizar);
router.put('/:id_dni', controlador.actualizar);
router.delete('/:id_dni', controlador.eliminar);

export default router;
