import * as modelo from './modelo.solicitudes.mjs';

// Crear tabla de solicitudes
async function crearTablaSolicitudes(req, res) {
    try {
        const pool = await import('../../../../conexion/conexion.db.mjs');
        
        // Crear la tabla
        await pool.default.query(`
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
        
        // Insertar datos de prueba
        await pool.default.query(`
            INSERT INTO solicitudes_reserva (nombre, gmail, telefono, id_cabana, fecha_inicio, fecha_fin, precio_estimado) VALUES
            ('Juan Pérez', 'juan.perez@gmail.com', '+54 351 123 4567', 1, '2025-08-15', '2025-08-20', 80000.00),
            ('María González', 'maria.gonzalez@hotmail.com', '+54 351 987 6543', 2, '2025-08-25', '2025-08-30', 75000.00),
            ('Carlos López', 'carlos.lopez@yahoo.com', '+54 351 555 1234', 3, '2025-09-01', '2025-09-05', 65000.00)
            ON CONFLICT DO NOTHING;
        `);
        
        res.json({
            success: true,
            mensaje: 'Tabla de solicitudes creada exitosamente'
        });
    } catch (error) {
        console.error('Error al crear tabla:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al crear tabla: ' + error.message
        });
    }
}

// Obtener todas las solicitudes
async function obtenerSolicitudes(req, res) {
    try {
        const solicitudes = await modelo.obtenerSolicitudes();
        res.json({
            success: true,
            data: solicitudes,
            mensaje: `Se encontraron ${solicitudes.length} solicitudes`
        });
    } catch (error) {
        console.error('Error al obtener solicitudes:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener solicitudes'
        });
    }
}

// Obtener una solicitud por ID
async function obtenerSolicitud(req, res) {
    try {
        const { id } = req.params;
        const solicitud = await modelo.obtenerSolicitudPorId(id);
        
        if (solicitud) {
            res.json({
                success: true,
                data: solicitud
            });
        } else {
            res.status(404).json({
                success: false,
                mensaje: 'Solicitud no encontrada'
            });
        }
    } catch (error) {
        console.error('Error al obtener solicitud:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener solicitud'
        });
    }
}

// Crear nueva solicitud
async function crearSolicitud(req, res) {
    try {
        const { nombre, gmail, telefono, id_cabana, fecha_inicio, fecha_fin, precio_estimado } = req.body;
        
        // Validar datos requeridos
        if (!nombre || !gmail || !telefono || !id_cabana || !fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                mensaje: 'Todos los campos son requeridos'
            });
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(gmail)) {
            return res.status(400).json({
                success: false,
                mensaje: 'Formato de email inválido'
            });
        }
        
        const datos = {
            nombre,
            gmail,
            telefono,
            id_cabana: parseInt(id_cabana),
            fecha_inicio,
            fecha_fin,
            precio_estimado: precio_estimado ? parseFloat(precio_estimado) : null
        };
        
        const resultado = await modelo.crearSolicitud(datos);
        
        res.status(201).json({
            success: true,
            data: resultado,
            mensaje: 'Solicitud creada exitosamente'
        });
    } catch (error) {
        console.error('Error al crear solicitud:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al crear solicitud'
        });
    }
}

// Actualizar estado de solicitud
async function actualizarEstadoSolicitud(req, res) {
    try {
        const { id } = req.params;
        const { estado, observaciones } = req.body;
        
        if (!estado) {
            return res.status(400).json({
                success: false,
                mensaje: 'Estado es requerido'
            });
        }
        
        const estadosValidos = ['Pendiente', 'Aprobada', 'Rechazada'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                mensaje: 'Estado inválido'
            });
        }
        
        const resultado = await modelo.actualizarEstadoSolicitud(id, estado, observaciones);
        
        if (resultado) {
            res.json({
                success: true,
                data: resultado,
                mensaje: `Estado actualizado a: ${estado}`
            });
        } else {
            res.status(404).json({
                success: false,
                mensaje: 'Solicitud no encontrada'
            });
        }
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar estado'
        });
    }
}

// Eliminar solicitud
async function eliminarSolicitud(req, res) {
    try {
        const { id } = req.params;
        const resultado = await modelo.eliminarSolicitud(id);
        
        if (resultado) {
            res.json({
                success: true,
                mensaje: 'Solicitud eliminada exitosamente'
            });
        } else {
            res.status(404).json({
                success: false,
                mensaje: 'Solicitud no encontrada'
            });
        }
    } catch (error) {
        console.error('Error al eliminar solicitud:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al eliminar solicitud'
        });
    }
}

// Obtener estadísticas
async function obtenerEstadisticas(req, res) {
    try {
        const estadisticas = await modelo.obtenerEstadisticasSolicitudes();
        res.json({
            success: true,
            data: estadisticas
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener estadísticas'
        });
    }
} 

// Exportaciones
export {
  crearTablaSolicitudes,
  obtenerSolicitudes,
  obtenerSolicitud,
  crearSolicitud,
  actualizarEstadoSolicitud,
  eliminarSolicitud,
  obtenerEstadisticas
}; 