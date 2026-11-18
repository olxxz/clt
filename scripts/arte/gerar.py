"""
Gera a arte das cartas (v0.48) pela API de imagens da OpenAI, nos dois
estilos de Configurações › Aparência: o RABISCO (só a forma, vira máscara e
ganha a cor da raridade no CSS) e a COLAGEM (com as cores dela, sem fundo).

  python3 scripts/arte/gerar.py rabisco,colagem            # o que falta
  python3 scripts/arte/gerar.py colagem "Café" "Reunião"    # só estas
  python3 scripts/arte/gerar.py --refazer                   # só o pós-processo
  node scripts/arte/indice.mjs                              # e o índice

O que já existe em `src/data/artes/<estilo>/<id>.webp` é pulado. A chave vem
de OPENAI_API_KEY; no ambiente da nuvem quem a põe é o proxy. A PNG crua fica
em `scripts/arte/bruto/` (fora do git), para refazer o recorte sem gastar.
Carta nova: uma linha em `catalogo.json` (id e nome) e uma em `cenas.py`.
"""
import json, sys, os, glob, time, base64, ssl, urllib.request, concurrent.futures as cf
from io import BytesIO
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__))
ARTES = os.path.join(D, '..', '..', 'src', 'data', 'artes')
BRUTO = os.path.join(D, 'bruto')
sys.path.insert(0, D)
from cenas import CENAS
CAT = {c['nome']: c for c in json.load(open(os.path.join(D, 'catalogo.json')))}
assert set(CAT) == set(CENAS), set(CAT) ^ set(CENAS)
ESTILOS = {
 'rabisco': ('Desenho de linha simples feito com caneta esferográfica: traço fino e uniforme, de uma espessura só, em tinta preta, '
   'com poucos traços, como um rabisco rápido na margem do caderno. Sem hachura pesada, sem sombra, sem preenchimento, sem cinza. '
   'Só o assunto da cena, sem cenário nem objetos em volta. Pessoas, quando aparecem, são bonecos simples de traço, sem rosto.'),
 'colagem': ('Colagem de recortes de papel de papelaria (papel kraft, post-it, papel quadriculado, recorte de revista, fita adesiva). '
   'POUCOS ELEMENTOS: um assunto central grande, de forma simples e bem visível, com no máximo dois ou três elementos de apoio; '
   'nada de miudezas espalhadas. Cores fortes e contraste claro entre o assunto e o resto. Liberdade artística na composição. '
   'Pessoas, quando aparecem, são silhuetas recortadas de papel, sem rosto desenhado.'),
}
BASE = ('Ilustração para a área de arte de uma carta de um jogo satírico sobre trabalho CLT num escritório brasileiro. '
        'Cena: {cena}. Estilo: {estilo} Nenhum objeto tem rosto, olhos, boca ou expressão: nada antropomorfizado. '
        'Composição horizontal, o assunto centralizado com respiro nas bordas, legível em tamanho pequeno. '
        'Sem nenhum texto, letra ou número escrito, sem moldura. Fundo transparente, sem papel de fundo.')
CA = '/root/.ccr/ca-bundle.crt'
ctx = ssl.create_default_context(cafile=CA if os.path.exists(CA) else None)
CHAVE = os.environ.get('OPENAI_API_KEY', 'proxy-injected')
def gera(par):
    est, nome = par
    c = CAT[nome]
    out = f'{ARTES}/{est}/{c["id"]}.webp'
    if os.path.exists(out): return nome, est, 'ja'
    body = json.dumps({'model': 'gpt-image-1.5', 'prompt': BASE.format(cena=CENAS[nome], estilo=ESTILOS[est]),
        'size': '1536x1024', 'quality': 'medium', 'background': 'transparent', 'output_format': 'png', 'n': 1}).encode()
    req = urllib.request.Request('https://api.openai.com/v1/images/generations', data=body,
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {CHAVE}'})
    for tentativa in range(10):
        try:
            r = json.load(urllib.request.urlopen(req, context=ctx, timeout=300)); break
        except Exception as e:
            erro = e.read().decode()[:200] if hasattr(e, 'read') else str(e)
            # sem crédito não adianta insistir; o limite de 20 imagens por
            # minuto, sim: espera e tenta de novo
            if 'insufficient_quota' in erro: break
            time.sleep(25 if 'Rate limit' in erro else 5)
    else:
        return nome, est, 'ERRO ' + erro
    img = Image.open(BytesIO(base64.b64decode(r['data'][0]['b64_json']))).convert('RGBA')
    os.makedirs(BRUTO, exist_ok=True)
    img.save(f'{BRUTO}/{est}-{c["id"]}.png')
    processar(est, img, out)
    return nome, est, 'ok'

def processar(est, img, out):
    # recorta a margem vazia (a IA deixa muita): o assunto ocupa a área de
    # arte, e o `contain` do CSS centraliza o que sobrar
    caixa = img.split()[-1].point(lambda v: 255 if v > 24 else 0).getbbox()
    if caixa:
        l, t, r, b = caixa
        folga = int(max(r - l, b - t) * 0.03)
        img = img.crop((max(0, l - folga), max(0, t - folga), min(img.width, r + folga), min(img.height, b + folga)))
    if est == 'rabisco':
        # só a FORMA importa: a cor vem do CSS (a da raridade), por máscara.
        # Alfa = tinta, e o RGB vira preto puro
        r_, g_, b_, a_ = img.split()
        lum = Image.merge('RGB', (r_, g_, b_)).convert('L')
        alfa = Image.eval(lum, lambda v: 255 - v)
        from PIL import ImageChops
        alfa = ImageChops.multiply(alfa, a_)
        alfa = alfa.point(lambda v: min(255, int(v * 1.8)))
        # engrossa o traço: na carta da mesa a arte tem ~130 px de largura
        from PIL import ImageFilter
        alfa = alfa.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(1))
        img = Image.merge('RGBA', (Image.new('L', img.size, 0),) * 3 + (alfa,))
        img.thumbnail((540, 360), Image.LANCZOS)
        img.save(out, 'WEBP', quality=80)
    else:
        img.thumbnail((600, 400), Image.LANCZOS)
        img.save(out, 'WEBP', quality=80)
if __name__ == '__main__':
    if sys.argv[1:] == ['--refazer']:
        for f in sorted(glob.glob(f'{BRUTO}/*.png')):
            est, id_ = os.path.basename(f)[:-4].split('-', 1)
            processar(est, Image.open(f).convert('RGBA'), f'{ARTES}/{est}/{id_}.webp')
        sys.exit()
    nomes = sys.argv[2:] or list(CENAS)
    ests = sys.argv[1].split(',')
    with cf.ThreadPoolExecutor(4) as ex:
        for r in ex.map(gera, [(e, n) for e in ests for n in nomes]): print(*r, flush=True)
