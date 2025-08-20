import express from 'express';
import * as controlador from './controlador.usuarios.mjs';

const router = express.Router();

// GET /api/v1/usuarios - Obtener todos los usuarios
router.get('/', controlador.obtenerUsuarios);

// GET /api/v1/usuarios/:id - Obtener un usuario por ID
router.get('/:id', controlador.obtenerUsuarioPorId);

// POST /api/v1/usuarios - Crear un nuevo usuario
router.post('/', controlador.crearUsuario);

// PUT /api/v1/usuarios/:id - Actualizar un usuario
router.put('/:id', controlador.actualizarUsuario);

// DELETE /api/v1/usuarios/:id - Eliminar un usuario
router.delete('/:id', controlador.eliminarUsuario);

// GET /api/v1/usuarios/reporte - Generar reporte en PDF
router.get('/reporte', controlador.generarReporte);

export default router;
