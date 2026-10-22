import { createPlayer } from './player-core.js?v=two-hop-sequence-2';

const FRAME_COUNT = 24;
const FRAME_SIZE = 280;

function validateAnimationData(data) {
  if (!data || data.width !== 560 || data.height !== 360 ||
      !Array.isArray(data.frames) || data.frames.length !== FRAME_COUNT ||
      !Number.isFinite(data.scale) || data.scale < 0.5 || data.scale > 1.2 ||
      !Number.isFinite(data.ground) || data.ground < 100 || data.ground > data.height ||
      !Number.isFinite(data.hopDuration) || data.hopDuration <= 0 || data.hopDuration > 2 ||
      !Number.isFinite(data.hopsEnd) || data.hopsEnd <= 0 || data.hopsEnd > 6 ||
      !Number.isFinite(data.introEnd) || data.introEnd < data.hopsEnd || data.introEnd > 12 ||
      !Array.isArray(data.beats) || data.beats.length > FRAME_COUNT ||
      !Array.isArray(data.work) || data.work.length < 1 || data.work.length > FRAME_COUNT ||
      !Number.isFinite(data.workStep) || data.workStep <= 0 || data.workStep > 1) {
    throw new Error('애니메이션 설정이 올바르지 않습니다.');
  }

  for (const [index, frame] of data.frames.entries()) {
    const expectedFile = `frames/${String(index + 1).padStart(2, '0')}.png`;
    if (frame?.index !== index || frame.file !== expectedFile ||
        !Number.isFinite(frame.anchorX) || frame.anchorX < 0 || frame.anchorX > FRAME_SIZE ||
        !Number.isFinite(frame.anchorY) || frame.anchorY < 0 || frame.anchorY > FRAME_SIZE) {
      throw new Error('애니메이션 프레임 경로가 올바르지 않습니다.');
    }
  }
  if (data.beats.some(([frame, duration]) => !Number.isInteger(frame) || frame < 0 || frame >= FRAME_COUNT ||
      !Number.isFinite(duration) || duration <= 0 || duration > 2) ||
      data.work.some((frame) => !Number.isInteger(frame) || frame < 0 || frame >= FRAME_COUNT)) {
    throw new Error('애니메이션 타이밍이 올바르지 않습니다.');
  }
}

class DoramiRabbit extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.player = null;
    this.observer = null;
    this.motion = null;
    this.onMotion = null;
    this.visible = false;
    this.loading = false;
  }

  connectedCallback() {
    this.mount();
    this.motion = matchMedia('(prefers-reduced-motion: reduce)');
    this.onMotion = () => this.updateMotionPreference();
    this.motion.addEventListener('change', this.onMotion);
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        this.visible = entries.some((entry) => entry.isIntersecting);
        if (this.visible && !this.player && !this.motion.matches) void this.loadAnimation();
        else if (this.player) this.visible && !this.motion.matches ? this.player.play() : this.player.pause();
        if (this.visible && this.motion.matches) this.showStill();
      }, { threshold: 0.2 });
      this.observer.observe(this);
    } else {
      this.visible = true;
      if (this.motion.matches) this.showStill();
      else void this.loadAnimation();
    }
  }

  mount() {
    const style = document.createElement('style');
    style.textContent = `
      :host{display:block;width:100%;max-width:100%;font:inherit}
      canvas,.still{width:100%;height:auto;display:block}
    `;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', '깡충 뛰어와 앉은 뒤 맥북으로 작업하는 Dorami 토끼');
    this.shadowRoot.replaceChildren(style, canvas);
    this.canvas = canvas;
  }

  async loadAnimation() {
    if (this.loading || this.player || !this.isConnected) return;
    this.loading = true;
    const base = new URL('./', import.meta.url);
    try {
      const configUrl = new URL('animation.json', base);
      configUrl.searchParams.set('v', 'two-hop-sequence-2');
      if (configUrl.origin !== base.origin) throw new Error('설정 경로가 올바르지 않습니다.');
      const response = await fetch(configUrl, { credentials: 'omit', cache: 'force-cache' });
      if (!response.ok) throw new Error('설정 파일을 불러오지 못했습니다.');
      const data = await response.json();
      validateAnimationData(data);
      const urls = data.frames.map((frame) => new URL(frame.file, base));
      const framePrefix = new URL('frames/', base).pathname;
      if (urls.some((url) => url.origin !== base.origin || !url.pathname.startsWith(framePrefix) || url.search || url.hash)) {
        throw new Error('프레임 경로가 올바르지 않습니다.');
      }
      if (this.motion.matches) {
        this.showStill();
        return;
      }
      const player = await createPlayer(this.canvas, {
        data,
        urls: urls.map((url) => url.href),
        compact: !this.hasAttribute('wide'),
        autoplay: false,
      });
      if (!this.isConnected) {
        player.destroy();
        return;
      }
      this.player = player;
      if (this.visible) player.play();
    } catch {
      if (this.isConnected) this.showStill();
    } finally {
      this.loading = false;
    }
  }

  showStill() {
    if (!this.isConnected || this.shadowRoot.querySelector('.still')) return;
    const still = document.createElement('img');
    still.className = 'still';
    still.alt = '맥북으로 작업하는 Dorami 토끼';
    still.src = new URL('dorami-cartoon-still.png', new URL('./', import.meta.url)).href;
    if (!this.shadowRoot.querySelector('.still')) this.canvas.replaceWith(still);
  }

  updateMotionPreference() {
    if (!this.player) {
      if (this.motion.matches) this.showStill();
      else if (this.visible) {
        this.shadowRoot.querySelector('.still')?.remove();
        this.mount();
        void this.loadAnimation();
      }
      return;
    }
    if (this.motion.matches) {
      this.player.destroy();
      this.player = null;
      this.showStill();
      return;
    }
    if (this.visible) this.player.play();
  }

  disconnectedCallback() {
    this.observer?.disconnect();
    this.motion?.removeEventListener('change', this.onMotion);
    this.player?.destroy();
    this.player = null;
    this.loading = false;
  }
}

if (!customElements.get('dorami-rabbit')) customElements.define('dorami-rabbit', DoramiRabbit);
