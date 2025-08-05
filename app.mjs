// Importamos/ejecutamos módulo de configuraciones
import './config/config.mjs';

// Express
import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
dotenv.config();

// Módulos
import modulosAp1 from './modulos/modulos.mjs';
import rutaLogin from './modulos/auth/ruta.login.mjs'; // nueva ruta
import rutasPagos from './modulos/api-crud/v1/pagos/rutas.pagos.mjs'; // módulo pagos

// Instanciamos Express
const app = express();
const PUERTO = process.env.PUERTO || 4000;

// Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de sesión
app.use(session({
  secret: 'secreto123', 
  resave: false,
  saveUninitialized: true
}));

// API y módulos existentes
app.use(modulosAp1);
app.use(rutasPagos);

// Rutas del sistema de login
app.use('/', rutaLogin); 
// Frontends
app.use('/admin', verificarSesionAdmin, express.static('admini')); // protegido
app.use('/', express.static('sitio')); // público

// Middleware de autenticación
function verificarSesionAdmin(req, res, next) {
  if (req.session.usuario && req.session.usuario.rol === 'admin') {
    next();
  } else {
    res.redirect('/login.html');
  }
}

// Levantamos el servidor
app.listen(PUERTO, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PUERTO}`);
});

// Atrapamos todos los métodos y rutas no configuradas
app.all('*', (req, res) => {
  res.status(404).json({ mensaje: 'No encontrado' });
});
