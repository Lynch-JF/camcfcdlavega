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

// ============ VERSE TYPEWRITER ============
// Anima el versículo destacado como si se escribiera a mano, la primera vez
// que entra en pantalla.
const typewriterEls = document.querySelectorAll('.verse-typewriter');

if (typewriterEls.length) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  typewriterEls.forEach((el) => {
    const fullText = el.dataset.text || el.textContent;
    if (!prefersReduced) el.textContent = '';

    const typeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (prefersReduced) {
            el.textContent = fullText;
          } else {
            typeText(el, fullText, 32);
          }
          typeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    typeObserver.observe(el);
  });
}

function typeText(el, text, speed) {
  let i = 0;
  el.classList.add('typing');
  function step() {
    if (i <= text.length) {
      el.textContent = text.slice(0, i);
      i++;
      setTimeout(step, speed);
    } else {
      el.classList.remove('typing');
    }
  }
  step();
}

// ============ FORM SUBMIT (INSCRIPCIÓN) ============
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

// ============ INSCRITOS Y PAGOS (PANEL PROTEGIDO) ============
// Nota de seguridad: esto es una contraseña simple del lado del cliente,
// pensada para que curiosos casuales no vean la lista al abrir la página.
// No es cifrado real ni protección contra alguien que revise el código
// fuente. Si se necesita seguridad de verdad, el filtrado debe hacerse
// en el backend (con login y token), no solo en el navegador.
const ADMIN_PASSWORD = 'juan316';
const ADMIN_SESSION_KEY = 'campo_admin_unlocked';

const adminGateForm = document.getElementById('admin-gate');
const adminPassInput = document.getElementById('admin-pass');
const adminStatus = document.getElementById('admin-status');
const adminPanel = document.getElementById('admin-panel');
const adminTbody = document.getElementById('admin-tbody');
const adminCount = document.getElementById('admin-count');
const adminRefreshBtn = document.getElementById('admin-refresh');
const adminLogoutBtn = document.getElementById('admin-logout');

function unlockAdminPanel() {
  if (adminGateForm) adminGateForm.hidden = true;
  if (adminPanel) adminPanel.hidden = false;
  cargarInscritos();
}

function lockAdminPanel() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  if (adminPanel) adminPanel.hidden = true;
  if (adminGateForm) {
    adminGateForm.hidden = false;
    adminGateForm.reset();
  }
  if (adminStatus) {
    adminStatus.textContent = '';
    adminStatus.className = 'form-status';
  }
}

if (adminGateForm) {
  // Si ya se desbloqueó antes en esta sesión del navegador, no pedir de nuevo.
  if (sessionStorage.getItem(ADMIN_SESSION_KEY) === '1') {
    unlockAdminPanel();
  }

  adminGateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const intento = adminPassInput.value.trim();

    if (intento === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
      adminStatus.textContent = '';
      unlockAdminPanel();
    } else {
      adminStatus.textContent = 'Contraseña incorrecta. Intenta de nuevo.';
      adminStatus.className = 'form-status error';
      adminPassInput.value = '';
      adminPassInput.focus();
    }
  });
}

if (adminRefreshBtn) {
  adminRefreshBtn.addEventListener('click', cargarInscritos);
}

if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener('click', lockAdminPanel);
}

// Intenta encontrar el estatus de pago sin importar el nombre exacto del
// campo que use el backend (pagado, pago, estatus_pago, etc.).
function resolverEstatusPago(inscrito) {
  const posibles = ['pagado', 'pago', 'ha_pagado', 'estatus_pago', 'pago_confirmado', 'isPaid'];
  for (const campo of posibles) {
    if (Object.prototype.hasOwnProperty.call(inscrito, campo)) {
      const valor = inscrito[campo];
      if (typeof valor === 'boolean') return valor ? 'si' : 'no';
      if (typeof valor === 'string') {
        const v = valor.toLowerCase();
        if (['si', 'sí', 'true', 'pagado', 'confirmado'].includes(v)) return 'si';
        if (['no', 'false', 'pendiente'].includes(v)) return 'no';
      }
    }
  }
  return 'desconocido';
}

// La respuesta de /api/inscripciones puede venir en distintas formas según
// el backend; probamos las más comunes para encontrar el listado.
function extraerListaInscritos(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.inscripciones)) return data.inscripciones;
  if (Array.isArray(data.inscritos)) return data.inscritos;
  if (Array.isArray(data.data)) return data.data;
  return null;
}

async function cargarInscritos() {
  if (!adminTbody) return;
  adminCount.textContent = 'Cargando inscritos...';
  adminTbody.innerHTML = '';

  try {
    const response = await fetch(`${API_URL}/api/inscripciones`);
    if (!response.ok) throw new Error('No se pudo obtener la lista de inscritos');
    const data = await response.json();
    const lista = extraerListaInscritos(data);

    if (!lista) {
      adminCount.textContent = '';
      adminTbody.innerHTML = `<tr><td colspan="5" class="admin-empty">
        El sistema todavía no devuelve el listado completo de inscritos (solo los cupos disponibles).
        Hay que pedirle al backend un endpoint que entregue nombre, teléfono, iglesia y estatus de pago
        de cada persona para poder mostrarlo aquí.
      </td></tr>`;
      return;
    }

    if (lista.length === 0) {
      adminCount.textContent = '0 inscritos por ahora';
      adminTbody.innerHTML = `<tr><td colspan="5" class="admin-empty">Todavía no hay inscritos.</td></tr>`;
      return;
    }

    const pagados = lista.filter((i) => resolverEstatusPago(i) === 'si').length;
    adminCount.textContent = `${lista.length} inscritos · ${pagados} pagados`;

    adminTbody.innerHTML = lista.map((inscrito) => {
      const estatus = resolverEstatusPago(inscrito);
      const pillClass = estatus === 'si' ? 'pago-si' : estatus === 'no' ? 'pago-no' : 'pago-desconocido';
      const pillTexto = estatus === 'si' ? 'Pagado' : estatus === 'no' ? 'Pendiente' : 'Sin dato';
      return `
        <tr>
          <td>${escapeHtml(inscrito.nombre || '—')}</td>
          <td>${escapeHtml(inscrito.edad != null ? String(inscrito.edad) : '—')}</td>
          <td>${escapeHtml(inscrito.telefono || '—')}</td>
          <td>${escapeHtml(inscrito.iglesia || '—')}</td>
          <td><span class="pago-pill ${pillClass}">${pillTexto}</span></td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    console.error('Error cargando inscritos:', error);
    adminCount.textContent = '';
    adminTbody.innerHTML = `<tr><td colspan="5" class="admin-empty">Error al cargar los inscritos: ${escapeHtml(error.message)}</td></tr>`;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}
