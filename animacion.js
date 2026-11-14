/* animacion.js — Dibuja la simulación en un <canvas> y controla iniciar, pausar, continuar, reiniciar y velocidad.
   El proyectil usa las mismas funciones de fisica.js que los resultados, así sigue exactamente la trayectoria calculada. */

const lienzo = document.getElementById('lienzo');
const ctx = lienzo.getContext('2d');
const COLOR = { azul: '#2f6bff', azulClaro: '#5aa9ff', azulSuave: '#c9dcf7', rejilla: '#e6ebf3', eje: '#9aa7ba', texto: '#4a5568' };

// Estado compartido con interfaz.js (que lo lee para activar o desactivar botones)
const estadoAnimacion = { resultados: null, t: 0, reproduciendo: false, terminada: false, velocidad: 1, factor: 1, ultimo: 0, idFrame: 0 };
let dimensiones = { ancho: 0, alto: 0 };

// Ajusta el tamaño del canvas al ancho disponible y a la densidad de píxeles (pantallas nítidas en celular)
function ajustarLienzo() {
  const ancho = lienzo.parentElement.clientWidth;
  const alto = Math.round(ancho * (ancho < 520 ? 0.8 : 0.5));
  const densidad = window.devicePixelRatio || 1;
  lienzo.width = ancho * densidad;
  lienzo.height = alto * densidad;
  lienzo.style.height = alto + 'px';
  ctx.setTransform(densidad, 0, 0, densidad, 0, 0);
  dimensiones = { ancho, alto };
}

const calcularMargen = () => dimensiones.ancho < 520
  ? { izq: 44, der: 14, sup: 18, inf: 36 } : { izq: 58, der: 24, sup: 22, inf: 44 };

// Escala única (px por metro) en ambos ejes: la parábola conserva su forma real y todo cabe en pantalla
function calcularEscala(r, m) {
  const anchoUtil = dimensiones.ancho - m.izq - m.der;
  const altoUtil = dimensiones.alto - m.sup - m.inf;
  return Math.min(anchoUtil / (Math.max(r.alcance, 1) * 1.08), altoUtil / (Math.max(r.alturaMaxima, 1) * 1.25));
}

// Separación "redonda" (1, 2, 5, 10...) entre marcas de la cuadrícula
function calcularPasoEje(rango, marcasDeseadas) {
  const bruto = rango / marcasDeseadas;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const f = bruto / potencia;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * potencia;
}

function dibujarCuadricula(m, escala) {
  const anchoU = dimensiones.ancho - m.izq - m.der, altoU = dimensiones.alto - m.sup - m.inf;
  const paso = calcularPasoEje(Math.max(anchoU, altoU) / escala, dimensiones.ancho < 520 ? 4 : 7);
  const base = dimensiones.alto - m.inf;
  ctx.font = '11px system-ui, sans-serif'; ctx.fillStyle = COLOR.texto; ctx.strokeStyle = COLOR.rejilla; ctx.lineWidth = 1;
  for (let i = 0; i * paso * escala <= anchoU; i++) {
    const px = m.izq + i * paso * escala;
    ctx.beginPath(); ctx.moveTo(px, m.sup); ctx.lineTo(px, base); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillText(String(Number((i * paso).toFixed(2))), px, base + 15);
  }
  for (let i = 0; i * paso * escala <= altoU; i++) {
    const py = base - i * paso * escala;
    ctx.beginPath(); ctx.moveTo(m.izq, py); ctx.lineTo(dimensiones.ancho - m.der, py); ctx.stroke();
    ctx.textAlign = 'right'; ctx.fillText(String(Number((i * paso).toFixed(2))), m.izq - 6, py + 4);
  }
  ctx.strokeStyle = COLOR.eje; ctx.lineWidth = 2; // ejes X (suelo) e Y
  ctx.beginPath(); ctx.moveTo(m.izq, m.sup); ctx.lineTo(m.izq, base); ctx.lineTo(dimensiones.ancho - m.der, base); ctx.stroke();
  ctx.fillStyle = COLOR.texto; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Distancia horizontal x (m)', m.izq + anchoU / 2, dimensiones.alto - 8);
  ctx.save(); ctx.translate(13, m.sup + altoU / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('Altura y (m)', 0, 0); ctx.restore();
}

// Recorre la trayectoria entre t = 0 y tFinal usando x(t) = V₀x·t  y  y(t) = h₀ + V₀y·t − ½·g·t²
function trazarCamino(r, aPixeles, tFinal) {
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const t = tFinal * i / 120;
    const { px, py } = aPixeles(calcularPosicionX(r.v0x, t), Math.max(0, calcularPosicionY(r.alturaInicial, r.v0y, r.gravedad, t)));
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function dibujarMarca(px, py, etiqueta, alineacion, desplazamientoY) {
  ctx.fillStyle = '#fff'; ctx.strokeStyle = COLOR.azul; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(px, py, 6, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
  ctx.fillStyle = COLOR.texto; ctx.font = '600 12px system-ui, sans-serif'; ctx.textAlign = alineacion;
  ctx.fillText(etiqueta, px + (alineacion === 'left' ? 12 : 0), py + desplazamientoY);
}

function redibujar() {
  const { resultados: r, t } = estadoAnimacion;
  ctx.clearRect(0, 0, dimensiones.ancho, dimensiones.alto);
  if (!r) return;
  const m = calcularMargen(), escala = calcularEscala(r, m);
  const aPixeles = (x, y) => ({ px: m.izq + x * escala, py: dimensiones.alto - m.inf - y * escala });
  dibujarCuadricula(m, escala);

  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = COLOR.azulSuave; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); // trayectoria prevista
  trazarCamino(r, aPixeles, r.tiempoVuelo); ctx.setLineDash([]);
  ctx.strokeStyle = COLOR.azulClaro; ctx.lineWidth = 3.5; // tramo ya recorrido
  if (t > 0) trazarCamino(r, aPixeles, t);

  const salida = aPixeles(0, r.alturaInicial), llegada = aPixeles(r.alcance, 0);
  if (r.alturaInicial > 0) { // soporte del lanzador
    ctx.strokeStyle = COLOR.azulSuave; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(salida.px, aPixeles(0, 0).py); ctx.lineTo(salida.px, salida.py); ctx.stroke();
  }
  dibujarMarca(salida.px, salida.py, 'Lanzamiento', 'left', -12);
  dibujarMarca(llegada.px, llegada.py, 'Aterrizaje', llegada.px > dimensiones.ancho - 90 ? 'right' : 'center', -14);

  const x = calcularPosicionX(r.v0x, t);
  const y = Math.max(0, calcularPosicionY(r.alturaInicial, r.v0y, r.gravedad, t));
  const { px, py } = aPixeles(x, y); // proyectil
  ctx.save(); ctx.shadowColor = 'rgba(47,107,255,.45)'; ctx.shadowBlur = 10;
  ctx.fillStyle = COLOR.azul; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(px, py, 8, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
  actualizarLecturas(r, t, x, y);
}

// Datos en vivo: tiempo, x, y, Vx = V₀x y Vy = V₀y − g·t
function actualizarLecturas(r, t, x, y) {
  const valores = { lecT: [t, 's'], lecX: [x, 'm'], lecY: [y, 'm'], lecVx: [calcularVelocidadX(r.v0x), 'm/s'], lecVy: [calcularVelocidadY(r.v0y, r.gravedad, t), 'm/s'] };
  Object.entries(valores).forEach(([id, [valor, unidad]]) => { document.getElementById(id).textContent = `${formatear(valor)} ${unidad}`; });
}

function cuadro(ahora) {
  const e = estadoAnimacion;
  if (!e.reproduciendo) return;
  const segundosReales = Math.min((ahora - e.ultimo) / 1000, 0.1); // evita saltos si la pestaña estuvo oculta
  e.ultimo = ahora;
  e.t = Math.min(e.t + segundosReales * e.factor * e.velocidad, e.resultados.tiempoVuelo);
  if (e.t >= e.resultados.tiempoVuelo) { e.reproduciendo = false; e.terminada = true; } // se detiene al tocar el suelo
  redibujar(); actualizarControles();
  if (e.reproduciendo) e.idFrame = requestAnimationFrame(cuadro);
}

function comenzarBucle() {
  cancelAnimationFrame(estadoAnimacion.idFrame);
  estadoAnimacion.ultimo = performance.now();
  estadoAnimacion.idFrame = requestAnimationFrame(cuadro);
}

// A velocidad 1× el vuelo dura entre 3 y 10 s reales, sin importar cuánto dure en la física
function prepararAnimacion(r) {
  const e = estadoAnimacion;
  cancelAnimationFrame(e.idFrame);
  Object.assign(e, { resultados: r, t: 0, reproduciendo: false, terminada: false, factor: r.tiempoVuelo / Math.min(Math.max(r.tiempoVuelo, 3), 10) });
  redibujar(); actualizarControles();
}
function iniciarAnimacion() {
  const e = estadoAnimacion;
  if (!e.resultados) return;
  Object.assign(e, { t: 0, terminada: false, reproduciendo: true });
  comenzarBucle(); actualizarControles();
}
function alternarPausa() {
  const e = estadoAnimacion;
  if (!e.resultados || e.terminada) return;
  e.reproduciendo = !e.reproduciendo;
  if (e.reproduciendo) comenzarBucle();
  actualizarControles();
}
function reiniciarAnimacion() {
  if (estadoAnimacion.resultados) prepararAnimacion(estadoAnimacion.resultados);
}
function fijarVelocidadReproduccion(multiplicador) {
  estadoAnimacion.velocidad = multiplicador;
}

// Reajusta el dibujo cuando cambia el ancho de la pantalla (girar el celular, cambiar el tamaño de la ventana)
let anchoPrevio = 0;
new ResizeObserver(() => {
  if (lienzo.parentElement.clientWidth === anchoPrevio) return;
  anchoPrevio = lienzo.parentElement.clientWidth;
  ajustarLienzo(); redibujar();
}).observe(lienzo.parentElement);
