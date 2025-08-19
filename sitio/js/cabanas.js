// Función para cargar las cabañas desde la base de datos
async function cargarCabanas() {
    console.log('🔄 Iniciando carga de cabañas...');
    
    try {
        console.log('Haciendo petición a /api/v1/cabanas...');
        const response = await fetch('/api/v1/cabanas');
        console.log('Respuesta del servidor:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const cabanas = await response.json();
        console.log('Datos recibidos:', cabanas);
        
        if (cabanas.success && cabanas.data) {
            console.log(`Cabañas cargadas exitosamente: ${cabanas.data.length} cabañas`);
            console.log('Lista de cabañas:', cabanas.data);
            mostrarCabanas(cabanas.data);
        } else {
            console.error('Error en la respuesta:', cabanas.mensaje || 'Respuesta inválida');
            console.log('Usando cabañas por defecto...');
            mostrarCabanasPorDefecto();
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        console.log('Cargando cabañas por defecto...');
        mostrarCabanasPorDefecto();
    }
}

// Función para mostrar las cabañas en el DOM
function mostrarCabanas(cabanas) {
    console.log('Renderizando cabañas:', cabanas.length);
    console.log('Datos de cabañas:', cabanas);
    
    const container = document.getElementById('cabanas-container');
    if (!container) {
        console.error('No se encontró el contenedor de cabañas');
        return;
    }
    
    console.log('Limpiando contenedor...');
    container.innerHTML = '';

    cabanas.forEach((cabana, index) => {
        console.log(`Creando card para: ${cabana.nombre} (índice ${index})`);
        const cabanaCard = crearCabanaCard(cabana);
        container.appendChild(cabanaCard);
        console.log(`Card creada para: ${cabana.nombre}`);
    });

    console.log('Aplicando animaciones...');
    aplicarAnimaciones();
    console.log('Renderizado completado');
}

// Función para crear una card de cabaña
function crearCabanaCard(cabana) {
    console.log('Creando card con datos:', cabana);
    
    const div = document.createElement('div');
    div.className = 'cabana-card slide-in-left';
    
    // Determinar la imagen basada en el nombre de la cabaña
    let imagenSrc = './recursos/cabanaLu.JPG'; // imagen por defecto
    if (cabana.nombre.toLowerCase().includes('ju')) {
        imagenSrc = './recursos/cabanaJu.JPG';
    } else if (cabana.nombre.toLowerCase().includes('pe')) {
        imagenSrc = './recursos/cabanaPeques.jpg';
    }

    // Formatear precio si existe
    const precioFormateado = cabana.precio ? 
        new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0
        }).format(parseFloat(cabana.precio)) : '';

    const html = `
        <img src="${imagenSrc}" alt="${cabana.nombre}" class="cabana-image">
        <div class="cabana-content">
            <h3 class="cabana-title">
                <i class="fas fa-home"></i> ${cabana.nombre}
            </h3>
            <p class="cabana-description">
                ${cabana.descripcion || 'Cabaña equipada con todas las comodidades necesarias para tu estadía perfecta.'}
            </p>
            <div class="cabana-features">
                <span class="feature-tag">
                    <i class="fas fa-tv"></i> TV Cable
                </span>
                <span class="feature-tag">
                    <i class="fas fa-snowflake"></i> A/C
                </span>
                <span class="feature-tag">
                    <i class="fas fa-bed"></i> ${cabana.capacidad || '2'} Personas
                </span>
                ${cabana.precio ? `<span class="feature-tag">
                    <i class="fas fa-dollar-sign"></i> ${precioFormateado}
                </span>` : ''}
            </div>
            <a href="./disponibilidad.html?cabana=${cabana.id}" class="reserve-btn">
                <i class="fas fa-calendar-check"></i> Reservar
            </a>
        </div>
    `;
    
    console.log('HTML generado:', html);
    div.innerHTML = html;
    
    console.log('Card creada exitosamente');
    return div;
}

// Función para mostrar cabañas por defecto si no se pueden cargar desde la BD
function mostrarCabanasPorDefecto() {
    console.log('Cargando cabañas por defecto...');
    
    const cabanasDefault = [
        {
            id: 1,
            nombre: 'Cabaña Lu',
            descripcion: 'Cabaña equipada con televisión, cable, aire acondicionado y dos habitaciones. Ideal para familias pequeñas. Incluye cocina completa, baño privado y terraza con vista al lago.',
            capacidad: 4,
            precio: 15000
        },
        {
            id: 2,
            nombre: 'Cabaña Ju',
            descripcion: 'Cabaña equipada con televisión, cable, aire acondicionado y una habitación. Perfecta para parejas. Incluye cocina equipada, baño privado y balcón.',
            capacidad: 2,
            precio: 12000
        },
        {
            id: 3,
            nombre: 'Cabaña Pe',
            descripcion: 'Cabaña equipada con televisión, cable, aire acondicionado y tres habitaciones. Ideal para grupos grandes. Incluye cocina completa, dos baños y terraza amplia.',
            capacidad: 6,
            precio: 20000
        }
    ];

    mostrarCabanas(cabanasDefault);
}

// Función para aplicar animaciones a las cards
function aplicarAnimaciones() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const cards = document.querySelectorAll('.cabana-card');
    console.log(`🎬 Aplicando animaciones a ${cards.length} cards`);
    
    cards.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Función para verificar si el servidor está disponible
async function verificarServidor() {
    try {
        const response = await fetch('/api/v1/cabanas', { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.log('Servidor no disponible, usando datos por defecto');
        return false;
    }
}

// Cargar cabañas cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Iniciando carga de cabañas...');
    
    // Intentar cargar desde la API primero
    console.log('Intentando cargar desde la API...');
    cargarCabanas();
});

// Función para recargar cabañas (útil para debugging)
window.recargarCabanas = function() {
    console.log('Recargando cabañas...');
    cargarCabanas();
}; 