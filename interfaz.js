/* interfaz.js — Conecta formulario, cálculos, tarjetas, procedimiento, animación y gráficas */

const TARJETAS = [
  { id: 'tiempoVuelo', simbolo: 'T', nombre: 'Tiempo total de vuelo', unidad: 's', texto: 'Cuánto tarda el objeto en llegar al suelo.' },
  { id: 'alturaMaxima', simbolo: 'H', nombre: 'Altura máxima', unidad: 'm', texto: 'El punto más alto, medido desde el suelo.' },
  { id: 'alcance', simbolo: 'R', nombre: 'Alcance horizontal', unidad: 'm', texto: 'Distancia recorrida en horizontal hasta aterrizar.' },
  { id: 'v0x', simbolo: 'V₀x', nombre: 'Velocidad inicial horizontal', unidad: 'm/s', texto: 'La parte de la velocidad que lo empuja hacia adelante.' },
  { id: 'v0y', simbolo: 'V₀y', nombre: 'Velocidad inicial vertical', unidad: 'm/s', texto: 'La parte de la velocidad que lo empuja hacia arriba.' },
  { id: 'vxFinal', simbolo: 'Vxf', nombre: 'Velocidad final horizontal', unidad: 'm/s', texto: 'Igual a V₀x: nada la cambia en horizontal.' },
  { id: 'vyFinal', simbolo: 'Vyf', nombre: 'Velocidad final vertical', unidad: 'm/s', texto: 'Si es negativa, el objeto va bajando.' },
  { id: 'velocidadFinal', simbolo: 'Vf', nombre: 'Magnitud de la velocidad final', unidad: 'm/s', texto: 'La rapidez con la que toca el suelo.' }
];
const IDS_ENTRADA = ['velocidad', 'angulo', 'altura', 'gravedad'];
const botonPausa = document.getElementById('botonPausa');

// Pone **texto** en negrita (los textos de procedimiento.js usan esa marca)
const conNegrita = texto => texto.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

function crearTarjetas() {
  document.getElementById('tarjetasResultados').innerHTML = TARJETAS.map(t => `
    <article class="tarjeta resultado">
      <span class="simbolo">${t.simbolo}</span>
      <h3>${t.nombre}</h3>
      <p class="valor"><span id="valor-${t.id}">—</span> <span class="unidad">${t.unidad}</span></p>
      <p class="texto-suave">${t.texto}</p>
    </article>`).join('');
}

function mostrarErrores(errores) {
  IDS_ENTRADA.forEach(id => {
    document.getElementById('error-' + id).textContent = errores[id] || '';
    document.getElementById(id).setAttribute('aria-invalid', errores[id] ? 'true' : 'false');
  });
}
function mostrarAvisoGeneral(mensaje) {
  const aviso = document.getElementById('avisoGeneral');
  aviso.textContent = mensaje;
  aviso.hidden = mensaje === '';
}

function mostrarResultados(r) {
  TARJETAS.forEach(t => { document.getElementById('valor-' + t.id).textContent = formatear(r[t.id]); });
  document.getElementById('procedimiento').innerHTML = generarProcedimiento(r).map(paso => `
    <article class="tarjeta paso"><h3>${paso.titulo}</h3><dl>${paso.lineas.map(l =>
      `<dt>${l.rotulo}</dt><dd class="${l.rotulo === 'Resultado' ? 'resultado-paso' : ''}">${l.texto}</dd>`).join('')}</dl></article>`).join('');
  document.getElementById('explicacion').innerHTML = generarExplicacion(r).map(t => `<p>${conNegrita(t)}</p>`).join('');
}

// Cambia el estado de los botones de la simulación según lo que esté pasando
function actualizarControles() {
  const e = estadoAnimacion, hay = e.resultados !== null;
  document.getElementById('botonIniciar').disabled = !hay;
  document.getElementById('botonReiniciarAnimacion').disabled = !hay;
  botonPausa.disabled = !hay || e.terminada || (!e.reproduciendo && e.t === 0);
  botonPausa.textContent = e.reproduciendo ? '❚❚ Pausar' : '▶ Continuar';
}

// Valida, calcula y actualiza todo. Con iniciar = true también arranca la animación.
function simular(iniciar) {
  const campos = Object.fromEntries(IDS_ENTRADA.map(id => [id, document.getElementById(id).value]));
  const { errores, valores } = validarEntradas(campos);
  mostrarErrores(errores);
  mostrarAvisoGeneral('');
  if (Object.keys(errores).length > 0) return;

  const r = calcularTodo(valores.velocidad, valores.angulo, valores.altura, valores.gravedad);
  if (r.tiempoVuelo < 1e-9) {
    mostrarAvisoGeneral('Con altura 0 m y ángulo 0° el objeto no despega: está en el suelo y se lanza horizontal. Sube el ángulo o la altura.');
    return;
  }
  mostrarResultados(r);
  dibujarTodasLasGraficas(r);
  prepararAnimacion(r);
  if (iniciar) {
    iniciarAnimacion();
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('simulacion').scrollIntoView({ behavior: reducir ? 'auto' : 'smooth' });
  }
}

function restablecer() {
  document.getElementById('formulario').reset(); // vuelve a los valores iniciales del HTML
  simular(false);
}

document.getElementById('formulario').addEventListener('submit', evento => { evento.preventDefault(); simular(true); });
document.getElementById('botonRestablecer').addEventListener('click', restablecer);
document.getElementById('botonIniciar').addEventListener('click', iniciarAnimacion);
botonPausa.addEventListener('click', alternarPausa);
document.getElementById('botonReiniciarAnimacion').addEventListener('click', reiniciarAnimacion);
document.getElementById('velocidadReproduccion').addEventListener('change', e => fijarVelocidadReproduccion(Number(e.target.value)));

// Al abrir la página se muestra un primer lanzamiento con los valores iniciales (sin animar todavía)
crearTarjetas();
ajustarLienzo();
simular(false);
