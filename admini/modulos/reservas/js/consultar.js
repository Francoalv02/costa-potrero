// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('form-disponibilidad');
    const resultado = document.getElementById('resultado');

    if (!form || !resultado) {
        console.error('No se encontraron los elementos necesarios');
        return;
    }

    // Validar fechas antes de enviar
    function validarFechas(fechaInicio, fechaFin) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        
        if (inicio < hoy) {
            return { valido: false, mensaje: ' La fecha de llegada no puede ser anterior a hoy' };
        }
        
        if (fin <= inicio) {
            return { valido: false, mensaje: ' La fecha de salida debe ser posterior a la fecha de llegada' };
        }
        
        const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
        if (dias > 30) {
            return { valido: false, mensaje: ' La estadía no puede ser mayor a 30 días' };
        }
        
        return { valido: true };
    }

    // Calcular días entre fechas
    function calcularDias(fechaInicio, fechaFin) {
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        return Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    }

    // Optimizar el evento submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fecha_inicio = document.getElementById('fecha_inicio').value;
        const fecha_fin = document.getElementById('fecha_fin').value;

        // Validar fechas
        const validacion = validarFechas(fecha_inicio, fecha_fin);
        if (!validacion.valido) {
            resultado.innerHTML = `<div class="mensajes error">${validacion.mensaje}</div>`;
            return;
        }

        // Mostrar loading con información
        const dias = calcularDias(fecha_inicio, fecha_fin);
        resultado.innerHTML = `
            <div class="mensajes info">
                <h3>Buscando disponibilidad...</h3>
                <p>Período: ${dias} día${dias > 1 ? 's' : ''} (${fecha_inicio} al ${fecha_fin})</p>
            </div>
        `;
        
        try {
            console.log('Consultando disponibilidad para:', { fecha_inicio, fecha_fin });
            
            const res = await fetch('/api/v1/reservas/disponibilidad/consultar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fecha_inicio, fecha_fin })
            });
            
            console.log('Respuesta del servidor:', res.status);
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const data = await res.json();
            console.log('Datos recibidos:', data);
            resultado.innerHTML = '';

            // Compatibilidad: aceptar { success, data } o { disponibles }
            const disponibles = Array.isArray(data)
                ? data
                : (data?.data || data?.disponibles || []);

            if (disponibles && disponibles.length > 0) {
                // Crear HTML con más información
                const html = disponibles.map(cabana => {
                    const precioEstimado = (parseFloat(cabana.precio) * dias).toFixed(2);
                    return `
                        <div class="cabana-disponible">
                            <div class="cabana-info">
                                <div class="cabana-nombre">Cabaña: ${cabana.nombre_cabana}</div>
                                <div class="cabana-detalles">
                                    <span class="cabana-id">ID: ${cabana.id_cabana}</span>
                                    <span class="cabana-precio">Precio $${cabana.precio}/día</span>
                                    <span class="cabana-capacidad">Capacidad: ${cabana.capacidad_personas} personas</span>
                                </div>
                                <div class="cabana-descripcion">${cabana.descripcion || 'Sin descripción disponible'}</div>
                                <div class="cabana-total">
                                    <strong> Precio total estimado: $${precioEstimado}</strong>
                                </div>
                            </div>
                            <div class="cabana-accion">
                                <a href="alta.html?id=${cabana.id_cabana}&fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}" 
                                   class="btn-reservar-cabana">
                                    Reservar Ahora
                                </a>
                            </div>
                        </div>
                    `;
                }).join('');
                
                resultado.innerHTML = `
                    <div class="mensajes success">
                        <h3>¡Cabañas Disponibles!</h3>
                        <p>Se encontraron ${disponibles.length} cabaña${disponibles.length > 1 ? 's' : ''} disponible${disponibles.length > 1 ? 's' : ''} para tu estadía</p>
                    </div>
                    <div class="cabanas-grid">
                        ${html}
                    </div>
                `;
            } else {
                resultado.innerHTML = `
                    <div class="mensajes error">
                        <h3>No hay cabañas disponibles</h3>
                        <p>No se encontraron cabañas disponibles para las fechas seleccionadas (${fecha_inicio} al ${fecha_fin}).</p>
                    </div>
                `;
                
                const sugerencia = data?.sugerencia;
                if (sugerencia) {
                    resultado.innerHTML += `
                        <div class="mensajes info">
                            <h3> Sugerencia de Disponibilidad</h3>
                            <p>Próxima disponibilidad sugerida: del ${sugerencia.fecha_inicio} al ${sugerencia.fecha_fin}</p>
                            <button onclick="cargarSugerencia('${sugerencia.fecha_inicio}', '${sugerencia.fecha_fin}')" 
                                    class="btn-estadisticas" style="margin-top: 10px;">
                                 Consultar Sugerencia
                            </button>
                        </div>
                    `;
                }
            }
        } catch (err) {
            console.error('Error al consultar disponibilidad:', err);
            resultado.innerHTML = `
                <div class="mensajes error">
                    <h3> Error al consultar disponibilidad</h3>
                    <p>Hubo un problema al conectar con el servidor. Intenta nuevamente.</p>
                    <p>Error: ${err.message}</p>
                </div>
            `;
        }
    });

    // Función para cargar sugerencia
    window.cargarSugerencia = function(fechaInicio, fechaFin) {
        document.getElementById('fecha_inicio').value = fechaInicio;
        document.getElementById('fecha_fin').value = fechaFin;
        form.dispatchEvent(new Event('submit'));
    };

    console.log('Script de consultar disponibilidad cargado correctamente');
});
