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
  Constante: /^-?[0-9]+(\.[0-9]+)?$/,
  Identificador: /^@[a-zA-Z_][a-zA-Z0-9_]*$/,
  SimboloAgrupacion: /^(\(|\))$/,
  Comparador: /^(==|<=|>=|!=|>|<)$/,
  OperadorLogico: /^(&&|\|\|)$/,
  SimboloInicio: /^(\{|inicio)$/,
  Delimitador: /^(;|\}|fin)$/,
  OperadorAsignacion: /^=$/,
  Literal: /^"[^"\n]*"$/,
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

  const esLetra = (c) => /[a-zA-Z_]/.test(c);
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
      tokens.push(nuevoToken(lexema, "Literal", lineaTok));
      i = j + 1;
      continue;
    }

    // --- Identificador @... ---
    if (c === "@") {
      let j = i + 1;
      while (j < n && /[a-zA-Z0-9_]/.test(codigo[j])) j++;
      const lexema = codigo.slice(i, j);
      if (ER.Identificador.test(lexema)) {
        tokens.push(nuevoToken(lexema, "Identificador", lineaTok));
      } else {
        errores.push(nuevoError("Lexico", `Identificador mal formado: "${lexema}"`, lineaTok));
      }
      i = j;
      continue;
    }

    // --- Palabra (reservada / inicio / fin) ---
    if (esLetra(c)) {
      let j = i;
      while (j < n && /[a-zA-Z0-9_]/.test(codigo[j])) j++;
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
      tokens.push(nuevoToken(lexema, "Constante", lineaTok));
      i = j;
      continue;
    }

    // --- Operadores y simbolos ---
    const dos = codigo.substr(i, 2);
    if (["==", "<=", ">=", "!="].includes(dos)) {
      tokens.push(nuevoToken(dos, "Comparador", lineaTok)); i += 2; continue;
    }
    if (dos === "&&" || dos === "||") {
      tokens.push(nuevoToken(dos, "OperadorLogico", lineaTok)); i += 2; continue;
    }

    if (c === ">" || c === "<") { tokens.push(nuevoToken(c, "Comparador", lineaTok)); i++; continue; }
    if (c === "=") { tokens.push(nuevoToken(c, "OperadorAsignacion", lineaTok)); i++; continue; }
    if ("+-*/%^".includes(c)) { tokens.push(nuevoToken(c, "OperadorAritmetico", lineaTok)); i++; continue; }
    if (c === "(" || c === ")") { tokens.push(nuevoToken(c, "SimboloAgrupacion", lineaTok)); i++; continue; }
    if (c === "{") { tokens.push(nuevoToken(c, "SimboloInicio", lineaTok)); i++; continue; }
    if (c === "}" || c === ";") { tokens.push(nuevoToken(c, "Delimitador", lineaTok)); i++; continue; }

    // Caracter no reconocido
    if (c === "!" || c === "&" || c === "|") {
      errores.push(nuevoError("Lexico", `Operador incompleto: "${c}"`, lineaTok));
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
  SimboloAgrupacion: "Simbolo de Agrupacion",
  Comparador: "Comparador",
  OperadorLogico: "Operador Logico",
  SimboloInicio: "Simbolo de Inicio",
  Delimitador: "Delimitador",
  OperadorAsignacion: "Operador de Asignacion",
  Literal: "Literal",
};

/* ============================================================
   TABLA DE SIMBOLOS
   Detecta declaraciones: (ent|doble) @id [ = valor ... ] ;
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

  // <instruccion> ::= <sentencia> <instruccion> | <sentencia>
  function instruccion() {
    const nodoInstr = nodo("instruccion");
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

  // <declarar> ::= <tipo> <id> [ = <valor> {<operador><valor>} ] <delimitador>
  function declarar() {
    const nodoDec = nodo("declarar");
    const tipo = actual();
    nodoDec.children.push(nodo("tipo", false, [nodo(tipo.lexema, true)]));
    pos++;
    nodoDec.children.push(esperaCategoria("Identificador", "un identificador (@nombre)"));
    if (!fin() && actual().categoria === "OperadorAsignacion") {
      nodoDec.children.push(esperaCategoria("OperadorAsignacion", '"="'));
      nodoDec.children.push(valorExpr());
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

  // <asignacion> ::= <id> = <valor> {<operador><valor>} <delimitador>
  function asignacion() {
    const nodoAsig = nodo("asignacion");
    nodoAsig.children.push(esperaCategoria("Identificador", "un identificador (@nombre)"));
    nodoAsig.children.push(esperaCategoria("OperadorAsignacion", '"="'));
    nodoAsig.children.push(valorExpr());
    nodoAsig.children.push(esperaLexema(";"));
    return nodoAsig;
  }

  // <mostrar> ::= imprimir (<valor> | <literal>) <delimitador>
  function mostrar() {
    const nodoMos = nodo("mostrar");
    nodoMos.children.push(esperaLexema("imprimir"));
    if (!fin() && actual().categoria === "Literal") {
      nodoMos.children.push(nodo("literal", false, [esperaCategoria("Literal", "un literal")]));
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

  // <valor> {<operador><valor>}  (expresion aritmetica)
  function valorExpr() {
    const nodoExpr = nodo("expresion");
    nodoExpr.children.push(valor());
    while (!fin() && actual().categoria === "OperadorAritmetico") {
      nodoExpr.children.push(nodo("operador", false, [esperaCategoria("OperadorAritmetico", "un operador aritmetico")]));
      nodoExpr.children.push(valor());
    }
    return nodoExpr;
  }

  // <valor> ::= <id> | <constante>
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

/* ---- Pestañas ---- */
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const destino = tab.dataset.tab;
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
    document.querySelectorAll(".tab-content").forEach((c) =>
      c.classList.toggle("active", c.dataset.tab === destino)
    );
  });
});

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
  $("#tablaTokens").innerHTML = `<tr><td colspan="4" class="empty">Sin analizar.</td></tr>`;
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
    tbody.innerHTML = `<tr><td colspan="4" class="empty">No se generaron tokens.</td></tr>`;
    return;
  }
  tbody.innerHTML = tokens
    .map(
      (t, idx) => `<tr>
        <td>${idx + 1}</td>
        <td><code>${escapeHtml(t.lexema)}</code></td>
        <td><span class="cat-tag">${NOMBRE_CATEGORIA[t.categoria] || t.categoria}</span></td>
        <td>${t.linea}</td>
      </tr>`
    )
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
