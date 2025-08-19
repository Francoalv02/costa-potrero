import pool from '../../../../conexion/conexion.db.mjs';

// Función para crear la tabla si no existe
async function inicializarTabla() {
    try {
        
        
        // Crear la tabla si no existe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS solicitudes_reserva (
                id_solicitud SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                gmail VARCHAR(100) NOT NULL,
                telefono VARCHAR(20) NOT NULL,
                id_cabana INTEGER REFERENCES cabanas(id_cabana),
                fecha_inicio DATE NOT NULL,
                fecha_fin DATE NOT NULL,
                estado VARCHAR(20) DEFAULT 'Pendiente',
                fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                observaciones TEXT,
                precio_estimado DECIMAL(10,2)
            );
        `);
        
        console.log('Tabla de solicitudes verificada y creada');
        
        // Insertar datos de prueba si la tabla está vacía
        const countResult = await pool.query('SELECT COUNT(*) as total FROM solicitudes_reserva');
        if (parseInt(countResult.rows[0].total) === 0) {
            await pool.query(`
                INSERT INTO solicitudes_reserva (nombre, gmail, telefono, id_cabana, fecha_inicio, fecha_fin, precio_estimado) VALUES
                ('Juan Pérez', 'juan.perez@gmail.com', '+54 351 123 4567', 1, '2025-08-15', '2025-08-20', 80000.00),
                ('María González', 'maria.gonzalez@hotmail.com', '+54 351 987 6543', 2, '2025-08-25', '2025-08-30', 75000.00),
                ('Carlos López', 'carlos.lopez@yahoo.com', '+54 351 555 1234', 3, '2025-09-01', '2025-09-05', 65000.00);
            `);
            console.log('Datos de prueba insertados');
        }
        
    } catch (error) {
        console.error('Error al inicializar tabla de solicitudes:', error);
    }
}

// Ejecutar la inicialización
inicializarTabla();

// Obtener todas las solicitudes
async function obtenerSolicitudes() {
  try {
    const query = `
      SELECT 
        sr.id_solicitud,
        sr.nombre,
        sr.gmail,
        sr.telefono,
        sr.id_cabana,
        c.nombre_cabana,
        sr.fecha_inicio,
        sr.fecha_fin,
        sr.estado,
        sr.fecha_solicitud,
        sr.observaciones,
        sr.precio_estimado
      FROM solicitudes_reserva sr
      LEFT JOIN cabanas c ON sr.id_cabana = c.id_cabana
      ORDER BY sr.fecha_solicitud DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    throw error;
  }
}

// Obtener solicitud por ID
async function obtenerSolicitudPorId(id) {
  try {
    const query = `
      SELECT 
        sr.id_solicitud,
        sr.nombre,
        sr.gmail,
        sr.telefono,
        sr.id_cabana,
        c.nombre_cabana,
        sr.fecha_inicio,
        sr.fecha_fin,
        sr.estado,
        sr.fecha_solicitud,
        sr.observaciones,
        sr.precio_estimado
      FROM solicitudes_reserva sr
      LEFT JOIN cabanas c ON sr.id_cabana = c.id_cabana
      WHERE sr.id_solicitud = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error al obtener solicitud por ID:', error);
    throw error;
  }
}

// Crear nueva solicitud
async function crearSolicitud(datos) {
  try {
    const { nombre, gmail, telefono, id_cabana, fecha_inicio, fecha_fin, precio_estimado } = datos;
    
    const query = `
      INSERT INTO solicitudes_reserva 
      (nombre, gmail, telefono, id_cabana, fecha_inicio, fecha_fin, precio_estimado)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_solicitud
    `;
    
    const result = await pool.query(query, [
      nombre, gmail, telefono, id_cabana, fecha_inicio, fecha_fin, precio_estimado
    ]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error al crear solicitud:', error);
    throw error;
  }
}

// Actualizar estado de solicitud
async function actualizarEstadoSolicitud(id, estado, observaciones = null) {
  try {
    const query = `
      UPDATE solicitudes_reserva 
      SET estado = $1, observaciones = $2
      WHERE id_solicitud = $3
      RETURNING id_solicitud
    `;
    
    const result = await pool.query(query, [estado, observaciones, id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error al actualizar estado de solicitud:', error);
    throw error;
  }
}

// Eliminar solicitud
async function eliminarSolicitud(id) {
  try {
    const query = `
      DELETE FROM solicitudes_reserva 
      WHERE id_solicitud = $1
      RETURNING id_solicitud
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error al eliminar solicitud:', error);
    throw error;
  }
}

// Obtener estadísticas de solicitudes
async function obtenerEstadisticasSolicitudes() {
  try {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN estado = 'Pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estado = 'Aprobada' THEN 1 END) as aprobadas,
        COUNT(CASE WHEN estado = 'Rechazada' THEN 1 END) as rechazadas
      FROM solicitudes_reserva
    `;
    
    const result = await pool.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error;
  }
} 

// Exportaciones
export {
  obtenerSolicitudes,
  obtenerSolicitudPorId,
  crearSolicitud,
  actualizarEstadoSolicitud,
  eliminarSolicitud,
  obtenerEstadisticasSolicitudes
}; 