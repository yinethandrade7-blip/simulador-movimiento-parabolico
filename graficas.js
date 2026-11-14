/* graficas.js — Tres gráficas con Chart.js. Los datos salen de generarMuestras() y las escalas se calculan con los resultados reales. */

const graficasActivas = {};
const COLORES_GRAFICA = { azul: '#2f6bff', azulClaro: '#5aa9ff', rejilla: '#e6ebf3', texto: '#4a5568' };

function crearGrafica(idCanvas, titulo, etiquetaX, etiquetaY, conjuntos, escalaX, escalaY) {
  if (graficasActivas[idCanvas]) graficasActivas[idCanvas].destroy();
  graficasActivas[idCanvas] = new Chart(document.getElementById(idCanvas), {
    type: 'scatter',
    data: { datasets: conjuntos },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 400 },
      plugins: {
        title: { display: true, text: titulo, color: '#2b3442', font: { size: 14, weight: '600' } },
        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, color: COLORES_GRAFICA.texto } }
      },
      scales: {
        x: { type: 'linear', min: 0, title: { display: true, text: etiquetaX }, grid: { color: COLORES_GRAFICA.rejilla }, ...escalaX },
        y: { title: { display: true, text: etiquetaY }, grid: { color: COLORES_GRAFICA.rejilla }, ...escalaY }
      }
    }
  });
}

const linea = (etiqueta, muestras, campoX, campoY, color) => ({
  label: etiqueta, data: muestras.map(m => ({ x: m[campoX], y: m[campoY] })),
  showLine: true, borderColor: color, borderWidth: 3, pointRadius: 0, pointHoverRadius: 4
});
const punto = (etiqueta, x, y, color) => ({
  label: etiqueta, data: [{ x, y }], showLine: false, pointRadius: 7, pointStyle: 'circle',
  backgroundColor: color, borderColor: '#fff', borderWidth: 2
});

function dibujarTodasLasGraficas(r) {
  const aviso = document.getElementById('avisoGraficas');
  if (typeof Chart === 'undefined') { aviso.hidden = false; return; } // sin internet no carga Chart.js
  aviso.hidden = true;
  const muestras = generarMuestras(r, 80);
  const xAltura = calcularPosicionX(r.v0x, r.tiempoAltura);

  // 1) Trayectoria y vs x, con el punto más alto y el de aterrizaje
  crearGrafica('graficaTrayectoria', 'Trayectoria', 'Distancia horizontal x (m)', 'Altura y (m)', [
    linea('Trayectoria', muestras, 'x', 'y', COLORES_GRAFICA.azul),
    punto('Punto más alto', xAltura, r.alturaMaxima, COLORES_GRAFICA.azulClaro),
    punto('Aterrizaje', r.alcance, 0, '#1f3fa8')
  ], { suggestedMax: Math.max(r.alcance * 1.05, 1) }, { min: 0, suggestedMax: Math.max(r.alturaMaxima * 1.1, 1) });

  // 2) Velocidades en función del tiempo: Vx constante, Vy = V₀y − g·t
  crearGrafica('graficaVelocidad', 'Velocidad frente al tiempo', 'Tiempo t (s)', 'Velocidad (m/s)', [
    linea('Vx (horizontal)', muestras, 't', 'vx', COLORES_GRAFICA.azul),
    linea('Vy (vertical)', muestras, 't', 'vy', COLORES_GRAFICA.azulClaro)
  ], { max: r.tiempoVuelo }, { beginAtZero: true });

  // 3) Posiciones en función del tiempo: x(t) e y(t)
  crearGrafica('graficaPosicion', 'Posición frente al tiempo', 'Tiempo t (s)', 'Posición (m)', [
    linea('X(t)', muestras, 't', 'x', COLORES_GRAFICA.azul),
    linea('Y(t)', muestras, 't', 'y', COLORES_GRAFICA.azulClaro)
  ], { max: r.tiempoVuelo }, { beginAtZero: true });
}
