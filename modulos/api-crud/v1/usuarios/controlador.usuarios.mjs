import * as modelo from './modelo.usuarios.mjs';
import PDFDocument from 'pdfkit';

// Obtener todos los usuarios
async function obtenerUsuarios(req, res) {
  try {
    const resultado = await modelo.obtenerUsuarios();
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error en obtenerUsuarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
}

// Obtener usuario por ID
async function obtenerUsuarioPorId(req, res) {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ mensaje: 'ID de usuario inválido' });
    }
    
    const resultado = await modelo.obtenerUsuarioPorId(id);
    
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Error en obtenerUsuario:', error);
    res.status(500).json({ mensaje: 'Error al obtener usuario' });
  }
}

// Crear nuevo usuario
async function crearUsuario(req, res) {
  try {
    const { usuario, clave, rol } = req.body;
    
    // Validaciones básicas
    if (!usuario || !clave || !rol) {
      return res.status(400).json({ 
        mensaje: 'Datos incompletos. Usuario, clave y rol son obligatorios.' 
      });
    }
    
    if (clave.length < 3) {
      return res.status(400).json({ 
        mensaje: 'La clave debe tener al menos 3 caracteres' 
      });
    }
    
    if (!['admin', 'cliente'].includes(rol)) {
      return res.status(400).json({ 
        mensaje: 'Rol inválido. Debe ser "admin" o "cliente"' 
      });
    }
    
    const datosUsuario = {
      usuario: usuario.trim(),
      clave: clave.trim(),
      rol
    };
    
    const resultado = await modelo.crearUsuario(datosUsuario);
    
    if (resultado.rows.length > 0) {
      const usuarioCreado = resultado.rows[0];
      res.status(201).json({
        mensaje: 'Usuario creado exitosamente',
        usuario: usuarioCreado
      });
    } else {
      res.status(500).json({ mensaje: 'Error al crear usuario' });
    }
  } catch (error) {
    console.error('Error en crearUsuario:', error);
    
    if (error.code === 'USUARIO_EXISTENTE') {
      return res.status(409).json({
        mensaje: error.message,
        tipo: 'USUARIO_EXISTENTE'
      });
    }
    
    res.status(500).json({ mensaje: 'Error al crear usuario' });
  }
}

// Actualizar usuario
async function actualizarUsuario(req, res) {
  try {
    const { id } = req.params;
    const { usuario, clave, rol } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ mensaje: 'ID de usuario inválido' });
    }
    
    // Validaciones básicas
    if (!usuario || !rol) {
      return res.status(400).json({ 
        mensaje: 'Datos incompletos. Usuario y rol son obligatorios.' 
      });
    }
    
    if (clave && clave.length < 3) {
      return res.status(400).json({ 
        mensaje: 'La clave debe tener al menos 3 caracteres' 
      });
    }
    
    if (!['admin', 'cliente'].includes(rol)) {
      return res.status(400).json({ 
        mensaje: 'Rol inválido. Debe ser "admin" o "cliente"' 
      });
    }
    
    const datosUsuario = {
      usuario: usuario.trim(),
      clave: clave ? clave.trim() : null,
      rol
    };
    
    const resultado = await modelo.actualizarUsuario(id, datosUsuario);
    
    if (resultado.rows.length > 0) {
      const usuarioActualizado = resultado.rows[0];
      res.json({
        mensaje: 'Usuario actualizado exitosamente',
        usuario: usuarioActualizado
      });
    } else {
      res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('Error en actualizarUsuario:', error);
    
    if (error.code === 'USUARIO_EXISTENTE') {
      return res.status(409).json({
        mensaje: error.message,
        tipo: 'USUARIO_EXISTENTE'
      });
    }
    
    if (error.code === 'NO_ENCONTRADO') {
      return res.status(404).json({
        mensaje: error.message,
        tipo: 'NO_ENCONTRADO'
      });
    }
    
    res.status(500).json({ mensaje: 'Error al actualizar usuario' });
  }
}

// Eliminar usuario
async function eliminarUsuario(req, res) {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ mensaje: 'ID de usuario inválido' });
    }
    
    const resultado = await modelo.eliminarUsuario(id);
    
    if (resultado.rows.length > 0) {
      const usuarioEliminado = resultado.rows[0];
      res.json({
        mensaje: `Usuario "${usuarioEliminado.usuario}" eliminado exitosamente`,
        id_eliminado: usuarioEliminado.id
      });
    } else {
      res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('Error en eliminarUsuario:', error);
    
    if (error.code === 'NO_ENCONTRADO') {
      return res.status(404).json({
        mensaje: error.message,
        tipo: 'NO_ENCONTRADO'
      });
    }
    
    if (error.code === 'ULTIMO_ADMIN') {
      return res.status(409).json({
        mensaje: error.message,
        tipo: 'ULTIMO_ADMIN'
      });
    }
    
    res.status(500).json({ mensaje: 'Error al eliminar usuario' });
  }
}

// Obtener estadísticas de usuarios
async function obtenerEstadisticas(req, res) {
  try {
    const resultado = await modelo.obtenerEstadisticasUsuarios();
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Error en obtenerEstadisticas:', error);
    res.status(500).json({ mensaje: 'Error al obtener estadísticas' });
  }
}

// Generar reporte PDF de usuarios
async function generarReporteUsuarios(req, res) {
  try {
    const resultado = await modelo.obtenerUsuarios();
    const usuarios = resultado.rows;
    
    if (usuarios.length === 0) {
      return res.status(404).json({ mensaje: 'No hay usuarios para mostrar en el reporte' });
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
    
    res.setHeader('Content-Disposition', `attachment; filename="reporte_usuarios_${fechaFormateada}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);
    
    // Título del reporte
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Reporte de Usuarios - Costa Potrero', { align: 'center' });
    
    doc.moveDown(0.5);
    
    // Información del reporte
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#7f8c8d')
       .text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
    
    doc.text(`Hora: ${new Date().toLocaleTimeString('es-ES')}`, { align: 'center' });
    doc.moveDown(1);
    
    // Estadísticas del reporte
    const totalUsuarios = usuarios.length;
    const usuariosActivos = usuarios.filter(u => u.activo).length;
    const administradores = usuarios.filter(u => u.rol === 'admin').length;
    const superAdministradores = usuarios.filter(u => u.rol === 'super_admin').length;
    
    // Crear tabla de estadísticas
    const statsY = doc.y;
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Resumen del Reporte:', 30, statsY);
    
    doc.moveDown(0.5);
    
    const statsData = [
      ['Total de Usuarios:', totalUsuarios.toString()],
      ['Usuarios Activos:', usuariosActivos.toString()],
      ['Administradores:', administradores.toString()],
      ['Super Administradores:', superAdministradores.toString()]
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
    
    // Crear tabla de usuarios
    const tableY = doc.y;
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Listado de Usuarios:', 30, tableY);
    
    doc.moveDown(0.5);
    
    // Encabezados de la tabla
    const headers = ['Usuario', 'Nombre', 'Email', 'Rol', 'Estado', 'Fecha Creación'];
    const startX = 30;
    const rowHeight = 20;
    const colWidths = [80, 120, 150, 80, 60, 90];
    
    let currentTableY = doc.y;
    
    // Dibujar encabezados
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#ffffff');
    
    let currentX = startX;
    headers.forEach((header, index) => {
      doc.rect(currentX, currentTableY, colWidths[index], rowHeight)
         .fill('#3498db');
      
      doc.text(header, currentX + 5, currentTableY + 6, {
        width: colWidths[index] - 10,
        align: 'left'
      });
      
      currentX += colWidths[index];
    });
    
    currentTableY += rowHeight;
    
    // Dibujar filas de datos
    doc.font('Helvetica')
       .fillColor('#2c3e50');
    
    usuarios.forEach((usuario, index) => {
      const bgColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
      const estadoTexto = usuario.activo ? 'Activo' : 'Inactivo';
      const rolTexto = usuario.rol === 'super_admin' ? 'Super Admin' : 'Admin';
      const fechaCreacion = new Date(usuario.fecha_creacion).toLocaleDateString('es-ES');
      
      const rowData = [
        usuario.usuario,
        usuario.nombre,
        usuario.email,
        rolTexto,
        estadoTexto,
        fechaCreacion
      ];
      
      currentX = startX;
      rowData.forEach((data, colIndex) => {
        doc.rect(currentX, currentTableY, colWidths[colIndex], rowHeight)
           .fill(bgColor)
           .stroke('#dee2e6');
        
        doc.fontSize(8)
           .text(data || 'N/A', currentX + 5, currentTableY + 6, {
             width: colWidths[colIndex] - 10,
             align: 'left',
             height: rowHeight - 12,
             ellipsis: true
           });
        
        currentX += colWidths[colIndex];
      });
      
      currentTableY += rowHeight;
      
      // Nueva página si es necesario
      if (currentTableY > 700) {
        doc.addPage();
        currentTableY = 50;
      }
    });
    
    // Finalizar el documento
    doc.end();
  } catch (error) {
    console.error('Error generando reporte:', error);
    res.status(500).json({ mensaje: 'Error al generar el reporte' });
  }
}

// Verificar credenciales (para login)
async function verificarCredenciales(req, res) {
  try {
    const { usuario, clave } = req.body;
    
    if (!usuario || !clave) {
      return res.status(400).json({ 
        mensaje: 'Usuario y clave son obligatorios' 
      });
    }
    
    const resultado = await modelo.verificarCredenciales(usuario, clave);
    
    if (resultado.valido) {
      res.json({
        mensaje: resultado.mensaje,
        usuario: resultado.usuario
      });
    } else {
      res.status(401).json({
        mensaje: resultado.mensaje
      });
    }
  } catch (error) {
    console.error('Error en verificarCredenciales:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

export {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  obtenerEstadisticas,
  generarReporteUsuarios as generarReporte,
  verificarCredenciales
};
