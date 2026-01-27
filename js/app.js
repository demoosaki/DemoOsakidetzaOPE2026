let questions = [
  {q:"Pregunta 1", options:["A","B","C","D"], answer:0},
  {q:"Pregunta 2", options:["A","B","C","D"], answer:1},
  {q:"Pregunta 3", options:["A","B","C","D"], answer:2},
  {q:"Pregunta 4", options:["A","B","C","D"], answer:3},
  {q:"Pregunta 5", options:["A","B","C","D"], answer:0},
  {q:"Pregunta 6", options:["A","B","C","D"], answer:1},
  {q:"Pregunta 7", options:["A","B","C","D"], answer:2},
  {q:"Pregunta 8", options:["A","B","C","D"], answer:3},
  {q:"Pregunta 9", options:["A","B","C","D"], answer:0},
  {q:"Pregunta 10", options:["A","B","C","D"], answer:1}
];

let currentIndex = 0;
let userAnswers = [];
let timerInterval;
let seconds = 0;

function shuffle(array) { return array.sort(() => Math.random() - 0.5); }

function startTimer() {
  clearInterval(timerInterval);
  seconds = 0;
  document.getElementById("timer").innerText = "00:00";
  timerInterval = setInterval(()=>{
    seconds++;
    let min = Math.floor(seconds/60).toString().padStart(2,"0");
    let sec = (seconds%60).toString().padStart(2,"0");
    document.getElementById("timer").innerText = `${min}:${sec}`;
  },1000);
}

function goHome() {
  document.body.className = "theme-default";
  document.getElementById("test-container").classList.add("hidden");
  document.getElementById("categories-container").classList.remove("hidden");
  document.getElementById("score").classList.add("hidden");
}

function startTest(categoryName) {
  document.body.className = "";
  switch(categoryName) {
    case "Medicina": document.body.classList.add("theme-medicina"); break;
    case "Enfermería": document.body.classList.add("theme-enfermeria"); break;
    case "Auxiliar de Enfermería": document.body.classList.add("theme-auxiliar"); break;
    case "Celador": document.body.classList.add("theme-celador"); break;
    default: document.body.classList.add("theme-default");
  }

  document.getElementById("current-category").innerText = categoryName;

  document.getElementById("categories-container").classList.add("hidden");
  document.getElementById("test-container").classList.remove("hidden");

  currentIndex = 0;
  userAnswers = [];
  questions = shuffle([...questions]);
  startTimer();
  showQuestion();
  generateNav();
  document.getElementById("score").classList.add("hidden");
}

function showQuestion() {
  let q = questions[currentIndex];
  document.getElementById("question-text").innerText = q.q;
  let answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";

  q.options.forEach((opt,i)=>{
    let btn = document.createElement("button");
    btn.innerText = opt;

    if(userAnswers[currentIndex] === i) btn.classList.add("selected");

    btn.onclick = ()=>{
      userAnswers[currentIndex] = i;
      showQuestion();

      // Pasa automáticamente a la siguiente pregunta
      if(currentIndex < questions.length-1){
        currentIndex++;
        showQuestion();
      }
    };

    // Mostrar resultados después de finalizar
    if(userAnswers[currentIndex] !== undefined && document.getElementById("score").classList.contains("hidden")===false){
      if(i === q.answer) btn.classList.add("correct");
      if(i === userAnswers[currentIndex] && i !== q.answer) btn.classList.add("wrong");
    }

    answersDiv.appendChild(btn);
  });
}

function generateNav() {
  let nav = document.getElementById("question-nav");
  nav.innerHTML = "";
  questions.forEach((_,i)=>{
    let btn = document.createElement("button");
    btn.innerText = i+1;
    btn.onclick = ()=>{
      currentIndex = i;
      showQuestion();
    };
    nav.appendChild(btn);
  });
}

function finishTest() {
  clearInterval(timerInterval);
  let score = 0;
  questions.forEach((q,i)=>{
    let navBtn = document.getElementById("question-nav").children[i];
    if(userAnswers[i] === q.answer){
      score++;
      navBtn.classList.add("correct");
    } else {
      navBtn.classList.add("wrong");
    }
  });
  document.getElementById("score").innerText = `Tu score: ${score} / ${questions.length}`;
  document.getElementById("score").classList.remove("hidden");
  showQuestion();
}

function restartTest() {
  currentIndex = 0;
  userAnswers = [];
  questions = shuffle([...questions]);
  startTimer();
  showQuestion();
  generateNav();
  document.getElementById("score").classList.add("hidden");
}





