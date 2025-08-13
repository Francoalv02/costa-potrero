import express from 'express';
import * as controlador from './controlador.solicitudes.mjs';

const rutasSolicitudes = express.Router();
rutasSolicitudes.use(express.json());

// Ruta temporal para crear la tabla
rutasSolicitudes.post('/crear-tabla', controlador.crearTablaSolicitudes);

// CRUD Solicitudes
rutasSolicitudes.get('/', controlador.obtenerSolicitudes);
rutasSolicitudes.get('/:id', controlador.obtenerSolicitud);
rutasSolicitudes.post('/', controlador.crearSolicitud);
rutasSolicitudes.put('/:id/estado', controlador.actualizarEstadoSolicitud);
rutasSolicitudes.delete('/:id', controlador.eliminarSolicitud);
rutasSolicitudes.get('/estadisticas', controlador.obtenerEstadisticas);

export default rutasSolicitudes; 