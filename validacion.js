/* validacion.js — Revisa lo que escribe el usuario y devuelve un mensaje sencillo por cada campo con problema */

const REGLAS_ENTRADA = [
  { id: 'velocidad', unidad: 'm/s',  max: 1000, mayorQueCero: true },
  { id: 'angulo',    unidad: '°',    max: 90,   mensajeRango: 'El ángulo debe estar entre 0° y 90°.' },
  { id: 'altura',    unidad: 'm',    max: 1000 },
  { id: 'gravedad',  unidad: 'm/s²', max: 100,  mayorQueCero: true }
];

// textos: { velocidad, angulo, altura, gravedad } tal como los escribió el usuario
// Devuelve { errores: {idCampo: mensaje}, valores: {idCampo: número} }
function validarEntradas(textos) {
  const errores = {};
  const valores = {};
  REGLAS_ENTRADA.forEach(regla => {
    const texto = String(textos[regla.id]).trim().replace(',', '.');
    const numero = Number(texto);
    let mensaje = '';
    if (texto === '') mensaje = 'Este campo está vacío. Escribe un número.';
    else if (!Number.isFinite(numero)) mensaje = 'Escribe solo un número, por ejemplo 12.5.';
    else if (numero < 0) mensaje = regla.mensajeRango || 'No puede ser negativo.';
    else if (regla.mayorQueCero && numero === 0) mensaje = 'Debe ser mayor que 0.';
    else if (numero > regla.max) mensaje = regla.mensajeRango || `No puede ser mayor que ${regla.max} ${regla.unidad}.`;
    if (mensaje) errores[regla.id] = mensaje; else valores[regla.id] = numero;
  });
  return { errores, valores };
}
