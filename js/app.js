let questions = [];
let current = 0;
let answersUser = [];
let timerInterval;
let seconds = 0;

const demoQuestions = [
  {
    q: "¿Cuál es el órgano encargado de la hematopoyesis?",
    options: ["Hígado", "Riñón", "Médula ósea", "Bazo"],
    correct: 2
  },
  {
    q: "¿Qué es la asepsia?",
    options: ["Eliminar virus", "Evitar contaminación", "Desinfectar", "Esterilizar"],
    correct: 1
  }
];

function startTest(category) {
  document.querySelector(".categories").classList.add("hidden");
  document.getElementById("test-container").classList.remove("hidden");

  questions = shuffle([...demoQuestions]);
  answersUser = new Array(questions.length).fill(null);
  current = 0;

  buildNav();
  showQuestion();
  startTimer();
}

function buildNav() {
  const nav = document.getElementById("question-nav");
  nav.innerHTML = "";
  questions.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.textContent = i + 1;
    btn.onclick = () => {
      current = i;
      showQuestion();
    };
    nav.appendChild(btn);
  });
}

function showQuestion() {
  const q = questions[current];
  document.getElementById("question-text").textContent = q.q;

  const answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.onclick = () => {
      answersUser[current] = i;
      if (current < questions.length - 1) {
        current++;
        showQuestion();
      } else {
        document.getElementById("finish-btn").classList.remove("hidden");
      }
    };
    answersDiv.appendChild(btn);
  });
}

function finishTest() {
  clearInterval(timerInterval);
  const navButtons = document.querySelectorAll("#question-nav button");

  questions.forEach((q, i) => {
    if (answersUser[i] === q.correct) {
      navButtons[i].classList.add("correct");
    } else {
      navButtons[i].classList.add("wrong");
    }
  });
}

document.getElementById("finish-btn").onclick = finishTest;

function startTimer() {
  seconds = 0;
  timerInterval = setInterval(() => {
    seconds++;
    const min = String(Math.floor(seconds / 60)).padStart(2, "0");
    const sec = String(seconds % 60).padStart(2, "0");
    document.getElementById("timer").textContent = `${min}:${sec}`;
  }, 1000);
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function goHome() {
  document.getElementById("test-container").classList.add("hidden");
  document.querySelector(".categories").classList.remove("hidden");
  clearInterval(timerInterval);
}
