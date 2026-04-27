# Paleta · Generador de Colores

Herramienta web para generar paletas de colores de forma rápida e intuitiva. Desarrollada para **Colorfly Studio**.

![Captura de la aplicación](assets/CapturaPage.png)

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

## Tecnologías

- HTML5 semántico
- CSS3 con variables y diseño mobile-first
- JavaScript vanilla (sin frameworks ni dependencias)
