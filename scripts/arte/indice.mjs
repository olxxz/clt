// Escreve `src/data/artes/index.ts` a partir das imagens que existem em
// `src/data/artes/rabisco/` (o nome do arquivo é o id da carta). Rode depois de acrescentar ou trocar imagens:
//   node scripts/arte/indice.mjs
// As imagens são IMPORTADAS, e não um caminho escrito à mão: `src` escrito à
// mão não ganha o `/clt` do GitHub Pages.
import { readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PASTA = join(import.meta.dirname, '..', '..', 'src', 'data', 'artes')
const ESTILOS = ['rabisco']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const importacoes = []
const tabelas = []
for (const estilo of ESTILOS) {
  const ids = readdirSync(join(PASTA, estilo))
    .filter((f) => f.endsWith('.webp'))
    .map((f) => f.slice(0, -5))
    .filter((id) => UUID.test(id))
    .sort()
  const linhas = ids.map((id, i) => {
    importacoes.push(`import ${estilo}${i} from './${estilo}/${id}.webp'`)
    return `  '${id}': ${estilo}${i},`
  })
  tabelas.push(`const ${estilo.toUpperCase()}: Record<string, StaticImageData> = {\n${linhas.join('\n')}\n}`)
}

writeFileSync(
  join(PASTA, 'index.ts'),
  `// GERADO por scripts/arte/indice.mjs — não edite à mão.
import type { StaticImageData } from 'next/image'
${importacoes.join('\n')}

${tabelas.join('\n\n')}

/** A imagem da carta no estilo pedido, ou null (carta sem imagem: fica o
 *  ícone da classe). */
export function arteDaCarta(id: string, estilo: 'rabisco'): string | null {
  return estilo === 'rabisco' ? (RABISCO[id]?.src ?? null) : null
}
`,
)
console.log(`${importacoes.length} imagens no índice`)
