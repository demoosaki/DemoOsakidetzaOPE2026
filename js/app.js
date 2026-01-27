let questions = {
  medicina: [
    {q: "Pregunta 1 Medicina", options: ["A","B","C","D"], answer: 1},
    {q: "Pregunta 2 Medicina", options: ["A","B","C","D"], answer: 2},
    {q: "Pregunta 3 Medicina", options: ["A","B","C","D"], answer: 0},
    {q: "Pregunta 4 Medicina", options: ["A","B","C","D"], answer: 3},
    {q: "Pregunta 5 Medicina", options: ["A","B","C","D"], answer: 1},
    {q: "Pregunta 6 Medicina", options: ["A","B","C","D"], answer: 2},
    {q: "Pregunta 7 Medicina", options: ["A","B","C","D"], answer: 0},
    {q: "Pregunta 8 Medicina", options: ["A","B","C","D"], answer: 3},
    {q: "Pregunta 9 Medicina", options: ["A","B","C","D"], answer: 1},
    {q: "Pregunta 10 Medicina", options: ["A","B","C","D"], answer: 2},
  ],
  enfermeria: [...Array(10)].map((_,i)=>({q:`Pregunta ${i+1} Enfermería`, options:["A","B","C","D"], answer:i%4})),
  auxiliar: [...Array(10)].map((_,i)=>({q:`Pregunta ${i+1} Auxiliar`, options:["A","B","C","D"], answer:i%4})),
  celador: [...Array(10)].map((_,i)=>({q:`Pregunta ${i+1} Celador`, options:["A","B","C","D"], answer:i%4})),
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
const questionNav = document.getElementById("question-nav");
const scoreDiv = document.getElementById("score");
const testCategoryName = document.getElementById("test-category-name");
const homeSection = document.getElementById("home");

function startTest(category) {
  currentCategory = category;
  currentTest = [...questions[category]];
  currentTest.sort(() => Math.random() - 0.5);
  currentIndex = 0;
  score = 0;
  selectedAnswers = Array(currentTest.length).fill(null);
  testCategoryName.textContent = category.charAt(0).toUpperCase() + category.slice(1);
  testContainer.classList.remove("hidden");
  homeSection.classList.add("hidden");
  finishBtn.classList.remove("hidden");
  restartBtn.classList.remove("hidden");
  scoreDiv.classList.add("hidden");
  startTimer();
  renderQuestion();
  renderQuestionNav();
  document.body.className = category;
}

function renderQuestion() {
  const q = currentTest[currentIndex];
  questionText.textContent = q.q;
  answersDiv.innerHTML = "";
  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    if(selectedAnswers[currentIndex] === idx) btn.classList.add("selected");
    btn.addEventListener("click", () => {
      selectedAnswers[currentIndex] = idx;
      renderQuestion();
    });
    answersDiv.appendChild(btn);
  });
}

function renderQuestionNav() {
  questionNav.innerHTML = "";
  currentTest.forEach((_, idx) => {
    const btn = document.createElement("button");
    btn.textContent = idx+1;
    if(scoreDiv.classList.contains("hidden")===false){
      const correct = currentTest[idx].answer;
      const sel = selectedAnswers[idx];
      if(sel === correct) btn.style.backgroundColor = "green";
      else btn.style.backgroundColor = "red";
      btn.addEventListener("click", ()=>showQuestionWithResults(idx));
    } else {
      btn.addEventListener("click", ()=>{currentIndex=idx; renderQuestion();});
    }
    questionNav.appendChild(btn);
  });
}

function finishTest() {
  score = selectedAnswers.reduce((acc, sel, idx) => sel === currentTest[idx].answer ? acc+1 : acc,0);
  scoreDiv.textContent = `Tu puntuación: ${score} / ${currentTest.length}`;
  scoreDiv.classList.remove("hidden");
  clearInterval(timerInterval);
  renderQuestionNav();
}

function showQuestionWithResults(idx){
  currentIndex = idx;
  const q = currentTest[idx];
  questionText.textContent = q.q;
  answersDiv.innerHTML = "";
  q.options.forEach((opt, oidx)=>{
    const btn = document.createElement("button");
    btn.textContent = opt;
    if(selectedAnswers[idx]===oidx && selectedAnswers[idx]===q.answer) btn.classList.add("correct");
    else if(selectedAnswers[idx]===oidx && selectedAnswers[idx]!==q.answer) btn.classList.add("incorrect");
    else if(oidx===q.answer) btn.classList.add("correct");
    answersDiv.appendChild(btn);
  });
}

function restartTest(){
  stopTimer();
  startTest(currentCategory);
}

function goHome(){
  stopTimer();
  testContainer.classList.add("hidden");
  homeSection.classList.remove("hidden");
}

function startTimer(){
  let seconds = 0;
  clearInterval(timerInterval);
  timerInterval = setInterval(()=>{
    seconds++;
    const m = String(Math.floor(seconds/60)).padStart(2,'0');
    const s = String(seconds%60).padStart(2,'0');
    timerSpan.textContent = `${m}:${s}`;
  },1000);
}

function stopTimer(){
  clearInterval(timerInterval);
}

finishBtn.addEventListener("click", finishTest);
restartBtn.addEventListener("click", restartTest);






