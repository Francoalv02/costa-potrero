import pool from '../../../../conexion/conexion.db.mjs';

// Obtener todos los usuarios
async function obtenerUsuarios() {
  try {
    const resultado = await pool.query(`
      SELECT 
        id,
        usuario,
        clave,
        rol
      FROM usuarios
      ORDER BY id
    `);
    return resultado;
  } catch (error) {
    console.error('Error en obtenerUsuarios:', error);
    throw error;
  }
}

// Obtener usuario por ID
async function obtenerUsuarioPorId(id) {
  try {
    const resultado = await pool.query(`
      SELECT 
        id,
        usuario,
        clave,
        rol
      FROM usuarios
      WHERE id = $1
    `, [id]);
    return resultado;
  } catch (error) {
    console.error('Error en obtenerUsuarioPorId:', error);
    throw error;
  }
}

// Obtener usuario por nombre de usuario (para login)
async function obtenerUsuarioPorNombre(usuario) {
  try {
    const resultado = await pool.query(`
      SELECT 
        id,
        usuario,
        clave,
        rol
      FROM usuarios
      WHERE usuario = $1
    `, [usuario]);
    return resultado;
  } catch (error) {
    console.error('Error en obtenerUsuarioPorNombre:', error);
    throw error;
  }
}

// Verificar si existe un usuario
async function verificarUsuarioExistente(usuario, idExcluir = null) {
  try {
    let query = `
      SELECT id, usuario
      FROM usuarios
      WHERE usuario = $1
    `;
    let params = [usuario];
    
    if (idExcluir) {
      query += ` AND id != $2`;
      params.push(idExcluir);
    }
    
    const resultado = await pool.query(query, params);
    return resultado;
  } catch (error) {
    console.error('Error en verificarUsuarioExistente:', error);
    throw error;
  }
}

// Crear nuevo usuario
async function crearUsuario({ usuario, clave, rol }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Verificar que no exista el usuario
    const existente = await verificarUsuarioExistente(usuario);
    if (existente.rows.length > 0) {
      const error = new Error('El nombre de usuario ya está en uso');
      error.code = 'USUARIO_EXISTENTE';
      throw error;
    }
    
    // Insertar usuario
    const resultado = await client.query(`
      INSERT INTO usuarios (usuario, clave, rol)
      VALUES ($1, $2, $3)
      RETURNING id, usuario, clave, rol
    `, [usuario, clave, rol]);
    
    await client.query('COMMIT');
    return resultado;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
  }
}

// Actualizar usuario
async function actualizarUsuario(id, { usuario, clave, rol }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Verificar que no exista el usuario (excluyendo el usuario actual)
    const existente = await verificarUsuarioExistente(usuario, id);
    if (existente.rows.length > 0) {
      const error = new Error('El nombre de usuario ya está en uso por otro usuario');
      error.code = 'USUARIO_EXISTENTE';
      throw error;
    }
    
    let query = `
      UPDATE usuarios 
      SET usuario = $1, rol = $2
    `;
    let params = [usuario, rol];
    
    // Si se proporcionó nueva contraseña, incluirla
    if (clave && clave.trim() !== '') {
      query += `, clave = $3 WHERE id = $4`;
      params.push(clave, id);
    } else {
      query += ` WHERE id = $3`;
      params.push(id);
    }
    
    query += ` RETURNING id, usuario, clave, rol`;
    
    const resultado = await client.query(query, params);
    
    if (resultado.rows.length === 0) {
      const error = new Error('Usuario no encontrado');
      error.code = 'NO_ENCONTRADO';
      throw error;
    }
    
    await client.query('COMMIT');
    return resultado;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
  }
}

// Eliminar usuario
async function eliminarUsuario(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Verificar que el usuario existe
    const usuarioExiste = await client.query('SELECT id, usuario FROM usuarios WHERE id = $1', [id]);
    if (usuarioExiste.rows.length === 0) {
      const error = new Error('Usuario no encontrado');
      error.code = 'NO_ENCONTRADO';
      throw error;
    }
    
    // No permitir eliminar si es el único admin
    const adminsActivos = await client.query(`
      SELECT COUNT(*)::int AS total
      FROM usuarios
      WHERE rol = 'admin' AND id != $1
    `, [id]);
    
    const usuarioActual = usuarioExiste.rows[0];
    const esAdmin = await client.query(`
      SELECT rol FROM usuarios WHERE id = $1 AND rol = 'admin'
    `, [id]);
    
    if (esAdmin.rows.length > 0 && adminsActivos.rows[0].total === 0) {
      const error = new Error('No se puede eliminar el último Administrador del sistema');
      error.code = 'ULTIMO_ADMIN';
      throw error;
    }
    
    // Eliminar usuario
    const resultado = await client.query(`
      DELETE FROM usuarios 
      WHERE id = $1 
      RETURNING id, usuario
    `, [id]);
    
    await client.query('COMMIT');
    return resultado;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
  }
}

// Actualizar último acceso (no implementado en esta versión)
async function actualizarUltimoAcceso(id) {
  try {
    // En esta versión simplificada no se actualiza último acceso
    return { rows: [{ id }] };
  } catch (error) {
    console.error('Error en actualizarUltimoAcceso:', error);
    throw error;
  }
}

// Verificar credenciales para login
async function verificarCredenciales(usuario, password) {
  try {
    const resultado = await obtenerUsuarioPorNombre(usuario);
    
    if (resultado.rows.length === 0) {
      return { valido: false, mensaje: 'Usuario no encontrado' };
    }
    
    const usuarioData = resultado.rows[0];
    
    // Verificar contraseña directamente (sin hash)
    if (password !== usuarioData.clave) {
      return { valido: false, mensaje: 'Contraseña incorrecta' };
    }
    
    // Actualizar último acceso
    await actualizarUltimoAcceso(usuarioData.id);
    
    // Remover clave del objeto de retorno
    const { clave: _, ...usuarioSinClave } = usuarioData;
    
    return { 
      valido: true, 
      usuario: usuarioSinClave,
      mensaje: 'Login exitoso'
    };
  } catch (error) {
    console.error('Error en verificarCredenciales:', error);
    return { valido: false, mensaje: 'Error interno del servidor' };
  }
}

// Obtener estadísticas de usuarios
async function obtenerEstadisticasUsuarios() {
  try {
    const estadisticas = await pool.query(`
      SELECT 
        COUNT(*)::int AS total_usuarios,
        COUNT(CASE WHEN rol = 'admin' THEN 1 END)::int AS administradores,
        COUNT(CASE WHEN rol = 'cliente' THEN 1 END)::int AS clientes
      FROM usuarios
    `);
    
    return estadisticas;
  } catch (error) {
    console.error('Error en obtenerEstadisticasUsuarios:', error);
    throw error;
  }
}

export {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  obtenerUsuarioPorNombre,
  verificarUsuarioExistente,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  actualizarUltimoAcceso,
  verificarCredenciales,
  obtenerEstadisticasUsuarios
};
