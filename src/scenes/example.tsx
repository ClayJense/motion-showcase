import {makeScene2D, Circle, Line, Txt, Rect} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  waitFor,
  sequence,
  easeInOutCubic,
  easeOutElastic,
  easeInOutExpo,
  chain,
  loop,
  Color,
} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  view.fill('#050810');

  // ─── Layout ───────────────────────────────────────────────────────────────
  const LAYERS = [3, 5, 5, 4, 2]; // neurones par couche
  const LAYER_X = [-480, -240, 0, 240, 480];
  const NODE_RADIUS = 22;
  const COLORS = {
    input:  '#00f5ff',
    hidden: '#7c3aed',
    output: '#f59e0b',
    glow:   '#a78bfa',
    bg:     '#050810',
    line:   '#1e1b4b',
    active: '#f0abfc',
    white:  '#ffffff',
  };

  // ─── Helper: position Y d'un neurone ──────────────────────────────────────
  const nodeY = (layer: number, index: number) => {
    const count = LAYERS[layer];
    const spacing = 90;
    return (index - (count - 1) / 2) * spacing;
  };

  // ─── Créer les refs ────────────────────────────────────────────────────────
  const nodes: ReturnType<typeof createRef<Circle>>[][] = LAYERS.map(count =>
    Array.from({length: count}, () => createRef<Circle>()),
  );
  const connections: ReturnType<typeof createRef<Line>>[] = [];

  // ─── Titre ────────────────────────────────────────────────────────────────
  const title = createRef<Txt>();
  const subtitle = createRef<Txt>();
  const signature = createRef<Txt>();
  const signatureLine = createRef<Rect>();
  const overlay = createRef<Rect>();

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE SETUP
  // ═══════════════════════════════════════════════════════════════════════════

  // Overlay d'intro (fond plein)
  view.add(
    <Rect
      ref={overlay}
      width={1920}
      height={1080}
      fill={COLORS.bg}
      zIndex={10}
      opacity={1}
    />,
  );

  // Connexions (dessinées avant les neurones pour être en dessous)
  for (let l = 0; l < LAYERS.length - 1; l++) {
    for (let i = 0; i < LAYERS[l]; i++) {
      for (let j = 0; j < LAYERS[l + 1]; j++) {
        const ref = createRef<Line>();
        connections.push(ref);
        view.add(
          <Line
            ref={ref}
            points={[
              [LAYER_X[l], nodeY(l, i)],
              [LAYER_X[l + 1], nodeY(l + 1, j)],
            ]}
            stroke={COLORS.line}
            lineWidth={1}
            opacity={0}
          />,
        );
      }
    }
  }

  // Neurones
  const layerColors = [
    COLORS.input,
    COLORS.hidden,
    COLORS.hidden,
    COLORS.hidden,
    COLORS.output,
  ];

  for (let l = 0; l < LAYERS.length; l++) {
    for (let i = 0; i < LAYERS[l]; i++) {
      view.add(
        <Circle
          ref={nodes[l][i]}
          x={LAYER_X[l]}
          y={nodeY(l, i)}
          size={0}
          fill={layerColors[l]}
          opacity={0}
          shadowColor={layerColors[l]}
          shadowBlur={0}
        />,
      );
    }
  }

  // Titre principal
  view.add(
    <Txt
      ref={title}
      text={'NEURAL NETWORK'}
      fontSize={64}
      fontFamily={'monospace'}
      fill={COLORS.white}
      fontWeight={800}
      letterSpacing={12}
      y={-420}
      opacity={0}
    />,
  );

  // Sous-titre
  view.add(
    <Txt
      ref={subtitle}
      text={'Visualizing Deep Learning'}
      fontSize={22}
      fontFamily={'monospace'}
      fill={COLORS.glow}
      letterSpacing={4}
      y={-360}
      opacity={0}
    />,
  );

  // Signature
  view.add(
    <Rect
      ref={signatureLine}
      width={0}
      height={2}
      fill={COLORS.output}
      y={395}
      opacity={0}
    />,
  );
  view.add(
    <Txt
      ref={signature}
      text={'✦  Izayid Ali  ✦'}
      fontSize={28}
      fontFamily={'monospace'}
      fill={COLORS.output}
      letterSpacing={6}
      y={430}
      opacity={0}
    />,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // ANIMATION SEQUENCE
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. Fade out overlay d'intro
  yield* overlay().opacity(0, 1.2, easeInOutExpo);

  // 2. Titre apparaît
  yield* all(
    title().opacity(1, 0.8),
    title().y(-390, 0.8, easeOutElastic),
  );
  yield* subtitle().opacity(1, 0.6);

  yield* waitFor(0.4);

  // 3. Neurones apparaissent couche par couche
  for (let l = 0; l < LAYERS.length; l++) {
    yield* sequence(
      0.06,
      ...nodes[l].map(node =>
        all(
          node().size(NODE_RADIUS * 2, 0.4, easeOutElastic),
          node().opacity(1, 0.3),
          node().shadowBlur(20, 0.4),
        ),
      ),
    );
    yield* waitFor(0.1);
  }

  yield* waitFor(0.3);

  // 4. Connexions apparaissent
  yield* sequence(
    0.008,
    ...connections.map(conn => conn().opacity(0.35, 0.3)),
  );

  yield* waitFor(0.5);

  // 5. Forward pass — vague de propagation couche par couche
  const pulseLayer = async function* (layerIdx: number) {
    const color = layerIdx === LAYERS.length - 1 ? COLORS.output : COLORS.active;
    yield* sequence(
      0.06,
      ...nodes[layerIdx].map(node =>
        chain(
          all(
            node().fill(color, 0.15),
            node().shadowColor(color, 0.15),
            node().shadowBlur(60, 0.15),
            node().size(NODE_RADIUS * 2.8, 0.15),
          ),
          all(
            node().fill(layerColors[layerIdx], 0.4),
            node().shadowColor(layerColors[layerIdx], 0.4),
            node().shadowBlur(20, 0.4),
            node().size(NODE_RADIUS * 2, 0.4),
          ),
        ),
      ),
    );
  };

  // Allumer aussi les connexions pendant la propagation
  const pulseConnections = async function* (fromLayer: number) {
    let idx = 0;
    for (let l = 0; l < LAYERS.length - 1; l++) {
      const count = LAYERS[l] * LAYERS[l + 1];
      const slice = connections.slice(idx, idx + count);
      if (l === fromLayer) {
        yield* sequence(
          0.01,
          ...slice.map(c =>
            chain(
              c().opacity(0.9, 0.12),
              c().stroke(COLORS.active, 0.12),
              all(c().opacity(0.35, 0.4), c().stroke(COLORS.line, 0.4)),
            ),
          ),
        );
      }
      idx += count;
    }
  };

  // 3 passes de forward propagation
  for (let pass = 0; pass < 3; pass++) {
    for (let l = 0; l < LAYERS.length; l++) {
      yield* all(
        pulseLayer(l),
        l < LAYERS.length - 1 ? pulseConnections(l) : waitFor(0),
      );
      yield* waitFor(0.05);
    }
    yield* waitFor(0.3);
  }

  yield* waitFor(0.2);

  // 6. Pulse global "heartbeat"
  yield* loop(2, () =>
    all(
      ...nodes.flat().map(node =>
        chain(
          node().shadowBlur(50, 0.25),
          node().shadowBlur(15, 0.25),
        ),
      ),
    ),
  );

  yield* waitFor(0.4);

  // 7. Signature finale
  yield* all(
    signatureLine().opacity(1, 0.3),
    signatureLine().width(320, 0.6, easeInOutCubic),
  );
  yield* all(
    signature().opacity(1, 0.8, easeInOutCubic),
    signature().y(420, 0.8, easeOutElastic),
  );

  yield* waitFor(1.5);

  // 8. Fade out final
  yield* all(
    overlay().opacity(1, 1.2, easeInOutExpo),
  );

  yield* waitFor(0.3);
});