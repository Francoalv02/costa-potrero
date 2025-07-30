/*import bcrypt from 'bcrypt';
import * as modelo from './modelo.usuarios.mjs';

export async function login(req, res) {
  const { usuario, password } = req.body;
  const usuarioBD = await modelo.buscarPorUsuario(usuario);

  if (!usuarioBD) {
    return res.status(401).json({ mensaje: 'Usuario no encontrado' });
  }

  const coincide = await bcrypt.compare(password, usuarioBD.password);
  if (!coincide) {
    return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
  }

  // Guardar usuario en sesión
  req.session.usuario = {
    nombre: usuarioBD.usuario,
    rol: usuarioBD.rol
  };

  res.status(200).json({ mensaje: 'Login correcto', rol: usuarioBD.rol });
}

export function logout(req, res) {
  req.session.destroy();
  res.json({ mensaje: 'Sesión cerrada' });
}

export function verificarSesionAdmin(req, res, next) {
  if (req.session.usuario?.rol === 'admin') {
    next();
  } else {
    res.status(401).json({ mensaje: 'Acceso denegado' });
  }
}*/
