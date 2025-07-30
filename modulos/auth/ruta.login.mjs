import express from 'express';
import pool from '../../conexion/conexion.db.mjs';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { usuario, clave } = req.body;
  const resultado = await pool.query(
    'SELECT * FROM usuarios WHERE usuario = $1 AND clave = $2',
    [usuario, clave]
  );

  if (resultado.rows.length === 0) {
    return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
  }

  req.session.usuario = {
    id: resultado.rows[0].id,
    usuario: resultado.rows[0].usuario,
    rol: resultado.rows[0].rol
  };

  res.json({ mensaje: 'Inicio de sesión exitoso', rol: resultado.rows[0].rol });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.status(200).json({ mensaje: 'Sesión cerrada' });
  });
});


export default router;
