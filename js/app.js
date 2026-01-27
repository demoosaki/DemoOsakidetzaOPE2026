function startTest(categoryName) {
  // Cambiar tema de la web según categoría
  document.body.className = ""; // Reset
  switch(categoryName) {
    case "Medicina": document.body.classList.add("theme-medicina"); break;
    case "Enfermería": document.body.classList.add("theme-enfermeria"); break;
    case "Auxiliar de Enfermería": document.body.classList.add("theme-auxiliar"); break;
    case "Celador": document.body.classList.add("theme-celador"); break;
    default: document.body.classList.add("theme-default");
  }

  // Mostrar nombre de categoría encima de pregunta
  document.getElementById("current-category").innerText = categoryName;

  // Mostrar test y ocultar portada
  document.getElementById("categories-container").classList.add("hidden");
  document.getElementById("test-container").classList.remove("hidden");

  // Aquí continua el resto de la inicialización del test...
}



