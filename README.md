# Analizador Lexico y Sintactico

Simulacion de software para la materia de **Compiladores (Ciclo VII)**. Es una aplicacion web estatica (HTML + CSS + JavaScript puro, sin dependencias ni backend) que implementa un **analizador lexico** y un **analizador sintactico** para un lenguaje de programacion propio, alineado con la gramatica BNF y las expresiones regulares del lenguaje.

## Funcionalidades

### Analisis Lexico
- Area para ingresar el codigo con **numeracion de lineas**.
- Boton **Analizar** para iniciar el proceso.
- **Listado de tokens generados** (lexema, categoria, codigo de categoria, ocurrencia, token completo y linea).
- **Tabla de simbolos / identificadores** (nombre, tipo, linea de declaracion y valor inicial).
- **Cantidad de lineas analizadas**.
- **Control de errores lexicos** (tipo de error y numero de linea).

### Analisis Sintactico
- **Arbol sintactico** generado segun el codigo ingresado (descenso recursivo LL(1)).
- **Control de errores sintacticos** (mensaje "se esperaba X, se encontro Y" con numero de linea).

## El lenguaje

### Categorias lexicas (expresiones regulares)

| # | Categoria | Expresion regular |
|---|-----------|-------------------|
| 1 | Palabras Reservadas | `^(ent\|doble\|imprimir\|leer\|Si\|entonces\|Mientras\|hacer)$` |
| 2 | Operador Aritmetico | `^(\+|-\|*\|/\|%|\^)$` |
| 3 | Constantes | `^[0-9]+(\.[0-9]+)?$` |
| 4 | Identificadores | `^@[a-zA-Z][a-zA-Z0-9]*$` |
| 5 | Comparadores | `^(==\|<=\|>=\|!=\|>\|<)$` |
| 6 | Simbolos de Inicio | `^(\{\|inicio)$` |
| 7 | Delimitadores | `^(;\|\}\|fin)$` |
| 8 | Operador de Asignacion | `^=$` |
| 9 | Literales | `^"[a-zA-Z0-9]*"$` |

**No forman parte de la gramatica:** parentesis `( )`, operadores logicos `&&` y `||` (se reportan como error lexico).

### Gramatica (BNF)

```
<Programa>     ::= <inicio> <instruccion> <final>
<inicio>       ::= { | inicio
<final>        ::= } | fin
<delimitador>  ::= ;
<instruccion>  ::= <sentencia> <instruccion> | <sentencia>
<sentencia>    ::= <declarar> | <condicion> | <ciclo> | <asignacion> | <mostrar> | <solicitar>
<declarar>     ::= <tipo> <id> {<compleAsig>} <delimitador>
<tipo>         ::= ent | doble
<id>           ::= @ <letra> { <letra> | <digito> }
<condicion>    ::= Si <valorLogico> entonces <inicio> <instruccion> <final>
<valorLogico>  ::= <valor> <comparador> <valor>
<valor>        ::= <id> | <digito> {<digito>} | <digito> {<digito>} . <digito> {<digito>}
<comparador>   ::= > | < | >= | <= | != | ==
<ciclo>        ::= Mientras <valorLogico> hacer <inicio> <instruccion> <final>
<asignacion>   ::= <id> <compleAsig> <delimitador>
<compleAsig>   ::= = <valor> { <operador> <valor> }
<operador>     ::= + | - | * | / | % | ^
<mostrar>      ::= imprimir <valor> | imprimir <literal> <delimitador>
<solicitar>    ::= leer <id> <delimitador>
<literal>      ::= " <letra> { <letra> | <digito> } "
```

Notas:
- `{<compleAsig>}` en `<declarar>` es **opcional** (0 o 1 vez): permite `ent @x ;` y `ent @x = 10 ;`.
- `<instruccion>` exige **al menos una** `<sentencia>` (no se aceptan bloques vacios `{ }`).
- El token lexico se forma con 3 digitos de categoria + 3 digitos de ocurrencia (ej. `005001` = primer comparador).

## Despliegue

Publicar en GitHub Pages: el workflow en `.github/workflows/deploy.yml` despliega la raiz del repositorio.
