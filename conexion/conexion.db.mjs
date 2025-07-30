import pg from 'pg';

const BD_HOST = process.env.BD_HOST;
const BD_PUERTO = process.env.BD_PUERTO;
const BD_USUARIO = process.env.BD_USUARIO;
const BD_PASSWORD = process.env.BD_PASSWORD;
const BD_NOMBRE = process.env.BD_NOMBRE;

const pool = new pg.Pool({
    host: BD_HOST,
    database: BD_NOMBRE,
    port: BD_PUERTO,
    user: BD_USUARIO,
    password: BD_PASSWORD,
});

export default pool;