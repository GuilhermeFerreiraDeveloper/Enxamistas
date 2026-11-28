'use client'

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';

const MASCOT_LINES = [
  'Quer provar do meu melzinho? É mel de abelha, viu? 🍯',
  'Bom dia! Já espalhou gentileza pela colmeia hoje?',
  'Você chegou e meu ferrão até virou coração. 💛',
  'Trabalhando em equipe? Aí sim, enxame de milhões!',
  'Não precisa voar sozinho: aqui a gente vai junto.',
  'Seu brilho hoje tá mais forte que asa no sol.',
  'Se a vida zumbir, dança no ritmo dela. 🎶',
  'A colmeia fica melhor quando você aparece.',
  'Você não é flor, mas deixou meu dia mais doce.',
  'Pausa pra água e um pouquinho de mel. Combinado?',
  'Bee yourself: seu jeito é parte da magia. ✨',
  'A fofoca aqui é só: você arrasou hoje!',
  'Meu coração faz bzz-bzz quando você sorri.',
  'Uma abelha sozinha faz pouco. Um enxame faz história.',
  'Você é a flor mais interessante desse jardim. 🌼',
  'Sem pressão: até abelha tira um tempinho pra descansar.',
  'Se o plano A não voou, temos mais 25 letras no alfabeto.',
  'Seu talento adoça até segunda-feira.',
  'Respeito é o melhor pólen: espalhe por aí.',
  'Alerta de fofura: você está zumbindo por aqui. 🐝',
  'A união faz o mel. E umas boas histórias também.',
  'Você tem passe livre pro meu jardim. 😉',
  'Não é cantada, é pesquisa: você vem sempre à colmeia?',
  'Se beleza desse mel, você abastecia a colmeia toda.',
  'Tem gente que ilumina. Você parece até vaga-lume de jardim.',
  'Cada abelha tem seu ritmo. O seu também tá certo.',
  'Sorria: alguém pode estar precisando desse seu brilho.',
  'Minha agenda de hoje: fazer bzz e te desejar coisa boa.',
  'Hoje é um ótimo dia pra florescer no seu próprio tempo.',
  'Você é o ingrediente secreto dessa colmeia.',
  'A vida é curta: dance antes que o pólen acabe!',
  'Seja gentil. Nunca se sabe quem está num dia de chuva.',
  'Você + essa energia = mel de primeira qualidade.',
  'Até a abelha rainha respeita quem chega com essa presença.',
  'Seu jeito único faz esse enxame ficar completo.',
  'Vamos combinar? Mais carinho, menos ferrão. 💛',
  'Eu ia te oferecer flores, mas você já trouxe o jardim.',
  'Nada de competição: aqui todo mundo pode brilhar.',
  'Você merece um dia doce e sem picada de pernilongo.',
  'Zumbido oficial: você é incrível. Pode arquivar! 🐝',
] as const;

function pickDifferentLine(currentIndex: number) {
  const offset = 1 + Math.floor(Math.random() * (MASCOT_LINES.length - 1));
  return (currentIndex + offset) % MASCOT_LINES.length;
}

export function MascotCompanion() {
  const pathname = usePathname();
  const [lineIndex, setLineIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setLineIndex((current) => pickDifferentLine(current));
  }, [pathname]);

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => {
          setLineIndex((current) => pickDifferentLine(current));
          setVisible(true);
        }}
        className="fixed bottom-[5.75rem] right-3 z-30 grid h-11 w-11 place-items-center rounded-full border border-royal-gold/35 bg-graphite/95 text-royal-gold shadow-xl backdrop-blur-xl transition hover:scale-105 hover:border-royal-gold sm:bottom-24 sm:right-6"
        aria-label="Mostrar mascote da colmeia"
      >
        <Sparkles size={18} />
      </button>
    );
  }

  return (
    <aside className="pointer-events-none fixed bottom-[5.75rem] right-3 z-30 flex max-w-[min(19rem,calc(100vw-1.5rem))] items-end gap-2 sm:bottom-24 sm:right-6" aria-label="Mascote da colmeia">
      <div className="pointer-events-auto relative mb-2 min-w-0 flex-1 rounded-2xl rounded-br-sm border border-royal-gold/25 bg-[#201f22]/95 px-3.5 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl sm:px-4">
        <p className="text-[11px] font-medium leading-relaxed text-white/90 sm:text-xs" aria-live="polite">
          {MASCOT_LINES[lineIndex]}
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-royal-gold/80">Dica da colmeia</span>
          <button
            type="button"
            onClick={() => setLineIndex((current) => pickDifferentLine(current))}
            className="text-[9px] font-bold text-white/55 underline decoration-white/20 underline-offset-2 transition hover:text-white"
            aria-label="Ouvir outra frase do mascote"
          >
            outra frase
          </button>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="text-[9px] font-bold text-white/40 transition hover:text-white"
            aria-label="Ocultar mascote"
          >
            ocultar
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setLineIndex((current) => pickDifferentLine(current))}
        className="pointer-events-auto mb-0.5 grid h-[4.25rem] w-[4.25rem] shrink-0 place-items-center overflow-hidden rounded-[1.4rem] border border-royal-gold/30 bg-gradient-to-br from-royal-gold/15 to-orchid/15 p-1 shadow-xl transition duration-300 hover:-translate-y-1 hover:rotate-2 hover:border-royal-gold/60 sm:h-[4.75rem] sm:w-[4.75rem]"
        aria-label="Trocar frase do mascote"
        title="Clique para ouvir outra frase"
      >
        <img src="/mascote.png" alt="Mascote Enxamista" className="h-full w-full object-contain" />
      </button>
    </aside>
  );
}
