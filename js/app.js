// ================= CONFIGURAÇÃO DO FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyD3JXXQrzqessm7zGL6Ipa0Le75XNN2QjM",
  authDomain: "disciplinas-7e838.firebaseapp.com",
  projectId: "disciplinas-7e838",
  storageBucket: "disciplinas-7e838.firebasestorage.app",
  messagingSenderId: "261374908815",
  appId: "1:261374908815:web:b5afc220d53494347bd3fa"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ================= VARIÁVEIS GLOBAIS =================
let disciplinesMap = {};
let currentDisciplineId = null;
let highlightActive = false;
let ariaTooltip = null;
let currentHighlightElements = [];

const dynamicContainer = document.getElementById('dynamic-content');
const sidebarContainer = document.getElementById('dynamic-sidebar');
const homeLink = document.getElementById('home-link');

// ================= FUNÇÕES DE DESTAQUE ARIA =================
function createTooltip() {
  if (!ariaTooltip) {
    ariaTooltip = document.createElement('div');
    ariaTooltip.className = 'aria-tooltip';
    document.body.appendChild(ariaTooltip);
  }
}
function showTooltip(text, event) {
  if (!highlightActive) return;
  createTooltip();
  ariaTooltip.textContent = text;
  ariaTooltip.style.display = 'block';
  ariaTooltip.style.left = (event.pageX + 15) + 'px';
  ariaTooltip.style.top = (event.pageY + 15) + 'px';
  setTimeout(() => { if (ariaTooltip) ariaTooltip.style.display = 'none'; }, 1500);
}
function clearHighlights() {
  currentHighlightElements.forEach(el => {
    el.classList.remove('aria-highlight');
    el.removeEventListener('mouseenter', el._ariaEnter);
    el.removeEventListener('mouseleave', el._ariaLeave);
  });
  currentHighlightElements = [];
  if (ariaTooltip) ariaTooltip.style.display = 'none';
}
function highlightAriaElements() {
  clearHighlights();
  const selectors = [
    '[role]', '[aria-label]', '[aria-selected]', '[aria-hidden]',
    '[aria-live]', '[aria-expanded]', '[aria-controls]', '[role="tab"]',
    '[role="tablist"]', '[role="list"]', '[role="listitem"]', '[role="main"]',
    '[role="banner"]', '[role="navigation"]', '.sr-only'
  ];
  const elements = document.querySelectorAll(selectors.join(','));
  elements.forEach(el => {
    el.classList.add('aria-highlight');
    currentHighlightElements.push(el);
    const enter = (e) => {
      let info = [];
      if (el.hasAttribute('role')) info.push(`role="${el.getAttribute('role')}"`);
      if (el.hasAttribute('aria-label')) info.push(`aria-label="${el.getAttribute('aria-label')}"`);
      if (el.hasAttribute('aria-selected')) info.push(`aria-selected="${el.getAttribute('aria-selected')}"`);
      if (el.classList.contains('sr-only')) info.push('texto oculto para leitores');
      if (info.length) showTooltip(info.join(', '), e);
    };
    const leave = () => { if (ariaTooltip) ariaTooltip.style.display = 'none'; };
    el.addEventListener('mouseenter', enter);
    el.addEventListener('mouseleave', leave);
    el._ariaEnter = enter;
    el._ariaLeave = leave;
  });
}
function toggleAriaHighlight() {
  highlightActive = !highlightActive;
  const btn = document.getElementById('toggleAriaHighlight');
  if (highlightActive) {
    highlightAriaElements();
    btn.classList.add('active');
    if (window._ariaObserver) window._ariaObserver.disconnect();
    window._ariaObserver = new MutationObserver(() => { if (highlightActive) highlightAriaElements(); });
    window._ariaObserver.observe(document.body, { childList: true, subtree: true });
  } else {
    clearHighlights();
    btn.classList.remove('active');
    if (window._ariaObserver) window._ariaObserver.disconnect();
  }
}
document.getElementById('toggleAriaHighlight').addEventListener('click', toggleAriaHighlight);

// ================= FUNÇÕES AUXILIARES =================
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

function setActiveButton(disciplineId) {
  document.querySelectorAll('.discipline-btn').forEach(btn => {
    const active = btn.getAttribute('data-discipline') === disciplineId;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
}

function focusFirstLessonButton() {
  setTimeout(() => {
    const firstBtn = document.querySelector('.btn-lesson');
    if (firstBtn) firstBtn.focus();
  }, 100);
}

// ================= RENDERIZAÇÃO =================
function renderHome() {
  currentDisciplineId = null;
  setActiveButton(null);
  const homeHTML = `
    <div class="home-container">
      <div class="home-header">
        <h3>Leonardo Arruda</h3>
        <div class="home-subtitle">Ambiente de aprendizagem</div>
      </div>
      <section class="home-section">
        <h3>Perfil acadêmico</h3>
        <p>Engenheiro e pesquisador, desenvolve projetos interseccionando acessibilidade, cognição musical, criatividade computacional, síntese sonora, interface humano-computador, programação musical e composição interativa. Mestre pelo Instituto de Artes - IA/Unicamp com ênfase em Música, Linguagem e Sonologia, sob orientação de José Eduardo Fornari Novo Junior, com financiamento CAPES-FAPESP. Possui especialização em Processos Didático-Pedagógicos para Cursos na Modalidade a Distância pela Universidade Virtual do Estado de São Paulo (UNIVESP) e Bacharel em Engenharia de Computação pelo Centro Universitário Sagrado Coração USC (2018). Atua em pesquisas pelo Núcleo Interdisciplinar de Comunicação Sonora (NICS) e integra o grupo de pesquisa Coletivo de Comunicação, Cognição e Computação (C4), registrado no CNPq. A produção acadêmica e artística articula música, tecnologia e inclusão, explorando musicalidade, percepção sonora e estética em projetos com tecnologia assistiva para tornar a experiência musical acessível.</p>
      </section>
    </div>
  `;
  dynamicContainer.innerHTML = homeHTML;
  if (highlightActive) highlightAriaElements();
  document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function renderLessonsList(disciplineId) {
  const disciplina = disciplinesMap[disciplineId];
  if (!disciplina) {
    dynamicContainer.innerHTML = `<div class="empty-state"><i class="fa fa-frown-o"></i><p>Disciplina não encontrada.</p></div>`;
    if (highlightActive) highlightAriaElements();
    return;
  }

  try {
    dynamicContainer.innerHTML = `<div class="empty-state"><i class="fa fa-spinner fa-spin"></i><p>Carregando aulas de ${escapeHtml(disciplina.nome)}...</p></div>`;

    // Buscar apenas aulas disponíveis
    const aulasSnapshot = await db.collection('aulas')
      .where('disciplinaId', '==', disciplineId)
      .where('disponivel', '==', true)
      .get();

    const lessons = [];
    aulasSnapshot.forEach(doc => {
      const data = doc.data();
      lessons.push({
        id: doc.id,
        title: data.titulo || "Sem título",
        desc: data.descricao || "",
        url: data.url || "#",
        ordem: typeof data.ordem === 'number' ? data.ordem : parseInt(data.ordem) || 9999
      });
    });

    // Ordenação ascendente (1,2,3...)
    lessons.sort((a, b) => a.ordem - b.ordem);

    if (lessons.length === 0) {
      dynamicContainer.innerHTML = `<div class="empty-state"><i class="fa fa-frown-o"></i><p>Nenhuma aula disponível no momento.</p></div>`;
      if (highlightActive) highlightAriaElements();
      return;
    }

    let html = `
      <div>
        <div class="d-flex justify-content-between align-items-center flex-wrap">
          <h2 style="color:#212529; font-weight:600;">${escapeHtml(disciplina.nome)}</h2>
          <span class="badge" style="background:#e9ecef; color:#495057;">${lessons.length} aulas</span>
        </div>
        <div class="info-notice" role="note">
          <i class="fa fa-info-circle" aria-hidden="true"></i>
          <p>O conteúdo será aberto em uma nova aba. Volte a esta janela para continuar.</p>
        </div>
        <div class="lessons-grid" role="list" aria-label="Lista de aulas">
    `;
    lessons.forEach((lesson, idx) => {
      const titleId = `lesson-title-${disciplineId}-${idx}`;
      html += `
        <div class="lesson-card" role="listitem">
          <div class="lesson-card-header">
            <h3 id="${titleId}">${escapeHtml(lesson.title)}</h3>
          </div>
          <div class="lesson-card-body">
            <p>${escapeHtml(lesson.desc)}</p>
            <button class="btn-lesson" data-url="${escapeHtml(lesson.url)}" data-title="${escapeHtml(lesson.title)}" aria-labelledby="${titleId}">
              <i class="fa fa-external-link" aria-hidden="true"></i> Acessar
            </button>
          </div>
        </div>
      `;
    });
    html += `</div></div>`;
    dynamicContainer.innerHTML = html;

    document.querySelectorAll('.btn-lesson').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.getAttribute('data-url');
        const title = btn.getAttribute('data-title');
        if (url && url !== '#') window.open(url, '_blank', 'noopener,noreferrer');
        else alert(`Material "${title}" ainda não possui link.`);
      });
    });
    if (highlightActive) highlightAriaElements();
  } catch (error) {
    console.error("Erro ao carregar aulas:", error);
    dynamicContainer.innerHTML = `<div class="empty-state"><i class="fa fa-exclamation-triangle"></i><p>Erro ao carregar aulas. Verifique o console.</p></div>`;
  }
}

async function selectDiscipline(disciplineId) {
  if (!disciplinesMap[disciplineId]) return;
  currentDisciplineId = disciplineId;
  await renderLessonsList(disciplineId);
  setActiveButton(disciplineId);
  focusFirstLessonButton();
  document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ================= CONSTRUÇÃO DO SIDEBAR COM FILTRO DE DISPONIBILIDADE =================
async function buildSidebar() {
  try {
    sidebarContainer.innerHTML = `<div class="empty-state"><i class="fa fa-spinner fa-spin"></i><p>Carregando disciplinas...</p></div>`;
    
    // Buscar todas as disciplinas (para depois filtrar)
    const disciplinasSnapshot = await db.collection('disciplinas').orderBy('ordem', 'asc').get();
    
    if (disciplinasSnapshot.empty) {
      sidebarContainer.innerHTML = `<div class="empty-state"><i class="fa fa-exclamation-triangle"></i><p>Nenhuma disciplina cadastrada.</p></div>`;
      return;
    }

    const categoriesMap = new Map();
    
    disciplinasSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Verificar disponibilidade (tratando diferentes tipos)
      let isAvailable = false;
      if (data.hasOwnProperty('disponivel')) {
        if (typeof data.disponivel === 'boolean') {
          isAvailable = data.disponivel === true;
        } else if (typeof data.disponivel === 'string') {
          isAvailable = data.disponivel.toLowerCase() === 'true';
        } else if (typeof data.disponivel === 'number') {
          isAvailable = data.disponivel === 1;
        }
      } else {
        // Se o campo não existe, considerar disponível (compatibilidade)
        isAvailable = true;
        console.warn(`Disciplina ${doc.id} não tem campo 'disponivel'. Exibindo por padrão.`);
      }
      
      if (!isAvailable) return; // Não exibir disciplinas indisponíveis
      
      const disciplina = {
        id: doc.id,
        nome: data.nome,
        categoria: data.categoria || "Outras",
        ordem: typeof data.ordem === 'number' ? data.ordem : parseInt(data.ordem) || 0,
        icon: data.icon || "fa-book"
      };
      disciplinesMap[doc.id] = disciplina;
      
      if (!categoriesMap.has(disciplina.categoria)) {
        categoriesMap.set(disciplina.categoria, []);
      }
      categoriesMap.get(disciplina.categoria).push(disciplina);
    });
    
    // Ordenar disciplinas dentro de cada categoria
    for (let [cat, discList] of categoriesMap.entries()) {
      discList.sort((a, b) => a.ordem - b.ordem);
    }
    
    const sortedCategories = Array.from(categoriesMap.keys()).sort();
    
    if (sortedCategories.length === 0) {
      sidebarContainer.innerHTML = `<div class="empty-state"><i class="fa fa-exclamation-triangle"></i><p>Nenhuma disciplina disponível no momento.</p><p>Verifique se o campo 'disponivel' está true nos documentos.</p></div>`;
      return;
    }
    
    let sidebarHtml = `<div class="disciplines-list" role="tablist">`;
    for (const categoria of sortedCategories) {
      const disciplinas = categoriesMap.get(categoria);
      sidebarHtml += `<div class="category-heading" role="presentation">${escapeHtml(categoria)}</div>`;
      for (const disc of disciplinas) {
        sidebarHtml += `
          <div role="presentation">
            <button class="discipline-btn" data-discipline="${disc.id}" id="discipline-${disc.id}" role="tab" aria-selected="false" aria-controls="dynamic-content">
              <i class="fa ${disc.icon}" aria-hidden="true"></i> ${escapeHtml(disc.nome)}
            </button>
          </div>
        `;
      }
    }
    sidebarHtml += `</div>`;
    sidebarContainer.innerHTML = sidebarHtml;
    
    // Anexar eventos
    document.querySelectorAll('.discipline-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const discId = btn.getAttribute('data-discipline');
        if (discId) selectDiscipline(discId);
      });
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const discId = btn.getAttribute('data-discipline');
          if (discId) selectDiscipline(discId);
        }
      });
    });
    
    if (highlightActive) highlightAriaElements();
    console.log("Sidebar carregado. Disciplinas disponíveis:", Object.keys(disciplinesMap).length);
  } catch (error) {
    console.error("Erro ao carregar disciplinas:", error);
    sidebarContainer.innerHTML = `<div class="empty-state"><i class="fa fa-exclamation-triangle"></i><p>Erro ao carregar disciplinas. Verifique o console.</p><p>${error.message}</p></div>`;
  }
}

// ================= EVENTOS INICIAIS =================
homeLink.addEventListener('click', (e) => { e.preventDefault(); renderHome(); });
homeLink.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); renderHome(); } });

(async () => {
  await buildSidebar();
  renderHome();
})();