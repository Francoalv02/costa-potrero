import express from 'express';
import * as controlador from './controlador.cabanas.mjs';

const rutasCabanas = express.Router();
rutasCabanas.use(express.json());

// Rutas para cabañas
rutasCabanas.get('/', controlador.obtenerCabanas);
rutasCabanas.get('/reporte', controlador.generarReporteCabanas);
rutasCabanas.get('/:id', controlador.obtenerCabana);
rutasCabanas.post('/', controlador.crearCabana);
rutasCabanas.put('/:id', controlador.modificarCabana);
rutasCabanas.delete('/:id', controlador.eliminarCabana);

export default rutasCabanas;
