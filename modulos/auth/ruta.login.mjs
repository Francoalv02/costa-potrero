import express from 'express';
import pool from '../../conexion/conexion.db.mjs';

const router = express.Router();

// Credenciales de respaldo (fallback)
const USUARIOS_FALLBACK = [

];
 
router.post('/login', async (req, res) => {
    try {
        const { usuario, clave } = req.body;
        
        // Intentar usar la base de datos primero
        try {
            const resultado = await pool.query(
                'SELECT * FROM usuarios WHERE usuario = $1 AND clave = $2',
                [usuario, clave]
            );

            if (resultado.rows.length > 0) {
                // Usuario encontrado en la base de datos
                req.session.usuario = {
                    id: resultado.rows[0].id,
                    usuario: resultado.rows[0].usuario,
                    rol: resultado.rows[0].rol
                };
                return res.json({ mensaje: 'Inicio de sesión exitoso', rol: resultado.rows[0].rol });
            }
        } catch (dbError) {
            console.log('Error de base de datos, usando fallback:', dbError.message);
        }
        
        // Fallback: buscar en credenciales hardcodeadas
        const usuarioEncontrado = USUARIOS_FALLBACK.find(
            u => u.usuario === usuario && u.clave === clave
        );

        if (!usuarioEncontrado) {
            return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
        }

        // Crear sesión con usuario del fallback
        req.session.usuario = {
            id: 1,
            usuario: usuarioEncontrado.usuario,
            rol: usuarioEncontrado.rol
        };

        res.json({ mensaje: 'Inicio de sesión exitoso', rol: usuarioEncontrado.rol });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.status(200).json({ mensaje: 'Sesión cerrada' });
    });
});

export default router;
