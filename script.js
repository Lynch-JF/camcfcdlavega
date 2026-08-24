// ============ API CONFIGURATION ============
const API_URL = "https://campcfcback-production.up.railway.app";

// ============ LOAD CUPOS ON PAGE LOAD ============
async function loadCupos() {
  try {
    const response = await fetch(`${API_URL}/api/inscripciones`);
    if (!response.ok) throw new Error('No se pudo obtener los cupos');
    const data = await response.json();
    const cuposNum = document.getElementById('cupos-num');
    if (cuposNum) {
      cuposNum.dataset.target = data.cuposDisponibles;
      // Si el elemento es visible, animar el contador
      if (isElementInViewport(cuposNum)) {
        animateCount(cuposNum, data.cuposDisponibles, 1200);
      }
    }
  } catch (error) {
    console.error('Error cargando cupos:', error);
  }
}

function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return rect.top >= 0 && rect.bottom <= window.innerHeight;
}

// Cargar cupos cuando se carga la página
window.addEventListener('load', loadCupos);

// ============ SCROLL REVEALS ============
const revealEls = document.querySelectorAll('.reveal');
const trailMap = document.querySelector('.trail-map');
const cuposNum = document.getElementById('cupos-num');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach((el) => revealObserver.observe(el));

// ============ TRAIL LINE DRAW-IN ============
if (trailMap) {
  const trailObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        trailMap.classList.add('in');
        trailObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  trailObserver.observe(trailMap);
}

// ============ CUPOS COUNTER ============
if (cuposNum) {
  const target = parseInt(cuposNum.dataset.target, 10) || 0;
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(cuposNum, target, 1200);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  counterObserver.observe(cuposNum);
}

function animateCount(el, target, duration) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    el.textContent = target;
    return;
  }
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ============ FORM SUBMIT ============
const form = document.getElementById('camp-form');
const submitBtn = document.getElementById('submit-btn');
const status = document.getElementById('form-status');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Recopilar datos del formulario
    const formData = new FormData(form);
    const datos = {
      nombre: formData.get('nombre'),
      edad: parseInt(formData.get('edad'), 10),
      telefono: formData.get('telefono'),
      iglesia: formData.get('iglesia'),
      contacto_nombre: formData.get('contacto_nombre'),
      contacto_telefono: formData.get('contacto_telefono'),
      talla: formData.get('talla'),
      alergias: formData.get('alergias') || '',
      notas: formData.get('notas') || '',
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    status.textContent = '';
    status.className = 'form-status';

    try {
      const response = await fetch(`${API_URL}/api/inscripciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datos),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar la inscripción');
      }

      // Éxito
      status.textContent = `¡Inscripción recibida! Te contactaremos pronto para confirmar el pago. Cupos disponibles: ${result.cuposDisponibles}`;
      status.className = 'form-status ok';
      form.reset();

      // Actualizar cupos en tiempo real
      const cuposNum = document.getElementById('cupos-num');
      if (cuposNum) {
        cuposNum.textContent = result.cuposDisponibles;
      }

    } catch (error) {
      console.error('Error:', error);
      status.textContent = `Error: ${error.message}`;
      status.className = 'form-status error';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirmar inscripción →';
    }
  });
}
