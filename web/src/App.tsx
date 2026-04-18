import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Flame, Target, Star, ArrowRight, PlayCircle, Clock, ChevronDown, Award, Menu, MessageCircle, X } from 'lucide-react';
import clsx from 'clsx';
import { useRef, useState, useEffect, useMemo, type MouseEventHandler, type ReactNode } from 'react';
import heroVideo from './assets/hero_optimized.mp4';
import heroPoster from './assets/hero_poster.jpg';
import bradokLogo from './assets/bradok.png';
import donosImage from './assets/donos.jpg';
import espacobradok from './assets/espacobradok.webp';
import movimentoVideo from './assets/movimento.mp4';
import espacobradokVideo from './assets/espacobradokVideo.mp4';
import cardioVideo from './assets/cardio.mp4';
import comercialVideo from './assets/comercial.mp4';
import acompanhamentoProfissionalImage from './assets/fotos/acompanhamentoProfissional.jpg';
import equipamentoDePontaImage from './assets/fotos/equipamentodeponta.webp';
import galoBrancoUnidadeCapa from './assets/fotos/galobrancoUnidadeCapa.webp';
import galoBrancoUnidadeVideo from './assets/fotos/galobrancoUnidade.mp4';
import mulheresBradokImage from './assets/fotos/mulheresbradok.jpg';
import senhoraNaEsteiraImage from './assets/fotos/senhoraNaEsteira.jpg';
import setvilleUnidadeCapa from './assets/fotos/setvileUnidadeCapa.webp';
import setvilleUnidadeVideo from './assets/fotos/setvileUnidade.mp4';
import tecnicasImage from './assets/fotos/tecnicas.jpg';
import videoDroneBradok from './assets/fotos/videoDroneBradok.mp4';
import HeroFusionMask from './components/HeroFusionMask';
import HeroFusionBaked from './components/HeroFusionBaked';

// --- RELATIVE GYMPASS REAL IMAGES ---
const REAL_IMAGE_1 = "https://images.partners.gympass.com/image/partners/5b69fe1b-8427-4191-aaaa-fc979fbc8bb9/lg_b9be4298-e840-470e-81f2-ecb8c03e1dea_IMG20250226WA0005.jpg";
const REAL_IMAGE_2 = donosImage;
const REAL_IMAGE_3 = "https://images.partners.gympass.com/image/partners/5b69fe1b-8427-4191-aaaa-fc979fbc8bb9/lg_504f706d-09b4-44c1-b74c-ebfddbff515a_IMG20250226WA0007.jpg";

const NAV_ITEMS = [
  { href: '#estrutura', label: 'Estrutura' },
  { href: '#unidades', label: 'Unidades' },
  { href: '#equipe', label: 'Equipe' },
  { href: '#depoimentos', label: 'Depoimentos' },
] as const;

const LOCATION_ITEMS = [
  {
    href: 'https://api.whatsapp.com/message/RLASK244K4A4P1?autoload=1&app_absent=0',
    title: 'Galo Branco',
    address: 'Atendimento via WhatsApp da unidade',
  },
  {
    href: 'https://api.whatsapp.com/send/?phone=551239021234&text&type=phone_number&app_absent=0',
    title: 'Setville',
    address: 'Av. José Martins Ferreira, 301',
  },
] as const;

const REELS = [
  { title: 'Foco no Movimento', subtitle: 'Reels / Carga', img: REAL_IMAGE_3, videoSrc: movimentoVideo },
  { title: 'Nosso Espaço', subtitle: 'Reels / Tour', img: espacobradok, videoSrc: espacobradokVideo },
  { title: 'Área Cardio', subtitle: 'Reels / Foco', img: REAL_IMAGE_1, videoSrc: cardioVideo },
  { title: 'Evolução Real', subtitle: 'Reels / Casos', img: REAL_IMAGE_3, videoSrc: comercialVideo },
] as const;

const REVIEWS = [
  { text: 'Ótima academia! Em Especial o instrutor Tony, que me ajudou a perder mais de 15kg em 6 meses com muita dedicação!', author: 'Marcos Paulo', subtitle: 'Local Guide do Google' },
  { text: 'Excelente atendimento, ótimos aparelhos! Professores que sabem o que estão fazendo.', author: 'Jeferson Catarucci', subtitle: '' },
  { text: 'A melhor estrutura do Galo Branco. Sem dor de cabeça, equipamentos de qualidade de verdade.', author: 'Silvania Aguiar', subtitle: '' },
  { text: 'Ambiente acolhedor e focado no que importa. O custo-benefício é excelente para a estrutura oferecida.', author: 'Lucas Mendes', subtitle: '' },
  { text: 'Ambiente sensacional, galera focada e super atenciosa. As máquinas são muito novas e a manutenção impecável.', author: 'Pedro Henrique', subtitle: 'Local Guide' },
  { text: 'Sempre limpo, organizado. O plano super claro me conquistou logo no primeiro mês.', author: 'Camila Santos', subtitle: '' },
] as const;

const clampProgress = (value: number) => Math.min(Math.max(value, 0), 1);
const HERO_INTRO_SCROLL_TRIGGER_DELTA = 4;
const isDemoRecordingSession = () => {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('demo') === 'recording';
};
const getDemoRecordingTake = () => {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('take') ?? '';
};
const getHeroBakeMode = () => {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('bake') ?? '';
};

const resetVideo = (video: HTMLVideoElement | null) => {
  if (!video) return;
  video.pause();
  if (video.currentTime > 0) {
    video.currentTime = 0;
  }
};

const playVideo = (video: HTMLVideoElement | null) => {
  video?.play().catch(() => { });
};

const getViewportState = () => {
  if (typeof window === 'undefined') {
    return {
      width: 1440,
      height: 900,
      isTouchDevice: false,
      isPhoneViewport: false,
      isCompactViewport: false,
      showDesktopNav: true,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  // Avoid classifying touchscreen laptops as touch-first devices.
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  const isLandscape = width > height;
  const isPhoneViewport = width < 640;
  const isCompactViewport = isTouchDevice && isLandscape && height <= 540;

  return {
    width,
    height,
    isTouchDevice,
    isPhoneViewport,
    isCompactViewport,
    showDesktopNav: width >= 768 && !isCompactViewport,
  };
};

const useViewportState = () => {
  const prefersReducedMotion = useReducedMotion();
  const [viewport, setViewport] = useState(getViewportState);

  useEffect(() => {
    const updateViewport = () => setViewport(getViewportState());

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  return {
    ...viewport,
    reducedMotionMode: Boolean(prefersReducedMotion),
  };
};

const useNearScreen = <T extends Element>(enabled: boolean, rootMargin = '240px') => {
  const ref = useRef<T | null>(null);
  const [isNearScreen, setIsNearScreen] = useState(!enabled);

  useEffect(() => {
    if (!enabled || isNearScreen || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsNearScreen(true);
        observer.disconnect();
      },
      { rootMargin }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [enabled, isNearScreen, rootMargin]);

  return { ref, isNearScreen };
};

// --- ANIMATION WRAPPER ---
type FadeUpProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  dataTestId?: string;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: MouseEventHandler<HTMLDivElement>;
};

const FadeUp = ({ children, delay = 0, className = "", dataTestId, onMouseEnter, onMouseLeave }: FadeUpProps) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    className={className}
    data-testid={dataTestId}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    {children}
  </motion.div>
);

// --- TOP NAVBAR ---
const TopNav = ({ showDesktopNav }: { showDesktopNav: boolean }) => {
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const locationMenuRef = useRef<HTMLDivElement>(null);
  const firstDrawerLinkRef = useRef<HTMLAnchorElement>(null);
  const isDrawerVisible = isMobileNavOpen && !showDesktopNav;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!locationMenuRef.current?.contains(event.target as Node)) {
        setIsLocationMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLocationMenuOpen(false);
        setIsMobileNavOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!isDrawerVisible) return;

    const timer = window.setTimeout(() => {
      firstDrawerLinkRef.current?.focus();
    }, 120);

    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(timer);
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
    };
  }, [isDrawerVisible]);

  const closeMenus = () => {
    setIsLocationMenuOpen(false);
    setIsMobileNavOpen(false);
  };

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-white/5 bg-black/80 px-4 py-4 backdrop-blur-md sm:px-6 md:px-12 md:py-5"
      >
        <div className="relative flex h-11 w-[140px] items-center sm:w-[160px] md:h-10 md:w-[180px]">
          <img
            src={bradokLogo}
            alt="Bradok Academia"
            className="pointer-events-none absolute top-1/2 h-[84px] w-auto -translate-y-1/2 object-contain object-left sm:h-[96px] md:h-40"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>

        <nav className={clsx(
          'items-center gap-1 font-bold uppercase tracking-widest text-neutral-400',
          showDesktopNav ? 'flex' : 'hidden'
        )}>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center rounded-full px-3 text-[11px] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bradok-yellow"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div ref={locationMenuRef} className={clsx('relative', showDesktopNav ? 'block' : 'hidden')}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isLocationMenuOpen}
              onClick={() => setIsLocationMenuOpen((current) => !current)}
              className="flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-black shadow-sm transition-all hover:scale-105 hover:bg-bradok-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bradok-yellow"
            >
              Falar com Atendimento
              <ChevronDown className={clsx('h-4 w-4 transition-transform duration-300', isLocationMenuOpen && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {isLocationMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute right-0 top-full mt-3 w-[20rem] rounded-[1.6rem] border border-white/10 bg-neutral-950/96 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                >
                  {LOCATION_ITEMS.map((location, index) => (
                    <a
                      key={location.href}
                      href={location.href}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setIsLocationMenuOpen(false)}
                      className={clsx(
                        'flex min-h-14 items-start gap-3 rounded-[1.2rem] px-4 py-4 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bradok-yellow',
                        index > 0 && 'mt-2'
                      )}
                    >
                      <div className="mt-0.5 rounded-full bg-bradok-yellow/14 p-2 text-bradok-yellow">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-white">{location.title}</p>
                        <p className="mt-1 text-sm text-neutral-400">Atendimento via WhatsApp da unidade</p>
                      </div>
                    </a>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!showDesktopNav && (
            <button
              type="button"
              aria-label={isMobileNavOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-controls="mobile-nav-drawer"
              aria-expanded={isMobileNavOpen}
              onClick={() => setIsMobileNavOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bradok-yellow"
            >
              {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </motion.header>

      <AnimatePresence>
        {isDrawerVisible && (
          <>
            <motion.button
              type="button"
              aria-label="Fechar menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenus}
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
            />

            <motion.div
              id="mobile-nav-drawer"
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-4 top-[5.5rem] z-40 overflow-hidden rounded-[2rem] border border-white/10 bg-neutral-950/96 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
            >
              <nav className="border-b border-white/8 p-3">
                {NAV_ITEMS.map((item, index) => (
                  <a
                    key={item.href}
                    ref={index === 0 ? firstDrawerLinkRef : undefined}
                    href={item.href}
                    onClick={closeMenus}
                    className="flex min-h-12 items-center justify-between rounded-[1.2rem] px-4 py-3 text-sm font-black uppercase tracking-[0.22em] text-white transition-colors hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bradok-yellow"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="h-4 w-4 text-bradok-yellow" />
                  </a>
                ))}
              </nav>

              <div className="grid gap-2 p-3">
                {LOCATION_ITEMS.map((location) => (
                  <a
                    key={location.href}
                    href={location.href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={closeMenus}
                    className="flex min-h-[4.75rem] items-start gap-3 rounded-[1.4rem] border border-white/8 bg-white/4 px-4 py-4 text-left transition-colors hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bradok-yellow"
                  >
                    <div className="rounded-full bg-bradok-yellow/14 p-2 text-bradok-yellow">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-white">{location.title}</p>
                      <p className="mt-1 text-sm text-neutral-400">Atendimento via WhatsApp da unidade</p>
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
// --- REEL CARD COMPONENT (HOVER TO PLAY) ---
const ReelCard = ({
  reel,
  index,
  isTouchDevice,
}: {
  reel: (typeof REELS)[number];
  index: number;
  isTouchDevice: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: cardRef, isNearScreen } = useNearScreen<HTMLDivElement>(true, '160px');
  const [isHovered, setIsHovered] = useState(false);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const canHoverPreview = !isTouchDevice;
  const shouldShowPreview = canHoverPreview ? isHovered : isPreviewActive;
  const shouldLoadVideo = isNearScreen && (canHoverPreview || isPreviewActive);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (shouldShowPreview) {
      playVideo(video);
      return;
    }

    resetVideo(video);
  }, [shouldShowPreview]);

  return (
    <FadeUp delay={index * 0.1} className="relative">
      <div
        ref={cardRef}
        data-testid={`reel-card-${index + 1}`}
        onMouseEnter={() => canHoverPreview && setIsHovered(true)}
        onMouseLeave={() => canHoverPreview && setIsHovered(false)}
        className="group relative aspect-[9/16] overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-900 shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.4)]"
      >
        {!canHoverPreview && (
          <button
            type="button"
            aria-label={isPreviewActive ? `Pausar prévia de ${reel.title}` : `Reproduzir prévia de ${reel.title}`}
            aria-pressed={isPreviewActive}
            onClick={() => setIsPreviewActive((current) => !current)}
            className="absolute inset-0 z-30 cursor-pointer rounded-[2rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bradok-yellow"
          />
        )}

        <img
          src={reel.img}
          alt={reel.title}
          loading="lazy"
          className={clsx(
            'pointer-events-none absolute inset-0 z-10 h-full w-full object-cover transition-[transform,opacity] duration-700',
            shouldShowPreview ? 'scale-105 opacity-0' : 'opacity-100'
          )}
        />

        {shouldLoadVideo && (
          <video
            ref={videoRef}
            src={reel.videoSrc}
            muted
            loop
            playsInline
            preload={canHoverPreview ? 'metadata' : 'none'}
            poster={reel.img}
            className={clsx(
              'pointer-events-none absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-500',
              shouldShowPreview ? 'opacity-100' : 'opacity-0'
            )}
          />
        )}

        <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />

        <div className={clsx(
          'pointer-events-none absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-500',
          canHoverPreview ? (isHovered ? 'opacity-100' : 'opacity-0') : (isPreviewActive ? 'opacity-0' : 'opacity-100')
        )}>
          <PlayCircle className={clsx(
            'h-16 w-16 text-white drop-shadow-md transition-transform duration-300',
            canHoverPreview && isHovered ? 'scale-110' : 'scale-100'
          )} />
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 z-20 p-5 sm:p-6">
          <h3 className={clsx(
            'mt-4 text-2xl font-black uppercase leading-none text-white drop-shadow-sm transition-transform duration-300',
            canHoverPreview && isHovered && '-translate-y-1'
          )}>
            {reel.title}
          </h3>
        </div>
      </div>
    </FadeUp>
  );
};

const UnitPreviewCard = ({
  imageSrc,
  videoSrc,
  alt,
  caption,
  testId,
  isTouchDevice,
}: {
  imageSrc: string;
  videoSrc: string;
  alt: string;
  caption: string;
  testId: string;
  isTouchDevice: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: cardRef, isNearScreen } = useNearScreen<HTMLDivElement>(true, '200px');
  const [isHovered, setIsHovered] = useState(false);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const canHoverPreview = !isTouchDevice;
  const shouldShowPreview = canHoverPreview ? isHovered : isPreviewActive;
  const shouldLoadVideo = isNearScreen && (canHoverPreview || isPreviewActive);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (shouldShowPreview) {
      playVideo(video);
      return;
    }

    resetVideo(video);
  }, [shouldShowPreview]);

  return (
    <div
      ref={cardRef}
      data-testid={testId}
      className="group relative h-[320px] overflow-hidden rounded-[2rem] border border-neutral-200/50 bg-neutral-100 shadow-inner sm:h-[360px] md:h-[400px]"
      onMouseEnter={() => canHoverPreview && setIsHovered(true)}
      onMouseLeave={() => canHoverPreview && setIsHovered(false)}
    >
      {!canHoverPreview && (
        <button
          type="button"
          aria-label={isPreviewActive ? `Pausar prévia de ${alt}` : `Reproduzir prévia de ${alt}`}
          aria-pressed={isPreviewActive}
          onClick={() => setIsPreviewActive((current) => !current)}
          className="absolute inset-0 z-20 cursor-pointer rounded-[2rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bradok-yellow"
        />
      )}

      <img
        src={imageSrc}
        loading="lazy"
        className={clsx(
          'absolute inset-0 h-full w-full object-cover transition-[transform,opacity] duration-700',
          shouldShowPreview ? 'scale-105 opacity-0' : 'opacity-100'
        )}
        alt={alt}
      />

      {shouldLoadVideo && (
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          loop
          playsInline
          preload={canHoverPreview ? 'metadata' : 'none'}
          poster={imageSrc}
          className={clsx(
            'pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
            shouldShowPreview ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}

      {!canHoverPreview && !isPreviewActive && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <PlayCircle className="h-14 w-14 text-white drop-shadow-md" />
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-6 pb-6 pt-32">
        <p className="text-center font-bold uppercase tracking-widest text-white drop-shadow">{caption}</p>
      </div>
    </div>
  );
};

// --- HORIZONTAL SCROLL WOw SECTION ---
const HorizontalScrollCarousel = ({
  isCompactViewport,
  isPhoneViewport,
}: {
  isCompactViewport: boolean;
  isPhoneViewport: boolean;
}) => {
  const targetRef = useRef<HTMLElement | null>(null);
  const x = useMotionValue('0%');

  const images = [
    { title: 'RECEPÇÃO PREMIUM', url: setvilleUnidadeCapa },
    { title: 'EQUIPAMENTOS DE PONTA', url: equipamentoDePontaImage },
    { title: 'IDENTIDADE BRADOK', url: galoBrancoUnidadeCapa },
    { title: 'ÁREA CARDIO', url: senhoraNaEsteiraImage },
    { title: 'ACOMPANHAMENTO NO SALÃO', url: acompanhamentoProfissionalImage },
  ];

  useEffect(() => {
    let frame = 0;

    const measureCarousel = () => {
      const target = targetRef.current;
      if (!target) return;

      const totalScrollableDistance = Math.max(target.offsetHeight - window.innerHeight, 1);
      const progress = clampProgress((window.scrollY - target.offsetTop) / totalScrollableDistance);
      const start = isCompactViewport ? 2 : isPhoneViewport ? 2 : 1.5;
      const end = isCompactViewport ? -38 : isPhoneViewport ? -56 : -65;

      x.set(`${start + (end - start) * progress}%`);
    };

    const queueMeasure = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        measureCarousel();
      });
    };

    queueMeasure();
    window.addEventListener('scroll', queueMeasure, { passive: true });
    window.addEventListener('resize', queueMeasure);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', queueMeasure);
      window.removeEventListener('resize', queueMeasure);
    };
  }, [isCompactViewport, isPhoneViewport, x]);

  return (
    <section
      id="estrutura"
      ref={targetRef}
      className={clsx(
        'relative z-10 bg-black',
        isCompactViewport ? 'h-[220vh]' : isPhoneViewport ? 'h-[250vh]' : 'h-[300vh]'
      )}
    >
      <div className={clsx(
        'sticky top-0 flex overflow-hidden',
        isCompactViewport ? 'h-[100svh] items-start pt-24' : 'h-[100svh] items-center'
      )}>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.03]">
          <h2 className="whitespace-nowrap text-[clamp(6rem,26vw,20rem)] font-black font-heading tracking-tighter text-white">BRADOK.</h2>
        </div>

        <motion.div
          style={{ x, willChange: 'transform' }}
          className={clsx(
            'relative z-10 flex w-max',
            isCompactViewport ? 'gap-4 px-4 pt-4' : 'gap-4 px-4 sm:gap-6 sm:px-6 md:gap-8 md:px-16'
          )}
        >
          <div className={clsx(
            'relative z-20 shrink-0 flex flex-col justify-center',
            isCompactViewport ? 'w-[18rem] max-w-[74vw] pr-5 pt-2' : isPhoneViewport ? 'w-[19rem] max-w-[calc(100vw-5.5rem)] pr-6' : 'w-[42vw] max-w-[34rem] pr-14 xl:max-w-[36rem] md:pr-18'
          )}>
            <h2 className="mb-6 text-[clamp(2.85rem,12vw,4.75rem)] font-heading font-black uppercase leading-[0.82] text-white md:mb-8 md:text-8xl">
              ESTRUTURA<span className="text-bradok-yellow">.</span><br />
              DE ELITE.
            </h2>
            <p className="max-w-[24rem] text-base font-medium leading-relaxed text-neutral-400 sm:text-lg md:max-w-[28rem] md:text-xl">
              Sua jornada merece o melhor espaço. Ambiente pensado para resultados reais.
              Arraste para ver nossos equipamentos e o salão onde sua transformação começa.
            </p>
          </div>

          {images.map((card, index) => (
            <div
              key={index}
              className={clsx(
                'group relative shrink-0 overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-900 shadow-[0_8px_30px_rgb(0,0,0,0.3)]',
                isCompactViewport
                  ? 'h-[38svh] w-[14.5rem]'
                  : isPhoneViewport
                    ? 'h-[48svh] w-[68vw] min-w-[14.5rem] max-w-[17rem]'
                    : 'h-[60vh] w-[68vw] md:w-[43vw]'
              )}
            >
              <img src={card.url} alt={card.title} className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5 sm:p-6 md:p-12">
                <p className="font-heading text-xl font-black uppercase text-white drop-shadow-md sm:text-2xl md:text-5xl">{card.title}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const DemoHeroMark = ({ progress }: { progress: number }) => {
  const revealProgress = clampProgress(progress);
  const washOpacity = clampProgress(revealProgress * 0.9);
  const logoOpacity = clampProgress((revealProgress - 0.04) / 0.72);
  const subtitleOpacity = clampProgress((revealProgress - 0.42) / 0.24);

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 bg-[#FAFAFA]"
        style={{ opacity: washOpacity }}
      />
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.82),rgba(255,255,255,0)_62%)]"
          style={{ opacity: washOpacity * 0.42 }}
        />
        <div
          aria-hidden
          className="flex w-full max-w-[min(76vw,68rem)] flex-col items-center"
          style={{
            opacity: logoOpacity,
            transform: `translate3d(0, ${(1 - logoOpacity) * 14}px, 0) scale(${0.972 + logoOpacity * 0.028})`,
            filter: `blur(${(1 - logoOpacity) * 4}px) drop-shadow(0 14px 32px rgba(0,0,0,0.12))`,
          }}
        >
          <img src={bradokLogo} alt="" className="h-auto w-full object-contain" />
          <div
            className="mt-3 text-center font-heading text-[0.95rem] font-black uppercase tracking-[0.36em] text-neutral-900 sm:mt-5 sm:text-[1.05rem]"
            style={{ opacity: subtitleOpacity }}
          >
            FITNESS ACADEMY.
          </div>
        </div>
      </div>
    </>
  );
};

// --- MAIN APP ---
function App() {
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const { scrollY } = useScroll();
  const isDemoRecording = useMemo(isDemoRecordingSession, []);
  const demoRecordingTake = useMemo(getDemoRecordingTake, []);
  const heroBakeMode = useMemo(getHeroBakeMode, []);
  const { width, height, isTouchDevice, isPhoneViewport, isCompactViewport, showDesktopNav, reducedMotionMode } = useViewportState();
  const shouldUseHeroVideo = true;
  const shouldSkipHeroCapture = isDemoRecording && demoRecordingTake !== '' && demoRecordingTake !== 'hero';
  const shouldUseHeroFusionMask = shouldUseHeroVideo && (!isDemoRecording || demoRecordingTake === 'hero');
  const shouldUseHeroFusionMaskLowPower = reducedMotionMode || isTouchDevice || isPhoneViewport || isCompactViewport;
  const shouldUseHeroFusionBaked = shouldUseHeroFusionMask && !shouldUseHeroFusionMaskLowPower;
  const shouldUseHeroParallax = !reducedMotionMode && !isTouchDevice;
  const heroVideoPlaybackRate = isDemoRecording ? 1.45 : 1;
  const heroTaglineDelay = 6 / heroVideoPlaybackRate;
  const heroDotDelay = 7.56 / heroVideoPlaybackRate;
  const shouldTrackHeroPlayback = isDemoRecording && shouldUseHeroVideo && !shouldUseHeroFusionMask;
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [heroPlaybackTime, setHeroPlaybackTime] = useState(0);
  const [heroIntroStarted, setHeroIntroStarted] = useState(() => !shouldUseHeroVideo);
  const [heroIntroCompleted, setHeroIntroCompleted] = useState(() => !shouldUseHeroVideo);
  const shouldRenderHeroTagline = heroBakeMode !== 'hero-fusion' && heroIntroStarted && (!isDemoRecording || demoRecordingTake === 'hero');
  const [activeTab, setActiveTab] = useState<'galo' | 'setville'>('galo');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { ref: droneCardRef, isNearScreen: shouldLoadDroneVideo } = useNearScreen<HTMLDivElement>(!reducedMotionMode);
  const shouldAnimateTestimonials = !isTouchDevice && !reducedMotionMode;
  const shouldUseDroneVideo = !reducedMotionMode && shouldLoadDroneVideo;
  const isHeroScrollLocked = shouldUseHeroVideo && !heroIntroCompleted && !shouldSkipHeroCapture;

  const heroScale = useTransform(scrollY, [0, 800], [1, reducedMotionMode ? 0.98 : isPhoneViewport ? 0.96 : isCompactViewport ? 0.97 : 0.9]);
  const heroOpacity = useTransform(scrollY, [0, 800], [1, reducedMotionMode ? 0.92 : isPhoneViewport ? 0.58 : 0.3]);
  const heroBorderRadius = useTransform(scrollY, [0, 800], ['0rem', isPhoneViewport || isCompactViewport ? '1.5rem' : '4rem']);
  const heroWashOpacity = useTransform(scrollY, [0, 800], [0, reducedMotionMode ? 0.06 : isPhoneViewport ? 0.08 : 0.12]);
  const heroSubtitleBottom = isCompactViewport ? '30.1svh' : isPhoneViewport ? '33svh' : '21.4svh';
  const heroSectionStyle = shouldUseHeroParallax
    ? { scale: heroScale, opacity: heroOpacity, borderRadius: heroBorderRadius, willChange: 'transform, opacity, border-radius' as const }
    : { willChange: 'auto' as const };

  useEffect(() => {
    if (!shouldUseHeroVideo || shouldSkipHeroCapture) {
      setHeroIntroStarted(true);
      setHeroIntroCompleted(true);
      return;
    }

    setHeroIntroStarted(false);
    setHeroIntroCompleted(false);
    setVideoDuration(null);
    setHeroPlaybackTime(0);
  }, [shouldSkipHeroCapture, shouldUseHeroVideo]);

  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video || !shouldUseHeroVideo || shouldSkipHeroCapture) return;
    let playbackFrame = 0;

    const clearPlaybackFrame = () => {
      if (!playbackFrame) return;
      window.cancelAnimationFrame(playbackFrame);
      playbackFrame = 0;
    };

    const commitPlaybackTime = (force = false) => {
      if (!shouldTrackHeroPlayback) return;

      const nextTime = video.ended ? (video.duration || video.currentTime || 0) : (video.currentTime || 0);
      setHeroPlaybackTime((current) => {
        if (!force && Math.abs(current - nextTime) < 1 / 90) {
          return current;
        }

        return nextTime;
      });
    };

    const updatePlaybackFrame = () => {
      playbackFrame = 0;
      commitPlaybackTime();

      if (!video.paused && !video.ended) {
        playbackFrame = window.requestAnimationFrame(updatePlaybackFrame);
      }
    };

    const queuePlaybackFrame = () => {
      if (!shouldTrackHeroPlayback) return;

      commitPlaybackTime(true);

      if (!playbackFrame && !video.paused && !video.ended) {
        playbackFrame = window.requestAnimationFrame(updatePlaybackFrame);
      }
    };

    const syncMetadata = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        setVideoDuration(video.duration);
      }

      commitPlaybackTime(true);

      if (!heroIntroStarted) {
        video.pause();
        clearPlaybackFrame();

        try {
          video.currentTime = 0;
        } catch {
          // Ignore seek failures before metadata is fully available.
        }
      }
    };

    const handleEnded = () => {
      clearPlaybackFrame();
      if (shouldTrackHeroPlayback) {
        commitPlaybackTime(true);
      }
      setHeroIntroCompleted(true);
    };

    const syncPlaybackTime = () => {
      if (shouldTrackHeroPlayback) {
        commitPlaybackTime(true);
      }
    };

    const startPlayback = () => {
      if (!heroIntroStarted || heroIntroCompleted) return;

      video.defaultMuted = true;
      video.muted = true;
      video.playsInline = true;
      video.playbackRate = heroVideoPlaybackRate;

      try {
        if (video.ended) {
          video.currentTime = 0;
        }
      } catch {
        // Ignore seek failures before metadata is fully available.
      }

      video.play().catch(() => {
        clearPlaybackFrame();
        setHeroIntroCompleted(true);
      });
    };

    if (video.readyState >= 1) {
      syncMetadata();
    }

    if (heroIntroStarted) {
      startPlayback();
    }

    video.addEventListener('loadedmetadata', syncMetadata);
    video.addEventListener('loadeddata', startPlayback);
    video.addEventListener('canplay', startPlayback);
    video.addEventListener('ended', handleEnded);

    if (shouldTrackHeroPlayback) {
      video.addEventListener('play', queuePlaybackFrame);
      video.addEventListener('pause', syncPlaybackTime);
      video.addEventListener('seeking', syncPlaybackTime);
      video.addEventListener('seeked', syncPlaybackTime);
      video.addEventListener('timeupdate', syncPlaybackTime);
    }

    return () => {
      clearPlaybackFrame();
      video.removeEventListener('loadedmetadata', syncMetadata);
      video.removeEventListener('loadeddata', startPlayback);
      video.removeEventListener('canplay', startPlayback);
      video.removeEventListener('ended', handleEnded);

      if (shouldTrackHeroPlayback) {
        video.removeEventListener('play', queuePlaybackFrame);
        video.removeEventListener('pause', syncPlaybackTime);
        video.removeEventListener('seeking', syncPlaybackTime);
        video.removeEventListener('seeked', syncPlaybackTime);
        video.removeEventListener('timeupdate', syncPlaybackTime);
      }
    };
  }, [heroIntroCompleted, heroIntroStarted, heroVideoPlaybackRate, shouldSkipHeroCapture, shouldTrackHeroPlayback, shouldUseHeroVideo]);

  useEffect(() => {
    if (!isHeroScrollLocked) return;

    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    const previousScrollRestoration = 'scrollRestoration' in window.history ? window.history.scrollRestoration : null;
    let touchStartY = 0;

    const startHeroIntro = () => {
      if (heroIntroStarted) return;
      setHeroIntroStarted(true);
    };

    const keepAtTop = () => {
      if (window.scrollY !== 0) {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.deltaY > HERO_INTRO_SCROLL_TRIGGER_DELTA && !heroIntroStarted) {
        startHeroIntro();
      }

      event.preventDefault();
      keepAtTop();
    };

    const handleTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0]?.clientY ?? 0;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const currentY = event.touches[0]?.clientY ?? touchStartY;

      if (currentY < touchStartY - 6 && !heroIntroStarted) {
        startHeroIntro();
      }

      event.preventDefault();
      keepAtTop();
    };

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    if (previousScrollRestoration !== null) {
      window.history.scrollRestoration = 'manual';
    }
    keepAtTop();

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
      if (previousScrollRestoration !== null) {
        window.history.scrollRestoration = previousScrollRestoration;
      }
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [heroIntroStarted, isHeroScrollLocked]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.demoMode = isDemoRecording ? 'recording' : 'default';
    root.dataset.demoHeroState = !shouldUseHeroVideo
      ? 'disabled'
      : heroIntroCompleted
        ? 'done'
        : heroIntroStarted
          ? 'playing'
          : 'idle';
    root.dataset.demoActiveUnit = activeTab;
    root.dataset.demoOpenFaq = openFaq === null ? '' : String(openFaq + 1);

    return () => {
      delete root.dataset.demoMode;
      delete root.dataset.demoHeroState;
      delete root.dataset.demoActiveUnit;
      delete root.dataset.demoOpenFaq;
    };
  }, [
    activeTab,
    heroIntroCompleted,
    heroIntroStarted,
    isDemoRecording,
    demoRecordingTake,
    openFaq,
    shouldUseHeroVideo,
  ]);

  const faqs = [
    { q: 'Precisa agendar para treinar?', a: 'Na Bradok você treina no seu ritmo. Não trabalhamos com agendamentos burocráticos. Você é dono do seu horário.' },
    { q: 'Quais os horários de pico?', a: 'Nosso pico costuma ser entre 18:00 e 20:00. Mas com o amplo espaço e maquinário duplicado em áreas chaves, o fluxo é constante e você não fica parado.' },
    { q: 'Vocês aceitam Gympass (Wellhub) e TotalPass?', a: 'Sim! Somos parceiros oficiais do TotalPass e Wellhub (antigo Gympass) nos planos adequados.' },
    { q: 'O Instrutor acompanha meu treino na musculação?', a: 'Temos uma equipe pesada (incluindo o lendário Prof. Tony) sempre disponível no salão para correção de movimentos, sem precisar pagar Personal.' }
  ];

  return (
    <div className="min-h-screen overflow-x-clip bg-[#FAFAFA] text-neutral-900 font-body selection:bg-bradok-yellow selection:text-black">
      <TopNav showDesktopNav={showDesktopNav} />
      {/* 1. HERO WOW (AUTOPLAY ENTRANCE + SOFT WASH ON SCROLL) */}
      <motion.section
        style={heroSectionStyle}
        className="sticky top-0 z-0 flex h-[100svh] w-full items-center justify-center overflow-hidden origin-top bg-black shadow-[0_20px_60px_rgba(0,0,0,0.05)]"
      >
        <motion.div
          initial={false}
          animate={{ scale: shouldUseHeroVideo && heroIntroStarted ? 1 : 1.06 }}
          transition={{ duration: reducedMotionMode ? 0.8 : shouldUseHeroVideo ? (isDemoRecording ? 3.6 : 6) : 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ willChange: 'transform' }}
          className="absolute inset-0 z-0 h-full w-full bg-black"
        >
          {!shouldUseHeroVideo && (
            <img src={heroPoster} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-90" />
          )}
          {shouldUseHeroVideo && (
            <video
              ref={heroVideoRef}
              src={heroVideo}
              muted
              playsInline
              preload="metadata"
              poster={heroPoster}
              onLoadedMetadata={(event) => {
                setVideoDuration(event.currentTarget.duration);
                if (!heroIntroStarted) {
                  event.currentTarget.currentTime = 0;
                  event.currentTarget.pause();
                }
              }}
              className="absolute inset-0 h-full w-full object-cover opacity-90"
              style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden', willChange: 'transform, opacity' }}
            />
          )}
          <motion.div className="pointer-events-none absolute inset-0 bg-[#FAFAFA]" style={{ opacity: heroWashOpacity }} />
        </motion.div>

        {shouldUseHeroFusionBaked && heroIntroStarted && (
          <HeroFusionBaked
            videoRef={heroVideoRef}
            videoDuration={videoDuration}
          />
        )}

        {!shouldUseHeroFusionBaked && shouldUseHeroFusionMask && heroIntroStarted && (
          <HeroFusionMask
            videoRef={heroVideoRef}
            videoDuration={videoDuration}
            viewportWidth={width}
            viewportHeight={height}
            isPhoneViewport={isPhoneViewport}
            isCompactViewport={isCompactViewport}
            lowPowerMode={shouldUseHeroFusionMaskLowPower}
            reducedMotion={reducedMotionMode}
          />
        )}

        {isDemoRecording && shouldUseHeroVideo && heroIntroStarted && !heroIntroCompleted && !shouldUseHeroFusionMask && (
          <DemoHeroMark
            progress={
              videoDuration && videoDuration > 0
                ? clampProgress((heroPlaybackTime - Math.max(videoDuration - 1.6, 0)) / 1.6)
                : 0
            }
          />
        )}

        {shouldRenderHeroTagline && (
          <div className="pointer-events-none absolute inset-x-0 z-20 flex justify-center px-4" style={{ bottom: heroSubtitleBottom }}>
          <div className="flex items-baseline">
            <h2 className="ml-[0.3em] font-heading text-[14px] font-black uppercase tracking-[0.32em] text-black sm:text-base md:text-[1.9vw] md:tracking-[0.4em]">
              {'FITNESS ACADEMY'.split('').map((char, index) => (
                <motion.span
                  key={`${char}-${index}-${shouldRenderHeroTagline ? 'started' : 'idle'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.05, delay: heroTaglineDelay + index * 0.08 }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </h2>
            <motion.div
              key={`hero-dot-${shouldRenderHeroTagline ? 'started' : 'idle'}`}
              initial={{ y: '-80vh' }}
              animate={{
                y: ['-80vh', '0vh', '-15vh', '-2vh', '0vh'],
              }}
              transition={{
                delay: heroDotDelay,
                duration: 1.4,
                times: [0, 0.42, 0.68, 0.88, 1],
                ease: [
                  [0.55, 0, 0.9, 0.3],
                  [0.2, 0.8, 0.35, 1],
                  [0.55, 0, 0.9, 0.4],
                  [0.2, 0.9, 0.4, 1],
                ],
              }}
              className="relative ml-2 h-3.5 w-3.5 md:ml-[0.6vw] md:h-[0.81vw] md:w-[0.81vw]"
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-[#FFCC00] mix-blend-screen"
              />
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-black mix-blend-multiply"
              />
            </motion.div>
          </div>
          </div>
        )}
      </motion.section>

      {/* 2. THE WOW SECTION: HORIZONTAL SCROLL MULTI-IMAGES */}
      <HorizontalScrollCarousel isCompactViewport={isCompactViewport} isPhoneViewport={isPhoneViewport} />

      {/* 2.5 ARSENAL (BENTO GRID FEATURE) */}
      <section className="relative z-10 py-32 px-6 md:px-16 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto">
          <FadeUp className="mb-16">
            <h2 className="text-5xl md:text-7xl font-heading font-black uppercase text-black leading-none tracking-tight">
              NOSSA ESTRUTURA<span className="text-bradok-yellow">.</span>
            </h2>
            <p className="mt-4 text-neutral-500 font-medium text-lg">Equipamentos selecionados para maximizar seus resultados, em um ambiente pensado para você evoluir.</p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[500px]">
            {/* BENTO CARD 1: LARGE */}
            <FadeUp delay={0.1} className="md:col-span-2 md:row-span-2 bg-black border border-neutral-950 p-8 flex flex-col justify-end relative overflow-hidden group rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <img src={REAL_IMAGE_1} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-700" alt="Pesos" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <div className="relative z-10 text-white">
                <h3 className="text-4xl font-black font-heading uppercase tracking-tight">Área de<br />Peso Livre</h3>
                <p className="text-neutral-300 mt-2 font-medium max-w-sm">Halteres de todas as cargas e anilhas em abundância. Espaço inteligente para você focar no treino, sem filas.</p>
              </div>
            </FadeUp>

            {/* BENTO CARD 2: WIDE */}
            <FadeUp delay={0.2} className="md:col-span-2 md:row-span-1 bg-white border border-neutral-200 p-8 flex flex-col justify-between relative overflow-hidden group rounded-[2rem] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start relative z-10">
                <h3 className="text-3xl font-black font-heading uppercase text-black tracking-tight">PARCEIROS<br />OFICIAIS</h3>
                <Award className="w-12 h-12 text-neutral-200 group-hover:text-bradok-yellow transition-colors duration-500" />
              </div>
              <div className="flex gap-4 font-black text-xl relative z-10 mt-6 md:mt-0">
                <span className="bg-neutral-100/80 text-neutral-900 border border-neutral-200 px-5 py-2 rounded-full text-xs tracking-wider">WELLHUB</span>
                <span className="bg-neutral-100/80 text-neutral-900 border border-neutral-200 px-5 py-2 rounded-full text-xs tracking-wider">TOTALPASS</span>
              </div>
            </FadeUp>

            {/* BENTO CARD 3: SMALL */}
            <FadeUp delay={0.3} className="md:col-span-1 md:row-span-1 group bg-white border border-neutral-200 p-8 flex flex-col justify-center rounded-[2rem] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <Clock className="w-10 h-10 text-neutral-300 mb-4 group-hover:text-bradok-yellow transition-colors" />
              <h3 className="text-2xl font-black font-heading uppercase text-black tracking-tight">Até a<br />Meia Noite</h3>
              <p className="text-neutral-500 text-sm mt-3 leading-relaxed">Fechamos às 00:00 no Galo Branco e 23:59 em Setville.</p>
            </FadeUp>

            {/* BENTO CARD 4: SMALL */}
            <FadeUp delay={0.4} className="md:col-span-1 md:row-span-1 bg-black border border-neutral-900 p-8 flex flex-col justify-center relative overflow-hidden group rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-xl hover:-translate-y-1 transition-all">
              <img src={REAL_IMAGE_2} className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:opacity-20 transition-opacity" alt="Equipe" />
              <div className="relative z-10">
                <Flame className="w-10 h-10 text-bradok-yellow mb-4" />
                <h3 className="text-2xl font-black font-heading uppercase text-white tracking-tight">100%<br />SUPORTE</h3>
                <p className="text-neutral-400 text-sm mt-3 leading-relaxed">Acompanhamento próximo por nossa equipe para garantir que sua execução seja perfeita e segura.</p>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* 3. REELS GRID (EXPERIENCE) -> REAL HOVER TO PLAY */}
      <section id="experiencia" className="relative z-10 border-t border-black bg-neutral-950 py-20 sm:py-24 md:pb-32 md:pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-16">
          <FadeUp className="mb-10 flex flex-col gap-6 border-b border-neutral-800 pb-8 md:mb-16 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-4xl font-heading font-black uppercase leading-none text-white sm:text-5xl md:text-6xl">
                Vivencie a Experiência
              </h2>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <p className="text-base font-medium text-neutral-400 sm:text-lg">Conheça a</p>
                <span className="font-heading text-[1.9rem] leading-none font-black uppercase tracking-[-0.04em] text-white">
                  BRADOK
                </span>
              </div>
            </div>
            <a href="https://instagram.com/academiabradok" target="_blank" rel="noreferrer" className="hidden min-h-11 items-center gap-2 text-sm font-bold uppercase text-bradok-yellow transition-colors hover:text-yellow-500 md:flex">
              Ver Vídeos no Instagram <ArrowRight className="w-4 h-4" />
            </a>
          </FadeUp>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
            {REELS.map((reel, index) => (
              <ReelCard
                key={reel.title}
                reel={reel}
                index={index}
                isTouchDevice={isTouchDevice}
              />
            ))}
          </div>

          <a
            href="https://instagram.com/academiabradok"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold uppercase text-bradok-yellow transition-colors hover:text-yellow-500 md:hidden"
          >
            Ver Vídeos no Instagram <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* 4. LOCATIONS (ABAS INTERATIVAS) - REAL IMAGES */}
      <section id="unidades" className="relative z-10 bg-[#FAFAFA] px-4 py-20 sm:px-6 sm:py-24 md:px-16 md:py-32">
        <div className="mx-auto max-w-7xl">
          <FadeUp className="mb-12 text-center md:mb-16">
            <h2 className="text-4xl font-heading font-black uppercase text-neutral-900 sm:text-5xl md:text-7xl">
              NOSSAS UNIDADES
            </h2>
          </FadeUp>

          <div role="tablist" aria-label="Selecione a unidade" className="relative z-10 mb-10 flex flex-col justify-center gap-3 md:mb-16 md:flex-row md:gap-8">
            <button
              id="unit-tab-galo"
              role="tab"
              type="button"
              aria-selected={activeTab === 'galo'}
              aria-controls="unit-panel-galo"
              onClick={() => setActiveTab('galo')}
              className={`min-h-12 flex-1 rounded-[1.5rem] border-b-4 px-6 py-4 font-heading text-lg font-black uppercase tracking-[0.12em] transition-all sm:px-8 sm:py-5 sm:text-xl md:flex-none md:rounded-t-[2rem] md:px-12 md:py-6 md:text-3xl ${activeTab === 'galo' ? 'border-bradok-yellow bg-white text-neutral-900 shadow-sm' : 'border-transparent text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700'}`}
            >
              Galo Branco
            </button>
            <button
              id="unit-tab-setville"
              role="tab"
              type="button"
              aria-selected={activeTab === 'setville'}
              aria-controls="unit-panel-setville"
              onClick={() => setActiveTab('setville')}
              className={`min-h-12 flex-1 rounded-[1.5rem] border-b-4 px-6 py-4 font-heading text-lg font-black uppercase tracking-[0.12em] transition-all sm:px-8 sm:py-5 sm:text-xl md:flex-none md:rounded-t-[2rem] md:px-12 md:py-6 md:text-3xl ${activeTab === 'setville' ? 'border-bradok-yellow bg-white text-neutral-900 shadow-sm' : 'border-transparent text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700'}`}
            >
              Setville
            </button>
          </div>

          <div className="relative flex min-h-[500px] items-center overflow-hidden rounded-[2rem] border border-neutral-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8 md:rounded-b-[2.5rem] md:rounded-tr-[2.5rem] md:p-12">
            <AnimatePresence mode="wait">
              {activeTab === 'galo' && (
                <motion.div
                  key="galo"
                  id="unit-panel-galo"
                  role="tabpanel"
                  aria-labelledby="unit-tab-galo"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="grid w-full grid-cols-1 items-center gap-8 md:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)] lg:gap-16"
                >
                  <div className="space-y-6 md:space-y-8 md:pl-4">
                    <div>
                      <h3 className="mb-2 text-3xl font-heading font-black uppercase text-neutral-900 sm:text-4xl">Unidade Galo Branco</h3>
                      <p className="text-lg font-medium text-neutral-500 sm:text-xl">Av. Dusmenil Santos Fernandes, 1225</p>
                    </div>
                    <div className="space-y-5 border-t border-neutral-100 pt-6 sm:space-y-6 sm:pt-8">
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-neutral-50 p-3"><Clock className="h-6 w-6 shrink-0 text-bradok-yellow" /></div>
                        <div>
                          <p className="font-bold uppercase tracking-wider text-neutral-900">Segunda à Sexta</p>
                          <p className="mt-1 text-neutral-500">05:30 às 00:00 (Meia Noite)</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-neutral-50 p-3"><Target className="h-6 w-6 shrink-0 text-bradok-yellow" /></div>
                        <div>
                          <p className="font-bold uppercase tracking-wider text-neutral-900">Final de Semana</p>
                          <p className="mt-1 text-neutral-500">Sábado: 08:00 às 14:00 <br /> Domingo: Das 08:00 ao 12:00</p>
                        </div>
                      </div>
                    </div>
                    <a href="https://api.whatsapp.com/message/RLASK244K4A4P1?autoload=1&app_absent=0" target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-4 rounded-2xl border border-neutral-200 bg-white px-6 py-4 font-bold uppercase text-neutral-800 shadow-sm transition-all hover:bg-neutral-900 hover:text-white sm:mt-6 sm:w-auto">
                      <MessageCircle className="h-5 w-5" /> Falar com Atendimento
                    </a>
                  </div>
                  <UnitPreviewCard
                    imageSrc={galoBrancoUnidadeCapa}
                    videoSrc={galoBrancoUnidadeVideo}
                    alt="Galo Branco Gym"
                    caption="Sua Melhor Escolha"
                    testId="unit-preview-galo"
                    isTouchDevice={isTouchDevice}
                  />
                </motion.div>
              )}

              {activeTab === 'setville' && (
                <motion.div
                  key="setville"
                  id="unit-panel-setville"
                  role="tabpanel"
                  aria-labelledby="unit-tab-setville"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="grid w-full grid-cols-1 items-center gap-8 md:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)] lg:gap-16"
                >
                  <div className="space-y-6 md:space-y-8 md:pl-4">
                    <div>
                      <h3 className="mb-2 text-3xl font-heading font-black uppercase text-neutral-900 sm:text-4xl">Unidade Setville</h3>
                      <p className="text-lg font-medium text-neutral-500 sm:text-xl">Av. José Martins Ferreira, 301</p>
                    </div>
                    <div className="space-y-5 border-t border-neutral-100 pt-6 sm:space-y-6 sm:pt-8">
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-neutral-50 p-3"><Clock className="h-6 w-6 shrink-0 text-bradok-yellow" /></div>
                        <div>
                          <p className="font-bold uppercase tracking-wider text-neutral-900">Segunda à Sexta</p>
                          <p className="mt-1 text-neutral-500">05:30 às 23:59</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-neutral-50 p-3"><Target className="h-6 w-6 shrink-0 text-bradok-yellow" /></div>
                        <div>
                          <p className="font-bold uppercase tracking-wider text-neutral-900">Final de Semana</p>
                          <p className="mt-1 text-neutral-500">Sábado: 08:00 às 14:00 <br /> Domingo: 08:00 às 12:00</p>
                        </div>
                      </div>
                    </div>
                    <a href="https://api.whatsapp.com/send/?phone=551239021234&text&type=phone_number&app_absent=0" target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-4 rounded-2xl border border-neutral-200 bg-white px-6 py-4 font-bold uppercase text-neutral-800 shadow-sm transition-all hover:bg-neutral-900 hover:text-white sm:mt-6 sm:w-auto">
                      <MessageCircle className="h-5 w-5" /> Falar com Atendimento
                    </a>
                  </div>
                  <UnitPreviewCard
                    imageSrc={setvilleUnidadeCapa}
                    videoSrc={setvilleUnidadeVideo}
                    testId="unit-preview-setville"
                    alt="Setville Gym"
                    caption="O Padrão Setville"
                    isTouchDevice={isTouchDevice}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
      {/* 5. TEAM SECTION - EXPANDED SPECIALISTS */}
      <section id="equipe" className="relative z-10 overflow-hidden border-t border-neutral-900 bg-neutral-950 px-4 py-24 sm:px-6 sm:py-28 md:px-16 md:py-36">
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-bradok-yellow/8 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl">
          <FadeUp className="mb-14">
            <div className="flex flex-col gap-10 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.28em] text-neutral-300">
                  Equipe Bradok
                </span>
                <h2 className="mt-6 text-4xl font-heading font-black uppercase leading-[0.88] text-white sm:text-5xl md:text-7xl">
                  NOSSOS ESPECIALISTAS
                </h2>
                <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-neutral-400 sm:text-xl">
                  Uma equipe presente no salão, preparada para corrigir execução, ajustar detalhes e sustentar sua evolução com orientação real do começo ao fim do treino.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:max-w-[34rem]">
                {[
                  { title: 'Correção de Execução', text: 'Olhar técnico no momento em que o movimento acontece.' },
                  { title: 'Presença no Salão', text: 'Acompanhamento constante, sem distanciamento da rotina do aluno.' },
                  { title: 'Evolução com Segurança', text: 'Orientação que protege a biomecânica e melhora a performance.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-[1.5rem] border border-neutral-800 bg-neutral-900/80 px-4 py-5 shadow-[0_8px_30px_rgb(0,0,0,0.18)]">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-300">{item.title}</p>
                    <p className="mt-3 text-sm leading-relaxed text-neutral-500">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-[1.25fr_0.95fr]">
            <FadeUp
              delay={0.1}
              dataTestId="team-dna-card"
              className="group relative flex min-h-[620px] flex-col justify-end overflow-hidden rounded-[2.5rem] border border-neutral-800 bg-black p-8 shadow-[0_18px_60px_rgb(0,0,0,0.28)] md:p-12"
            >
              <img
                src={donosImage}
                className="absolute inset-0 h-full w-full object-cover opacity-52 brightness-[0.72] saturate-[0.8] transition-[transform,opacity,filter] duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:brightness-100 group-hover:saturate-100"
                alt="Equipe Bradok"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10 transition-opacity duration-500 group-hover:opacity-0" />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,204,0,0.18),transparent_28%,transparent_100%)] transition-opacity duration-500 group-hover:opacity-0" />

              <div className="relative z-20 max-w-3xl transition-[opacity,transform] duration-400 group-hover:translate-y-4 group-hover:opacity-0">
                <span className="mb-6 inline-block rounded-full bg-bradok-yellow px-4 py-2 text-xs font-black uppercase tracking-widest text-neutral-900 shadow-sm">
                  Nosso DNA
                </span>
                <h3 className="mb-4 text-4xl font-black font-heading uppercase leading-[0.92] text-white sm:text-5xl lg:text-6xl">
                  A EQUIPE QUE
                  <br />
                  SUSTENTA SUA EVOLUÇÃO
                </h3>
                <p className="max-w-2xl border-l-4 border-bradok-yellow py-1 pl-5 text-lg font-medium leading-relaxed text-white/80">
                  Cultura de excelência, presença constante e atenção de verdade. Aqui, orientação não aparece só quando você pede: ela faz parte da rotina, da execução e da confiança construída treino após treino.
                </p>
              </div>

              <div className="relative z-20 mt-8 grid gap-3 transition-[opacity,transform] duration-400 group-hover:translate-y-4 group-hover:opacity-0 sm:grid-cols-3">
                {[
                  { title: 'Biomecânica', text: 'Correções claras para treinar melhor e com mais consistência.' },
                  { title: 'Presença real', text: 'Equipe próxima, disponível e ativa no ritmo do salão.' },
                  { title: 'Ambiente firme', text: 'Postura acolhedora sem perder foco em resultado.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-bradok-yellow">{item.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/75">{item.text}</p>
                  </div>
                ))}
              </div>
            </FadeUp>

            <div className="grid grid-cols-1 gap-6">
              <div ref={droneCardRef}>
                <FadeUp
                  delay={0.16}
                  dataTestId="team-drone-card"
                  className="group relative flex min-h-[260px] flex-col justify-end overflow-hidden rounded-[2rem] border border-neutral-800 bg-black p-8 shadow-[0_8px_30px_rgb(0,0,0,0.28)]"
                >
                  {shouldUseDroneVideo ? (
                    <video
                      src={videoDroneBradok}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload={isTouchDevice ? 'none' : 'metadata'}
                      poster={espacobradok}
                      className="absolute inset-0 h-full w-full object-cover opacity-48 brightness-[0.78] saturate-[0.78] transition-[transform,opacity,filter] duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:brightness-100 group-hover:saturate-100"
                    />
                  ) : (
                    <img
                      src={espacobradok}
                      alt="Ambiente Bradok"
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover opacity-48 brightness-[0.78] saturate-[0.78] transition-[transform,opacity,filter] duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:brightness-100 group-hover:saturate-100"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/20 transition-opacity duration-500 group-hover:opacity-0" />
                  <div className="relative z-20 max-w-md transition-[opacity,transform] duration-400 group-hover:translate-y-4 group-hover:opacity-0">
                    <span className="inline-flex rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-300">
                      Presença no salão
                    </span>
                    <h3 className="mt-4 text-3xl font-black font-heading uppercase leading-[0.95] text-white">
                      ATENÇÃO DE
                      <br />
                      PONTA A PONTA
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                      Um ambiente vivo, com acompanhamento presente e energia constante para manter seu treino fluindo com mais confiança.
                    </p>
                  </div>
                </FadeUp>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FadeUp delay={0.22} className="group relative flex min-h-[300px] flex-col justify-end overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-900 p-7 shadow-[0_8px_30px_rgb(0,0,0,0.22)]">
                  <img
                    src={acompanhamentoProfissionalImage}
                    className="absolute inset-0 h-full w-full object-cover opacity-44 brightness-[0.78] saturate-[0.82] transition-[transform,opacity,filter] duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:brightness-100 group-hover:saturate-100"
                    alt="Acompanhamento profissional"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/15 transition-opacity duration-500 group-hover:opacity-0" />
                  <div className="relative z-20 transition-[opacity,transform] duration-400 group-hover:translate-y-4 group-hover:opacity-0">
                    <span className="inline-flex rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-300">
                      Acompanhamento
                    </span>
                    <h3 className="mt-4 text-2xl font-black font-heading uppercase leading-none text-white">
                      CORREÇÃO DE
                      <br />
                      EXECUÇÃO
                    </h3>
                    <p className="mt-3 border-l-2 border-bradok-yellow pl-4 text-sm leading-relaxed text-neutral-400">
                      Orientação próxima para ajustar postura, cadência e segurança enquanto o treino acontece.
                    </p>
                  </div>
                </FadeUp>

                <FadeUp delay={0.28} className="group relative flex min-h-[300px] flex-col justify-end overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-900 p-7 shadow-[0_8px_30px_rgb(0,0,0,0.22)]">
                  <img
                    src={tecnicasImage}
                    className="absolute inset-0 h-full w-full object-cover opacity-42 brightness-[0.76] saturate-[0.82] transition-[transform,opacity,filter] duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:brightness-100 group-hover:saturate-100"
                    alt="Aplicação de técnica no treino"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/10 transition-opacity duration-500 group-hover:opacity-0" />
                  <div className="relative z-20 transition-[opacity,transform] duration-400 group-hover:translate-y-4 group-hover:opacity-0">
                    <span className="inline-flex rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-300">
                      Técnica & Ciência
                    </span>
                    <h3 className="mt-4 text-2xl font-black font-heading uppercase leading-none text-white">
                      BIOMECÂNICA
                      <br />
                      APLICADA
                    </h3>
                    <p className="mt-3 border-l-2 border-neutral-600 pl-4 text-sm leading-relaxed text-neutral-400">
                      Conhecimento traduzido em ação prática para extrair mais resultado com melhor controle.
                    </p>
                  </div>
                </FadeUp>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <FadeUp delay={0.32} className="group relative flex min-h-[320px] flex-col justify-end overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-900 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.22)]">
              <img
                src={senhoraNaEsteiraImage}
                className="absolute inset-0 h-full w-full object-cover opacity-42 brightness-[0.78] saturate-[0.82] transition-[transform,opacity,filter] duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:brightness-100 group-hover:saturate-100"
                alt="Acompanhamento em diferentes perfis de treino"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/15 transition-opacity duration-500 group-hover:opacity-0" />
              <div className="relative z-20 max-w-sm transition-[opacity,transform] duration-400 group-hover:translate-y-4 group-hover:opacity-0">
                <span className="inline-flex rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-300">
                  Cuidado individual
                </span>
                <h3 className="mt-4 text-3xl font-black font-heading uppercase leading-[0.95] text-white">
                  CADA PERFIL,
                  <br />
                  A MESMA ATENÇÃO
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                  Da adaptação inicial à continuidade do treino, a orientação respeita o momento e o ritmo de cada aluno.
                </p>
              </div>
            </FadeUp>

            <FadeUp delay={0.38} className="group relative flex min-h-[320px] flex-col justify-end overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-900 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.22)]">
              <img
                src={mulheresBradokImage}
                className="absolute inset-0 h-full w-full object-cover opacity-40 brightness-[0.78] saturate-[0.84] transition-[transform,opacity,filter] duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:brightness-100 group-hover:saturate-100"
                alt="Comunidade Bradok"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/15 transition-opacity duration-500 group-hover:opacity-0" />
              <div className="relative z-20 max-w-sm transition-[opacity,transform] duration-400 group-hover:translate-y-4 group-hover:opacity-0">
                <span className="inline-flex rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-300">
                  Ambiente que acolhe
                </span>
                <h3 className="mt-4 text-3xl font-black font-heading uppercase leading-[0.95] text-white">
                  FORÇA, TROCA
                  <br />
                  E PERTENCIMENTO
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                  Mais do que instrução, a equipe ajuda a sustentar um clima firme, humano e motivador dentro do salão.
                </p>
              </div>
            </FadeUp>

            <FadeUp delay={0.44} className="relative min-h-[320px] overflow-hidden rounded-[2rem] border border-neutral-800 bg-black p-8 shadow-[0_8px_30px_rgb(0,0,0,0.22)]">
              <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,204,0,0.16),transparent_32%)]" />
              <div className="relative z-20 flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span className="inline-flex rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-300">
                    O padrão Bradok
                  </span>
                  <Award className="h-10 w-10 text-bradok-yellow" />
                </div>
                <h3 className="mt-8 text-3xl font-black font-heading uppercase leading-[0.95] text-white">
                  O QUE VOCÊ
                  <br />
                  SENTE NA PRÁTICA
                </h3>

                <div className="mt-8 space-y-5">
                  {[
                    { title: 'Postura ativa', text: 'Equipe que observa, orienta e não deixa seu treino esfriar.' },
                    { title: 'Clareza técnica', text: 'Explicações objetivas para você executar melhor e evoluir com mais controle.' },
                    { title: 'Confiança no processo', text: 'Um suporte que transforma disciplina em constância dentro da rotina.' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3 border-t border-neutral-800 pt-5 first:border-t-0 first:pt-0">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-bradok-yellow" />
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.14em] text-white">{item.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-neutral-400">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>
      {/* 6. MURAL DE HONRA (REAL GOOGLE REVIEWS) */}
      <section id="depoimentos" className="relative z-10 overflow-hidden border-t border-neutral-200 bg-[#FAFAFA] py-20 sm:py-24 md:py-32">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 md:px-16">
          <FadeUp className="mb-12 text-center md:mb-16">
            <h2 className="text-4xl font-heading font-black uppercase text-neutral-900 sm:text-5xl md:text-6xl">O que dizem sobre nós</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg font-medium text-neutral-500 sm:text-xl">Mais de 400 depoimentos de alunos satisfeitos. Qualidade reconhecida por quem treina com a gente todos os dias.</p>
          </FadeUp>
        </div>

        {shouldAnimateTestimonials ? (
          <div className="group relative flex overflow-hidden">
            <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-32 bg-gradient-to-r from-[#FAFAFA] to-transparent"></div>
            <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-32 bg-gradient-to-l from-[#FAFAFA] to-transparent"></div>

            <motion.div
              className="flex w-max items-stretch gap-6 pr-6"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ ease: 'linear', duration: 40, repeat: Infinity }}
            >
              {[...Array(2)].map((_, arrayIndex) => (
                <div key={arrayIndex} className="flex gap-6">
                  {REVIEWS.map((review) => (
                    <div key={`${arrayIndex}-${review.author}`} className="flex w-[350px] flex-col justify-between rounded-[2rem] border border-neutral-100 bg-white p-8 shadow-[0_4px_20px_rgb(0,0,0,0.04)] transition-transform duration-300 hover:-translate-y-2 md:w-[420px]">
                      <div>
                        <div className="mb-4 flex text-bradok-yellow">
                          {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}
                        </div>
                        <p className="mb-6 flex-grow text-lg font-medium italic leading-relaxed text-neutral-700">"{review.text}"</p>
                      </div>
                      <div className="flex items-center gap-4 border-t border-neutral-50 pt-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-sm font-black text-white">{review.author.charAt(0)}</span>
                        <div>
                          <span className="block text-xs font-bold uppercase tracking-wider text-neutral-900">{review.author}</span>
                          {review.subtitle && <span className="text-[10px] uppercase text-neutral-500">{review.subtitle}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        ) : (
          <div className="relative">
            <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-10 bg-gradient-to-r from-[#FAFAFA] to-transparent sm:w-16"></div>
            <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-10 bg-gradient-to-l from-[#FAFAFA] to-transparent sm:w-16"></div>

            <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:px-6 md:px-16">
              {REVIEWS.map((review) => (
                <div key={review.author} className="flex w-[84vw] min-w-[18rem] snap-center flex-col justify-between rounded-[2rem] border border-neutral-100 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.04)] sm:max-w-[24rem] sm:min-w-[20rem]">
                  <div>
                    <div className="mb-4 flex text-bradok-yellow">
                      {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}
                    </div>
                    <p className="mb-6 text-base font-medium italic leading-relaxed text-neutral-700 sm:text-lg">"{review.text}"</p>
                  </div>
                  <div className="flex items-center gap-4 border-t border-neutral-50 pt-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-sm font-black text-white">{review.author.charAt(0)}</span>
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-neutral-900">{review.author}</span>
                      {review.subtitle && <span className="text-[10px] uppercase text-neutral-500">{review.subtitle}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      <section id="cta" className="relative z-10 border-y border-black bg-neutral-950 px-4 py-20 sm:px-6 sm:py-24 md:px-16 md:py-32">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 md:gap-16 lg:flex-row">
          <div className="lg:w-1/2">
            <FadeUp>
              <h2 className="mb-6 text-4xl font-heading font-black uppercase leading-[0.95] text-white sm:text-5xl md:mb-8 md:text-8xl">
                SEU PRÓXIMO <br /><span className="text-bradok-yellow drop-shadow-sm">PASSO COMEÇA AQUI</span>
              </h2>
              <p className="mb-8 border-l-4 border-bradok-yellow pl-4 text-lg font-medium text-neutral-400 sm:pl-6 sm:text-xl md:text-2xl">
                Um passo acessível na sua saúde e bem-estar, com estrutura de verdade para sustentar sua rotina e sua qualidade de vida.
              </p>
              <ul className="mb-10 space-y-4 rounded-[2rem] border border-neutral-900 bg-black p-6 sm:p-8 md:mb-12">
                <li className="flex items-center gap-4 text-base text-white sm:text-lg md:text-xl"><CheckCircle2 className="h-6 w-6 shrink-0 text-bradok-yellow" /> Acompanhamento Profissional</li>
                <li className="flex items-center gap-4 text-base text-white sm:text-lg md:text-xl"><CheckCircle2 className="h-6 w-6 shrink-0 text-bradok-yellow" /> Equipamentos Modernos e Bem Cuidados</li>
                <li className="flex items-center gap-4 text-base text-white sm:text-lg md:text-xl"><CheckCircle2 className="h-6 w-6 shrink-0 text-bradok-yellow" /> Planos Transparentes e Flexíveis</li>
                <li className="flex items-center gap-4 text-base text-neutral-500 sm:text-lg md:text-xl"><CheckCircle2 className="h-6 w-6 shrink-0 text-neutral-600" /> Aceitamos Wellhub e TotalPass</li>
              </ul>
            </FadeUp>
          </div>
          <div className="w-full lg:w-1/2">
            <FadeUp delay={0.2}>
              <div className="rounded-[2.5rem] bg-bradok-yellow p-6 text-center text-neutral-900 shadow-[0_20px_60px_rgba(255,204,0,0.3)] transition-all duration-500 sm:p-10 md:p-12 lg:rotate-2 lg:hover:rotate-0">
                <h3 className="mb-4 text-3xl font-black font-heading uppercase sm:text-4xl">VENHA CONHECER A BRADOK</h3>
                <p className="mb-8 text-lg font-medium text-neutral-800 sm:mb-10 sm:text-xl">Conheça nosso espaço e experimente nossa estrutura gratuitamente. Venha dar o primeiro passo.</p>
                <a href="https://linktr.ee/academiabradok?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGn9F-67H-HAo99WFbEXiQvbNdCP8fu76I5gOppL2hNK-R9I6klrjjTlgzqSv4_aem_Vc_-yjfC-IdzPuAoOd7YGw" target="_blank" rel="noreferrer" className="flex min-h-12 w-full items-center justify-center gap-4 rounded-2xl bg-neutral-900 px-6 py-5 font-heading text-lg font-black uppercase tracking-wider text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-black sm:px-8 sm:text-2xl">
                  Ver mais <ArrowRight />
                </a>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>
      <section id="duvidas" className="relative z-10 bg-[#FAFAFA] px-4 py-20 sm:px-6 sm:py-24 md:px-16 md:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeUp className="mb-12 text-center md:mb-16">
            <h2 className="mb-4 text-4xl font-heading font-black uppercase text-neutral-900 sm:mb-6 sm:text-5xl">Dúvidas Frequentes</h2>
            <p className="text-lg font-medium text-neutral-500 sm:text-xl">As respostas que você precisa de forma direta.</p>
          </FadeUp>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FadeUp key={index} delay={index * 0.1}>
                <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <button
                    data-testid={`faq-item-${index + 1}`}
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    aria-expanded={openFaq === index}
                    className="flex min-h-12 w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-neutral-50 sm:p-6"
                  >
                    <span className="text-base font-bold uppercase text-neutral-900 sm:text-lg md:text-xl">{faq.q}</span>
                    <ChevronDown className={`w-6 h-6 text-bradok-yellow transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-[#FAFAFA]">
                        <div className="border-t border-neutral-100 p-5 pt-4 text-base text-neutral-600 sm:p-6 sm:pt-4 sm:text-lg">{faq.a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>
      {/* 9. FOOTER DEFINITIVO - DARK */}
      <footer className="relative z-10 border-t border-neutral-900 bg-black px-4 pb-10 pt-16 sm:px-6 sm:pt-20 md:px-16 md:pb-12 md:pt-24">
        <div className="mx-auto mb-16 grid max-w-7xl grid-cols-1 gap-10 md:mb-24 lg:grid-cols-4 lg:gap-16">
          <div className="lg:col-span-2">
            <img src={bradokLogo} alt="Bradok Academia" className="-mt-10 mb-0 h-[120px] w-auto object-contain object-left sm:-mt-14 sm:h-[150px] md:-mt-18 md:h-[180px]" style={{ filter: 'brightness(0) invert(1)' }} />
            <p className="-mt-4 max-w-md text-base text-neutral-400 sm:-mt-6 sm:text-lg">Promovendo saúde, performance e bem-estar. Um ambiente pensado em transformar sua rotina com qualidade, segurança e dedicação sincera.</p>
          </div>
          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-white">Nossas Unidades</h4>
            <ul className="space-y-6">
              <li className="flex flex-col">
                <strong className="mb-1 uppercase tracking-wider text-bradok-yellow">Setville</strong>
                <span className="text-neutral-400">Av. José Martins Ferreira, 301</span>
                <a href="https://maps.google.com/?q=Academia+Bradok+Setville" target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center text-xs uppercase text-neutral-500 underline transition-colors hover:text-white">Como chegar</a>
              </li>
              <li className="flex flex-col">
                <strong className="mb-1 uppercase tracking-wider text-bradok-yellow">Galo Branco</strong>
                <span className="text-neutral-400">Av. Dusmenil Santos Fernandes, 1225</span>
                <a href="https://maps.google.com/?q=Academia+Bradok+Galo+Branco" target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center text-xs uppercase text-neutral-500 underline transition-colors hover:text-white">Como chegar</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-white">Ações</h4>
            <ul className="space-y-4">
              <li><a href="https://www.google.com/search?q=Academia+Bradok+SJC" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-lg font-bold text-neutral-300 transition-colors hover:text-bradok-yellow">Veja no Google</a></li>
              <li><a href="https://instagram.com/academiabradok" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-neutral-400 transition-colors hover:text-white">Seguir nosso Instagram</a></li>
              <li><a href="https://wellhub.com" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-neutral-500 transition-colors hover:text-white">Acesso Wellhub APP</a></li>
            </ul>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 border-t border-neutral-900 pt-8 text-center text-sm font-medium text-neutral-600 md:flex-row md:text-left">
          <p>© {new Date().getFullYear()} Academia Bradok SJC. Transformando rotinas.</p>
          <p className="max-w-lg md:text-right">
            *Resultados dependem da assiduidade e fatores biológicos. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
