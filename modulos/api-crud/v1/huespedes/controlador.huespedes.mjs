import * as modelo from './modelo.huespedes.mjs';
import PDFDocument from 'pdfkit';

// --- OBTENER TODOS LOS HUÉSPEDES ---
async function obtenerHuespedes(req, res) {
  try {
    const resultado = await modelo.obtenerTodos();
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener huéspedes' });
  }
}

// --- OBTENER UN HUÉSPED ---
async function obtenerUno(req, res) {
  try {
    const resultado = await modelo.obtenerPorDNI(req.params.id_dni);
    if (resultado.rows.length === 0) return res.status(404).json({ mensaje: 'No encontrado' });
    res.json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error' });
  }
}

// --- CREAR O ACTUALIZAR HUÉSPED ---
async function crearOActualizar(req, res) {
  try {
    const { id_dni, nombre, telefono, gmail } = req.body;
    if (!id_dni || !nombre || !gmail) return res.status(400).json({ mensaje: 'Datos incompletos' });

    await modelo.insertarOActualizar({ id_dni, nombre, telefono, gmail });
    res.status(200).json({ mensaje: 'Huésped guardado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al guardar huésped' });
  }
}

// --- ACTUALIZAR HUÉSPED ---
async function actualizar(req, res) {
  try {
    const { id_dni, nombre, telefono, gmail } = req.body;
    const dniOriginal = req.params.id_dni;
    
    console.log('Actualizando huésped:', { dniOriginal, id_dni, nombre, telefono, gmail });
    
    if (!id_dni || !nombre || !gmail) {
      return res.status(400).json({ mensaje: 'Datos incompletos' });
    }

    const resultado = await modelo.actualizar(dniOriginal, { nombre, gmail, telefono });
    
    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Huésped no encontrado' });
    }

    res.status(200).json({ mensaje: 'Huésped actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar huésped:', err);
    res.status(500).json({ mensaje: 'Error al actualizar huésped' });
  }
}

// --- ELIMINAR HUÉSPED ---
async function eliminar(req, res) {
  try {
    const resultado = await modelo.eliminar(req.params.id_dni);
    if (resultado.rowCount === 0)
      return res.status(404).json({ mensaje: 'Huésped no encontrado' });

    res.status(200).json({ mensaje: 'Huésped eliminado correctamente' });
  } catch (err) {
    console.error(err);
    if (err.code === 'RESERVAS_ASOCIADAS') {
      res.status(400).json({ mensaje: err.message });
    } else {
      res.status(500).json({ mensaje: 'Error al eliminar huésped' });
    }
  }
}

// --- GENERAR REPORTE DE HUÉSPEDES ---
async function generarReporteHuespedes(req, res) {
  try {
    const resultado = await modelo.obtenerTodos();
    const huespedes = resultado.rows;

    if (huespedes.length === 0) {
      return res.status(404).json({ mensaje: 'No hay huéspedes registrados' });
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
    
    res.setHeader('Content-Disposition', `attachment; filename="reporte_huespedes_${fechaFormateada}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    // Título del reporte
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Reporte de Huéspedes - Costa Potrero', { align: 'center' });
    
    doc.moveDown(0.5);
    
    // Información del reporte
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#7f8c8d')
       .text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
    
    doc.text(`Hora: ${new Date().toLocaleTimeString('es-ES')}`, { align: 'center' });
    
    doc.moveDown(1);

    // Estadísticas del reporte
    const totalHuespedes = huespedes.length;
    const conTelefono = huespedes.filter(h => h.telefono && h.telefono.trim() !== '').length;
    const sinTelefono = totalHuespedes - conTelefono;
    const conEmail = huespedes.filter(h => h.gmail && h.gmail.trim() !== '').length;
    const sinEmail = totalHuespedes - conEmail;

    // Crear tabla de estadísticas
    const statsY = doc.y;
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Resumen del Reporte:', 30, statsY);
    
    doc.moveDown(0.5);
    
    const statsData = [
      ['Total de Huéspedes:', totalHuespedes.toString()],
      ['Con Teléfono:', conTelefono.toString()],
      ['Sin Teléfono:', sinTelefono.toString()],
      ['Con Email:', conEmail.toString()],
      ['Sin Email:', sinEmail.toString()]
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

    // Crear tabla de huéspedes
    const tableY = doc.y;
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Detalle de Huéspedes:', 30, tableY);
    
    doc.moveDown(0.5);

    // Definir columnas de la tabla
    const columns = [
      { header: 'DNI', key: 'id_dni', width: 60 },
      { header: 'Nombre', key: 'nombre', width: 100 },
      { header: 'Teléfono', key: 'telefono', width: 80 },
      { header: 'Email', key: 'gmail', width: 120 }
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
    huespedes.forEach((huesped, index) => {
      // Alternar colores de filas
      const rowColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
      
      columnPositions.forEach(col => {
        doc.rect(col.x, dataY, col.width, 20)
           .fill(rowColor)
           .stroke('#dee2e6');
        
        let value = huesped[col.key] || '-';
        
        // Formatear valores específicos
        if (col.key === 'telefono' && (!value || value === '-')) {
          value = 'No registrado';
        }
        
        // Truncar texto largo
        if (value.length > 15 && col.key === 'nombre') {
          value = value.substring(0, 13) + '...';
        } else if (value.length > 20 && col.key === 'gmail') {
          value = value.substring(0, 18) + '...';
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
  } catch (err) {
    console.error('Error al generar reporte de huéspedes:', err);
    res.status(500).json({ mensaje: 'Error al generar reporte' });
  }
}

// --- EXPORTACIONES ---
export {
  obtenerHuespedes,
  obtenerUno,
  crearOActualizar,
  actualizar,
  eliminar,
  generarReporteHuespedes
};
