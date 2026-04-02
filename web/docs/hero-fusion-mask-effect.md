# Hero Fusion Mask Effect

Referencia do prototipo criado para a Bradok e depois portado para o hero real.

## Intencao visual

- O `hero_optimized.mp4` domina quase toda a cena.
- Faltando `2s` para o fim, a marca `BRADOK` nao entra como overlay seco.
- A sensacao buscada e de fusao: o video parece se condensar dentro da marca.
- Em seguida o palco inteiro vai clareando ate chegar num branco lavado.

## Leitura da animacao

1. O video principal roda normalmente.
2. Na janela final, um matte organico comeca a nascer no tamanho final da logo.
3. O conteudo dentro da marca aparece desfocado, luminoso e com `mix-blend` mais suave.
4. A forma assenta, ganha definicao e fixa o video vivo dentro da wordmark.
5. O fundo continua clareando por tras, sem a marca parecer colada por cima.

## Ingredientes do efeito

- `bradok.png` como mascara final fixa.
- Video principal como unica fonte de imagem.
- `canvas` para desenhar o frame atual do video dentro da mascara.
- Matte procedural para a entrada:
  - prioridade para shader/WebGL;
  - fallback 2D em canvas quando WebGL nao estiver disponivel.
- Halo discreto mascarado para dar presenca sem parecer glow barato.
- Fase de fusao no proprio conteudo da mascara:
  - blur inicial;
  - brilho mais alto;
  - contraste mais baixo;
  - `mix-blend-mode: screen` antes do settle;
  - settle para `normal` no final.

## Timing base

- Duracao da janela final: `2s`.
- Reveal da massa: comeca quase imediatamente na janela final.
- Wash branco: entra mais tarde, para a marca respirar antes do fechamento.
- O logo nao muda de tamanho durante a transicao.

## Estrutura tecnica recomendada

Use um componente dedicado, hoje representado por:

- [HeroFusionMask.tsx](d:/bradock/web/src/components/HeroFusionMask.tsx)

Fluxo:

1. Ler `currentTime` do video principal.
2. Calcular `transitionProgress` nos ultimos `2s`.
3. Gerar matte procedural por shader.
4. Desenhar o frame atual do video num `canvas`.
5. Aplicar o matte com `destination-in`.
6. Aplicar a propria `bradok.png` como mascara CSS no canvas final.
7. Sobrepor um veil branco no palco inteiro.

## Parametros que mais mudam o resultado

- `threshold` e `softness` do matte: controlam o quanto a forma parece liquida ou seca.
- `washProgress`: define quando o fundo branco entra.
- `fusionGlowProgress` e `fusionSettleProgress`: controlam a leitura de fusao antes da marca assentar.
- `blur`, `brightness`, `contrast` e `mixBlendMode` do canvas mascarado.

## O que evitar

- Reveal linear esquerda-direita com cara de maquina de escrever.
- White wipe duro por cima do video.
- Escala do logo mudando durante a entrada.
- Glow exagerado ou blur constante ate o fim.
- Particulas ou ruido demais sem formar massa.

## Como portar para outros projetos

1. Troque a logo PNG.
2. Atualize o bounding box da area util da marca.
3. Ajuste o `aspect ratio` do container da palavra.
4. Preserve a janela final de `2s` como ponto de partida.
5. Refine primeiro o matte e o settle antes de mexer no wash branco.

## Observacao

O lab experimental foi removido do roteamento, mas a ideia dele continua viva neste documento e no componente reutilizavel do hero real.
