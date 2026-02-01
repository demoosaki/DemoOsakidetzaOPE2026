// Archivo principal del test — carga dinámica por categoría (data/<categoria>.json),
// cache en localStorage, laterales de anuncios y consentimiento.
// Incluye control por-test para usar orden aleatorio o fijo (persistente).

const AdsConfig = {
  enabled: true,
  clientId: 'ca-pub-8376718952935319', // ya proporcionado
  leftSlot: null,
  rightSlot: null,
  showConsentBanner: true
};

let originalTest = []; // guarda el array tal cual viene del JSON
let currentTest = [];
let currentIndex = 0;
let score = 0;
let timerInterval;
let selectedAnswers = [];
let currentCategory = "";

// Elementos DOM (asegúrate que existen en tu HTML)
const testContainer = document.getElementById("test-container");
const questionText = document.getElementById("question-text");
const answersDiv = document.getElementById("answers");
const finishBtn = document.getElementById("finish-btn");
const restartBtn = document.getElementById("restart-btn");
const timerSpan = document.getElementById("timer");
const topBar = document.getElementById("top-bar");
const questionNav = document.getElementById("question-nav");
const scoreDiv = document.getElementById("score");
const testCategoryName = document.getElementById("test-category-name");
const homeSection = document.getElementById("home");
const adLeft = document.getElementById('ad-left');
const adRight = document.getElementById('ad-right');
const consentBanner = document.getElementById('cookie-consent');

function cacheKeyFor(category){ return `questions:${category}`; }

// ---------------- Order toggle utilities ----------------
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function orderKey(testId) { return `orderMode:${testId}`; } // 'fixed' or 'random'
function getOrderMode(testId) { return localStorage.getItem(orderKey(testId)) || 'fixed'; }
function setOrderMode(testId, mode) {
  if (mode !== 'fixed' && mode !== 'random') mode = 'fixed';
  localStorage.setItem(orderKey(testId), mode);
  window.dispatchEvent(new CustomEvent('orderModeChanged', { detail: { testId, mode } }));
}
function processOrder(testId, questionsArr) {
  const mode = getOrderMode(testId);
  if (mode === 'random') return shuffleArray(questionsArr);
  return questionsArr.slice();
}
// Aplica la preferencia al test ya cargado (reinicia intento)
function applyOrderToCurrentTest() {
  if (!originalTest || !Array.isArray(originalTest) || originalTest.length === 0) return;
  currentTest = processOrder(currentCategory, originalTest);
  currentIndex = 0;
  selectedAnswers = Array(currentTest.length).fill(null);
  score = 0;
  renderQuestion();
  renderQuestionNav();
  startTimer();
}
// Renderiza el control (justo encima del enunciado de la pregunta)
function renderOrderToggleAboveQuestion(testId) {
  if (!questionText) return;
  // eliminar control previo si existe
  const existing = document.querySelector('.order-toggle-above-question');
  if (existing) existing.remove();

  const wrapper = document.createElement('div');
  wrapper.className = 'order-toggle-above-question';
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.gap = '10px';
  wrapper.style.margin = '8px 0';

  const label = document.createElement('span');
  label.textContent = 'Aleatorio:';
  label.style.fontWeight = '600';
  wrapper.appendChild(label);

  // Botón "Sí"
  const btnYes = document.createElement('button');
  btnYes.textContent = 'Sí';
  btnYes.className = 'order-btn-yes';
  btnYes.style.padding = '4px 10px';
  btnYes.style.cursor = 'pointer';

  // Botón "No"
  const btnNo = document.createElement('button');
  btnNo.textContent = 'No';
  btnNo.className = 'order-btn-no';
  btnNo.style.padding = '4px 10px';
  btnNo.style.cursor = 'pointer';

  function updateButtons() {
    const mode = getOrderMode(testId);
    if (mode === 'random') {
      btnYes.style.background = '#0d6efd'; btnYes.style.color = '#fff';
      btnNo.style.background = ''; btnNo.style.color = '';
    } else {
      btnNo.style.background = '#0d6efd'; btnNo.style.color = '#fff';
      btnYes.style.background = ''; btnYes.style.color = '';
    }
  }

  btnYes.addEventListener('click', ()=>{
    setOrderMode(testId, 'random');
    updateButtons();
    // preguntar si aplicar ahora
    if (confirm('Aplicar orden aleatorio ahora (reiniciará el test)?')) applyOrderToCurrentTest();
  });
  btnNo.addEventListener('click', ()=>{
    setOrderMode(testId, 'fixed');
    updateButtons();
    if (confirm('Restablecer orden fijo ahora (reiniciará el test)?')) applyOrderToCurrentTest();
  });

  wrapper.appendChild(btnYes);
  wrapper.appendChild(btnNo);

  // insertamos antes del enunciado
  const parent = questionText.parentNode;
  if (parent) parent.insertBefore(wrapper, questionText);
  updateButtons();
}
function cacheKeyFor(category){ return `questions:${category}`; }

// ---------- carga de preguntas ----------
async function loadQuestionsForCategory(category){
  const key = cacheKeyFor(category);
  try {
    const cached = localStorage.getItem(key);
    if(cached){
      const parsed = JSON.parse(cached);
      if(Array.isArray(parsed) && parsed.length) {
        originalTest = parsed.slice();
        return parsed;
      }
    }
  } catch(e){ localStorage.removeItem(key); }

  try {
    const resp = await fetch(`/data/${category}.json`, {cache: "no-store"});
    if(!resp.ok) throw new Error('No encontrado');
    const arr = await resp.json();
    if(!Array.isArray(arr)) throw new Error('Formato inválido');
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch(e){ /* ignore quota */ }
    originalTest = arr.slice();
    return arr;
  } catch(err){
    console.warn('Fallo al cargar preguntas:', err);
    if(window.DEFAULT_QUESTIONS && window.DEFAULT_QUESTIONS[category]) {
      originalTest = window.DEFAULT_QUESTIONS[category].slice();
      return window.DEFAULT_QUESTIONS[category];
    }
    return [];
  }
}

// ---------- Ads / consentimiento (no tocado) ----------
function injectAdsenseScript(clientId){
  if(!clientId) return;
  if(window.adsenseScriptInjected) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
  s.crossOrigin = 'anonymous';
  document.head.appendChild(s);
  window.adsenseScriptInjected = true;
}
function renderAdContainer(containerEl, clientId, slotId){
  if(!containerEl) return;
  if(!clientId || !slotId){
    containerEl.innerHTML = `<div class="ad-placeholder">Publicidad</div>`;
    containerEl.classList.remove('hidden');
    return;
  }
  containerEl.innerHTML = `
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-client="${clientId}"
         data-ad-slot="${slotId}"
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
  `;
  containerEl.classList.remove('hidden');
}
function loadLateralAds(){
  if(!AdsConfig.enabled) return;
  if(AdsConfig.clientId) injectAdsenseScript(AdsConfig.clientId);
  const consentGiven = localStorage.getItem('ads_consent') === 'yes';
  if(AdsConfig.showConsentBanner && !consentGiven){
    if(adLeft) renderAdContainer(adLeft, null, null);
    if(adRight) renderAdContainer(adRight, null, null);
    if(consentBanner) consentBanner.classList.remove('hidden');
    return;
  }
  if(adLeft) renderAdContainer(adLeft, AdsConfig.clientId, AdsConfig.leftSlot);
  if(adRight) renderAdContainer(adRight, AdsConfig.clientId, AdsConfig.rightSlot);
}
function setupConsentBanner(){
  if(!consentBanner) return;
  const btnAccept = document.getElementById('accept-ads');
  const btnDecline = document.getElementById('decline-ads');
  btnAccept && btnAccept.addEventListener('click', ()=>{
    localStorage.setItem('ads_consent','yes');
    consentBanner.classList.add('hidden');
    loadLateralAds();
  });
  btnDecline && btnDecline.addEventListener('click', ()=>{
    localStorage.setItem('ads_consent','no');
    consentBanner.classList.add('hidden');
    if(adLeft) renderAdContainer(adLeft, null, null);
    if(adRight) renderAdContainer(adRight, null, null);
  });
}

// ---------- flujo de test ----------
async function startTest(category){
  currentCategory = category;
  const arr = await loadQuestionsForCategory(category);
  if(!arr || arr.length === 0){
    alert('No hay preguntas disponibles para ' + category);
    return;
  }
  // aplicar preferencia de orden (no barajeo por defecto)
  currentTest = processOrder(category, originalTest);
  currentIndex = 0;
  score = 0;
  selectedAnswers = Array(currentTest.length).fill(null);
  testCategoryName.textContent = category.charAt(0).toUpperCase()+category.slice(1);
  testContainer.classList.remove('hidden');
  homeSection.classList.add('hidden');
  if(finishBtn) finishBtn.classList.remove('hidden');
  if(restartBtn) restartBtn.classList.remove('hidden');
  if(scoreDiv) scoreDiv.classList.add('hidden');
  if(topBar) topBar.classList.remove('hidden');
  startTimer();
  renderQuestion();
  renderQuestionNav();
  loadLateralAds();
  document.body.classList.add(category);

  // renderizamos control justo encima del enunciado
  renderOrderToggleAboveQuestion(category);
}

function renderQuestion(){
  const q = currentTest[currentIndex];
  questionText.textContent = q.q || '';
  answersDiv.innerHTML = '';
  (q.options || []).forEach((opt, idx)=>{
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = opt;
    if(selectedAnswers[currentIndex] === idx) btn.classList.add('selected');
    btn.addEventListener('click', ()=>{
      selectedAnswers[currentIndex] = idx;
      Array.from(answersDiv.children).forEach(c=>c.classList.remove('selected'));
      btn.classList.add('selected');
      renderQuestionNav();
      setTimeout(()=>{
        if(currentIndex < currentTest.length-1){
          currentIndex++;
          renderQuestion();
        } else {
          finishTest();
        }
      }, 220);
    });
    answersDiv.appendChild(btn);
  });
}

function renderQuestionNav(){
  questionNav.innerHTML = '';
  currentTest.forEach((_, idx)=>{
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = idx+1;
    btn.title = `Ir a pregunta ${idx+1}`;
    if(scoreDiv && !scoreDiv.classList.contains('hidden')){
      const correct = currentTest[idx].answer;
      const sel = selectedAnswers[idx];
      if(sel === correct) btn.style.backgroundColor = 'green';
      else btn.style.backgroundColor = 'red';
      btn.addEventListener('click', ()=>showQuestionWithResults(idx));
    } else {
      btn.addEventListener('click', ()=>{ currentIndex = idx; renderQuestion(); });
    }
    questionNav.appendChild(btn);
  });
}

function finishTest(){
  score = selectedAnswers.reduce((acc, sel, idx)=> sel === currentTest[idx].answer ? acc+1 : acc, 0);
  if(scoreDiv){
    scoreDiv.textContent = `Tu puntuación: ${score} / ${currentTest.length}`;
    scoreDiv.classList.remove('hidden');
  }
  clearInterval(timerInterval);
  renderQuestionNav();
}

function showQuestionWithResults(idx){
  currentIndex = idx;
  const q = currentTest[idx];
  questionText.textContent = q.q || '';
  answersDiv.innerHTML = '';
  (q.options || []).forEach((opt, oidx)=>{
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = opt;
    if(selectedAnswers[idx]===oidx && selectedAnswers[idx]===q.answer) btn.classList.add('correct');
    else if(selectedAnswers[idx]===oidx && selectedAnswers[idx]!==q.answer) btn.classList.add('incorrect');
    else if(oidx===q.answer) btn.classList.add('correct');
    answersDiv.appendChild(btn);
  });
}

function restartTest(){
  stopTimer();
  // volver a aplicar preferencia y reiniciar
  currentTest = processOrder(currentCategory, originalTest);
  currentIndex = 0;
  score = 0;
  selectedAnswers = Array(currentTest.length).fill(null);
  startTimer();
  renderQuestion();
  renderQuestionNav();
}

function goHome(){
  stopTimer();
  testContainer.classList.add('hidden');
  homeSection.classList.remove('hidden');
  if(finishBtn) finishBtn.classList.add('hidden');
  if(restartBtn) restartBtn.classList.add('hidden');
  if(scoreDiv) scoreDiv.classList.add('hidden');
  if(timerSpan) timerSpan.textContent = '00:00';
  if(topBar) topBar.classList.add('hidden');
  if(adLeft) adLeft.classList.add('hidden');
  if(adRight) adRight.classList.add('hidden');
  document.body.classList.remove(currentCategory);
}

function startTimer(){
  let seconds = 0;
  clearInterval(timerInterval);
  timerInterval = setInterval(()={
    seconds++;
    const m = String(Math.floor(seconds/60)).padStart(2,'0');
    const s = String(seconds%60).padStart(2,'0');
    if(timerSpan) timerSpan.textContent = `${m}:${s}`;
  },1000);
}
function stopTimer(){ clearInterval(timerInterval); }

if(finishBtn) finishBtn.addEventListener('click', finishTest);
if(restartBtn) restartBtn.addEventListener('click', restartTest);
document.addEventListener('DOMContentLoaded', ()=>{ setupConsentBanner(); });