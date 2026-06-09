from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import math

OUT = Path('/home/ubuntu/juego_responsive/assets/enemies')
OUT.mkdir(parents=True, exist_ok=True)

S = 512
SS = 3
W = S * SS

def sc(v):
    if isinstance(v, tuple):
        return tuple(int(x * SS) for x in v)
    return int(v * SS)

def canvas():
    return Image.new('RGBA', (W, W), (0, 0, 0, 0))

def shadow(draw, bbox, blur=22, alpha=90):
    layer = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse(sc(bbox), fill=(0, 0, 0, alpha))
    return layer.filter(ImageFilter.GaussianBlur(sc(blur)))

def save(img, name):
    img = img.resize((S, S), Image.Resampling.LANCZOS)
    img.save(OUT / f'{name}.png')

def draw_eye(d, cx, cy, r=28, glow=(255, 236, 120)):
    d.ellipse(sc((cx-r, cy-r, cx+r, cy+r)), fill=(255, 255, 235, 255))
    d.ellipse(sc((cx-r*0.42, cy-r*0.42, cx+r*0.42, cy+r*0.42)), fill=glow + (255,) if len(glow)==3 else glow)
    d.ellipse(sc((cx-r*0.18, cy-r*0.18, cx+r*0.18, cy+r*0.18)), fill=(30, 20, 20, 255))

def draw_teeth(d, points, fill=(255,255,230,255)):
    d.polygon([sc(p) for p in points], fill=fill)

def ogre():
    img = canvas(); sh = shadow(ImageDraw.Draw(img), (110, 380, 402, 465)); img.alpha_composite(sh)
    d = ImageDraw.Draw(img)
    d.polygon([sc((122,142)), sc((62,72)), sc((158,92))], fill=(181,65,65,255))
    d.polygon([sc((390,142)), sc((450,72)), sc((354,92))], fill=(181,65,65,255))
    d.ellipse(sc((90,98,422,416)), fill=(121, 64, 169, 255), outline=(231,82,82,255), width=sc(12))
    d.ellipse(sc((116,128,396,396)), fill=(143,76,188,255))
    d.arc(sc((155,255,357,365)), 15, 165, fill=(42,20,44,255), width=sc(14))
    draw_eye(d, 197, 219, 31, (255, 211, 70))
    draw_eye(d, 315, 219, 31, (255, 211, 70))
    d.rectangle(sc((164,151,232,175)), fill=(57,25,63,255))
    d.rectangle(sc((280,151,348,175)), fill=(57,25,63,255))
    d.ellipse(sc((238,246,274,280)), fill=(74,39,105,255))
    draw_teeth(d, [(205, 330), (230, 330), (217, 382)])
    draw_teeth(d, [(282, 330), (307, 330), (295, 382)])
    return img

def skull():
    img = canvas(); img.alpha_composite(shadow(ImageDraw.Draw(img), (120,385,392,460)))
    d = ImageDraw.Draw(img)
    d.ellipse(sc((104,78,408,358)), fill=(236,225,196,255), outline=(122,81,141,255), width=sc(12))
    d.rounded_rectangle(sc((168,270,344,414)), radius=sc(42), fill=(221,210,181,255), outline=(122,81,141,255), width=sc(10))
    d.ellipse(sc((154,168,242,260)), fill=(42,36,54,255))
    d.ellipse(sc((270,168,358,260)), fill=(42,36,54,255))
    d.polygon([sc((256,250)), sc((222,312)), sc((290,312))], fill=(72,55,80,255))
    for x in [196, 230, 264, 298]:
        d.line(sc((x,330,x,400)), fill=(92,70,91,255), width=sc(7))
    d.arc(sc((160,265,352,385)), 25, 155, fill=(92,70,91,255), width=sc(8))
    return img

def dragon():
    img = canvas(); img.alpha_composite(shadow(ImageDraw.Draw(img), (106,382,404,465)))
    d = ImageDraw.Draw(img)
    d.polygon([sc((110,165)), sc((48,105)), sc((145,95))], fill=(241,121,43,255))
    d.polygon([sc((402,165)), sc((464,105)), sc((367,95))], fill=(241,121,43,255))
    d.ellipse(sc((86,102,426,394)), fill=(42,151,109,255), outline=(245,142,52,255), width=sc(12))
    d.rounded_rectangle(sc((128,252,384,406)), radius=sc(70), fill=(49,175,123,255), outline=(31,97,82,255), width=sc(8))
    d.polygon([sc((256,52)), sc((226,120)), sc((286,120))], fill=(255,198,73,255))
    draw_eye(d, 196, 202, 25, (255, 102, 64))
    draw_eye(d, 316, 202, 25, (255, 102, 64))
    d.arc(sc((178,285,334,370)), 18, 162, fill=(27,69,58,255), width=sc(10))
    for x in [207, 256, 305]:
        draw_teeth(d, [(x-13,332), (x+13,332), (x,372)])
    d.line(sc((150,155,108,130)), fill=(255,220,76,255), width=sc(10))
    d.line(sc((362,155,404,130)), fill=(255,220,76,255), width=sc(10))
    return img

def zombie():
    img = canvas(); img.alpha_composite(shadow(ImageDraw.Draw(img), (115,385,397,465)))
    d = ImageDraw.Draw(img)
    d.ellipse(sc((96,84,416,396)), fill=(91,159,101,255), outline=(50,105,65,255), width=sc(12))
    d.polygon([sc((158,108)), sc((220,72)), sc((250,115)), sc((306,77)), sc((356,116)), sc((360,154)), sc((154,154))], fill=(45,76,51,255))
    draw_eye(d, 198, 217, 30, (248, 238, 135))
    d.ellipse(sc((288,192,358,262)), fill=(247,238,134,255), outline=(50,105,65,255), width=sc(8))
    d.line(sc((286,195,359,260)), fill=(48,94,57,255), width=sc(9))
    d.arc(sc((178,286,337,365)), 20, 160, fill=(42,78,49,255), width=sc(12))
    d.rectangle(sc((215,330,238,365)), fill=(230,230,195,255))
    d.rectangle(sc((282,330,305,365)), fill=(230,230,195,255))
    return img

def bat():
    img = canvas(); img.alpha_composite(shadow(ImageDraw.Draw(img), (95,390,417,462)))
    d = ImageDraw.Draw(img)
    d.polygon([sc((250,166)), sc((48,102)), sc((98,236)), sc((162,204)), sc((194,292)), sc((256,230))], fill=(48,58,78,255), outline=(26,31,45,255))
    d.polygon([sc((262,166)), sc((464,102)), sc((414,236)), sc((350,204)), sc((318,292)), sc((256,230))], fill=(48,58,78,255), outline=(26,31,45,255))
    d.ellipse(sc((154,116,358,354)), fill=(37,45,65,255), outline=(12,18,29,255), width=sc(10))
    d.polygon([sc((196,126)), sc((175,58)), sc((236,105))], fill=(37,45,65,255))
    d.polygon([sc((316,126)), sc((337,58)), sc((276,105))], fill=(37,45,65,255))
    draw_eye(d, 215, 219, 20, (246, 79, 91))
    draw_eye(d, 297, 219, 20, (246, 79, 91))
    d.arc(sc((210,268,302,326)), 20, 160, fill=(242,242,230,255), width=sc(7))
    draw_teeth(d, [(235,300),(250,300),(243,335)])
    draw_teeth(d, [(262,300),(277,300),(270,335)])
    return img

def spider():
    img = canvas(); img.alpha_composite(shadow(ImageDraw.Draw(img), (85,385,427,462)))
    d = ImageDraw.Draw(img)
    for y in [205,245,285,325]:
        d.line(sc((185,y,70,y-58)), fill=(58,42,76,255), width=sc(14))
        d.line(sc((327,y,442,y-58)), fill=(58,42,76,255), width=sc(14))
        d.line(sc((70,y-58,52,y-30)), fill=(58,42,76,255), width=sc(14))
        d.line(sc((442,y-58,460,y-30)), fill=(58,42,76,255), width=sc(14))
    d.ellipse(sc((128,126,384,378)), fill=(91,59,122,255), outline=(173,78,197,255), width=sc(12))
    for cx in [205,255,305]:
        draw_eye(d, cx, 210, 18, (125, 255, 194))
    d.arc(sc((196,270,316,334)), 20, 160, fill=(238,238,230,255), width=sc(7))
    return img

def alien():
    img = canvas(); img.alpha_composite(shadow(ImageDraw.Draw(img), (110,385,402,465)))
    d = ImageDraw.Draw(img)
    d.ellipse(sc((92,72,420,386)), fill=(32,181,153,255), outline=(19,111,102,255), width=sc(12))
    d.polygon([sc((256,358)), sc((196,446)), sc((316,446))], fill=(31,132,125,255))
    d.ellipse(sc((138,166,242,268)), fill=(8,42,49,255))
    d.ellipse(sc((270,166,374,268)), fill=(8,42,49,255))
    d.ellipse(sc((180,202,205,227)), fill=(150,255,229,230))
    d.ellipse(sc((312,202,337,227)), fill=(150,255,229,230))
    d.line(sc((201,316,311,316)), fill=(7,66,70,255), width=sc(8))
    for x in [168, 344]:
        d.line(sc((x,90,x-35,25)), fill=(42,205,174,255), width=sc(10))
        d.ellipse(sc((x-49,10,x-19,40)), fill=(110,255,210,255))
    return img

def warlock():
    img = canvas(); img.alpha_composite(shadow(ImageDraw.Draw(img), (105,387,407,466)))
    d = ImageDraw.Draw(img)
    d.polygon([sc((112,210)), sc((256,24)), sc((400,210))], fill=(83,43,126,255), outline=(203,58,88,255))
    d.rectangle(sc((150,190,362,222)), fill=(203,58,88,255))
    d.ellipse(sc((126,144,386,402)), fill=(105,48,147,255), outline=(47,22,75,255), width=sc(12))
    d.polygon([sc((146,382)), sc((366,382)), sc((405,462)), sc((107,462))], fill=(53,31,84,255))
    draw_eye(d, 207, 245, 23, (105, 225, 255))
    draw_eye(d, 305, 245, 23, (105, 225, 255))
    d.arc(sc((205,300,307,355)), 15, 165, fill=(238,230,255,255), width=sc(8))
    d.line(sc((372,230,444,114)), fill=(137,90,53,255), width=sc(13))
    d.ellipse(sc((424,86,474,136)), fill=(55,219,255,255))
    return img

def snake():
    img = canvas(); img.alpha_composite(shadow(ImageDraw.Draw(img), (104,392,408,463)))
    d = ImageDraw.Draw(img)
    d.arc(sc((94,186,406,476)), 120, 435, fill=(36,151,84,255), width=sc(74))
    d.ellipse(sc((158,72,386,284)), fill=(57,190,103,255), outline=(25,117,64,255), width=sc(12))
    d.polygon([sc((268,274)), sc((330,390)), sc((210,390))], fill=(48,155,89,255))
    draw_eye(d, 216, 170, 20, (255, 241, 95))
    draw_eye(d, 315, 170, 20, (255, 241, 95))
    d.line(sc((266,220,266,274)), fill=(131,35,45,255), width=sc(8))
    d.line(sc((266,274,238,300)), fill=(225,51,73,255), width=sc(7))
    d.line(sc((266,274,294,300)), fill=(225,51,73,255), width=sc(7))
    for x in [205, 327]:
        draw_teeth(d, [(x-10,230),(x+10,230),(x,266)])
    return img

def scorpion():
    img = canvas(); img.alpha_composite(shadow(ImageDraw.Draw(img), (80,385,432,465)))
    d = ImageDraw.Draw(img)
    d.arc(sc((210,30,430,255)), 180, 340, fill=(224,126,39,255), width=sc(45))
    d.polygon([sc((407,64)), sc((458,45)), sc((432,100))], fill=(255,198,73,255), outline=(155,81,31,255))
    d.ellipse(sc((128,166,384,380)), fill=(214,101,38,255), outline=(135,65,31,255), width=sc(12))
    for x in [196,256,316]:
        d.line(sc((x,380,x-35,442)), fill=(155,76,36,255), width=sc(16))
        d.line(sc((x,380,x+35,442)), fill=(155,76,36,255), width=sc(16))
    d.line(sc((151,228,62,165)), fill=(155,76,36,255), width=sc(18))
    d.line(sc((361,228,450,165)), fill=(155,76,36,255), width=sc(18))
    d.ellipse(sc((34,136,92,194)), fill=(224,126,39,255), outline=(135,65,31,255), width=sc(8))
    d.ellipse(sc((420,136,478,194)), fill=(224,126,39,255), outline=(135,65,31,255), width=sc(8))
    draw_eye(d, 218, 244, 18, (255, 227, 86))
    draw_eye(d, 294, 244, 18, (255, 227, 86))
    d.arc(sc((210,292,302,340)), 20, 160, fill=(72,37,23,255), width=sc(7))
    return img

assets = {
    'ogro': ogre,
    'calavera': skull,
    'dragon': dragon,
    'zombi': zombie,
    'murcielago': bat,
    'arana': spider,
    'alien': alien,
    'brujo': warlock,
    'serpiente': snake,
    'escorpion': scorpion,
}

for name, fn in assets.items():
    save(fn(), name)

print(f'Generadas {len(assets)} imágenes PNG en {OUT}')
