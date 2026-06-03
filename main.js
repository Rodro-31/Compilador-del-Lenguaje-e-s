"use strict";

/* ============================================================
   Analizador Lexico y Sintactico
   Lenguaje propio (Compiladores - Ciclo VII)
   ============================================================ */

/* ---------- Categorias lexicas (expresiones regulares) ---------- */
const RESERVADAS = ["ent", "doble", "imprimir", "leer", "Si", "entonces", "Mientras", "hacer"];

const ER = {
  PalabraReservada: /^(ent|doble|imprimir|leer|Si|entonces|Mientras|hacer)$/,
  OperadorAritmetico: /^(\+|-|\*|\/|%|\^)$/,
  Constante: /^[0-9]+(\.[0-9]+)?$/,
  Identificador: /^@[a-zA-Z][a-zA-Z0-9]*$/,
  Comparador: /^(==|<=|>=|!=|>|<)$/,
  SimboloInicio: /^(\{|inicio)$/,
  Delimitador: /^(;|\}|fin)$/,
  OperadorAsignacion: /^=$/,
  Literal: /^"[a-zA-Z0-9]*"$/,
};

/* ============================================================
   LEXER  (analizador lexico)
   Devuelve { tokens, errores }
   ============================================================ */
function analizarLexico(codigo) {
  const tokens = [];
  const errores = [];
  let linea = 1;
  let i = 0;
  const n = codigo.length;

  const esLetra = (c) => /[a-zA-Z]/.test(c);
  const esDigito = (c) => /[0-9]/.test(c);

  while (i < n) {
    const c = codigo[i];

    // Salto de linea
    if (c === "\n") { linea++; i++; continue; }
    // Espacios en blanco
    if (c === " " || c === "\t" || c === "\r") { i++; continue; }

    const lineaTok = linea;

    // --- Literal "..." ---
    if (c === '"') {
      let j = i + 1;
      let cerrado = false;
      while (j < n) {
        if (codigo[j] === "\n") break;
        if (codigo[j] === '"') { cerrado = true; break; }
        j++;
      }
      if (!cerrado) {
        errores.push(nuevoError("Lexico", `Literal sin comilla de cierre`, lineaTok));
        // consumir hasta fin de linea para continuar
        i = j;
        continue;
      }
      const lexema = codigo.slice(i, j + 1);
      if (ER.Literal.test(lexema)) {
        tokens.push(nuevoToken(lexema, "Literal", lineaTok));
      } else {
        errores.push(
          nuevoError("Lexico", `Literal invalido (solo letras y digitos entre comillas): "${lexema}"`, lineaTok)
        );
      }
      i = j + 1;
      continue;
    }

    // --- Identificador @<letra>{<letra>|<digito>} ---
    if (c === "@") {
      let j = i + 1;
      while (j < n && /[a-zA-Z0-9]/.test(codigo[j])) j++;
      const lexema = codigo.slice(i, j);
      if (ER.Identificador.test(lexema)) {
        tokens.push(nuevoToken(lexema, "Identificador", lineaTok));
      } else {
        errores.push(
          nuevoError("Lexico", `Identificador mal formado (use @letra y luego letras o digitos): "${lexema}"`, lineaTok)
        );
      }
      i = j;
      continue;
    }

    // --- Palabra (reservada / inicio / fin) ---
    if (esLetra(c)) {
      let j = i;
      while (j < n && /[a-zA-Z]/.test(codigo[j])) j++;
      const lexema = codigo.slice(i, j);
      if (lexema === "inicio") {
        tokens.push(nuevoToken(lexema, "SimboloInicio", lineaTok));
      } else if (lexema === "fin") {
        tokens.push(nuevoToken(lexema, "Delimitador", lineaTok));
      } else if (ER.PalabraReservada.test(lexema)) {
        tokens.push(nuevoToken(lexema, "PalabraReservada", lineaTok));
      } else {
        errores.push(nuevoError("Lexico", `Palabra o identificador no valido: "${lexema}"`, lineaTok));
      }
      i = j;
      continue;
    }

    // --- Numero (constante) ---
    if (esDigito(c)) {
      let j = i;
      while (j < n && esDigito(codigo[j])) j++;
      if (codigo[j] === "." && esDigito(codigo[j + 1])) {
        j++;
        while (j < n && esDigito(codigo[j])) j++;
      }
      const lexema = codigo.slice(i, j);
      if (ER.Constante.test(lexema)) {
        tokens.push(nuevoToken(lexema, "Constante", lineaTok));
      } else {
        errores.push(nuevoError("Lexico", `Constante mal formada: "${lexema}"`, lineaTok));
      }
      i = j;
      continue;
    }

    // --- Operadores y simbolos ---
    const dos = codigo.substr(i, 2);
    if (["==", "<=", ">=", "!="].includes(dos)) {
      tokens.push(nuevoToken(dos, "Comparador", lineaTok)); i += 2; continue;
    }
    if (dos === "&&" || dos === "||") {
      errores.push(nuevoError("Lexico", `El operador "${dos}" no esta definido en la gramatica`, lineaTok));
      i += 2;
      continue;
    }

    if (c === ">" || c === "<") { tokens.push(nuevoToken(c, "Comparador", lineaTok)); i++; continue; }
    if (c === "=") { tokens.push(nuevoToken(c, "OperadorAsignacion", lineaTok)); i++; continue; }
    if ("+-*/%^".includes(c)) { tokens.push(nuevoToken(c, "OperadorAritmetico", lineaTok)); i++; continue; }
    if (c === "(" || c === ")") {
      errores.push(nuevoError("Lexico", `El simbolo "${c}" no esta definido en la gramatica`, lineaTok));
      i++;
      continue;
    }
    if (c === "{") { tokens.push(nuevoToken(c, "SimboloInicio", lineaTok)); i++; continue; }
    if (c === "}" || c === ";") { tokens.push(nuevoToken(c, "Delimitador", lineaTok)); i++; continue; }

    // Caracter no reconocido
    if (c === ".") {
      errores.push(nuevoError("Lexico", `Constante mal formada (el punto debe ir entre digitos)`, lineaTok));
    } else if (c === "!" || c === "&" || c === "|") {
      errores.push(nuevoError("Lexico", `Operador incompleto: "${c}"`, lineaTok));
    } else if (c === "_") {
      errores.push(nuevoError("Lexico", `El caracter "_" no esta permitido en identificadores ni palabras`, lineaTok));
    } else {
      errores.push(nuevoError("Lexico", `Caracter no reconocido: "${c}"`, lineaTok));
    }
    i++;
  }

  return { tokens, errores };
}

function nuevoToken(lexema, categoria, linea) {
  return { lexema, categoria, linea };
}
function nuevoError(tipo, mensaje, linea) {
  return { tipo, mensaje, linea };
}

/* Nombre legible de la categoria para la tabla */
const NOMBRE_CATEGORIA = {
  PalabraReservada: "Palabra Reservada",
  OperadorAritmetico: "Operador Aritmetico",
  Constante: "Constante",
  Identificador: "Identificador",
  Comparador: "Comparador",
  SimboloInicio: "Simbolo de Inicio",
  Delimitador: "Delimitador",
  OperadorAsignacion: "Operador de Asignacion",
  Literal: "Literal",
};

/* Numero de cada categoria para construir el token (segun gramatica del lenguaje) */
const NUMERO_CATEGORIA = {
  PalabraReservada: 1,
  OperadorAritmetico: 2,
  Constante: 3,
  Identificador: 4,
  Comparador: 5,
  SimboloInicio: 6,
  Delimitador: 7,
  OperadorAsignacion: 8,
  Literal: 9,
};

const pad3 = (n) => String(n).padStart(3, "0");

/* ============================================================
   TABLA DE SIMBOLOS
   Detecta declaraciones: (ent|doble) @id [ compleAsig ] ;
   ============================================================ */
function construirTablaSimbolos(tokens) {
  const tabla = [];
  for (let k = 0; k < tokens.length; k++) {
    const t = tokens[k];
    if (t.categoria === "PalabraReservada" && (t.lexema === "ent" || t.lexema === "doble")) {
      const sig = tokens[k + 1];
      if (sig && sig.categoria === "Identificador") {
        let valor = "";
        if (tokens[k + 2] && tokens[k + 2].categoria === "OperadorAsignacion") {
          const partes = [];
          let m = k + 3;
          while (tokens[m] && !(tokens[m].categoria === "Delimitador" && tokens[m].lexema === ";")) {
            partes.push(tokens[m].lexema);
            m++;
          }
          valor = partes.join(" ");
        }
        // evitar duplicados por nombre
        if (!tabla.some((s) => s.nombre === sig.lexema)) {
          tabla.push({
            nombre: sig.lexema,
            tipo: t.lexema,
            linea: t.linea,
            valor: valor || "(sin valor)",
          });
        }
      }
    }
  }
  return tabla;
}

/* ============================================================
   PARSER  (analizador sintactico) - descenso recursivo LL(1)
   Construye el arbol sintactico segun la BNF.
   ============================================================ */
function ParseError(mensaje, linea) {
  this.mensaje = mensaje;
  this.linea = linea;
}

function analizarSintactico(tokens) {
  let pos = 0;

  const fin = () => pos >= tokens.length;
  const actual = () => tokens[pos];
  const lineaActual = () => (fin() ? lineaFinal() : actual().linea);

  function lineaFinal() {
    return tokens.length ? tokens[tokens.length - 1].linea : 1;
  }

  function nodo(label, terminal = false, children = []) {
    return { label, terminal, children };
  }

  function esperaCategoria(categoria, descripcion) {
    if (fin()) {
      throw new ParseError(`Se esperaba ${descripcion} pero el codigo termino`, lineaFinal());
    }
    const t = actual();
    if (t.categoria !== categoria) {
      throw new ParseError(`Se esperaba ${descripcion} pero se encontro "${t.lexema}"`, t.linea);
    }
    pos++;
    return nodo(t.lexema, true);
  }

  function esperaLexema(lexema) {
    if (fin()) {
      throw new ParseError(`Se esperaba "${lexema}" pero el codigo termino`, lineaFinal());
    }
    const t = actual();
    if (t.lexema !== lexema) {
      throw new ParseError(`Se esperaba "${lexema}" pero se encontro "${t.lexema}"`, t.linea);
    }
    pos++;
    return nodo(t.lexema, true);
  }

  // <Programa> ::= <inicio> <instruccion> <final>
  function programa() {
    const nodoProg = nodo("Programa");
    nodoProg.children.push(parseInicio());
    nodoProg.children.push(instruccion());
    nodoProg.children.push(parseFinal());
    if (!fin()) {
      throw new ParseError(`Se encontro contenido despues del fin del programa: "${actual().lexema}"`, actual().linea);
    }
    return nodoProg;
  }

  // <inicio> ::= { | inicio
  function parseInicio() {
    if (fin()) throw new ParseError(`Se esperaba "{" o "inicio"`, lineaFinal());
    const t = actual();
    if (t.lexema === "{" || t.lexema === "inicio") {
      pos++;
      return nodo("inicio", false, [nodo(t.lexema, true)]);
    }
    throw new ParseError(`Se esperaba "{" o "inicio" pero se encontro "${t.lexema}"`, t.linea);
  }

  // <final> ::= } | fin
  function parseFinal() {
    if (fin()) throw new ParseError(`Se esperaba "}" o "fin"`, lineaFinal());
    const t = actual();
    if (t.lexema === "}" || t.lexema === "fin") {
      pos++;
      return nodo("final", false, [nodo(t.lexema, true)]);
    }
    throw new ParseError(`Se esperaba "}" o "fin" pero se encontro "${t.lexema}"`, t.linea);
  }

  // <instruccion> ::= <sentencia> <instruccion> | <sentencia>  (al menos una sentencia)
  function instruccion() {
    const nodoInstr = nodo("instruccion");
    if (fin() || esFinal()) {
      throw new ParseError("Se esperaba al menos una sentencia", lineaActual());
    }
    do {
      nodoInstr.children.push(sentencia());
    } while (!fin() && !esFinal());
    return nodoInstr;
  }

  function esFinal() {
    const t = actual();
    return t && (t.lexema === "}" || t.lexema === "fin");
  }

  // <sentencia> ::= declarar | condicion | ciclo | asignacion | mostrar | solicitar
  function sentencia() {
    if (fin()) throw new ParseError(`Se esperaba una sentencia`, lineaFinal());
    const t = actual();
    if (t.lexema === "ent" || t.lexema === "doble") return declarar();
    if (t.lexema === "Si") return condicion();
    if (t.lexema === "Mientras") return ciclo();
    if (t.categoria === "Identificador") return asignacion();
    if (t.lexema === "imprimir") return mostrar();
    if (t.lexema === "leer") return solicitar();
    throw new ParseError(`Inicio de sentencia no valido: "${t.lexema}"`, t.linea);
  }

  // <declarar> ::= <tipo> <id> {<compleAsig>} <delimitador>  ({compleAsig} opcional: 0 o 1)
  function declarar() {
    const nodoDec = nodo("declarar");
    const tipo = actual();
    nodoDec.children.push(nodo("tipo", false, [nodo(tipo.lexema, true)]));
    pos++;
    nodoDec.children.push(esperaCategoria("Identificador", "un identificador (@nombre)"));
    if (!fin() && actual().categoria === "OperadorAsignacion") {
      nodoDec.children.push(compleAsig());
    }
    nodoDec.children.push(esperaLexema(";"));
    return nodoDec;
  }

  // <condicion> ::= Si <valorLogico> entonces <inicio> <instruccion> <final>
  function condicion() {
    const nodoCon = nodo("condicion");
    nodoCon.children.push(esperaLexema("Si"));
    nodoCon.children.push(valorLogico());
    nodoCon.children.push(esperaLexema("entonces"));
    nodoCon.children.push(parseInicio());
    nodoCon.children.push(instruccion());
    nodoCon.children.push(parseFinal());
    return nodoCon;
  }

  // <ciclo> ::= Mientras <valorLogico> hacer <inicio> <instruccion> <final>
  function ciclo() {
    const nodoCic = nodo("ciclo");
    nodoCic.children.push(esperaLexema("Mientras"));
    nodoCic.children.push(valorLogico());
    nodoCic.children.push(esperaLexema("hacer"));
    nodoCic.children.push(parseInicio());
    nodoCic.children.push(instruccion());
    nodoCic.children.push(parseFinal());
    return nodoCic;
  }

  // <asignacion> ::= <id> <compleAsig> <delimitador>
  function asignacion() {
    const nodoAsig = nodo("asignacion");
    nodoAsig.children.push(esperaCategoria("Identificador", "un identificador (@nombre)"));
    nodoAsig.children.push(compleAsig());
    nodoAsig.children.push(esperaLexema(";"));
    return nodoAsig;
  }

  // <compleAsig> ::= "=" <valor> {<operador><valor>}
  function compleAsig() {
    const nodoCA = nodo("compleAsig");
    nodoCA.children.push(esperaCategoria("OperadorAsignacion", '"="'));
    nodoCA.children.push(valor());
    while (!fin() && actual().categoria === "OperadorAritmetico") {
      nodoCA.children.push(nodo("operador", false, [esperaCategoria("OperadorAritmetico", "un operador aritmetico")]));
      nodoCA.children.push(valor());
    }
    return nodoCA;
  }

  // <mostrar> ::= imprimir (<valor> | <literal>) <delimitador>
  function mostrar() {
    const nodoMos = nodo("mostrar");
    nodoMos.children.push(esperaLexema("imprimir"));
    if (!fin() && actual().categoria === "Literal") {
      nodoMos.children.push(nodo("literal", false, [esperaCategoria("Literal", 'un literal ("letras o digitos")')]));
    } else {
      nodoMos.children.push(valor());
    }
    nodoMos.children.push(esperaLexema(";"));
    return nodoMos;
  }

  // <solicitar> ::= leer <id> <delimitador>
  function solicitar() {
    const nodoSol = nodo("solicitar");
    nodoSol.children.push(esperaLexema("leer"));
    nodoSol.children.push(esperaCategoria("Identificador", "un identificador (@nombre)"));
    nodoSol.children.push(esperaLexema(";"));
    return nodoSol;
  }

  // <valorLogico> ::= <valor> <comparador> <valor>
  function valorLogico() {
    const nodoVL = nodo("valorLogico");
    nodoVL.children.push(valor());
    nodoVL.children.push(esperaCategoria("Comparador", "un comparador (>, <, >=, <=, ==, !=)"));
    nodoVL.children.push(valor());
    return nodoVL;
  }

  // <valor> ::= <id> | <digito> {<digito>} | <digito> {<digito>} "." <digito> {<digito>}
  function valor() {
    if (fin()) throw new ParseError(`Se esperaba un valor (identificador o numero)`, lineaFinal());
    const t = actual();
    if (t.categoria === "Identificador") {
      pos++;
      return nodo("valor", false, [nodo(t.lexema, true)]);
    }
    if (t.categoria === "Constante") {
      pos++;
      return nodo("valor", false, [nodo(t.lexema, true)]);
    }
    throw new ParseError(`Se esperaba un valor (identificador o numero) pero se encontro "${t.lexema}"`, t.linea);
  }

  // --- Ejecucion ---
  try {
    if (tokens.length === 0) {
      return { arbol: null, errores: [nuevoError("Sintactico", "No hay codigo para analizar", 1)] };
    }
    const arbol = programa();
    return { arbol, errores: [] };
  } catch (e) {
    if (e instanceof ParseError) {
      return { arbol: null, errores: [nuevoError("Sintactico", e.mensaje, e.linea)] };
    }
    throw e;
  }
}

/* ============================================================
   INTERFAZ
   ============================================================ */
const EJEMPLO_DEFECTO = `inicio
    doble @radio = 5.5 ;
    doble @pi = 3.1416 ;
    doble @area = 0 ;

    Si @radio > 0 entonces
    {
        @area = 95.14 ;
        imprimir @area ;
    }
fin`;

const $ = (sel) => document.querySelector(sel);

const editor = $("#codigo");
const gutter = $("#gutter");

/* ---- Numeracion de lineas ---- */
function actualizarGutter(lineasError = []) {
  const total = editor.value.split("\n").length;
  let html = "";
  for (let i = 1; i <= total; i++) {
    const clase = lineasError.includes(i) ? ' class="err-line"' : "";
    html += `<span${clase}>${i}</span>`;
  }
  gutter.innerHTML = html;
  gutter.scrollTop = editor.scrollTop;
}

editor.addEventListener("input", () => actualizarGutter());
editor.addEventListener("scroll", () => { gutter.scrollTop = editor.scrollTop; });

/* ---- Zoom del arbol sintactico ---- */
let zoom = 1;
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 2.5;

function aplicarZoom() {
  const pane = $("#arbol");
  if (pane) pane.style.setProperty("--zoom", zoom);
  $("#zoomNivel").textContent = `${Math.round(zoom * 100)}%`;
}

$("#zoomIn").addEventListener("click", () => {
  zoom = Math.min(ZOOM_MAX, +(zoom + 0.1).toFixed(2));
  aplicarZoom();
});
$("#zoomOut").addEventListener("click", () => {
  zoom = Math.max(ZOOM_MIN, +(zoom - 0.1).toFixed(2));
  aplicarZoom();
});
$("#zoomReset").addEventListener("click", () => {
  zoom = 1;
  aplicarZoom();
});

/* ---- Subpestañas del panel de Tokens ---- */
document.querySelectorAll(".subtab").forEach((subtab) => {
  subtab.addEventListener("click", () => {
    const destino = subtab.dataset.subtab;
    const panel = subtab.closest(".panel");
    if (!panel) return;
    panel.querySelectorAll(".subtab").forEach((s) => s.classList.toggle("active", s === subtab));
    panel.querySelectorAll(".subtab-content").forEach((c) =>
      c.classList.toggle("active", c.dataset.subtab === destino)
    );
  });
});

/* ---- Tabla de categorias lexicas ---- */
function renderCategorias() {
  const tbody = $("#tablaCategorias");
  if (!tbody) return;
  const claves = Object.keys(NUMERO_CATEGORIA).sort(
    (a, b) => NUMERO_CATEGORIA[a] - NUMERO_CATEGORIA[b]
  );
  tbody.innerHTML = claves
    .map(
      (clave) => `<tr>
        <td>${NUMERO_CATEGORIA[clave]}</td>
        <td>${NOMBRE_CATEGORIA[clave]}</td>
        <td><code>${escapeHtml(ER[clave].source)}</code></td>
      </tr>`
    )
    .join("");
}

/* ---- Botones ---- */
$("#btnLimpiar").addEventListener("click", () => {
  editor.value = "";
  actualizarGutter();
  reiniciarResultados();
  editor.focus();
});

$("#btnAnalizar").addEventListener("click", analizar);

function reiniciarResultados() {
  $("#numLineas").textContent = "0";
  $("#numTokens").textContent = "0";
  $("#numErrores").textContent = "0";
  $("#tablaTokens").innerHTML = `<tr><td colspan="7" class="empty">Sin analizar.</td></tr>`;
  $("#tablaSimbolos").innerHTML = `<tr><td colspan="5" class="empty">Sin analizar.</td></tr>`;
  $("#listaErrores").innerHTML = `<p class="empty">Sin analizar.</p>`;
  $("#arbol").innerHTML = `<p class="empty">Sin analizar.</p>`;
}

/* ---- Proceso principal ---- */
function analizar() {
  const codigo = editor.value;
  const numLineas = codigo.replace(/\n+$/, "").split("\n").length;

  const { tokens, errores: erroresLex } = analizarLexico(codigo);
  const tabla = construirTablaSimbolos(tokens);

  let erroresSin = [];
  let arbol = null;
  if (erroresLex.length === 0 && tokens.length > 0) {
    const res = analizarSintactico(tokens);
    arbol = res.arbol;
    erroresSin = res.errores;
  }

  const todosErrores = [...erroresLex, ...erroresSin];

  // Estadisticas
  $("#numLineas").textContent = codigo.trim() === "" ? "0" : String(numLineas);
  $("#numTokens").textContent = String(tokens.length);
  $("#numErrores").textContent = String(todosErrores.length);

  renderTokens(tokens);
  renderSimbolos(tabla);
  renderErrores(todosErrores, arbol);
  renderArbol(arbol, todosErrores);

  const lineasError = todosErrores.map((e) => e.linea);
  actualizarGutter(lineasError);
}

/* ---- Render: tokens ---- */
function renderTokens(tokens) {
  const tbody = $("#tablaTokens");
  if (tokens.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty">No se generaron tokens.</td></tr>`;
    return;
  }
  const contadores = {};
  tbody.innerHTML = tokens
    .map((t, idx) => {
      contadores[t.categoria] = (contadores[t.categoria] || 0) + 1;
      const numCat = pad3(NUMERO_CATEGORIA[t.categoria]);
      const numOcc = pad3(contadores[t.categoria]);
      const token = numCat + numOcc;
      return `<tr>
        <td>${idx + 1}</td>
        <td><code>${escapeHtml(t.lexema)}</code></td>
        <td><span class="cat-tag">${NOMBRE_CATEGORIA[t.categoria] || t.categoria}</span></td>
        <td><code>${numCat}</code></td>
        <td><code>${numOcc}</code></td>
        <td><code>${token}</code></td>
        <td>${t.linea}</td>
      </tr>`;
    })
    .join("");
}

/* ---- Render: tabla de simbolos ---- */
function renderSimbolos(tabla) {
  const tbody = $("#tablaSimbolos");
  if (tabla.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">No se declararon identificadores.</td></tr>`;
    return;
  }
  tbody.innerHTML = tabla
    .map(
      (s, idx) => `<tr>
        <td>${idx + 1}</td>
        <td><code>${escapeHtml(s.nombre)}</code></td>
        <td>${s.tipo}</td>
        <td>${s.linea}</td>
        <td>${escapeHtml(s.valor)}</td>
      </tr>`
    )
    .join("");
}

/* ---- Render: errores ---- */
function renderErrores(errores, arbol) {
  const cont = $("#listaErrores");
  if (errores.length === 0) {
    cont.innerHTML = `<div class="ok-msg">Analisis completado sin errores. El codigo es valido.</div>`;
    return;
  }
  cont.innerHTML = errores
    .map(
      (e) => `<div class="error-item">
        <div><span class="tipo">Error ${e.tipo}</span> &mdash; <span class="linea">Linea ${e.linea}</span></div>
        <div>${escapeHtml(e.mensaje)}</div>
      </div>`
    )
    .join("");
}

/* ---- Render: arbol sintactico ---- */
function renderArbol(arbol, errores) {
  const cont = $("#arbol");
  if (!arbol) {
    const hayLex = errores.some((e) => e.tipo === "Lexico");
    const msg = hayLex
      ? "No se genero el arbol: corrige primero los errores lexicos."
      : "No se genero el arbol: hay errores sintacticos.";
    cont.innerHTML = `<p class="empty">${msg}</p>`;
    return;
  }
  cont.innerHTML = `<ul class="tree">${nodoHtml(arbol)}</ul>`;
  zoom = 1;
  aplicarZoom();
}

function nodoHtml(nodo) {
  const clase = nodo.terminal ? "terminal" : "nonterminal";
  let html = `<li><span class="node ${clase}">${escapeHtml(nodo.label)}</span>`;
  if (nodo.children && nodo.children.length) {
    html += `<ul>${nodo.children.map(nodoHtml).join("")}</ul>`;
  }
  html += `</li>`;
  return html;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ---- Inicializacion ---- */
editor.value = EJEMPLO_DEFECTO;
actualizarGutter();
renderCategorias();
