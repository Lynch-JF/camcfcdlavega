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
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    status.textContent = '';
    status.className = 'form-status';

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirmar inscripción →';
      status.textContent = '¡Inscripción recibida! Te contactaremos pronto para confirmar el pago.';
      status.className = 'form-status ok';
      form.reset();
    }, 900);
  });
}