/* procedimiento.js — Textos que dependen de los resultados: formato de números,
   procedimiento paso a paso (fórmula, sustitución, operación, resultado) y explicación en palabras. */

// Número con coma decimal. Evita mostrar "-0,00" para valores prácticamente cero.
function formatear(numero, decimales = 2) {
  if (Math.abs(numero) < 0.5 * 10 ** -decimales) numero = 0;
  return numero.toLocaleString('es-CO', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
}

// Devuelve una lista de pasos: { titulo, lineas: [{ rotulo, texto }] }
function generarProcedimiento(r) {
  const f = formatear;
  const g = r.gravedad, v0 = r.velocidadInicial, theta = r.anguloGrados, h0 = r.alturaInicial;
  const coseno = Math.cos(gradosARadianes(theta)), seno = Math.sin(gradosARadianes(theta));
  const radicando = r.v0y ** 2 + 2 * g * h0;

  const altura = r.v0y > 0
    ? [{ rotulo: 'Fórmula', texto: 'Hmáx = h₀ + V₀y² / (2·g)   (en el punto más alto Vy = 0)' },
       { rotulo: 'Sustitución', texto: `Hmáx = ${f(h0)} + ${f(r.v0y)}² / (2·${f(g)})` },
       { rotulo: 'Operación', texto: `Hmáx = ${f(h0)} + ${f(r.v0y ** 2)} / ${f(2 * g)}` }]
    : [{ rotulo: 'Fórmula', texto: 'Como V₀y = 0 el objeto no sube: Hmáx = h₀' },
       { rotulo: 'Sustitución', texto: `Hmáx = ${f(h0)}` }];

  return [
    { titulo: '1. Descomponer la velocidad inicial', lineas: [
      { rotulo: 'Fórmula', texto: 'V₀x = V₀·cos(θ)      V₀y = V₀·sen(θ)' },
      { rotulo: 'Sustitución', texto: `V₀x = ${f(v0)}·cos(${f(theta)}°)      V₀y = ${f(v0)}·sen(${f(theta)}°)` },
      { rotulo: 'Operación', texto: `V₀x = ${f(v0)}·${f(coseno, 4)}      V₀y = ${f(v0)}·${f(seno, 4)}` },
      { rotulo: 'Resultado', texto: `V₀x = ${f(r.v0x)} m/s      V₀y = ${f(r.v0y)} m/s` }] },
    { titulo: '2. Calcular el tiempo de vuelo', lineas: [
      { rotulo: 'Fórmula', texto: 'T = [V₀y + √(V₀y² + 2·g·h₀)] / g' },
      { rotulo: 'Sustitución', texto: `T = [${f(r.v0y)} + √(${f(r.v0y)}² + 2·${f(g)}·${f(h0)})] / ${f(g)}` },
      { rotulo: 'Operación', texto: `T = [${f(r.v0y)} + √${f(radicando)}] / ${f(g)} = [${f(r.v0y)} + ${f(Math.sqrt(radicando))}] / ${f(g)}` },
      { rotulo: 'Resultado', texto: `T = ${f(r.tiempoVuelo)} s` }] },
    { titulo: '3. Calcular la altura máxima', lineas: [
      ...altura,
      { rotulo: 'Resultado', texto: `Hmáx = ${f(r.alturaMaxima)} m` }] },
    { titulo: '4. Calcular el alcance horizontal', lineas: [
      { rotulo: 'Fórmula', texto: 'R = V₀x·T' },
      { rotulo: 'Sustitución', texto: `R = ${f(r.v0x)}·${f(r.tiempoVuelo)}` },
      { rotulo: 'Operación', texto: `R = ${f(r.v0x, 4)}·${f(r.tiempoVuelo, 4)}  (con más decimales)` },
      { rotulo: 'Resultado', texto: `R = ${f(r.alcance)} m` }] },
    { titulo: '5. Calcular la velocidad final', lineas: [
      { rotulo: 'Fórmula', texto: 'Vxf = V₀x      Vyf = V₀y − g·T      Vf = √(Vxf² + Vyf²)' },
      { rotulo: 'Sustitución', texto: `Vxf = ${f(r.v0x)}      Vyf = ${f(r.v0y)} − ${f(g)}·${f(r.tiempoVuelo)}      Vf = √(${f(r.vxFinal)}² + Vyf²)` },
      { rotulo: 'Operación', texto: `Vyf = ${f(r.v0y)} − ${f(g * r.tiempoVuelo)} = ${f(r.vyFinal)}      Vf = √(${f(r.vxFinal ** 2)} + ${f(r.vyFinal ** 2)}) = √${f(r.vxFinal ** 2 + r.vyFinal ** 2)}` },
      { rotulo: 'Resultado', texto: `Vxf = ${f(r.vxFinal)} m/s      Vyf = ${f(r.vyFinal)} m/s      Vf = ${f(r.velocidadFinal)} m/s` }] }
  ];
}

// Párrafos en lenguaje sencillo que interpretan los resultados del lanzamiento actual
function generarExplicacion(r) {
  const f = formatear;
  const p = [];
  p.push(`El objeto permanece **${f(r.tiempoVuelo)} s** en el aire y cae a **${f(r.alcance)} m** del punto de lanzamiento, medidos en horizontal.`);
  p.push(r.v0y > 0
    ? `Sube hasta **${f(r.alturaMaxima)} m** sobre el suelo${r.alturaInicial > 0 ? ` (${f(r.alturaMaxima - r.alturaInicial)} m más arriba de donde fue lanzado)` : ''}. En ese punto su velocidad vertical es 0 por un instante, y después empieza a bajar.`
    : `Como sale en horizontal, no sube: su altura máxima es la de lanzamiento, ${f(r.alturaMaxima)} m, y desde ahí solo cae.`);
  p.push(`En horizontal nada lo frena ni lo empuja (no se considera el aire), por eso su velocidad horizontal es **${f(r.vxFinal)} m/s** durante todo el vuelo.`);
  p.push(`En vertical, la gravedad cambia la velocidad ${f(r.gravedad)} m/s cada segundo: empieza en ${f(r.v0y)} m/s y termina en **${f(r.vyFinal)} m/s**. El signo negativo significa que, al final, se mueve hacia abajo.`);
  p.push(`Toca el suelo con una rapidez de **${f(r.velocidadFinal)} m/s**` + (r.alturaInicial > 0
    ? `, mayor que la inicial (${f(r.velocidadInicial)} m/s), porque cae desde ${f(r.alturaInicial)} m y la gravedad sigue acelerándolo.`
    : `, igual a la inicial, porque sale y llega a la misma altura.`));
  if (r.anguloGrados === 90) p.push('Al lanzarlo a 90° no avanza en horizontal: sube y vuelve a caer por la misma línea vertical.');
  if (r.anguloGrados === 0) p.push('Al lanzarlo a 0° la velocidad inicial es toda horizontal, así que el movimiento vertical es una caída libre.');
  return p;
}
