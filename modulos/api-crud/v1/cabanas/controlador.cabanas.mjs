/*
Conecta capa de datos a respuesta clientes (reservas de cabañas)
*/
import * as modelo from './modelo.cabanas.mjs';

import PDFDocument from 'pdfkit';


async function generarReporteCabanas(req, res) {
  try {
    const resultado = await modelo.obtenerCabanas();

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'No hay cabañas para reportar' });
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
    
    res.setHeader('Content-Disposition', `attachment; filename="reporte_cabanas_${fechaFormateada}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    // Título del reporte
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Reporte de Cabañas - Costa Potrero', { align: 'center' });
    
    doc.moveDown(0.5);
    
    // Información del reporte
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#7f8c8d')
       .text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
    
    doc.text(`Hora: ${new Date().toLocaleTimeString('es-ES')}`, { align: 'center' });
    
    doc.moveDown(1);

    // Estadísticas del reporte
    const totalCabanas = resultado.rows.length;
    const precioPromedio = resultado.rows.reduce((sum, c) => sum + parseFloat(c.precio || 0), 0) / totalCabanas;
    const capacidadTotal = resultado.rows.reduce((sum, c) => sum + parseInt(c.capacidad_personas || 0), 0);

    // Crear tabla de estadísticas
    const statsY = doc.y;
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Resumen del Reporte:', 30, statsY);
    
    doc.moveDown(0.5);
    
    const statsData = [
      ['Total de Cabañas:', totalCabanas.toString()],
      ['Precio Promedio:', `$${precioPromedio.toFixed(2)}`],
      ['Capacidad Total:', `${capacidadTotal} personas`]
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

    // Crear tabla de cabañas
    const tableY = doc.y;
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Detalle de Cabañas:', 30, tableY);
    
    doc.moveDown(0.5);

    // Definir columnas de la tabla
    const columns = [
      { header: 'ID', key: 'id_cabana', width: 25 },
      { header: 'Nombre', key: 'nombre_cabana', width: 80 },
      { header: 'Descripción', key: 'descripcion', width: 120 },
      { header: 'Capacidad', key: 'capacidad_personas', width: 50 },
      { header: 'Precio', key: 'precio', width: 50 }
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
    resultado.rows.forEach((cabana, index) => {
      // Alternar colores de filas
      const rowColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
      
      columnPositions.forEach(col => {
        doc.rect(col.x, dataY, col.width, 20)
           .fill(rowColor)
           .stroke('#dee2e6');
        
        let value = cabana[col.key] || '-';
        
        // Formatear valores específicos
        if (col.key === 'id_cabana') {
          value = `#${value}`;
        } else if (col.key === 'precio') {
          value = `$${parseFloat(value || 0).toFixed(2)}`;
        } else if (col.key === 'capacidad_personas') {
          value = `${value} pers.`;
        }
        
        // Truncar texto largo
        if (value.length > 15 && col.key === 'descripcion') {
          value = value.substring(0, 13) + '...';
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
    res.status(500).json({ mensaje: 'Error al generar el reporte de cabañas' });
  }
}


async function obtenerCabanas(req, res) {
    try {
        const resultado = await modelo.obtenerCabanas();
        if (resultado.rows.length > 0) {
            // Transformar los datos al formato que espera el frontend
            const cabanas = resultado.rows.map(cabana => ({
                id: cabana.id_cabana,
                nombre: cabana.nombre_cabana,
                descripcion: cabana.descripcion,
                capacidad: cabana.capacidad_personas,
                precio: cabana.precio
            }));
            
            res.json({
                success: true,
                data: cabanas,
                mensaje: `Se encontraron ${cabanas.length} cabañas`
            });
        } else {
            res.status(404).json({ 
                success: false,
                mensaje: 'No se encontraron cabañas',
                data: []
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false,
            mensaje: 'Error en el servidor al obtener cabañas',
            data: []
        });
    }
}

async function obtenerCabana(req, res) {
    try {
        const { id } = req.params;
        const resultado = await modelo.obtenerCabana(id);
        if (resultado.rows.length > 0) {
            res.json(resultado.rows[0]);
        } else {
            res.status(404).json({ mensaje: 'Cabaña no encontrada' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor al obtener la cabaña' });
    }
}

async function crearCabana(req, res) {
    try {
                const {
        nombre_cabana,
        descripcion,
        capacidad_personas,
        precio 
        } = req.body;

            if (!nombre_cabana || !descripcion || !capacidad_personas || !precio) {
            return res.status(400).json({ mensaje: 'Datos incompletos para crear la cabaña' });
            }

            const resultado = await modelo.crearCabana({
            nombre_cabana,
            descripcion,
            capacidad_personas,
            precio 
            });


        const { id: idCabanaCreada } = resultado.rows[0];
        res.json({ mensaje: `La Cabaña fue creada correctamente` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor al crear la cabaña' });
    }
}

async function modificarCabana(req, res) {
    try {
        const { id: id_cabana } = req.params;

                const {
        nombre_cabana,
        descripcion,
        capacidad_personas,
        precio 
        } = req.body;

        if (!id_cabana || !nombre_cabana || !descripcion || !capacidad_personas || !precio) {
        return res.status(400).json({ mensaje: 'Datos incompletos para modificar la cabaña' });
        }

        const resultado = await modelo.modificarCabana({
        id_cabana,
        nombre_cabana,
        descripcion,
        capacidad_personas,
        precio 
        });


        const { id: idCabanaModificada } = resultado.rows[0];
        res.json({ mensaje: `La Cabaña fue modificada correctamente` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor al modificar la cabaña' });
    }
}

async function eliminarCabana(req, res) {
    try {
        const { id } = req.params;
        const resultado = await modelo.eliminarCabana(id);

        res.status(200).json({ 
            mensaje: `La Cabaña fue eliminada correctamente`,
            id_eliminado: resultado.rows[0].id_cabana
        });
    } catch (error) {
        console.error('Error al eliminar cabaña:', error);
        
        if (error.code === 'RESERVAS_ASOCIADAS') {
            res.status(400).json({ 
                mensaje: error.message,
                detalle: error.detail,
                tipo: 'RESERVAS_ASOCIADAS'
            });
        } else if (error.code === 'NO_ENCONTRADA') {
            res.status(404).json({ 
                mensaje: error.message,
                tipo: 'NO_ENCONTRADA'
            });
        } else {
            res.status(500).json({ 
                mensaje: 'Error en el servidor al eliminar la cabaña',
                tipo: 'ERROR_SERVIDOR'
            });
        }
    }
}

export {
    generarReporteCabanas,
    obtenerCabanas,
    obtenerCabana,
    crearCabana,
    modificarCabana,
    eliminarCabana,
};
