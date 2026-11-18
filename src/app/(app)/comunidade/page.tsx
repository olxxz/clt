'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { ABAS_DA_COMUNIDADE, abaValida } from './abas'
import Analise from './Analise'
import Feedbacks from './Feedbacks'
import Novidades from './Novidades'
import styles from './comunidade.module.sass'

/**
 * Novidades, Feedbacks e Análise eram três entradas no menu para o mesmo
 * assunto: o que está acontecendo com o jogo. Viraram abas (v0.38), e desde a
 * v0.48 as abas são o CABEÇALHO da página, com a aba no endereço
 * (`?aba=feedbacks`): é o que deixa o menu da barra lateral abrir direto
 * numa delas, e o link de uma aba ser compartilhável.
 */
export default function ComunidadePage() {
  // `useSearchParams` no export estático só vive dentro de um Suspense
  return (
    <Suspense fallback={null}>
      <Comunidade />
    </Suspense>
  )
}

function Comunidade() {
  const aba = abaValida(useSearchParams().get('aba'))
  const atual = ABAS_DA_COMUNIDADE.find((a) => a.valor === aba)!

  return (
    <main className="page">
      <header className={styles.cabecalho}>
        <div className={styles.titulos}>
          <h1 className={styles.titulo}>Comunidade</h1>
          <p className={styles.texto}>{atual.texto}</p>
        </div>
        <nav className={styles.abas} aria-label="Seções da comunidade">
          {ABAS_DA_COMUNIDADE.map(({ valor, rotulo, Icon }) => (
            <Link
              key={valor}
              href={valor === 'novidades' ? '/comunidade' : `/comunidade?aba=${valor}`}
              scroll={false}
              replace
              className={`${styles.aba} ${aba === valor ? styles.abaAtiva : ''}`}
              aria-current={aba === valor ? 'page' : undefined}
            >
              <Icon size={17} aria-hidden />
              {rotulo}
            </Link>
          ))}
        </nav>
      </header>

      <div className={styles.conteudo}>
        {aba === 'novidades' ? <Novidades /> : null}
        {aba === 'feedbacks' ? <Feedbacks /> : null}
        {aba === 'analise' ? <Analise /> : null}
      </div>
    </main>
  )
}
