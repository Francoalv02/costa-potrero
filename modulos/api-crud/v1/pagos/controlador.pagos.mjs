import * as modelo from './modelo.pagos.mjs';
import PDFDocument from 'pdfkit';

// Obtener estados de pago
async function obtenerEstadosPago(req, res) {
  try {
    const estados = await modelo.obtenerEstadosPago();
    res.json(estados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener estados de pago' });
  }
}

// Crear nuevo pago
async function crearPago(req, res) {
  try {
    const { id_reserva, id_estado_pago, metodo_pago, observacion } = req.body;
    if (!id_reserva || !id_estado_pago) {
      return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
    }

    const resultado = await modelo.crearPago({
      id_reserva,
      id_estado_pago: parseInt(id_estado_pago),
      metodo_pago,
      observacion
    });

    res.status(201).json({ mensaje: `Pago registrado (ID ${resultado.rows[0].id_pago})` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear el pago' });
  }
}

// Obtener lista de pagos
async function obtenerPagos(req, res) {
  try {
    const pagos = await modelo.obtenerPagos();
    res.json(pagos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener pagos' });
  }
}

// Obtener un pago por ID
async function obtenerPago(req, res) {
  try {
    const { id } = req.params;
    const resultado = await modelo.obtenerPagoPorId(id);

    if (resultado.rows.length > 0) {
      res.json(resultado.rows[0]);
    } else {
      res.status(404).json({ mensaje: 'Pago no encontrado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
}

// Actualizar pago
async function actualizarPago(req, res) {
  try {
    const { id } = req.params;
    const { estado_pago, metodo_pago, observacion } = req.body;
    
    if (!estado_pago) {
      return res.status(400).json({ mensaje: 'El estado de pago es requerido' });
    }

    const resultado = await modelo.actualizarPago(id, {
      id_estado_pago: parseInt(estado_pago),
      metodo_pago,
      observacion
    });

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Pago no encontrado' });
    }

    res.json({ mensaje: 'Pago actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar pago:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el pago' });
  }
}

// Eliminar pago
async function eliminarPago(req, res) {
  try {
    const { id } = req.params;
    await modelo.eliminarPago(id);
    res.json({ mensaje: 'Pago eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar el pago' });
  }
}

// Generar reporte de pagos
async function generarReportePagos(req, res) {
  try {
    const { estado } = req.body;
    
    // Obtener todos los pagos
    const pagos = await modelo.obtenerPagos();
    
    // Filtrar por estado si se especifica
    let pagosFiltrados = pagos;
    if (estado) {
      pagosFiltrados = pagos.filter(p => 
        p.nombre_estado_pago.toLowerCase() === estado.toLowerCase()
      );
    }

    if (pagosFiltrados.length === 0) {
      return res.status(404).json({ mensaje: 'No hay pagos para mostrar en el reporte' });
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
    
    res.setHeader('Content-Disposition', `attachment; filename="reporte_pagos_${fechaFormateada}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    // Título del reporte
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Reporte de Pagos - Costa Potrero', { align: 'center' });
    
    doc.moveDown(0.5);
    
    // Información del reporte
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#7f8c8d')
       .text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
    
    doc.text(`Hora: ${new Date().toLocaleTimeString('es-ES')}`, { align: 'center' });
    
    if (estado) {
      doc.text(`Filtro aplicado: ${estado}`, { align: 'center' });
    }
    
    doc.moveDown(1);

    // Estadísticas del reporte
    const totalPagos = pagosFiltrados.length;
    const montoTotal = pagosFiltrados.reduce((sum, p) => sum + parseFloat(p.monto), 0);
    const pagosPendientes = pagosFiltrados.filter(p => p.nombre_estado_pago.toLowerCase().includes('pendiente')).length;
    const pagosCompletados = pagosFiltrados.filter(p => p.nombre_estado_pago.toLowerCase().includes('completado')).length;

    // Crear tabla de estadísticas
    const statsY = doc.y;
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Resumen del Reporte:', 30, statsY);
    
    doc.moveDown(0.5);
    
    const statsData = [
      ['Total de Pagos:', totalPagos.toString()],
      ['Monto Total:', `$${montoTotal.toFixed(2)}`],
      ['Pagos Pendientes:', pagosPendientes.toString()],
      ['Pagos Completados:', pagosCompletados.toString()]
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

    // Crear tabla de pagos
    const tableY = doc.y;
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Detalle de Pagos:', 30, tableY);
    
    doc.moveDown(0.5);

    // Definir columnas de la tabla
    const columns = [
      { header: 'ID', key: 'id_pago', width: 30 },
      { header: 'Reserva', key: 'id_reserva', width: 40 },
      { header: 'Huésped', key: 'huesped', width: 80 },
      { header: 'Fecha', key: 'fecha_pago', width: 60 },
      { header: 'Monto', key: 'monto', width: 50 },
      { header: 'Estado', key: 'nombre_estado_pago', width: 60 },
      { header: 'Método', key: 'metodo_pago', width: 50 },
      { header: 'Observación', key: 'observacion', width: 80 }
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
    pagosFiltrados.forEach((pago, index) => {
      // Alternar colores de filas
      const rowColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
      
      columnPositions.forEach(col => {
        doc.rect(col.x, dataY, col.width, 20)
           .fill(rowColor)
           .stroke('#dee2e6');
        
        let value = pago[col.key] || '-';
        
        // Formatear valores específicos
        if (col.key === 'id_reserva') {
          value = `#${value}`;
        } else if (col.key === 'monto') {
          value = `$${parseFloat(value).toFixed(2)}`;
        } else if (col.key === 'fecha_pago') {
          value = new Date(value).toLocaleDateString('es-ES');
        }
        
        // Truncar texto largo
        if (value.length > 15 && col.key !== 'observacion') {
          value = value.substring(0, 12) + '...';
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
    res.status(500).json({ mensaje: 'Error al generar el reporte de pagos' });
  }
}

export {
  obtenerEstadosPago,
  crearPago,
  obtenerPagos,
  obtenerPago,
  actualizarPago,
  eliminarPago,
  generarReportePagos
};
