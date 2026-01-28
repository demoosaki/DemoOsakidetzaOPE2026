// Archivo principal del test — versión con carga dinámica por categoría (data/<categoria>.json),
// cache en localStorage, laterales de anuncios y consentimiento estricto.
// NOTA: Integra esto con el index.html y css del repo. Si ya hay un js/app.js, reemplaza su contenido.

const AdsConfig = {
  enabled: true,
  clientId: 'ca-pub-8376718952935319', // ya proporcionado
  leftSlot: null,   // sustituirás por el data-ad-slot cuando lo crees
  rightSlot: null,
  showConsentBanner: true
};

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

async function loadQuestionsForCategory(category){
  const key = cacheKeyFor(category);
  // comprobamos cache
  try {
    const cached = localStorage.getItem(key);
    if(cached){
      const parsed = JSON.parse(cached);
      if(Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch(e){ localStorage.removeItem(key); }

  // fetch del JSON en /data/<categoria>.json
  try {
    const resp = await fetch(`/data/${category}.json`, {cache: "no-store"});
    if(!resp.ok) throw new Error('No encontrado');
    const arr = await resp.json();
    if(!Array.isArray(arr)) throw new Error('Formato inválido');
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch(e){ /* ignore quota */ }
    return arr;
  } catch(err){
    console.warn('Fallo al cargar preguntas:', err);
    // fallback: usar preguntas mínimas embebidas si existen
    if(window.DEFAULT_QUESTIONS && window.DEFAULT_QUESTIONS[category]) return window.DEFAULT_QUESTIONS[category];
    return [];
  }
}

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
  // inyectar script si no está ya
  if(AdsConfig.clientId) injectAdsenseScript(AdsConfig.clientId);
  // si consent es requerido, no renderizamos hasta aceptar (gestión aparte)
  const consentGiven = localStorage.getItem('ads_consent') === 'yes';
  if(AdsConfig.showConsentBanner && !consentGiven){
    // mostramos placeholders y el banner manejará la carga
    if(adLeft) renderAdContainer(adLeft, null, null);
    if(adRight) renderAdContainer(adRight, null, null);
    if(consentBanner) consentBanner.classList.remove('hidden');
    return;
  }
  // render real
  if(adLeft) renderAdContainer(adLeft, AdsConfig.clientId, AdsConfig.leftSlot);
  if(adRight) renderAdContainer(adRight, AdsConfig.clientId, AdsConfig.rightSlot);
}

// Banner de consentimiento simple
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
    // dejamos placeholders
    if(adLeft) renderAdContainer(adLeft, null, null);
    if(adRight) renderAdContainer(adRight, null, null);
  });
}

async function startTest(category){
  currentCategory = category;
  currentTest = await loadQuestionsForCategory(category);
  // si no hay preguntas, mostramos mensaje y salimos
  if(!currentTest || currentTest.length === 0){
    alert('No hay preguntas disponibles para ' + category);
    return;
  }
  // barajar si se desea
  currentTest.sort(()=>Math.random()-0.5);
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
  // cargar laterales (respeta consentimiento)
  loadLateralAds();
  document.body.classList.add(category);
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
  startTest(currentCategory);
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
  timerInterval = setInterval(()=>{
    seconds++;
    const m = String(Math.floor(seconds/60)).padStart(2,'0');
    const s = String(seconds%60).padStart(2,'0');
    if(timerSpan) timerSpan.textContent = `${m}:${s}`;
  },1000);
}

function stopTimer(){
  clearInterval(timerInterval);
}

if(finishBtn) finishBtn.addEventListener('click', finishTest);
if(restartBtn) restartBtn.addEventListener('click', restartTest);
document.addEventListener('DOMContentLoaded', ()=>{ setupConsentBanner(); });