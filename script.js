/* ============================================================
   APP DE AHORRO – SCRIPT.JS
   ============================================================ */

// ================== VARIABLES ==================

// Array para guardar todos los gastos con fecha
let gastos = [];    

// Variable de ingresos totales
let ingresos = 0;   

// Periodo activo (semana, mes, año)
let periodoActivo = "mes"; 

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

// Resultados resumen
const resIngresos = document.getElementById("resIngresos");
const resGastos = document.getElementById("resGastos");
const resResultado = document.getElementById("resResultado");
const resEtiqueta = document.getElementById("resEtiqueta");

// Botones periodo
const btnSemana = document.getElementById("btn-semana");
const btnMes = document.getElementById("btn-mes");
const btnAno = document.getElementById("btn-ano");

// Gráfico Chart.js
const ctx = document.getElementById("graficoGastos").getContext("2d");
const baseColors = ["#ff6384","#36a2eb","#ffce56","#4bc0c0","#9966ff","#ff9f40","#8bc34a","#e91e63"];
let grafico = new Chart(ctx, {
  type: "pie",
  data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
  options: { responsive: true, plugins: { legend: { position: "bottom" } } }
});

// ================== FUNCIONES ==================

// Normaliza categoría (Primera letra mayúscula)
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

// ================== FILTRADO POR PERIODO ==================

// Devuelve gastos filtrados según periodoActivo
function filtrarGastos() {
  const ahora = new Date();
  return gastos.filter(g => {
    const gastoFecha = new Date(g.fecha);
    if (periodoActivo === "semana") {
      // Gastos últimos 7 días
      const difDias = (ahora - gastoFecha)/(1000*60*60*24);
      return difDias <= 7;
    } else if (periodoActivo === "mes") {
      // Mismo mes y año
      return gastoFecha.getMonth() === ahora.getMonth() &&
             gastoFecha.getFullYear() === ahora.getFullYear();
    } else if (periodoActivo === "ano") {
      // Mismo año
      return gastoFecha.getFullYear() === ahora.getFullYear();
    }
    return true; // fallback
  });
}

// ================== GESTIÓN DE GASTOS ==================

// Agregar gasto
function agregarGasto(e) {
  if (e) e.preventDefault(); // Prevenir submit del formulario
  const categoria = normalizarCategoria(categoriaInput.value);
  const cantidad = parseFloat(cantidadInput.value);

  if (!categoria || isNaN(cantidad) || cantidad <=0){
    alert("Introduce una categoría y cantidad válida (>0)");
    return;
  }

  // Guardar gasto con fecha actual
  gastos.push({categoria, cantidad, fecha: new Date().toISOString()});

  // Limpiar inputs
  categoriaInput.value = "";
  cantidadInput.value = "";

  // Actualizar interfaz
  actualizarUICompleta();
}

// Eliminar gasto por índice
function eliminarGasto(index){
  gastos.splice(index,1);
  actualizarUICompleta();
}

// ================== ACTUALIZACIÓN DE UI ==================

// Mostrar lista de gastos filtrada
function mostrarGastos(){
  if (!listaGastos) return;
  listaGastos.innerHTML = "";

  const filtrados = filtrarGastos();

  filtrados.forEach((gasto,index)=>{
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
  const filtrados = filtrarGastos();
  const agregados = {};
  filtrados.forEach(g => agregados[g.categoria] = (agregados[g.categoria]||0)+g.cantidad);

  const labels = Object.keys(agregados);
  const data = Object.values(agregados);

  grafico.data.labels = labels;
  grafico.data.datasets[0].data = data;
  grafico.data.datasets[0].backgroundColor = getColors(labels.length);
  grafico.update();
}

// Actualizar resumen
function actualizarResumen(){
  const filtrados = filtrarGastos();
  const totalGastos = filtrados.reduce((sum,g)=> sum+g.cantidad,0);
  const ahorro = ingresos - totalGastos;

  // Mostrar resultados
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

// Actualiza toda la UI (lista, resumen y gráfico)
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

// Cambiar periodo
btnSemana.addEventListener("click", ()=> cambiarPeriodo("semana"));
btnMes.addEventListener("click", ()=> cambiarPeriodo("mes"));
btnAno.addEventListener("click", ()=> cambiarPeriodo("ano"));

// Función para cambiar periodo y actualizar UI
function cambiarPeriodo(periodo){
  periodoActivo = periodo;
  // Actualizar botón activo visualmente
  [btnSemana,btnMes,btnAno].forEach(b => b.classList.remove("active"));
  if(periodo==="semana") btnSemana.classList.add("active");
  else if(periodo==="mes") btnMes.classList.add("active");
  else if(periodo==="ano") btnAno.classList.add("active");

  actualizarUICompleta();
}

// ================== INICIALIZACIÓN ==================
cambiarPeriodo("mes"); // Por defecto muestra el mes actual

