// ============================================================
// APP DE AHORRO – LÓGICA PRINCIPAL (script.js)
// Versión mejorada y comentada
// - Calcula ingresos, total de gastos y ahorro
// - Lista de gastos con botón para borrar
// - Gráfico por categorías (pie) con agregación automática
// - Validaciones y formato de moneda en EUR
// - Atajo: Enter en el campo "cantidad" añade el gasto
// Requisitos en el HTML (ids): ingresos, categoria, cantidad,
// listaGastos, totalGastos, ahorro, graficoGastos
// Requisito: incluir Chart.js en <head>
// <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
// ============================================================

// ================== VARIABLES ==================

// Array donde guardamos todos los gastos como objetos { categoria, cantidad }
let gastos = [];
// Ingresos mensuales (número)
let ingresos = 0;

// Formato de moneda en euros (ej: 1.234,56 €)
const fmtEUR = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

// ================== REFERENCIAS DOM ==================

// Elementos que deben existir en el HTML (mismo id)
const listaGastos = document.getElementById("listaGastos");
const totalGastosEl = document.getElementById("totalGastos");
const ahorroEl = document.getElementById("ahorro");
const ingresosInput = document.getElementById("ingresos");
const categoriaInput = document.getElementById("categoria");
const cantidadInput = document.getElementById("cantidad");

// ================== GRÁFICO (Chart.js) ==================

// Contexto del lienzo para el gráfico circular
const ctx = document.getElementById("graficoGastos").getContext("2d");

// Paleta base (si hay más categorías, se generarán colores extra)
const baseColors = [
  "#ff6384", "#36a2eb", "#ffce56", "#4bc0c0",
  "#9966ff", "#ff9f40", "#8bc34a", "#e91e63"
];

// Instancia inicial del gráfico vacía
let grafico = new Chart(ctx, {
  type: "pie",
  data: {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { position: "bottom" } }
  }
});

// ================== EVENTOS ==================

// Cuando cambia el input de ingresos, guardamos y recalculamos
if (ingresosInput) {
  ingresosInput.addEventListener("input", () => {
    // Convertimos a número; si está vacío o mal, queda en 0
    ingresos = parseFloat(ingresosInput.value) || 0;
    actualizarResumen();
  });
}

// Atajo de teclado: pulsar Enter en "cantidad" añade el gasto
if (cantidadInput) {
  cantidadInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      agregarGasto();
    }
  });
}

// Si tienes un botón con id="btnVaciar" en tu HTML, esto lo conectará
const btnVaciar = document.getElementById("btnVaciar");
if (btnVaciar) {
  btnVaciar.addEventListener("click", () => {
    if (confirm("¿Seguro que quieres borrar todos los gastos?")) {
      gastos = [];
      actualizarUICompleta();
    }
  });
}

// ================== UTILIDADES ==================

// Normaliza el nombre de categoría (trim y primera letra mayúscula)
function normalizarCategoria(texto) {
  const t = (texto || "").toString().trim();
  if (!t) return "Sin categoría";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// Genera una lista de colores si hay más categorías que colores base
function getColors(n) {
  if (n <= baseColors.length) return baseColors.slice(0, n);
  // Generar colores adicionales con HSL repartidos
  const extra = [];
  for (let i = 0; i < n - baseColors.length; i++) {
    const hue = Math.floor((360 / (n - baseColors.length)) * i);
    extra.push(`hsl(${hue} 70% 55%)`);
  }
  return baseColors.concat(extra);
}

// ================== ACCIONES PRINCIPALES ==================

// Añadir un gasto desde los inputs actuales
function agregarGasto() {
  // Leemos y validamos inputs
  const categoriaRaw = categoriaInput ? categoriaInput.value : "";
  const cantidadRaw = cantidadInput ? cantidadInput.value : "";

  const categoria = normalizarCategoria(categoriaRaw);
  const cantidad = parseFloat(cantidadRaw);

  // Validaciones básicas
  if (!categoria || isNaN(cantidad) || cantidad <= 0) {
    alert("Introduce una categoría y una cantidad válida (> 0)");
    return;
  }

  // Añadimos al array
  gastos.push({ categoria, cantidad });

  // Limpiamos campos para rapidez de uso
  if (categoriaInput) categoriaInput.value = "";
  if (cantidadInput) cantidadInput.value = "";

  // Actualizamos todo
  actualizarUICompleta();
}

// Eliminar un gasto por índice
function eliminarGasto(index) {
  gastos.splice(index, 1);
  actualizarUICompleta();
}

// ================== RENDER / CÁLCULOS ==================

// Pinta la lista de gastos con botón de borrar
function mostrarGastos() {
  if (!listaGastos) return;
  listaGastos.innerHTML = "";

  gastos.forEach((gasto, index) => {
    const li = document.createElement("li");

    // Texto: "Categoría: 12,34 €"
    const texto = document.createElement("span");
    texto.textContent = `${gasto.categoria}: ${fmtEUR.format(gasto.cantidad)}`;

    // Botón borrar
    const btn = document.createElement("button");
    btn.textContent = "❌";
    btn.title = "Eliminar gasto";
    btn.style.marginLeft = "10px";
    btn.addEventListener("click", () => eliminarGasto(index));

    li.appendChild(texto);
    li.appendChild(btn);
    listaGastos.appendChild(li);
  });
}

// Calcula total de gastos y ahorro, y los escribe en pantalla
function actualizarResumen() {
  // Total de gastos
  const totalGastos = gastos.reduce((sum, g) => sum + g.cantidad, 0);
  if (totalGastosEl) totalGastosEl.textContent = totalGastos.toFixed(2);

  // Ahorro = ingresos - total gastos
  const ahorro = ingresos - totalGastos;
  if (ahorroEl) {
    // Si es negativo, mostramos aviso textual
    ahorroEl.textContent = ahorro >= 0
      ? ahorro.toFixed(2)
      : "⚠️ Gastas más de lo que ingresas";
  }
}

// Actualiza el gráfico agrupando por categoría
function actualizarGrafico() {
  // Agregamos por categoría
  const categorias = {};
  gastos.forEach(g => {
    categorias[g.categoria] = (categorias[g.categoria] || 0) + g.cantidad;
  });

  const labels = Object.keys(categorias);
  const data = Object.values(categorias);

  grafico.data.labels = labels;
  grafico.data.datasets[0].data = data;
  grafico.data.datasets[0].backgroundColor = getColors(labels.length);
  grafico.update();
}

// Refresca todo lo que se ve en la interfaz
function actualizarUICompleta() {
  mostrarGastos();
  actualizarResumen();
  actualizarGrafico();
}

function actualizarResumen() {
  // Total de gastos
  const totalGastos = gastos.reduce((sum, g) => sum + g.cantidad, 0);

  if (totalGastosEl) {
    totalGastosEl.textContent = totalGastos.toFixed(2);
    totalGastosEl.className = "gastos-total"; // aplicamos estilo rojo
  }

  // Ahorro
  const ahorro = ingresos - totalGastos;

  if (ahorroEl) {
    if (ahorro >= 0) {
      ahorroEl.textContent = ahorro.toFixed(2);   // mostramos el ahorro positivo
      ahorroEl.className = "positivo";           // verde
    } else {
      ahorroEl.textContent = "⚠️ Gastas más de lo que ingresas"; // aviso
      ahorroEl.className = "negativo";           // rojo
    }
  }
}


// ================== API PÚBLICA (opcional) ==================
// Si en tu HTML usas onclick="agregarGasto()" funcionará porque la función
// está en ámbito global. Si prefieres usar addEventListener en un botón,
// puedes añadir en tu HTML un botón con id="btnAgregar" y descomentar aquí:
// const btnAgregar = document.getElementById("btnAgregar");
// if (btnAgregar) btnAgregar.addEventListener("click", agregarGasto);

// Fin del script. A disfrutar 😊

