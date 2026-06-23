import os
from PIL import Image, ImageDraw

def create_pixel_art_enemy(name, color):
    # Tamaño base pequeño para el efecto pixel art (32x32)
    base_size = 32
    img = Image.new('RGBA', (base_size, base_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Dibujar una forma básica simplificada "pixelada"
    # Cuerpo central
    draw.rectangle([8, 8, 24, 24], fill=color)
    # Ojos
    draw.point([(12, 12), (20, 12)], fill=(255, 255, 255, 255))
    draw.point([(12, 13), (20, 13)], fill=(0, 0, 0, 255))
    
    # Detalles específicos por enemigo
    if name == 'dragon':
        draw.rectangle([4, 12, 8, 20], fill=color) # Alas
        draw.rectangle([24, 12, 28, 20], fill=color)
        draw.point([(16, 6), (16, 7)], fill=(200, 0, 0, 255)) # Cuerno
    elif name == 'murcielago':
        draw.line([(4, 10), (8, 14)], fill=color, width=1)
        draw.line([(24, 14), (28, 10)], fill=color, width=1)
    elif name == 'calavera':
        draw.rectangle([8, 8, 24, 24], fill=(240, 240, 240, 255))
        draw.rectangle([10, 18, 22, 24], fill=(200, 200, 200, 255))
        draw.point([(12, 12), (20, 12)], fill=(0, 0, 0, 255))
    elif name == 'zombi':
        draw.rectangle([10, 24, 22, 30], fill=(100, 150, 100, 255))
    elif name == 'ogro':
        draw.rectangle([6, 6, 26, 26], fill=color)
        draw.point([(16, 4)], fill=(200, 200, 200, 255)) # Cuerno único
    elif name == 'arana':
        for i in range(4):
            draw.line([(8, 12+i*3), (2, 10+i*3)], fill=color)
            draw.line([(24, 12+i*3), (30, 10+i*3)], fill=color)
    elif name == 'alien':
        draw.ellipse([8, 4, 24, 20], fill=color)
        draw.point([(12, 10), (20, 10)], fill=(0, 0, 0, 255))
    elif name == 'brujo':
        draw.polygon([(16, 2), (8, 10), (24, 10)], fill=(80, 0, 120, 255))
    elif name == 'serpiente':
        draw.line([(16, 8), (16, 28), (20, 28)], fill=color, width=2)
    elif name == 'escorpion':
        draw.line([(16, 8), (28, 4), (28, 12)], fill=color, width=1) # Cola
    
    # Escalar a un tamaño mayor (512x512) usando NEAREST para mantener los bordes definidos (pixel art)
    final_img = img.resize((512, 512), Image.NEAREST)
    return final_img

enemies = {
    'ogro': (70, 130, 70, 255),
    'calavera': (200, 200, 200, 255),
    'dragon': (180, 40, 40, 255),
    'zombi': (80, 120, 80, 255),
    'murcielago': (60, 60, 80, 255),
    'arana': (40, 40, 40, 255),
    'alien': (150, 250, 150, 255),
    'brujo': (100, 50, 150, 255),
    'serpiente': (50, 180, 50, 255),
    'escorpion': (180, 120, 40, 255)
}

os.makedirs('assets/enemies', exist_ok=True)

for name, color in enemies.items():
    img = create_pixel_art_enemy(name, color)
    img.save(f'assets/enemies/{name}.png')
    print(f'Generado pixel art: {name}.png')
