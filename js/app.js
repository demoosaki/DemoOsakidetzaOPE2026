// Archivo principal del test — carga dinámica por categoría (data/<categoria>.json),
// cache en localStorage, laterales de anuncios y consentimiento.
// Incluye control por-test para usar orden aleatorio o fijo (persistente).

const AdsConfig = {
  enabled: true,
  clientId: 'ca-pub-8376718952935319',
  leftSlot: null,
  rightSlot: null,
  showConsentBanner: true
};

let originalTest = [];
let currentTest = [];
let currentIndex = 0;
let score = 0;
let timerInterval;
let selectedAnswers = [];
let currentCategory = "";

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

// Order toggle utilities
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function orderKey(testId) { return `orderMode:${testId}`; }
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
function renderOrderToggleAboveQuestion(testId) {
  if (!questionText) return;
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
  const btnYes = document.createElement('button');
  btnYes.textContent = 'Sí';
  btnYes.className = 'order-btn-yes';
  btnYes.style.padding = '4px 10px';
  btnYes.style.cursor = 'pointer';
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
    if (confirm('Aplicar orden aleatorio ahora (reiniciará el test)?')) applyOrderToCurrentTest();
  });
  btnNo.addEventListener('click', ()=>{
    setOrderMode(testId, 'fixed');
    updateButtons();
    if (confirm('Restablecer orden fijo ahora (reiniciará el test)?')) applyOrderToCurrentTest();
  });
  wrapper.appendChild(btnYes);
  wrapper.appendChild(btnNo);
  const parent = questionText.parentNode;
  if (parent) parent.insertBefore(wrapper, questionText);
  updateButtons();
}

// load questions
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
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch(e){ }
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

// Ads
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
    containerEl.innerHTML = `<div class=\