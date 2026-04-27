# Paleta · Generador de Colores

Herramienta web para generar paletas de colores de forma rápida e intuitiva. Desarrollada para **Colorfly Studio**.

![Captura de la aplicación](assets/CapturaPage.PNG)

## Instalación

1. Descargá el proyecto desde GitHub: hacé clic en el botón verde **Code** y luego en **Download ZIP**.
2. Descomprimí el archivo ZIP en la carpeta que quieras.
3. Abrí la carpeta y hacé doble clic en `index.html`. Se abre directamente en el navegador.

No requiere instalación de programas, servidores ni conexión a internet (salvo para cargar las tipografías de Google Fonts).

## Uso

Una vez abierto el archivo en el navegador, la app genera una paleta automáticamente. Desde ahí podés generar nuevas paletas, bloquear colores, reordenarlos, guardarlos y exportarlos como imagen.

## Funcionalidades

### Generar paleta
- Hacé clic en **Generar paleta** o presioná <kbd>Espacio</kbd> / <kbd>G</kbd> en el teclado.
- Elegí la cantidad de colores: **6**, **8** o **9**.

### Modos de armonía
| Modo | Descripción |
|---|---|
| Aleatorio | Colores completamente independientes |
| Análogos | Colores vecinos en la rueda cromática (±60°) |
| Complementarios | Dos tonos opuestos (180°) con variaciones |
| Triádicos | Tres tonos equidistantes (120° entre sí) |

### Formato de visualización
Podés ver los códigos en **HEX** o **HSL**. El copiado al portapapeles es siempre en HEX.

### Copiar un color
Hacé clic sobre el color para copiar su código HEX al portapapeles.

### Bloquear colores
Hacé clic en el ícono 🔒 de una tarjeta para bloquear ese color. Los colores bloqueados no se reemplazan al generar una nueva paleta. Para desbloquear todos a la vez usá el botón **Desbloquear todo**.

### Reordenar colores
Arrastrá y soltá las tarjetas para cambiar el orden. Los colores bloqueados también se pueden reordenar.

### Guardar paletas
Hacé clic en **💾 Guardar paleta** para guardar la paleta actual. Las paletas guardadas se almacenan en el navegador (localStorage) y persisten entre sesiones. Podés asignarles un nombre, cargarlas nuevamente o eliminarlas.

### Exportar como PNG
Hacé clic en **🖼 Exportar PNG** para descargar la paleta como imagen.

### Tema claro / oscuro
Usá el botón ☀️ / 🌙 en el encabezado para alternar entre temas. La preferencia se guarda automáticamente.

## Despliegue

La aplicación está disponible en línea via GitHub Pages:
🔗 [https://acperezjulia.github.io/ProyectoM1_AnaliaPerezJulia/](https://acperezjulia.github.io/ProyectoM1_AnaliaPerezJulia/)

## Decisiones técnicas

- **Sin frameworks ni dependencias**: se optó por JavaScript vanilla para mantener el proyecto liviano, sin pasos de build y apto para abrirse directamente como archivo local.
- **HSL internamente, HEX al copiar**: los colores se generan y manipulan en HSL porque facilita el cálculo de armonías cromáticas. Al copiar se convierte a HEX, ya que es el formato estándar que usan los diseñadores de Colorfly Studio.
- **Mobile-first**: los estilos base están pensados para celular y se escalan progresivamente hacia pantallas más grandes con media queries.
- **localStorage para persistencia**: las paletas guardadas y la preferencia de tema se almacenan en el navegador sin necesidad de backend.
- **Funcionalidades extra**: se incorporaron mejoras de UI/UX más allá de los requisitos base — drag & drop para reordenar, exportación como PNG, modos de armonía cromática, barra de controles fija y modo claro/oscuro — con el objetivo de hacer la herramienta más útil y profesional para el uso real del cliente.

## Posibles mejoras

- Permitir ingresar un color propio como punto de partida de la paleta.
- Agregar más modos de armonía (tetrádicos, monocromáticos).
- Historial de paletas generadas (no solo las guardadas manualmente).
- Opción de exportar la paleta como archivo CSS o JSON.
- Vista previa de la paleta aplicada a una UI de ejemplo (botones, fondo, tipografía).

## Tecnologías

- HTML5 semántico con roles ARIA y etiquetas accesibles
- CSS3: variables, Flexbox, CSS Grid, diseño mobile-first, animaciones y transiciones
- JavaScript vanilla (sin frameworks ni dependencias)
- Canvas API para la exportación de paletas como imagen PNG
- localStorage para persistencia de datos en el navegador
