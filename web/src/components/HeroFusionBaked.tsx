import { useEffect, useRef, type RefObject } from 'react';
import heroFusionBaked from '../assets/hero_fusion_baked.mp4';

const HERO_SOURCE_FRAME_RATE = 60;
const TRANSITION_START_FRAME = 147;
const TRANSITION_DURATION_SECONDS = 2;
const TRANSITION_FIXED_START_SECONDS = TRANSITION_START_FRAME / HERO_SOURCE_FRAME_RATE;
const TRANSITION_ACTIVATION_LEAD_SECONDS = 0.06;

const getTransitionStart = (duration: number) => {
  if (duration <= 0) return 0;

  return Math.min(
    Math.max(duration - TRANSITION_DURATION_SECONDS, 0),
    TRANSITION_FIXED_START_SECONDS,
  );
};

type HeroFusionBakedProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoDuration: number | null;
};

const HeroFusionBaked = ({ videoRef, videoDuration }: HeroFusionBakedProps) => {
  const bakedVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const sourceVideo = videoRef.current;
    const bakedVideo = bakedVideoRef.current;
    if (!sourceVideo || !bakedVideo) return;

    const trackedVideo = sourceVideo as HTMLVideoElement & {
      requestVideoFrameCallback?: (callback: (now: number, metadata: unknown) => void) => number;
      cancelVideoFrameCallback?: (handle: number) => void;
    };
    const hasVideoFrameCallback = typeof trackedVideo.requestVideoFrameCallback === 'function';

    let rafFrame = 0;
    let videoFrame = 0;

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

    const syncFromSource = (force = false) => {
      const duration = videoDuration ?? sourceVideo.duration ?? 0;
      const revealStart = Math.max(getTransitionStart(duration) - TRANSITION_ACTIVATION_LEAD_SECONDS, 0);
      const sourceTime = sourceVideo.ended ? duration : (sourceVideo.currentTime || 0);
      const targetTime = Math.max(sourceTime - revealStart, 0);
      const bakedDuration = Number.isFinite(bakedVideo.duration) ? bakedVideo.duration : 0;

      if (targetTime <= 0 && !sourceVideo.ended) {
        bakedVideo.style.opacity = '0';
        bakedVideo.pause();
        if (bakedVideo.currentTime > 0.001) {
          bakedVideo.currentTime = 0;
        }
        return !sourceVideo.paused && !sourceVideo.ended;
      }

      bakedVideo.style.opacity = '1';

      const safeDuration = bakedDuration > 0 ? Math.max(bakedDuration - 1 / 60, 0) : targetTime;
      const clampedTargetTime = bakedDuration > 0 ? Math.min(targetTime, safeDuration) : targetTime;

      if (force || Math.abs((bakedVideo.currentTime || 0) - clampedTargetTime) > 0.05) {
        bakedVideo.currentTime = clampedTargetTime;
      }

      if (!sourceVideo.paused && !sourceVideo.ended && (bakedDuration <= 0 || clampedTargetTime < safeDuration)) {
        bakedVideo.play().catch(() => {});
      } else {
        bakedVideo.pause();
      }

      return !sourceVideo.paused && !sourceVideo.ended;
    };

    const scheduleNextSync = () => {
      if (hasVideoFrameCallback) {
        videoFrame = trackedVideo.requestVideoFrameCallback(() => {
          videoFrame = 0;
          if (syncFromSource()) {
            scheduleNextSync();
          }
        });
        return;
      }

      rafFrame = window.requestAnimationFrame(() => {
        rafFrame = 0;
        if (syncFromSource()) {
          scheduleNextSync();
        }
      });
    };

    const queueSync = (force = false) => {
      clearScheduledFrame();
      if (syncFromSource(force)) {
        scheduleNextSync();
      }
    };
    const handleLoadedMetadata = () => queueSync(true);
    const handlePlay = () => queueSync();
    const handlePause = () => queueSync(true);
    const handleSeeking = () => queueSync(true);
    const handleSeeked = () => queueSync(true);
    const handleEnded = () => queueSync(true);
    const handleTimeUpdate = () => queueSync();

    queueSync(true);

    sourceVideo.addEventListener('loadedmetadata', handleLoadedMetadata);
    bakedVideo.addEventListener('loadedmetadata', handleLoadedMetadata);
    sourceVideo.addEventListener('play', handlePlay);
    sourceVideo.addEventListener('pause', handlePause);
    sourceVideo.addEventListener('seeking', handleSeeking);
    sourceVideo.addEventListener('seeked', handleSeeked);
    sourceVideo.addEventListener('ended', handleEnded);
    sourceVideo.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      clearScheduledFrame();
      sourceVideo.removeEventListener('loadedmetadata', handleLoadedMetadata);
      bakedVideo.removeEventListener('loadedmetadata', handleLoadedMetadata);
      sourceVideo.removeEventListener('play', handlePlay);
      sourceVideo.removeEventListener('pause', handlePause);
      sourceVideo.removeEventListener('seeking', handleSeeking);
      sourceVideo.removeEventListener('seeked', handleSeeked);
      sourceVideo.removeEventListener('ended', handleEnded);
      sourceVideo.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoDuration, videoRef]);

  return (
    <video
      ref={bakedVideoRef}
      src={heroFusionBaked}
      muted
      playsInline
      preload="auto"
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 h-full w-full object-cover"
      style={{ opacity: 0, willChange: 'opacity' }}
    />
  );
};

export default HeroFusionBaked;
