import express from 'express';

// v1
import rutasReservasV1 from './api-crud/v1/reservas/rutas.reservas.mjs';
import rutasHuespedesV1 from './api-crud/v1/huespedes/rutas.huespedes.mjs';
import rutasCabanasV1 from './api-crud/v1/cabanas/rutas.cabanas.mjs'; 
import rutasPagosV1 from './api-crud/v1/pagos/rutas.pagos.mjs';
import rutasSolicitudesV1 from './api-crud/v1/solicitudes/rutas.solicitudes.mjs'; 
import rutasUsuariosV1 from './api-crud/v1/usuarios/rutas.usuarios.mjs'; 
import * as controladorReservas from './api-crud/v1/reservas/controlador.reservas.mjs';

const modulosApi = express.Router();

// Agregamos las rutas a la API con prefijos
modulosApi.use('/api/v1/reservas', rutasReservasV1);
modulosApi.use('/api/v1/cabanas', rutasCabanasV1); 
modulosApi.use('/api/v1/huespedes', rutasHuespedesV1);
modulosApi.use('/api/v1/pagos', rutasPagosV1);
modulosApi.use('/api/v1/solicitudes', rutasSolicitudesV1); 
modulosApi.use('/api/v1/usuarios', rutasUsuariosV1); 

// Ruta directa para estados
modulosApi.get('/api/v1/estados', controladorReservas.obtenerEstados);

export default modulosApi;
