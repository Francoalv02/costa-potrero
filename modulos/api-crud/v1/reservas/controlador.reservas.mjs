import * as modelo from './modelo.reservas.mjs';

import PDFDocument from 'pdfkit';
import pool from '../../../../conexion/conexion.db.mjs';

//generar reportes 
async function generarReporteReservas(req, res) {
  try {
    const { fechaInicio, fechaFin, estado } = req.query;

    const resultado = await modelo.obtenerReservasConFiltros({ fechaInicio, fechaFin, estado });

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'No hay reservas con esos filtros' });
    }

    const doc = new PDFDocument({
      size: 'A4',
      margin: 30
    });

    // Generar fecha actual en formato DD-MM-YYYY
    const fechaActual = new Date();
    const dia = fechaActual.getDate().toString().padStart(2, '0');
    const mes = (fechaActual.getMonth() + 1).toString().padStart(2, '0');
    const año = fechaActual.getFullYear();
    const fechaFormateada = `${dia}-${mes}-${año}`;
    
    res.setHeader('Content-Disposition', `attachment; filename="reporte_reservas_${fechaFormateada}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    // Título del reporte
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Reporte de Reservas - Costa Potrero', { align: 'center' });
    
    doc.moveDown(0.5);
    
    // Información del reporte
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#7f8c8d')
       .text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
    
    doc.text(`Hora: ${new Date().toLocaleTimeString('es-ES')}`, { align: 'center' });
    
    if (fechaInicio && fechaFin) {
      doc.text(`Período: ${fechaInicio} al ${fechaFin}`, { align: 'center' });
    }
    
    if (estado) {
      doc.text(`Filtro aplicado: ${estado}`, { align: 'center' });
    }
    
    doc.moveDown(1);

    // Estadísticas del reporte
    const totalReservas = resultado.rows.length;
    const precioTotal = resultado.rows.reduce((sum, r) => sum + parseFloat(r.preciototal || 0), 0);
    const reservasConfirmadas = resultado.rows.filter(r => r.nombreestado?.toLowerCase().includes('confirmada')).length;
    const reservasPendientes = resultado.rows.filter(r => r.nombreestado?.toLowerCase().includes('pendiente')).length;

    // Crear tabla de estadísticas
    const statsY = doc.y;
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Resumen del Reporte:', 30, statsY);
    
    doc.moveDown(0.5);
    
    const statsData = [
      ['Total de Reservas:', totalReservas.toString()],
      ['Precio Total:', `$${precioTotal.toFixed(2)}`],
      ['Reservas Confirmadas:', reservasConfirmadas.toString()],
      ['Reservas Pendientes:', reservasPendientes.toString()]
    ];

    let currentY = doc.y;
    statsData.forEach(([label, value]) => {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#34495e')
         .text(label, 30, currentY);
      
      doc.font('Helvetica')
         .fillColor('#2c3e50')
         .text(value, 150, currentY);
      
      currentY += 15;
    });

    doc.moveDown(1);

    // Crear tabla de reservas
    const tableY = doc.y;
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Detalle de Reservas:', 30, tableY);
    
    doc.moveDown(0.5);

    // Definir columnas de la tabla
    const columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'DNI', key: 'id_dni', width: 50 },
      { header: 'Huésped', key: 'nombre', width: 70 },
      { header: 'Email', key: 'email', width: 80 },
      { header: 'Cabaña', key: 'nombre_cabana', width: 50 },
      { header: 'Desde', key: 'fechainicio', width: 50 },
      { header: 'Hasta', key: 'fechafin', width: 50 },
      { header: 'Precio', key: 'preciototal', width: 40 },
      { header: 'Estado', key: 'nombreestado', width: 50 }
    ];

    // Calcular posiciones de columnas
    let xPos = 30;
    const columnPositions = columns.map(col => {
      const pos = xPos;
      xPos += col.width;
      return { ...col, x: pos };
    });

    // Encabezado de la tabla
    const headerY = doc.y;
    doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor('#ffffff');
    
    columnPositions.forEach(col => {
      doc.rect(col.x, headerY, col.width, 15)
         .fill('#34495e');
      
      doc.fillColor('#ffffff')
         .text(col.header, col.x + 2, headerY + 4);
    });

    // Datos de la tabla
    let dataY = headerY + 15;
    resultado.rows.forEach((reserva, index) => {
      // Alternar colores de filas
      const rowColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
      
      columnPositions.forEach(col => {
        doc.rect(col.x, dataY, col.width, 20)
           .fill(rowColor)
           .stroke('#dee2e6');
        
        let value = reserva[col.key] || '-';
        
        // Formatear valores específicos
        if (col.key === 'id') {
          value = `#${value}`;
        } else if (col.key === 'preciototal') {
          value = `$${parseFloat(value || 0).toFixed(2)}`;
        } else if (col.key === 'fechainicio' || col.key === 'fechafin') {
          value = new Date(value).toLocaleDateString('es-ES');
        }
        
        // Truncar texto largo
        if (value.length > 12 && col.key !== 'email') {
          value = value.substring(0, 10) + '...';
        }
        
        doc.fontSize(7)
           .font('Helvetica')
           .fillColor('#2c3e50')
           .text(value, col.x + 2, dataY + 6);
      });
      
      dataY += 20;
      
      // Nueva página si es necesario
      if (dataY > 700) {
        doc.addPage();
        dataY = 30;
      }
    });

    // Pie de página
    doc.moveDown(1);
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#7f8c8d')
       .text(`Reporte generado automáticamente por el sistema de Costa Potrero`, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al generar el reporte de reservas' });
  }
}

// --- OBTENER ÚLTIMA RESERVA ---
async function obtenerUltimaReserva(req, res) {
  try {
    const r = await pool.query(`
      SELECT r.id_reserva,
             h.nombre AS huesped,
             h.id_dni,
             c.nombre_cabana,
             r.precioTotal AS preciototal
      FROM reservas r
      JOIN huespedes h ON r.id_dni = h.id_dni
      JOIN cabanas c ON r.id_cabana = c.id_cabana
      ORDER BY r.id_reserva DESC
      LIMIT 1
    `);
    if (r.rows.length === 0) return res.status(404).json({ mensaje: 'Sin reservas' });
    res.json(r.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener última reserva' });
  }
}

// --- CONSULTAR DISPONIBILIDAD ---
async function consultarDisponibilidad(req, res) {
  const { fecha_inicio, fecha_fin } = req.body;
  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({ 
      success: false,
      mensaje: 'Fechas requeridas' 
    });
  }
  
  try {
    console.log('Consultando disponibilidad para:', { fecha_inicio, fecha_fin });
    
    const disponibles = await modelo.obtenerCabanasDisponibles(fecha_inicio, fecha_fin);
    console.log('Cabañas disponibles encontradas:', disponibles.length);
    
    if (disponibles.length > 0) {
      res.json({ 
        success: true,
        data: disponibles,
        mensaje: `Se encontraron ${disponibles.length} cabañas disponibles`
      });
    } else {
      const sugerencia = await modelo.buscarProximaDisponibilidad(fecha_inicio);
      res.json({ 
        success: false,
        mensaje: 'Sin disponibilidad', 
        sugerencia,
        data: []
      });
    }
  } catch (error) {
    console.error('Error al consultar disponibilidad:', error);
    res.status(500).json({ 
      success: false,
      mensaje: 'Error al consultar disponibilidad',
      data: []
    });
  }
}

// --- OBTENER TODAS LAS RESERVAS ---
async function obtenerReservas(req, res) {
  try {
    const resultado = await modelo.obtenerReservasConEstado();
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
}

// --- OBTENER RESERVAS ACTIVAS (excluyendo Check Out) ---
async function obtenerReservasActivas(req, res) {
  try {
    const resultado = await modelo.obtenerReservasActivas();
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
}

// --- OBTENER UNA RESERVA POR ID ---
async function obtenerReserva(req, res) {
  try {
    const { id } = req.params;
    console.log('ID recibido en obtenerReserva:', id, 'Tipo:', typeof id);
    
    // Validar que el ID sea un número
    if (!id || isNaN(parseInt(id))) {
      console.error('ID inválido recibido:', id);
      return res.status(400).json({ mensaje: 'ID de reserva inválido' });
    }
    
    const resultado = await modelo.obtenerReservaConEstadoPorId(id);

    if (resultado.rows.length > 0) {
      const reserva = resultado.rows[0];
      console.log('Datos de la reserva desde el controlador:', reserva);
      console.log('Campos disponibles:', Object.keys(reserva));
      res.json(reserva);
    } else {
      res.status(404).json({ mensaje: 'Reserva no encontrada' });
    }
  } catch (error) {
    console.error('Error en obtenerReserva:', error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
}

// --- CREAR NUEVA RESERVA (verifica huésped también) ---
async function crearReservaHandler(req, res) {
  try {
    const { id_dni, nombre, gmail, id_cabana, fecha_inicio, fecha_fin, id_estado } = req.body;

    if (!id_dni || !nombre || !gmail || !id_cabana || !fecha_inicio || !fecha_fin || !id_estado) {
      return res.status(400).json({ mensaje: 'Datos incompletos' });
    }

    await modelo.verificarOCrearHuesped({ id_dni, nombre, gmail });

    // calcula automáticamente el precio
    const resultado = await modelo.crearReserva({ id_dni, id_cabana, fecha_inicio, fecha_fin, id_estado });

    res.status(201).json({ mensaje: `Reserva creada correctamente`, id_reserva: resultado.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear la reserva' });
  }
}

// --- MODIFICAR RESERVA ---
async function modificarReserva(req, res) {
  try {
    const { id } = req.params;
    const { id_dni, id_cabana, fecha_inicio, fecha_fin, nombre, gmail, telefono, id_estado } = req.body;

    if (!id || !id_dni || !id_cabana || !fecha_inicio || !fecha_fin || !id_estado) {
      return res.status(400).json({ mensaje: 'Datos incompletos' });
    }

    await modelo.actualizarHuesped({ id_dni, nombre, gmail, telefono });

    // recalcula el precio
    const resultado = await modelo.modificarReserva({
      id,
      id_dni,
      id_cabana,
      fecha_inicio,
      fecha_fin,
      id_estado
    });

    const { id: idReservaModificada } = resultado.rows[0];
    res.json({ mensaje: `Reserva ${idReservaModificada} modificada correctamente` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
}

// --- ELIMINAR RESERVA ---
async function eliminarReserva(req, res) {
  try {
    const { id } = req.params;
    const resultado = await modelo.eliminarReserva(id);

    if (resultado.rows.length > 0) {
      const { id: idReservaEliminada } = resultado.rows[0];
      res.status(200).json({ mensaje: `Reserva ${idReservaEliminada} eliminada correctamente` });
    } else {
      res.status(404).json({ mensaje: 'Reserva no encontrada' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
}

// --- OBTENER RESERVAS CON FILTROS ---
async function obtenerReservasConFiltros(req, res) {
  try {
    const { fechaInicio, fechaFin, estado, cabana } = req.query;
    console.log('Parámetros recibidos en controlador:', req.query);
    console.log('Parámetros extraídos:', { fechaInicio, fechaFin, estado, cabana });
    
    const resultado = await modelo.obtenerReservasConFiltros({
      fechaInicio,
      fechaFin,
      estado,
      cabana
    });

    if (resultado.rows.length > 0) {
      res.json(resultado.rows);
    } else {
      res.status(404).json({ mensaje: 'No se encontraron reservas con los filtros aplicados' });
    }
  } catch (error) {
    console.error('Error en controlador obtenerReservasConFiltros:', error);
    res.status(500).json({ mensaje: 'Error al filtrar reservas' });
  }
}

async function obtenerEstados(req, res) {
  try {
    const estados = await modelo.obtenerEstados();
    res.json(estados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener estados' });
  }
}

// --- ACTUALIZAR ESTADO DE CICLO DE VIDA ---
async function actualizarEstadoCiclo(req, res) {
  try {
    const { id } = req.params;
    const { nuevoEstado } = req.body;

    if (!nuevoEstado) {
      return res.status(400).json({ mensaje: 'Nuevo estado requerido' });
    }

    // Validar que el estado sea válido
    const estadosValidos = ['Reservada', 'Check In', 'Limpieza', 'Check Out'];
    if (!estadosValidos.includes(nuevoEstado)) {
      return res.status(400).json({ mensaje: 'Estado no válido' });
    }

    const resultado = await modelo.actualizarEstadoReserva(id, nuevoEstado);
    
    if (resultado.rows.length > 0) {
      res.json({ 
        mensaje: `Estado de reserva ${id} actualizado a "${nuevoEstado}"`,
        nuevoEstado: nuevoEstado
      });
    } else {
      res.status(404).json({ mensaje: 'Reserva no encontrada' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
}

// --- EXPORTACIONES ---
export {
  obtenerReservas,
  obtenerReservasActivas,
  obtenerReserva,
  crearReservaHandler,
  modificarReserva,
  eliminarReserva,
  obtenerReservasConFiltros,
  generarReporteReservas,
  obtenerEstados,
  actualizarEstadoCiclo,
  obtenerUltimaReserva,
  consultarDisponibilidad
};
