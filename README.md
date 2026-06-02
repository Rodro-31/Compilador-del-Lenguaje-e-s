# Analizador Lexico y Sintactico

Simulacion de software para la materia de **Compiladores (Ciclo VII)**. Es una aplicacion web estatica (HTML + CSS + JavaScript puro, sin dependencias ni backend) que implementa un **analizador lexico** y un **analizador sintactico** para un lenguaje de programacion propio.

## Funcionalidades

### Analisis Lexico
- Area para ingresar el codigo con **numeracion de lineas**.
- Boton **Analizar** para iniciar el proceso.
- **Listado de tokens generados** (lexema, categoria lexica y numero de linea).
- **Tabla de simbolos / identificadores** (nombre, tipo, linea de declaracion y valor inicial).
- **Cantidad de lineas analizadas**.
- **Control de errores lexicos** (tipo de error y numero de linea).

### Analisis Sintactico
- **Arbol sintactico** generado segun el codigo ingresado (descenso recursivo LL(1)).
- **Control de errores sintacticos** (mensaje "se esperaba X, se encontro Y" con numero de linea).

## El lenguaje

### Categorias lexicas (expresiones regulares)

| Categoria | Expresion regular |
|---|---|
| Palabras Reservadas | `^(ent|doble|imprimir|leer|Si|entonces|Mientras|hacer)$` |
| Operador Aritmetico | `^(\+|-|\*|/|%|\^)$` |
| Constantes | `^-?[0-9]+(\.[0-9]+)?$` |
| Identificadores | `^@[a-zA-Z_][a-zA-Z0-9_]*$` |
| Simbolos de Agrupacion | `^(\(|\))$` |
| Comparadores | `^(==|<=|>=|!=|>|<)$` |
| Operador Logico | `^(&&|\|\|)$` |
| Simbolos de Inicio | `^(\{|inicio)$` |
| Delimitadores | `^(;|\}|fin)$` |
| Operador de Asignacion | `^=$` |
| Literales | `^"[^"\n]*"$` |

### Gramatica (BNF)

```
<Programa>    ::= <inicio> <instruccion> <final>
<inicio>      ::= { | inicio
<final>       ::= } | fin
<instruccion> ::= <sentencia> <instruccion> | <sentencia>
<sentencia>   ::= <declarar> | <condicion> | <ciclo> | <asignacion> | <mostrar> | <solicitar>
<declarar>    ::= <tipo> <id> [ = <valor> {<operador><valor>} ] <delimitador>
<tipo>        ::= ent | doble
<condicion>   ::= Si <valorLogico> entonces <inicio> <instruccion> <final>
<ciclo>       ::= Mientras <valorLogico> hacer <inicio> <instruccion> <final>
<asignacion>  ::= <id> = <valor> {<operador><valor>} <delimitador>
<mostrar>     ::= imprimir (<valor> | <literal>) <delimitador>
<solicitar>   ::= leer <id> <delimitador>
<valorLogico> ::= <valor> <comparador> <valor>
<valor>       ::= <id> | <constante>
```
