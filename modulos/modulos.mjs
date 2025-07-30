import express from 'express';

// v1
import rutasReservasV1 from './api-crud/v1/reservas/rutas.reservas.mjs';
import rutasHuespedesV1 from './api-crud/v1/huespedes/rutas.huespedes.mjs';
import rutasCabanasV1 from './api-crud/v1/cabanas/rutas.cabanas.mjs'; // Importación de rutas de cabañas

const modulosApi = express.Router();

// Agregamos las rutas a la API
modulosApi.use(rutasReservasV1);
modulosApi.use(rutasCabanasV1); // Activamos las rutas de cabañas
modulosApi.use(rutasHuespedesV1);

export default modulosApi;
