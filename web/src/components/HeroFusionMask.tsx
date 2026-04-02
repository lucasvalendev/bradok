import { useEffect, useMemo, useRef, type CSSProperties, type RefObject } from 'react';
import bradokLogo from '../assets/bradok.png';

const HERO_LOGO_BOUNDS = {
  x: 91,
  y: 762,
  width: 1864,
  height: 528,
} as const;

const HERO_SOURCE_FRAME_RATE = 60;
const TRANSITION_START_FRAME = 147;
const TRANSITION_DURATION_SECONDS = 2;
const TRANSITION_FIXED_START_SECONDS = TRANSITION_START_FRAME / HERO_SOURCE_FRAME_RATE;
const TRANSITION_ACTIVATION_LEAD_SECONDS = 0.06;

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

const getTransitionStart = (duration: number) => {
  if (duration <= 0) return 0;

  return Math.min(
    Math.max(duration - TRANSITION_DURATION_SECONDS, 0),
    TRANSITION_FIXED_START_SECONDS,
  );
};

const getTransitionProgress = (time: number, duration: number) => {
  if (duration <= 0) return 0;

  return clamp((time - getTransitionStart(duration)) / TRANSITION_DURATION_SECONDS);
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
    ? clamp((transitionProgress - 0.78) / 0.22)
    : easeInOutCubic(clamp((transitionProgress - 0.78) / 0.22));
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
      filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.14))',
    },
    veilStyle: {
      opacity: clamp(washProgress * 0.92),
    },
  };
};

type MaskVisualState = {
  presentation: StagePresentation;
  revealOpacity: number;
  settleProgress: number;
  negativeProgress: number;
  inkProgress: number;
};

const getMaskVisualState = (
  stageWidth: number,
  stageHeight: number,
  transitionProgress: number,
  reducedMotion: boolean,
  isPhoneViewport: boolean,
  isCompactViewport: boolean,
): MaskVisualState => {
  const presentation = getStagePresentation(
    stageWidth,
    stageHeight,
    transitionProgress,
    reducedMotion,
    isPhoneViewport,
    isCompactViewport,
  );

  return {
    presentation,
    revealOpacity: smoothstep(0.04, 0.62, presentation.organicRevealProgress),
    settleProgress: smoothstep(0.28, 0.92, presentation.organicRevealProgress),
    negativeProgress: smoothstep(0.02, 0.24, presentation.organicRevealProgress)
      * (1 - smoothstep(0.58, 0.84, presentation.transitionProgress)),
    inkProgress: smoothstep(0.54, 0.92, presentation.transitionProgress),
  };
};

const renderRevealMatte = (
  outputContext: CanvasRenderingContext2D,
  size: number,
  progress: number,
  reducedMotion: boolean,
  time: number,
) => {
  const easedProgress = reducedMotion ? progress : easeInOutCubic(progress);
  const settle = smoothstep(0.7, 1, easedProgress);
  const drift = reducedMotion ? 0 : Math.sin(time * 1.15) * (1 - settle) * 0.016;
  const blobs = [
    { start: 0.02, x: 0.5, y: 0.52, radius: 0.32, alpha: 0.96 },
    { start: 0.14, x: 0.3, y: 0.54, radius: 0.24, alpha: 0.8 },
    { start: 0.18, x: 0.7, y: 0.46, radius: 0.24, alpha: 0.8 },
    { start: 0.32, x: 0.17, y: 0.45, radius: 0.18, alpha: 0.6 },
    { start: 0.36, x: 0.84, y: 0.6, radius: 0.18, alpha: 0.6 },
  ] as const;

  outputContext.clearRect(0, 0, size, size);
  outputContext.save();

  for (const blob of blobs) {
    const activation = smoothstep(blob.start, blob.start + 0.24, easedProgress);
    if (activation <= 0) continue;

    const x = size * (blob.x + drift * (blob.x < 0.5 ? -1 : 1));
    const y = size * (blob.y + drift * (blob.y > 0.5 ? 0.5 : -0.5));
    const radius = size * blob.radius * (0.24 + activation * 1.04);
    const gradient = outputContext.createRadialGradient(x, y, radius * 0.08, x, y, radius);

    gradient.addColorStop(0, `rgba(255,255,255,${blob.alpha})`);
    gradient.addColorStop(0.48, `rgba(255,255,255,${blob.alpha * (0.52 + activation * 0.18)})`);
    gradient.addColorStop(0.82, `rgba(255,255,255,${0.08 + activation * 0.08})`);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    outputContext.fillStyle = gradient;
    outputContext.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  const finalFill = smoothstep(0.68, 1, easedProgress);
  if (finalFill > 0) {
    outputContext.globalAlpha = finalFill;
    outputContext.fillStyle = '#ffffff';
    outputContext.fillRect(0, 0, size, size);
    outputContext.globalAlpha = 1;
  }

  outputContext.restore();
};

type HeroFusionMaskProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoDuration: number | null;
  viewportWidth: number;
  viewportHeight: number;
  isPhoneViewport: boolean;
  isCompactViewport: boolean;
  lowPowerMode: boolean;
  reducedMotion: boolean;
};

const HeroFusionMask = ({
  videoRef,
  videoDuration,
  viewportWidth,
  viewportHeight,
  isPhoneViewport,
  isCompactViewport,
  lowPowerMode,
  reducedMotion,
}: HeroFusionMaskProps) => {
  const useLiteMask = reducedMotion || lowPowerMode;
  const veilRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const logoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeDuration = videoDuration ?? 0;
  const transitionStart = getTransitionStart(activeDuration);
  const metrics = useMemo(
    () => getLogoMetrics(
      Math.max(viewportWidth, 1),
      Math.max(viewportHeight, 1),
      isPhoneViewport,
      isCompactViewport,
    ),
    [isCompactViewport, isPhoneViewport, viewportHeight, viewportWidth],
  );
  const initialVisualState = useMemo(
    () => getMaskVisualState(
      Math.max(viewportWidth, 1),
      Math.max(viewportHeight, 1),
      0,
      useLiteMask,
      isPhoneViewport,
      isCompactViewport,
    ),
    [isCompactViewport, isPhoneViewport, useLiteMask, viewportHeight, viewportWidth],
  );

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

  const applyVisualState = (visualState: MaskVisualState) => {
    if (veilRef.current) {
      veilRef.current.style.opacity = String(visualState.presentation.veilStyle.opacity ?? 0);
    }

    if (shellRef.current) {
      shellRef.current.style.opacity = String(visualState.presentation.shellStyle.opacity ?? 0);
      shellRef.current.style.transform = visualState.presentation.shellStyle.transform?.toString() ?? 'translate3d(0,0,0) scale(1)';
    }

    if (logoCanvasRef.current) {
      logoCanvasRef.current.style.opacity = String(clamp(visualState.revealOpacity * 1.04));
      logoCanvasRef.current.style.filter = [
        `invert(${clamp(visualState.negativeProgress * 0.98)})`,
        `brightness(${Math.max(0.08, 1.02 - visualState.inkProgress * 0.96)})`,
        `contrast(${1.02 + visualState.inkProgress * 0.36 + visualState.negativeProgress * 0.12})`,
      ].join(' ');
      logoCanvasRef.current.style.transform = `scale(${1.02 - visualState.settleProgress * 0.02})`;
      logoCanvasRef.current.style.mixBlendMode = 'normal';
    }
  };

  useEffect(() => {
    applyVisualState(initialVisualState);
  }, [initialVisualState]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = logoCanvasRef.current;
    if (!video || !canvas || metrics.maskCanvasSize <= 0 || activeDuration <= 0) return;

    const trackedVideo = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (callback: (now: number, metadata: unknown) => void) => number;
      cancelVideoFrameCallback?: (handle: number) => void;
    };

    const context = canvas.getContext('2d');
    if (!context) return;

    const logicalSize = metrics.maskCanvasSize;
    const dpr = 1;
    const pixelSize = Math.max(Math.round(logicalSize * dpr), 1);
    const matteCanvas = document.createElement('canvas');
    const matteResolution = useLiteMask ? 80 : 112;
    const frameIntervalMs = 1000 / (useLiteMask ? 24 : 30);

    matteCanvas.width = matteResolution;
    matteCanvas.height = matteResolution;

    const matteContext = matteCanvas.getContext('2d');
    if (!matteContext) return;

    if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
      canvas.width = pixelSize;
      canvas.height = pixelSize;
      canvas.style.width = `${logicalSize}px`;
      canvas.style.height = `${logicalSize}px`;
    }

    let rafFrame = 0;
    let videoFrame = 0;
    let lastRenderTimestamp = -Infinity;

    const clearCanvas = () => {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, logicalSize, logicalSize);
    };

    const clearScheduledFrame = () => {
      if (rafFrame) {
        window.cancelAnimationFrame(rafFrame);
        rafFrame = 0;
      }

      if (videoFrame && trackedVideo.cancelVideoFrameCallback) {
        trackedVideo.cancelVideoFrameCallback(videoFrame);
        videoFrame = 0;
      }
    };

    const renderCurrentFrame = () => {
      const liveDuration = videoDuration ?? video.duration ?? 0;
      const nextTime = video.ended ? liveDuration : (video.currentTime || 0);

      if (nextTime < transitionStart - TRANSITION_ACTIVATION_LEAD_SECONDS && !video.ended) {
        clearCanvas();
        applyVisualState(initialVisualState);
        return 0;
      }

      const transitionProgress = getTransitionProgress(nextTime, liveDuration);
      const visualState = getMaskVisualState(
        Math.max(viewportWidth, 1),
        Math.max(viewportHeight, 1),
        transitionProgress,
        useLiteMask,
        isPhoneViewport,
        isCompactViewport,
      );
      const revealProgress = visualState.presentation.organicRevealProgress;

      applyVisualState(visualState);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, logicalSize, logicalSize);

      if (video.readyState >= 2 && revealProgress > 0.001) {
        const videoWidth = Math.max(video.videoWidth, 1);
        const videoHeight = Math.max(video.videoHeight, 1);
        const scale = Math.max(logicalSize / videoWidth, logicalSize / videoHeight);
        const drawWidth = videoWidth * scale;
        const drawHeight = videoHeight * scale;
        const drawX = (logicalSize - drawWidth) / 2;
        const drawY = (logicalSize - drawHeight) / 2;

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(video, drawX, drawY, drawWidth, drawHeight);

        renderRevealMatte(matteContext, matteResolution, revealProgress, useLiteMask, video.currentTime);

        context.globalCompositeOperation = 'destination-in';
        context.drawImage(matteCanvas, 0, 0, logicalSize, logicalSize);
        context.globalCompositeOperation = 'source-over';
      }

      return transitionProgress;
    };

    const scheduleNextFrame = () => {
      if (trackedVideo.requestVideoFrameCallback) {
        videoFrame = trackedVideo.requestVideoFrameCallback((now) => {
          videoFrame = 0;
          if (now - lastRenderTimestamp < frameIntervalMs && !video.ended) {
            scheduleNextFrame();
            return;
          }

          lastRenderTimestamp = now;
          const nextProgress = renderCurrentFrame();

          if (!video.paused && !video.ended && nextProgress < 1) {
            scheduleNextFrame();
          }
        });
        return;
      }

      rafFrame = window.requestAnimationFrame((now) => {
        rafFrame = 0;
        if (now - lastRenderTimestamp < frameIntervalMs && !video.ended) {
          scheduleNextFrame();
          return;
        }

        lastRenderTimestamp = now;
        const nextProgress = renderCurrentFrame();

        if (!video.paused && !video.ended && nextProgress < 1) {
          scheduleNextFrame();
        }
      });
    };

    const queueRender = () => {
      clearScheduledFrame();
      lastRenderTimestamp = -Infinity;
      const nextProgress = renderCurrentFrame();

      if (!video.paused && !video.ended && nextProgress < 1) {
        scheduleNextFrame();
      }
    };

    queueRender();

    video.addEventListener('play', queueRender);
    video.addEventListener('pause', queueRender);
    video.addEventListener('timeupdate', queueRender);
    video.addEventListener('seeking', queueRender);
    video.addEventListener('seeked', queueRender);
    video.addEventListener('ended', queueRender);

    return () => {
      clearScheduledFrame();
      video.removeEventListener('play', queueRender);
      video.removeEventListener('pause', queueRender);
      video.removeEventListener('timeupdate', queueRender);
      video.removeEventListener('seeking', queueRender);
      video.removeEventListener('seeked', queueRender);
      video.removeEventListener('ended', queueRender);
    };
  }, [
    activeDuration,
    initialVisualState,
    isCompactViewport,
    isPhoneViewport,
    metrics.maskCanvasSize,
    transitionStart,
    useLiteMask,
    videoDuration,
    videoRef,
    viewportHeight,
    viewportWidth,
  ]);

  return (
    <>
      <div
        ref={veilRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 bg-[#fafafa]"
        style={{ opacity: initialVisualState.presentation.veilStyle.opacity }}
      />

      <div
        ref={shellRef}
        aria-hidden
        className="pointer-events-none absolute z-10"
        style={{
          left: `${metrics.x}px`,
          top: `${metrics.y}px`,
          width: `${metrics.width}px`,
          height: `${metrics.height}px`,
          opacity: initialVisualState.presentation.shellStyle.opacity,
          transform: initialVisualState.presentation.shellStyle.transform,
          transformOrigin: 'center center',
          filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.14))',
          willChange: 'opacity, transform',
        }}
      >
        <canvas
          ref={logoCanvasRef}
          className="absolute"
          style={{
            left: `-${metrics.maskOffsetX}px`,
            top: `-${metrics.maskOffsetY}px`,
            width: `${metrics.maskCanvasSize}px`,
            height: `${metrics.maskCanvasSize}px`,
            opacity: 0,
            transform: 'scale(1.02)',
            willChange: 'opacity, transform, filter',
            ...maskStyle,
          }}
        />
      </div>
    </>
  );
};

export default HeroFusionMask;
