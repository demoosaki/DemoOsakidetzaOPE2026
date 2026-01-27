// Variables globales
let questions = [];
let currentQuestionIndex = 0;
let timer = 0;
let timerInterval;
let userAnswers = [];
let testFinished = false;

// Demo 10 preguntas ABCD
const demoQuestions = [
  {q:"Pregunta 1", a:["A1","B1","C1","D1"], correct:0},
  {q:"Pregunta 2", a:["A2","B2","C2","D2"], correct:1},
  {q:"Pregunta 3", a:["A3","B3","C3","D3"], correct:2},
  {q:"Pregunta 4", a:["A4","B4","C4","D4"], correct:3},
  {q:"Pregunta 5", a:["A5","B5","C5","D5"], correct:0},
  {q:"Pregunta 6", a:["A6","B6","C6","D6"], correct:1},
  {q:"Pregunta 7", a:["A7","B7","C7","D7"], correct:2},
  {q:"Pregunta 8", a:["A8","B8","C8","D8"], correct:3},
  {q:"Pregunta 9", a:["A9","B9","C9","D9"], correct:0},
  {q:"Pregunta 10", a:["A10","B10","C10","D10"], correct:1},
];

// Funciones
function startTest(category){
  document.querySelector(".categories").classList.add("hidden");
  document.getElementById("test-container").classList.remove("hidden");

  questions = [...demoQuestions].sort(() => Math.random() - 0.5);
  currentQuestionIndex = 0;
  userAnswers = Array(questions.length).fill(null);
  testFinished = false;

  document.getElementById("finish-btn").classList.remove("hidden");
  document.getElementById("restart-btn").classList.remove("hidden");
  document.getElementById("score").classList.add("hidden");

  startTimer();
  renderQuestion();
  renderQuestionNav();
}

function startTimer(){
  timer = 0;
  clearInterval(timerInterval);
  timerInterval = setInterval(()=>{
    timer++;
    const min = String(Math.floor(timer/60)).padStart(2,"0");
    const sec = String(timer%60).padStart(2,"0");
    document.getElementById("timer").textContent = `${min}:${sec}`;
  },1000);
}

function renderQuestion(){
  const q = questions[currentQuestionIndex];
  document.getElementById("question-text").textContent = q.q;
  const answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";
  q.a.forEach((ans,i)=>{
    const btn = document.createElement("button");
    btn.textContent = ans;
    btn.onclick = ()=>selectAnswer(i);
    // marcar respuestas después de finalizar
    if(testFinished){
      if(i===q.correct) btn.style.background="#14532d"; // verde
      if(userAnswers[currentQuestionIndex]===i && i!==q.correct) btn.style.background="#7f1d1d"; // rojo
    }
    answersDiv.appendChild(btn);
  });
}

function selectAnswer(index){
  if(testFinished) return;
  userAnswers[currentQuestionIndex]=index;
  nextQuestion();
}

function nextQuestion(){
  if(currentQuestionIndex<questions.length-1){
    currentQuestionIndex++;
    renderQuestion();
  }
}

function renderQuestionNav(){
  const nav = document.getElementById("question-nav");
  nav.innerHTML="";
  questions.forEach((_,i)=>{
    const btn = document.createElement("button");
    btn.textContent = i+1;
    if(testFinished){
      if(userAnswers[i]===questions[i].correct) btn.classList.add("correct");
      else btn.classList.add("wrong");
    }
    btn.onclick = ()=>{
      currentQuestionIndex=i;
      renderQuestion();
    };
    nav.appendChild(btn);
  });
}

function finishTest(){
  testFinished=true;
  clearInterval(timerInterval);
  renderQuestionNav();
  renderQuestion();
  // score
  const correctCount = userAnswers.filter((a,i)=>a===questions[i].correct).length;
  const scoreDiv = document.getElementById("score");
  scoreDiv.textContent = `Score: ${correctCount}/${questions.length}`;
  scoreDiv.classList.remove("hidden");
}

function restartTest(){
  startTest(); // reinicia todo
}

function goHome(){
  document.getElementById("test-container").classList.add("hidden");
  document.querySelector(".categories").classList.remove("hidden");
  clearInterval(timerInterval);
}

