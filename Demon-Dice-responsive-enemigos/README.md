# Demon-Dice

Proyecto de juego táctico con dados. Esta versión incorpora una carpeta de recursos gráficos para enemigos y mejoras de diseño responsive.

## Cambios añadidos

| Área | Mejora |
| --- | --- |
| Imágenes de enemigos | Se añadió `assets/enemies/` con diez archivos PNG transparentes: `ogro.png`, `calavera.png`, `dragon.png`, `zombi.png`, `murcielago.png`, `arana.png`, `alien.png`, `brujo.png`, `serpiente.png` y `escorpion.png`. |
| Lógica del juego | `game.js` ahora asigna a cada enemigo una imagen PNG mediante la propiedad `image` y mantiene un fallback con emoji si algún recurso no carga. |
| Responsive | `style.css` escala tablero, dados, enemigos e imágenes con `clamp()`, `aspect-ratio`, `max-width` y media queries. En pantallas pequeñas los paneles se reorganizan en una sola columna. |
| Interacción móvil | Los dados pueden seleccionarse con clic/toque y luego colocarse tocando la zona de destino, además del arrastrar y soltar original. |

## Cómo ejecutar

Abre `index.html` directamente en el navegador o levanta un servidor local desde esta carpeta:

```bash
python3 -m http.server 8000
```

Luego entra en `http://localhost:8000/index.html`.
