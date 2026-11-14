/**
 * Fixture "GLORIOSO DIA": imita un cifrado copiado de una página web, con los problemas reales
 * del pegado: U+200B al inicio y dentro de las líneas, U+FEFF al principio, espacios duros (U+00A0)
 * entre acordes y saltos de línea de Windows (\r\n).
 *
 * La estructura y los acordes son los de la canción (Intro, Verso, Coro, Verso 2, Puente, Final).
 * La letra es un texto de relleno, no la original (tiene derechos de autor): para el parser
 * solo importa la forma de las líneas. Se puede reemplazar por la letra real sin tocar los tests
 * de estructura.
 */
const Z = "​"; // zero-width space
const NB = " "; // espacio duro

export const GLORIOSO_DIA = [
  `﻿${Z}Intro`,
  `${Z}D2${NB}${NB}${NB}G${NB}${NB}${NB}x2`,
  ``,
  `${Z}Verso`,
  `${Z}D                 G`,
  `${Z}Estaba lejos y sin luz`,
  `${Z}Bm7        A        D/F#`,
  `Perdido en mi ${Z}oscuridad`,
  `     G/B         Dsus4`,
  `${Z}Hasta que oí tu voz`,
  ``,
  `${Z}Coro:`,
  `${Z}N.C.      G          D`,
  `${Z}Me llamaste y corrí a ti`,
  `${Z}A7(b9)        Bm7    Riff`,
  `${Z}De la noche a tu gran día`,
  `| D5 | B5 | G | A |`,
  ``,
  `${Z}VERSO 2`,
  `${Z}D                 G`,
  `${Z}Ahora canto libre al fin`,
  `${Z}Bm7           A`,
  `${Z}Tu gracia me alcanzó`,
  ``,
  `${Z}puente`,
  `${Z}G            D`,
  `${Z}Ya no hay cadenas`,
  `${Z}Bm           A      x2`,
  `${Z}Ya no hay temor`,
  ``,
  `${Z}[Final]`,
  `${Z}D2   G   D`,
].join("\r\n");
