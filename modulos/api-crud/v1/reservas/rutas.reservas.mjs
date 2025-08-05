import express from 'express';
import * as controlador from './controlador.reservas.mjs';

const rutasReservas = express.Router();
rutasReservas.use(express.json());



// CRUD Reservas
rutasReservas.get('/api/v1/reservas', controlador.obtenerReservas);
rutasReservas.get('/api/v1/reservas/filtros', controlador.obtenerReservasConFiltros);
rutasReservas.get('/api/v1/reservas/reporte', controlador.generarReporteReservas);
rutasReservas.get('/api/v1/reservas/:id', controlador.obtenerReserva);
rutasReservas.put('/api/v1/reservas/:id', controlador.modificarReserva);
rutasReservas.delete('/api/v1/reservas/:id', controlador.eliminarReserva);
rutasReservas.post('/api/v1/reservas', controlador.crearReservaHandler);
rutasReservas.post('/api/v1/disponibilidad', controlador.consultarDisponibilidad);
rutasReservas.get('/api/v1/estados', controlador.obtenerEstados);

export default rutasReservas;
