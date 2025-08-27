/* ============================================================
   APP DE AHORRO – SCRIPT.JS
   ============================================================ */

// ================== VARIABLES ==================
let gastos = [];    // Array para guardar gastos
let ingresos = 0;   // Variable de ingresos

// Formato de moneda en euros
const fmtEUR = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

// ================== REFERENCIAS DOM ==================
const listaGastos = document.getElementById("listaGastos");
const ingresosInput = document.getElementById("ingresos");
const categoriaInput = document.getElementById("categoria");
const cantidadInput = document.getElementById("cantidad");

const resIngresos = document.getElementById("resIngresos");
const resGastos = document.getElementById("resGastos");
const resResultado = document.getElementById("resResultado");
const resEtiqueta = document.getElementById("resEtiqueta");
const ahorroEl = document.getElementById("resResultado");

// Gráfico
const ctx = document.getElementById("graficoGastos").getContext("2d");
const baseColors = ["#ff6384","#36a2eb","#ffce56","#4bc0c0","#9966ff","#ff9f40","#8bc34a","#e91e63"];
let grafico = new Chart(ctx, {
  type: "pie",
  data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
  options: { responsive: true, plugins: { legend: { position: "bottom" } } }
});

// ================== FUNCIONES ==================

// Normaliza categoría (primera letra mayúscula)
function normalizarCategoria(texto) {
  const t = (texto || "").toString().trim();
  if (!t) return "Sin categoría";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// Genera colores para gráfico
function getColors(n) {
  if (n <= baseColors.length) return baseColors.slice(0, n);
  const extra = [];
  for (let i=0; i<n-baseColors.length; i++){
    const hue = Math.floor((360/(n-baseColors.length))*i);
    extra.push(`hsl(${hue} 70% 55%)`);
  }
  return baseColors.concat(extra);
}

// Agregar gasto
function agregarGasto(e) {
  if (e) e.preventDefault(); // Prevenir submit
  const categoria = normalizarCategoria(categoriaInput.value);
  const cantidad = parseFloat(cantidadInput.value);

  if (!categoria || isNaN(cantidad) || cantidad <=0){
    alert("Introduce una categoría y cantidad válida (>0)");
    return;
  }

  gastos.push({categoria, cantidad});

  categoriaInput.value = "";
  cantidadInput.value = "";

  actualizarUICompleta();
}

// Eliminar gasto
function eliminarGasto(index){
  gastos.splice(index,1);
  actualizarUICompleta();
}

// Mostrar lista de gastos
function mostrarGastos(){
  if (!listaGastos) return;
  listaGastos.innerHTML = "";

  gastos.forEach((gasto,index)=>{
    const li = document.createElement("li");
    const texto = document.createElement("span");
    texto.textContent = `${gasto.categoria}: ${fmtEUR.format(gasto.cantidad)}`;

    const btn = document.createElement("button");
    btn.textContent = "❌";
    btn.title = "Eliminar gasto";
    btn.addEventListener("click", ()=> eliminarGasto(index));

    li.appendChild(texto);
    li.appendChild(btn);
    listaGastos.appendChild(li);
  });
}

// Actualizar gráfico
function actualizarGrafico(){
  const agregados = {};
  gastos.forEach(g=> agregados[g.categoria]=(agregados[g.categoria]||0)+g.cantidad);

  const labels = Object.keys(agregados);
  const data = Object.values(agregados);

  grafico.data.labels = labels;
  grafico.data.datasets[0].data = data;
  grafico.data.datasets[0].backgroundColor = getColors(labels.length);
  grafico.update();
}

// Actualizar resumen
function actualizarResumen(){
  const totalGastos = gastos.reduce((sum,g)=> sum+g.cantidad,0);
  const ahorro = ingresos - totalGastos;

  resIngresos.textContent = ingresos.toFixed(2);
  resGastos.textContent = totalGastos.toFixed(2);
  resResultado.textContent = ahorro.toFixed(2);

  // Cambiar color según positivo/negativo
  if (ahorro > 0){
    resResultado.className = "positivo";
    resEtiqueta.textContent = "Ganancia";
    resEtiqueta.className = "badge positivo";
  } else if (ahorro < 0){
    resResultado.className = "negativo";
    resEtiqueta.textContent = "Pérdida";
    resEtiqueta.className = "badge negativo";
  } else {
    resResultado.className = "neutro";
    resEtiqueta.textContent = "Equilibrado";
    resEtiqueta.className = "badge neutro";
  }
}

// Actualiza toda la UI
function actualizarUICompleta(){
  mostrarGastos();
  actualizarResumen();
  actualizarGrafico();
}

// ================== EVENTOS ==================

// Actualizar ingresos
ingresosInput.addEventListener("input", ()=> {
  ingresos = parseFloat(ingresosInput.value)||0;
  actualizarUICompleta();
});

// Formulario añadir gasto
document.getElementById("form-gasto").addEventListener("submit", agregarGasto);

