import { useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
import bradokLogo from '../assets/bradok.png';

const HERO_LOGO_BOUNDS = {
  x: 91,
  y: 762,
  width: 1864,
  height: 528,
} as const;

const TRANSITION_DURATION_SECONDS = 2;
const TRANSITION_ACTIVATION_LEAD_SECONDS = 0.08;
const UI_SYNC_STEP_SECONDS = 1 / 24;

const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);
const easeOutCubic = (value: number) => 1 - Math.pow(1 - clamp(value), 3);
const easeInOutCubic = (value: number) => {
  const t = clamp(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const getLogoMetrics = (
  stageWidth: number,
  stageHeight: number,
  isPhoneViewport: boolean,
  isCompactViewport: boolean,
) => {
  const aspectRatio = HERO_LOGO_BOUNDS.width / HERO_LOGO_BOUNDS.height;
  const width = Math.min(
    stageWidth * (isPhoneViewport ? 0.82 : isCompactViewport ? 0.68 : 0.76),
    stageWidth - (isPhoneViewport ? 32 : isCompactViewport ? 72 : 120),
  );
  const height = width / aspectRatio;
  const x = (stageWidth - width) / 2;
  const y = (stageHeight - height) / 2;
  const imageScale = width / HERO_LOGO_BOUNDS.width;

  return {
    width,
    height,
    x,
    y,
    maskCanvasSize: 2048 * imageScale,
    maskOffsetX: HERO_LOGO_BOUNDS.x * imageScale,
    maskOffsetY: HERO_LOGO_BOUNDS.y * imageScale,
  };
};

type StagePresentation = {
  metrics: ReturnType<typeof getLogoMetrics>;
  transitionProgress: number;
  organicRevealProgress: number;
  shellStyle: CSSProperties;
  veilStyle: CSSProperties;
  spotlightStyle: CSSProperties;
};

const getStagePresentation = (
  stageWidth: number,
  stageHeight: number,
  transitionProgress: number,
  reducedMotion: boolean,
  isPhoneViewport: boolean,
  isCompactViewport: boolean,
): StagePresentation => {
  const metrics = getLogoMetrics(stageWidth, stageHeight, isPhoneViewport, isCompactViewport);
  const easedTransition = reducedMotion ? transitionProgress : easeInOutCubic(transitionProgress);
  const washProgress = reducedMotion
    ? clamp((transitionProgress - 0.5) / 0.5)
    : easeInOutCubic(clamp((transitionProgress - 0.5) / 0.5));
  const organicRevealProgress = reducedMotion
    ? transitionProgress
    : easeOutCubic(clamp((transitionProgress - 0.02) / 0.9));
  const shellAppear = reducedMotion
    ? transitionProgress
    : easeOutCubic(clamp((transitionProgress - 0.04) / 0.78));

  return {
    metrics,
    transitionProgress: easedTransition,
    organicRevealProgress,
    shellStyle: {
      opacity: clamp(shellAppear),
      transform: `translate3d(0, ${reducedMotion ? 0 : (1 - shellAppear) * 12}px, 0) scale(${0.972 + shellAppear * 0.028})`,
      transformOrigin: 'center center',
      filter: 'drop-shadow(0 10px 26px rgba(0,0,0,0.18))',
    },
    veilStyle: {
      opacity: clamp(washProgress * 0.92),
    },
    spotlightStyle: {
      opacity: clamp(shellAppear * (1 - washProgress * 0.35) * 0.22),
      transform: `scale(${0.96 + shellAppear * 0.06})`,
    },
  };
};

type FluidShaderRenderer = {
  canvas: HTMLCanvasElement;
  render: (progress: number, time: number) => void;
  dispose: () => void;
};

const createFluidShaderRenderer = (size: number): FluidShaderRenderer | null => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
    stencil: false,
  });

  if (!gl) return null;

  const vertexSource = `
    attribute vec2 aPosition;
    varying vec2 vUv;

    void main() {
      vUv = (aPosition + 1.0) * 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision mediump float;

    varying vec2 vUv;
    uniform float uProgress;
    uniform float uTime;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);

      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));

      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;

      for (int octave = 0; octave < 4; octave++) {
        value += amplitude * noise(p);
        p *= 2.03;
        amplitude *= 0.52;
      }

      return value;
    }

    float metaball(vec2 uv, vec2 center, float radius, vec2 stretch) {
      vec2 delta = (uv - center) / stretch;
      float distance = length(delta);
      return smoothstep(radius, 0.0, distance);
    }

    void addNode(inout float field, vec2 uv, vec2 baseCenter, float start, float radius, float wobble, float pulse, float progress, float time, float settle) {
      float activation = smoothstep(start, start + 0.24, progress);
      if (activation <= 0.0) return;

      float wobbleScale = (1.0 - settle) * wobble;
      vec2 center = baseCenter + vec2(
        sin(time * 1.1 + pulse) * 0.012 * wobbleScale + cos(time * 0.58 + pulse * 1.6) * 0.006 * wobbleScale,
        cos(time * 0.94 + pulse * 0.83) * 0.014 * wobbleScale
      );

      float ball = metaball(uv, center, radius * (0.24 + activation * 1.08), vec2(1.0, 0.74));
      field += ball * (0.58 + activation * 0.72);
    }

    void main() {
      float progress = clamp(uProgress, 0.0, 1.0);
      float settle = smoothstep(0.72, 1.0, progress);
      float time = uTime * 0.72;
      vec2 uv = vUv;

      vec2 flow = vec2(
        fbm(uv * 3.1 + vec2(0.0, time * 0.18)) - 0.5,
        fbm(uv * 3.1 + vec2(12.4, -time * 0.16)) - 0.5
      );
      uv += flow * 0.085 * (1.0 - settle);

      float field = 0.0;
      field += metaball(uv, vec2(0.5, 0.52), 0.08 + progress * 0.24, vec2(1.0, 0.72)) * (0.48 + progress * 0.4);

      addNode(field, uv, vec2(0.49, 0.53), 0.04, 0.27, 1.2, 0.8, progress, time, settle);
      addNode(field, uv, vec2(0.32, 0.55), 0.10, 0.20, 0.9, 1.3, progress, time, settle);
      addNode(field, uv, vec2(0.66, 0.47), 0.14, 0.21, 1.4, 0.5, progress, time, settle);
      addNode(field, uv, vec2(0.18, 0.42), 0.20, 0.17, 1.1, 1.9, progress, time, settle);
      addNode(field, uv, vec2(0.82, 0.61), 0.26, 0.18, 1.5, 2.4, progress, time, settle);
      addNode(field, uv, vec2(0.43, 0.37), 0.30, 0.16, 1.7, 0.2, progress, time, settle);
      addNode(field, uv, vec2(0.58, 0.68), 0.34, 0.16, 1.3, 2.8, progress, time, settle);
      addNode(field, uv, vec2(0.10, 0.58), 0.40, 0.15, 1.0, 1.5, progress, time, settle);
      addNode(field, uv, vec2(0.90, 0.44), 0.44, 0.15, 1.6, 3.1, progress, time, settle);

      float detail = fbm(uv * 7.8 + vec2(time * 0.16, -time * 0.13));
      field += (detail - 0.5) * 0.09 * (1.0 - settle);

      float threshold = mix(0.34, 0.20, progress);
      float softness = mix(0.12, 0.06, progress);
      float alpha = smoothstep(threshold - softness, threshold + softness, field);
      alpha = max(alpha, settle);

      gl_FragColor = vec4(vec3(1.0), alpha);
    }
  `;

  const compileShader = (shaderType: number, source: string) => {
    const shader = gl.createShader(shaderType);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) {
    if (vertexShader) gl.deleteShader(vertexShader);
    if (fragmentShader) gl.deleteShader(fragmentShader);
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  const positionBuffer = gl.createBuffer();
  if (!positionBuffer) {
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ]),
    gl.STATIC_DRAW,
  );

  const positionLocation = gl.getAttribLocation(program, 'aPosition');
  const progressLocation = gl.getUniformLocation(program, 'uProgress');
  const timeLocation = gl.getUniformLocation(program, 'uTime');

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.viewport(0, 0, size, size);
  gl.clearColor(0, 0, 0, 0);

  return {
    canvas,
    render: (progress: number, time: number) => {
      gl.viewport(0, 0, size, size);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform1f(progressLocation, progress);
      gl.uniform1f(timeLocation, time);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
    dispose: () => {
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    },
  };
};

const renderFluidMatte = (
  fieldContext: CanvasRenderingContext2D,
  outputContext: CanvasRenderingContext2D,
  size: number,
  progress: number,
  reducedMotion: boolean,
  time: number,
) => {
  const easedProgress = reducedMotion ? progress : easeInOutCubic(progress);
  const settle = smoothstep(0.72, 1, easedProgress);
  const timeDrift = reducedMotion ? 0 : time * 0.7;
  const threshold = 0.33 - easedProgress * 0.12;
  const softness = 0.1 - easedProgress * 0.03;
  const fieldNodes = [
    { x: 0.49, y: 0.53, start: 0.04, radius: 0.27, wobble: 1.2, pulse: 0.8 },
    { x: 0.32, y: 0.55, start: 0.1, radius: 0.2, wobble: 0.9, pulse: 1.3 },
    { x: 0.66, y: 0.47, start: 0.14, radius: 0.21, wobble: 1.4, pulse: 0.5 },
    { x: 0.18, y: 0.42, start: 0.2, radius: 0.17, wobble: 1.1, pulse: 1.9 },
    { x: 0.82, y: 0.61, start: 0.26, radius: 0.18, wobble: 1.5, pulse: 2.4 },
    { x: 0.43, y: 0.37, start: 0.3, radius: 0.16, wobble: 1.7, pulse: 0.2 },
    { x: 0.58, y: 0.68, start: 0.34, radius: 0.16, wobble: 1.3, pulse: 2.8 },
    { x: 0.1, y: 0.58, start: 0.4, radius: 0.15, wobble: 1.0, pulse: 1.5 },
    { x: 0.9, y: 0.44, start: 0.44, radius: 0.15, wobble: 1.6, pulse: 3.1 },
  ] as const;

  fieldContext.clearRect(0, 0, size, size);
  fieldContext.fillStyle = '#000000';
  fieldContext.fillRect(0, 0, size, size);
  fieldContext.globalCompositeOperation = 'screen';

  const coreGradient = fieldContext.createRadialGradient(
    size * 0.5,
    size * 0.52,
    size * 0.02,
    size * 0.5,
    size * 0.52,
    size * (0.08 + easedProgress * 0.22),
  );
  coreGradient.addColorStop(0, `rgba(255,255,255,${0.56 + easedProgress * 0.22})`);
  coreGradient.addColorStop(1, 'rgba(255,255,255,0)');
  fieldContext.fillStyle = coreGradient;
  fieldContext.fillRect(0, 0, size, size);

  for (const node of fieldNodes) {
    const activation = smoothstep(node.start, node.start + 0.24, easedProgress);
    if (activation <= 0) continue;

    const wobbleScale = (1 - settle) * node.wobble;
    const x = size * (
      node.x
      + Math.sin(timeDrift * 1.1 + node.pulse) * 0.012 * wobbleScale
      + Math.cos(timeDrift * 0.55 + node.pulse * 1.6) * 0.006 * wobbleScale
    );
    const y = size * (
      node.y
      + Math.cos(timeDrift * 0.95 + node.pulse * 0.8) * 0.014 * wobbleScale
    );
    const radius = size * node.radius * (0.24 + activation * 1.08);
    const gradient = fieldContext.createRadialGradient(x, y, radius * 0.08, x, y, radius);

    gradient.addColorStop(0, `rgba(255,255,255,${0.72 + activation * 0.2})`);
    gradient.addColorStop(0.36, `rgba(255,255,255,${0.42 + activation * 0.24})`);
    gradient.addColorStop(0.72, `rgba(255,255,255,${0.16 + activation * 0.16})`);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    fieldContext.fillStyle = gradient;
    fieldContext.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  fieldContext.globalCompositeOperation = 'source-over';

  const source = fieldContext.getImageData(0, 0, size, size);
  const data = source.data;
  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] / 255;
    const shaped = smoothstep(threshold - softness, threshold + softness, alpha);
    const settled = Math.max(shaped, settle);
    const channel = Math.round(clamp(settled) * 255);

    data[index] = 255;
    data[index + 1] = 255;
    data[index + 2] = 255;
    data[index + 3] = channel;
  }

  outputContext.clearRect(0, 0, size, size);
  outputContext.putImageData(source, 0, 0);
};

type HeroFusionMaskProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoDuration: number | null;
  viewportWidth: number;
  viewportHeight: number;
  isPhoneViewport: boolean;
  isCompactViewport: boolean;
  reducedMotion: boolean;
};

const HeroFusionMask = ({
  videoRef,
  videoDuration,
  viewportWidth,
  viewportHeight,
  isPhoneViewport,
  isCompactViewport,
  reducedMotion,
}: HeroFusionMaskProps) => {
  const logoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const activeDuration = videoDuration ?? 0;
  const transitionStart = activeDuration > 0 ? Math.max(activeDuration - TRANSITION_DURATION_SECONDS, 0) : 0;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || activeDuration <= 0) return;

    let frame = 0;
    let lastCommittedTime = -1;

    const clearFrame = () => {
      if (!frame) return;
      window.cancelAnimationFrame(frame);
      frame = 0;
    };

    const syncPlaybackTime = () => {
      const nextTime = video.ended ? activeDuration : (video.currentTime || 0);

      if (nextTime < transitionStart - TRANSITION_ACTIVATION_LEAD_SECONDS && !video.ended) {
        lastCommittedTime = 0;
        setPlaybackTime(0);
        clearFrame();
        return;
      }

      lastCommittedTime = nextTime;
      setPlaybackTime((current) => (Math.abs(current - nextTime) >= 0.001 ? nextTime : current));
    };

    const updateTime = () => {
      frame = 0;

      const nextTime = video.ended ? activeDuration : (video.currentTime || 0);
      if (nextTime < transitionStart - TRANSITION_ACTIVATION_LEAD_SECONDS && !video.ended) {
        return;
      }

      if (lastCommittedTime < 0 || Math.abs(lastCommittedTime - nextTime) >= UI_SYNC_STEP_SECONDS || video.ended) {
        lastCommittedTime = nextTime;
        setPlaybackTime((current) => (Math.abs(current - nextTime) >= 0.001 ? nextTime : current));
      }

      if (!video.paused && !video.ended && nextTime < activeDuration) {
        frame = window.requestAnimationFrame(updateTime);
      }
    };

    const queueUpdate = () => {
      const nextTime = video.ended ? activeDuration : (video.currentTime || 0);
      if (nextTime < transitionStart - TRANSITION_ACTIVATION_LEAD_SECONDS && !video.ended) {
        return;
      }

      if (!frame) {
        frame = window.requestAnimationFrame(updateTime);
      }
    };

    syncPlaybackTime();

    video.addEventListener('play', queueUpdate);
    video.addEventListener('timeupdate', queueUpdate);
    video.addEventListener('seeking', syncPlaybackTime);
    video.addEventListener('seeked', syncPlaybackTime);
    video.addEventListener('ended', syncPlaybackTime);

    return () => {
      clearFrame();
      video.removeEventListener('play', queueUpdate);
      video.removeEventListener('timeupdate', queueUpdate);
      video.removeEventListener('seeking', syncPlaybackTime);
      video.removeEventListener('seeked', syncPlaybackTime);
      video.removeEventListener('ended', syncPlaybackTime);
    };
  }, [activeDuration, transitionStart, videoRef]);

  const transitionProgress = activeDuration > 0
    ? clamp((playbackTime - transitionStart) / TRANSITION_DURATION_SECONDS)
    : 0;
  const presentation = useMemo(
    () => getStagePresentation(
      Math.max(viewportWidth, 1),
      Math.max(viewportHeight, 1),
      transitionProgress,
      reducedMotion,
      isPhoneViewport,
      isCompactViewport,
    ),
    [isCompactViewport, isPhoneViewport, reducedMotion, transitionProgress, viewportHeight, viewportWidth],
  );
  const fusionGlowProgress = smoothstep(0.04, 0.62, presentation.organicRevealProgress);
  const fusionSettleProgress = smoothstep(0.28, 0.92, presentation.organicRevealProgress);
  const inkLockProgress = smoothstep(0.74, 1, presentation.transitionProgress);
  const finalWhiteLift = smoothstep(0.56, 1, presentation.transitionProgress);

  const maskStyle = useMemo(() => ({
    maskImage: `url(${bradokLogo})`,
    WebkitMaskImage: `url(${bradokLogo})`,
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'top left',
    WebkitMaskPosition: 'top left',
    maskSize: '100% 100%',
    WebkitMaskSize: '100% 100%',
  } as CSSProperties), []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = logoCanvasRef.current;
    if (!video || !canvas || presentation.metrics.maskCanvasSize <= 0 || activeDuration <= 0) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const logicalSize = presentation.metrics.maskCanvasSize;
    const dpr = Math.min(window.devicePixelRatio || 1, reducedMotion ? 1 : 1.5);
    const pixelSize = Math.max(Math.round(logicalSize * dpr), 1);
    const matteCanvas = document.createElement('canvas');
    const fieldCanvas = document.createElement('canvas');
    const matteResolution = reducedMotion ? 128 : 192;
    const shaderRenderer = reducedMotion ? null : createFluidShaderRenderer(matteResolution);

    matteCanvas.width = matteResolution;
    matteCanvas.height = matteResolution;
    fieldCanvas.width = matteResolution;
    fieldCanvas.height = matteResolution;

    const matteContext = matteCanvas.getContext('2d');
    const fieldContext = fieldCanvas.getContext('2d', { willReadFrequently: true });
    if (!matteContext || !fieldContext) return;

    if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
      canvas.width = pixelSize;
      canvas.height = pixelSize;
      canvas.style.width = `${logicalSize}px`;
      canvas.style.height = `${logicalSize}px`;
    }

    let frame = 0;
    const clearCanvas = () => {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, logicalSize, logicalSize);
    };

    const renderFrame = () => {
      frame = 0;

      if (video.readyState >= 2) {
        const videoWidth = Math.max(video.videoWidth, 1);
        const videoHeight = Math.max(video.videoHeight, 1);
        const scale = Math.max(logicalSize / videoWidth, logicalSize / videoHeight);
        const drawWidth = videoWidth * scale;
        const drawHeight = videoHeight * scale;
        const drawX = (logicalSize - drawWidth) / 2;
        const drawY = (logicalSize - drawHeight) / 2;
        const liveDuration = videoDuration ?? video.duration ?? 0;
        const localTransitionStart = Math.max(liveDuration - TRANSITION_DURATION_SECONDS, 0);
        const localTransitionProgress = liveDuration > 0
          ? clamp((video.currentTime - localTransitionStart) / TRANSITION_DURATION_SECONDS)
          : 0;
        const revealProgress = reducedMotion
          ? localTransitionProgress
          : easeOutCubic(clamp((localTransitionProgress - 0.02) / 0.9));

        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.clearRect(0, 0, logicalSize, logicalSize);

        if (revealProgress > 0.001) {
          context.drawImage(video, drawX, drawY, drawWidth, drawHeight);

          if (shaderRenderer) {
            shaderRenderer.render(revealProgress, video.currentTime);
            matteContext.clearRect(0, 0, matteResolution, matteResolution);
            matteContext.drawImage(shaderRenderer.canvas, 0, 0, matteResolution, matteResolution);
          } else {
            renderFluidMatte(fieldContext, matteContext, matteResolution, revealProgress, reducedMotion, video.currentTime);
          }

          context.globalCompositeOperation = 'destination-in';
          context.imageSmoothingEnabled = true;
          context.filter = reducedMotion ? 'blur(3px)' : 'blur(7px)';
          context.drawImage(matteCanvas, 0, 0, logicalSize, logicalSize);
          context.filter = 'none';
          context.globalCompositeOperation = 'source-over';
        }
      }

      const liveDuration = videoDuration ?? video.duration ?? 0;
      const localTransitionStart = Math.max(liveDuration - TRANSITION_DURATION_SECONDS, 0);
      const localTransitionProgress = liveDuration > 0
        ? clamp((video.currentTime - localTransitionStart) / TRANSITION_DURATION_SECONDS)
        : 0;

      if (!video.paused && !video.ended && localTransitionProgress < 1) {
        frame = window.requestAnimationFrame(renderFrame);
      }
    };

    const queueRender = () => {
      const nextTime = video.ended ? activeDuration : (video.currentTime || 0);
      if (nextTime < transitionStart - TRANSITION_ACTIVATION_LEAD_SECONDS && !video.ended) {
        clearCanvas();
        if (frame) {
          window.cancelAnimationFrame(frame);
          frame = 0;
        }
        return;
      }

      if (!frame) {
        frame = window.requestAnimationFrame(renderFrame);
      }
    };

    queueRender();

    video.addEventListener('play', queueRender);
    video.addEventListener('timeupdate', queueRender);
    video.addEventListener('seeking', queueRender);
    video.addEventListener('seeked', queueRender);
    video.addEventListener('ended', queueRender);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      video.removeEventListener('play', queueRender);
      video.removeEventListener('timeupdate', queueRender);
      video.removeEventListener('seeking', queueRender);
      video.removeEventListener('seeked', queueRender);
      video.removeEventListener('ended', queueRender);
      shaderRenderer?.dispose();
    };
  }, [activeDuration, presentation.metrics.maskCanvasSize, reducedMotion, transitionStart, videoDuration, videoRef]);

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 bg-[#fafafa]"
        style={presentation.veilStyle}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute z-10"
        style={{
          left: `${presentation.metrics.x - 56}px`,
          top: `${presentation.metrics.y - 48}px`,
          width: `${presentation.metrics.width + 112}px`,
          height: `${presentation.metrics.height + 96}px`,
          ...presentation.spotlightStyle,
        }}
      >
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.34),rgba(255,255,255,0.12)_34%,rgba(255,255,255,0)_72%)] blur-3xl" />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute z-10"
        style={{
          left: `${presentation.metrics.x}px`,
          top: `${presentation.metrics.y}px`,
          width: `${presentation.metrics.width}px`,
          height: `${presentation.metrics.height}px`,
          ...presentation.shellStyle,
        }}
      >
        <div
          className="absolute"
          style={{
            left: `-${presentation.metrics.maskOffsetX}px`,
            top: `-${presentation.metrics.maskOffsetY}px`,
            width: `${presentation.metrics.maskCanvasSize}px`,
            height: `${presentation.metrics.maskCanvasSize}px`,
            opacity: clamp(presentation.transitionProgress * (1 - presentation.transitionProgress * 0.34) * 0.42),
            filter: reducedMotion ? 'blur(12px)' : 'blur(20px)',
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.9), rgba(255,255,255,0.22) 42%, rgba(255,255,255,0) 72%)',
            ...maskStyle,
          }}
        />

        <canvas
          ref={logoCanvasRef}
          className="absolute"
          style={{
            left: `-${presentation.metrics.maskOffsetX}px`,
            top: `-${presentation.metrics.maskOffsetY}px`,
            width: `${presentation.metrics.maskCanvasSize}px`,
            height: `${presentation.metrics.maskCanvasSize}px`,
            opacity: clamp(fusionGlowProgress * 1.06),
            filter: `blur(${reducedMotion ? 0 : (1 - fusionSettleProgress) * 12}px) brightness(${1.02 - inkLockProgress * 0.74}) contrast(${0.98 + inkLockProgress * 0.54}) saturate(${1.02 - inkLockProgress * 0.24})`,
            transform: `scale(${1.028 - fusionSettleProgress * 0.028})`,
            mixBlendMode: fusionSettleProgress < 0.64 ? 'screen' : 'normal',
            ...maskStyle,
          }}
        />

        <div
          className="absolute"
          style={{
            left: `-${presentation.metrics.maskOffsetX}px`,
            top: `-${presentation.metrics.maskOffsetY}px`,
            width: `${presentation.metrics.maskCanvasSize}px`,
            height: `${presentation.metrics.maskCanvasSize}px`,
            opacity: inkLockProgress * 0.92,
            background: 'radial-gradient(circle at 50% 46%, rgba(10,10,10,0.28) 0%, rgba(3,3,3,0.78) 42%, rgba(0,0,0,0.92) 100%)',
            mixBlendMode: 'multiply',
            ...maskStyle,
          }}
        />

        <div
          className="absolute"
          style={{
            left: `-${presentation.metrics.maskOffsetX}px`,
            top: `-${presentation.metrics.maskOffsetY}px`,
            width: `${presentation.metrics.maskCanvasSize}px`,
            height: `${presentation.metrics.maskCanvasSize}px`,
            opacity: 0.16 + fusionSettleProgress * 0.18 + finalWhiteLift * 0.08,
            filter: reducedMotion ? 'none' : 'blur(10px)',
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2), rgba(255,255,255,0.06) 28%, rgba(255,255,255,0) 62%)',
            mixBlendMode: 'screen',
            ...maskStyle,
          }}
        />
      </div>
    </>
  );
};

export default HeroFusionMask;
