/* fisica.js — Cálculos físicos del movimiento parabólico (no toca la interfaz).
   Unidades: metros (m), segundos (s), m/s, grados (°), m/s². */

function gradosARadianes(anguloGrados) {
  return anguloGrados * Math.PI / 180;
}

// Los errores de redondeo del computador (por ejemplo cos 90° = 6e-17) se tratan como cero
function limpiarRuido(numero) {
  return Math.abs(numero) < 1e-12 ? 0 : numero;
}

// v0x = v0·cos(θ)   y   v0y = v0·sen(θ)   (θ se convierte a radianes antes de usar cos y sen)
function calcularComponentesVelocidad(velocidadInicial, anguloGrados) {
  const anguloRadianes = gradosARadianes(anguloGrados);
  return {
    v0x: limpiarRuido(velocidadInicial * Math.cos(anguloRadianes)),
    v0y: limpiarRuido(velocidadInicial * Math.sin(anguloRadianes))
  };
}

// x(t) = v0x·t
function calcularPosicionX(v0x, tiempo) {
  return v0x * tiempo;
}

// y(t) = y0 + v0y·t − ½·g·t²
function calcularPosicionY(alturaInicial, v0y, gravedad, tiempo) {
  return alturaInicial + v0y * tiempo - 0.5 * gravedad * tiempo * tiempo;
}

// vx = v0x (no hay fuerza horizontal, así que no cambia)
function calcularVelocidadX(v0x) {
  return v0x;
}

// vy(t) = v0y − g·t
function calcularVelocidadY(v0y, gravedad, tiempo) {
  return v0y - gravedad * tiempo;
}

// Tiempo de vuelo: se resuelve y(t) = 0  →  ½·g·t² − v0y·t − y0 = 0
// t = (v0y + √(v0y² + 2·g·y0)) / g   (raíz positiva)
function calcularTiempoVuelo(alturaInicial, v0y, gravedad) {
  return (v0y + Math.sqrt(v0y * v0y + 2 * gravedad * alturaInicial)) / gravedad;
}

// Altura máxima: en el punto más alto vy = 0, es decir t = v0y/g
// y_max = y0 + v0y² / (2·g)   (si el objeto no sube, la máxima es y0)
function calcularAlturaMaxima(alturaInicial, v0y, gravedad) {
  return v0y > 0 ? alturaInicial + (v0y * v0y) / (2 * gravedad) : alturaInicial;
}

// Alcance horizontal: x evaluada en el tiempo de vuelo → R = v0x·t_vuelo
function calcularAlcance(v0x, tiempoVuelo) {
  return v0x * tiempoVuelo;
}

// Rapidez (módulo de la velocidad): |v| = √(vx² + vy²)
function calcularRapidez(vx, vy) {
  return Math.hypot(vx, vy);
}

// Reúne todos los resultados de un lanzamiento en un solo objeto
function calcularTodo(velocidadInicial, anguloGrados, alturaInicial, gravedad) {
  const { v0x, v0y } = calcularComponentesVelocidad(velocidadInicial, anguloGrados);
  const tiempoVuelo = calcularTiempoVuelo(alturaInicial, v0y, gravedad);
  const vxFinal = calcularVelocidadX(v0x);
  const vyFinal = calcularVelocidadY(v0y, gravedad, tiempoVuelo);
  return {
    velocidadInicial, anguloGrados, alturaInicial, gravedad,
    v0x, v0y, tiempoVuelo,
    tiempoAltura: v0y > 0 ? v0y / gravedad : 0, // instante en que vy = 0
    alturaMaxima: calcularAlturaMaxima(alturaInicial, v0y, gravedad),
    alcance: calcularAlcance(v0x, tiempoVuelo),
    vxFinal, vyFinal,
    velocidadFinal: calcularRapidez(vxFinal, vyFinal)
  };
}

// Divide el vuelo en "intervalos" partes iguales y calcula t, x, y, vx, vy en cada una
function generarMuestras(resultados, intervalos) {
  const muestras = [];
  for (let i = 0; i <= intervalos; i++) {
    const t = resultados.tiempoVuelo * i / intervalos;
    const y = calcularPosicionY(resultados.alturaInicial, resultados.v0y, resultados.gravedad, t);
    muestras.push({
      t,
      x: calcularPosicionX(resultados.v0x, t),
      y: Math.max(0, y), // evita -0.00 por redondeo al llegar al suelo
      vx: calcularVelocidadX(resultados.v0x),
      vy: calcularVelocidadY(resultados.v0y, resultados.gravedad, t)
    });
  }
  return muestras;
}
