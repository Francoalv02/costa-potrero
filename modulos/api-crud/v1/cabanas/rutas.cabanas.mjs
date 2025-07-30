import express from 'express';
import * as controlador from './controlador.cabanas.mjs'; // Cambia el controlador por el correspondiente a cabañas

const rutasCabanas = express.Router();
rutasCabanas.use(express.json());

// Rutas para cabañas
rutasCabanas.get('/api/v1/cabanas', controlador.obtenerCabanas);
rutasCabanas.get('/api/v1/cabanas/:id', controlador.obtenerCabana);
rutasCabanas.post('/api/v1/cabanas', controlador.crearCabana);
rutasCabanas.put('/api/v1/cabanas/:id', controlador.modificarCabana);
rutasCabanas.delete('/api/v1/cabanas/:id', controlador.eliminarCabana);

export default rutasCabanas;
