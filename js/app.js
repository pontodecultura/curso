import { CONFIG } from './config.js';
import { normalizePhone, applyMask } from './phone.js';
import { sha256Hex, decryptGroupLink } from './crypto.js';
import { clearSession, isRateLimited, registerAttempt } from './storage.js';

const AUTHORIZED = window.AUTHORIZED;

const els = {
  form: document.getElementById('accessForm'),
  course: document.getElementById('course'),
  courseDescription: document.getElementById('courseDescription'),
  phone: document.getElementById('phone'),
  button: document.getElementById('checkButton'),
  status: document.getElementById('status'),
  accessCard: document.getElementById('accessCard'),
  successCard: document.getElementById('successCard'),
  selectedCourse: document.getElementById('selectedCourse'),
  whatsappButton: document.getElementById('whatsappButton'),
  logoutButton: document.getElementById('logoutButton')
};

const courses = normalizeCourses(AUTHORIZED);

function normalizeCourses(data) {
  if (Array.isArray(data?.courses)) {
    return data.courses.map(course => ({
      ...course,
      lookupSalt: `${data.lookupSaltBase}:${course.id}`,
      deriveSalt: `${data.deriveSaltBase}:${course.id}`
    }));
  }

  // Compatibilidade com a versão anterior, que possuía um único curso.
  if (Array.isArray(data?.records) && data.records.length) {
    return [{
      id: 'curso-atual',
      title: 'Curso atual',
      description: 'Acesso do projeto anterior.',
      records: data.records,
      lookupSalt: data.lookupSalt,
      deriveSalt: data.deriveSalt
    }];
  }

  return [];
}

function setStatus(message = '', type = '') {
  els.status.textContent = message;
  els.status.className = type ? `status ${type}` : 'status';
}

function getCourseIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('curso') || params.get('course') || '';
}

function getSelectedCourse() {
  return courses.find(course => course.id === els.course.value) || null;
}

function populateCourses() {
  els.course.innerHTML = '';

  if (!courses.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Nenhum curso configurado';
    els.course.appendChild(option);
    els.course.disabled = true;
    els.button.disabled = true;
    setStatus('Banco de cursos não encontrado.', 'error');
    return;
  }

  for (const course of courses) {
    const option = document.createElement('option');
    option.value = course.id;
    option.textContent = course.title;
    els.course.appendChild(option);
  }

  const requested = getCourseIdFromURL();
  if (requested && courses.some(course => course.id === requested)) {
    els.course.value = requested;
  }
  updateCourseDescription();
}

function updateCourseDescription() {
  const course = getSelectedCourse();
  els.courseDescription.textContent = course?.description || 'Selecione o curso para continuar.';
}

function rememberSession(courseId, hash) {
  const expiresAt = Date.now() + (AUTHORIZED.sessionHours * 60 * 60 * 1000);
  localStorage.setItem(CONFIG.sessionKey, JSON.stringify({ courseId, hash, expiresAt }));
}

function showAccess() {
  const course = getSelectedCourse();
  els.selectedCourse.textContent = course?.title || 'Curso';
  els.accessCard.classList.add('hidden');
  els.successCard.classList.remove('hidden');
  els.successCard.setAttribute('aria-hidden', 'false');
}

function showLogin() {
  els.successCard.classList.add('hidden');
  els.successCard.setAttribute('aria-hidden', 'true');
  els.accessCard.classList.remove('hidden');
}

async function findAuthorizedRecord(phone, course) {
  const hash = await sha256Hex(`${course.lookupSalt}:${phone}`);
  const recordsByHash = new Map((course.records || []).map(record => [record.hash, record]));
  return { record: recordsByHash.get(hash) || null, hash };
}

async function unlock(phone, course, record) {
  const securityConfig = {
    deriveSalt: course.deriveSalt,
    pbkdf2Iterations: AUTHORIZED.pbkdf2Iterations
  };
  const link = await decryptGroupLink(phone, record, securityConfig);

  const parsed = new URL(link);
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'chat.whatsapp.com') {
    throw new Error('Destino inválido');
  }

  els.whatsappButton.href = link;
  rememberSession(course.id, record.hash);
  showAccess();
}

els.course.addEventListener('change', () => {
  updateCourseDescription();
  clearSession();
  els.phone.value = '';
  setStatus('');
  els.phone.focus();
});

els.phone.addEventListener('input', () => {
  applyMask(els.phone);
  setStatus('');
});

els.phone.addEventListener('change', () => applyMask(els.phone));
els.phone.addEventListener('paste', () => requestAnimationFrame(() => applyMask(els.phone)));

els.form.addEventListener('submit', async event => {
  event.preventDefault();
  setStatus('');

  if (isRateLimited()) {
    setStatus('Muitas tentativas. Aguarde alguns segundos e tente novamente.', 'error');
    return;
  }

  const course = getSelectedCourse();
  if (!course) {
    registerAttempt(false);
    setStatus('Selecione um curso válido.', 'error');
    return;
  }

  const phone = normalizePhone(els.phone.value);
  if (!phone) {
    registerAttempt(false);
    setStatus('Número inválido. Informe DDD + 8 ou 9 dígitos.', 'error');
    return;
  }

  els.button.disabled = true;
  els.button.textContent = 'Verificando...';

  try {
    const { record } = await findAuthorizedRecord(phone, course);

    if (!record) {
      registerAttempt(false);
      setStatus('Número não autorizado para este curso.', 'error');
      return;
    }

    await unlock(phone, course, record);
    registerAttempt(true);
    setStatus('Acesso liberado.', 'ok');
  } catch (error) {
    console.error(error);
    registerAttempt(false);
    setStatus('Não foi possível validar este acesso.', 'error');
  } finally {
    els.button.disabled = false;
    els.button.textContent = 'Verificar acesso';
  }
});

els.logoutButton.addEventListener('click', () => {
  clearSession();
  els.whatsappButton.removeAttribute('href');
  els.phone.value = '';
  setStatus('');
  showLogin();
  els.phone.focus();
});

// Como a chave de descriptografia depende do telefone, a sessão serve apenas
// como estado local temporário; não restaura o acesso sem nova validação.
clearSession();
populateCourses();
els.phone.focus();
