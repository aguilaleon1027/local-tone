'use strict';

/* ── API ─────────────────────────────────── */
const API = {
  catalog:    (cat) => `/api/hanbok/catalog?category=${cat}&available_only=true`,
  categories: '/api/hanbok/categories',
  upload:     '/api/fitting/upload-photo',
  generate:   '/api/fitting/generate',
};

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '오류가 발생했습니다.' }));
    throw new Error(err.detail || '서버 오류');
  }
  return res.json();
}

/* ── 커스텀 커서 ───────────────────────────── */
function initCursor() {
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');
  if (!cursor || window.matchMedia('(pointer: coarse)').matches) return;

  let fx = 0, fy = 0;
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
    fx += (e.clientX - fx) * 0.12;
    fy += (e.clientY - fy) * 0.12;
    follower.style.left = fx + 'px';
    follower.style.top  = fy + 'px';
  });

  const raf = () => {
    follower.style.left = fx + 'px';
    follower.style.top  = fy + 'px';
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  document.querySelectorAll('a, button, .hanbok-card, .fitting-item, .filter-btn').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('active');
      follower.classList.add('active');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('active');
      follower.classList.remove('active');
    });
  });
}

/* ── 네비게이션 ───────────────────────────── */
function initNav() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  toggle?.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    menu.style.display = open ? 'flex' : 'none';
  });

  document.querySelectorAll('.mobile-link, .mobile-cta').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      menu.style.display = 'none';
    });
  });
}

/* ── 스크롤 리빌 ──────────────────────────── */
function initReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

/* ── 카운터 애니메이션 ────────────────────── */
function initCounters() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.count, 10);
      let current = 0;
      const duration = 1600;
      const step = (timestamp) => {
        if (!el._startTime) el._startTime = timestamp;
        const progress = Math.min((timestamp - el._startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        current = Math.floor(ease * target);
        el.textContent = current.toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString() + (el.dataset.suffix || '');
      };
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => io.observe(el));
}

/* ── 리뷰 무한 스크롤 복제 ───────────────── */
function initReviews() {
  const track = document.getElementById('reviewsTrack');
  if (!track) return;
  const clone = track.innerHTML;
  track.innerHTML += clone;
}

/* ── 카테고리 필터 + 카탈로그 로드 ─────────── */
async function initCatalog() {
  const filterWrap = document.getElementById('categoryFilter');
  const grid = document.getElementById('hanbokGrid');
  const fittingGrid = document.getElementById('fittingHanbokGrid');

  let currentCategory = 'all';
  let allHanboks = [];

  try {
    const categories = await apiFetch(API.categories);
    renderCategories(categories, filterWrap);

    allHanboks = await apiFetch(API.catalog('all'));
    renderGrid(allHanboks, grid);
    renderFittingGrid(allHanboks, fittingGrid);
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--text-3);grid-column:1/-1;text-align:center;padding:40px">${err.message}</p>`;
  }

  filterWrap?.addEventListener('click', async (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    filterWrap.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.category;
    try {
      const items = await apiFetch(API.catalog(currentCategory));
      renderGrid(items, grid);
    } catch {}
  });
}

function renderCategories(categories, wrap) {
  categories.forEach(cat => {
    if (cat.id === 'all') return;
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.category = cat.id;
    btn.textContent = cat.name;
    wrap.appendChild(btn);
  });
}

function renderGrid(items, grid) {
  if (!grid) return;
  if (!items.length) {
    grid.innerHTML = '<p style="color:var(--text-3);grid-column:1/-1;text-align:center;padding:60px">해당 카테고리의 한복이 없습니다.</p>';
    return;
  }
  grid.innerHTML = items.map(h => `
    <article class="hanbok-card reveal" data-id="${h.id}">
      <div class="card-image">
        <img src="${h.image_url}" alt="${h.title}" style="width:100%;height:100%;object-fit:cover;display:block;">
        <div class="card-overlay">
          <button class="overlay-btn overlay-btn-secondary" onclick="openDetail('${h.id}')">상세보기</button>
          <button class="overlay-btn overlay-btn-primary" onclick="goFitting('${h.id}')">AI 피팅</button>
        </div>
      </div>
      <div class="card-body">
        <p class="card-category">${h.category || ''}</p>
        <h3 class="card-name">${h.title}</h3>
        ${h.color ? `<div class="card-colors"><span style="font-size:0.8rem;color:var(--text-3)">${h.color}</span></div>` : ''}
        <div class="card-footer">
          <button class="btn btn-outline" style="padding:7px 16px;font-size:0.8rem" onclick="goFitting('${h.id}')">피팅하기</button>
        </div>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('.reveal').forEach(el => {
    requestAnimationFrame(() => el.classList.add('visible'));
  });
}

function renderFittingGrid(items, grid) {
  if (!grid) return;
  grid.innerHTML = items.map(h => `
    <div class="fitting-item" data-id="${h.id}" data-name="${h.title}" data-image="${h.image_url}">
      <img src="${h.image_url}" alt="${h.title}" class="fitting-item-gradient" style="width:100%;height:100%;object-fit:cover;display:block;">
      <div class="fitting-item-name">${h.title}</div>
    </div>
  `).join('');
}

function openDetail(id) {
  document.getElementById('fitting')?.scrollIntoView({ behavior: 'smooth' });
}

function goFitting(id) {
  document.getElementById('fitting')?.scrollIntoView({ behavior: 'smooth' });
  const item = document.querySelector(`#fittingHanbokGrid .fitting-item[data-id="${id}"]`);
  if (item) {
    setTimeout(() => {
      if (currentStep !== 2) goToStep(2);
      setTimeout(() => selectHanbok(item), 300);
    }, 600);
  }
}

/* ── AI 피팅 플로우 ───────────────────────── */
let currentStep = 1;
let uploadedPhotoId = null;
let selectedHanbokId = null;

function goToStep(step) {
  document.querySelectorAll('.fitting-step-panel').forEach((p, i) => {
    p.classList.toggle('active', i + 1 === step);
  });
  document.querySelectorAll('.step').forEach((s, i) => {
    s.classList.remove('active', 'completed');
    if (i + 1 < step) s.classList.add('completed');
    if (i + 1 === step) s.classList.add('active');
  });
  currentStep = step;
}

function initFitting() {
  const uploadArea = document.getElementById('uploadArea');
  const photoInput = document.getElementById('photoInput');
  const uploadPlaceholder = document.getElementById('uploadPlaceholder');
  const uploadPreview = document.getElementById('uploadPreview');
  const previewImg = document.getElementById('previewImg');
  const removeBtn = document.getElementById('removePhoto');
  const toStep2 = document.getElementById('toStep2');
  const backToStep1 = document.getElementById('backToStep1');
  const startFitting = document.getElementById('startFitting');
  const retryBtn = document.getElementById('retryFitting');
  const fittingGrid = document.getElementById('fittingHanbokGrid');
  const selectedInfo = document.getElementById('selectedInfo');
  const selectedPreview = document.getElementById('selectedPreview');
  const selectedDetails = document.getElementById('selectedDetails');

  // 드래그앤드롭
  uploadArea?.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
  uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
  uploadArea?.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });
  uploadArea?.addEventListener('click', (e) => {
    if (e.target.closest('.preview-remove')) return;
    if (!uploadPreview?.classList.contains('hidden')) return;
    photoInput?.click();
  });
  photoInput?.addEventListener('change', () => {
    if (photoInput.files[0]) handleFile(photoInput.files[0]);
  });

  function handleFile(file) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast('JPG, PNG, WEBP 파일만 업로드 가능합니다.', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('파일 크기가 10MB를 초과합니다.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      uploadPlaceholder.classList.add('hidden');
      uploadPreview.classList.remove('hidden');
      toStep2.disabled = false;
      uploadPhoto(file);
    };
    reader.readAsDataURL(file);
  }

  async function uploadPhoto(file) {
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const result = await apiFetch(API.upload, { method: 'POST', body: fd });
      uploadedPhotoId = result.photo_id;
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  removeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    previewImg.src = '';
    uploadPlaceholder.classList.remove('hidden');
    uploadPreview.classList.add('hidden');
    toStep2.disabled = true;
    uploadedPhotoId = null;
    if (photoInput) photoInput.value = '';
  });

  toStep2?.addEventListener('click', () => goToStep(2));
  backToStep1?.addEventListener('click', () => goToStep(1));

  // 한복 선택
  fittingGrid?.addEventListener('click', (e) => {
    const item = e.target.closest('.fitting-item');
    if (!item) return;
    selectHanbok(item);
  });

  retryBtn?.addEventListener('click', () => {
    goToStep(1);
    uploadedPhotoId = null;
    selectedHanbokId = null;
    previewImg.src = '';
    uploadPlaceholder.classList.remove('hidden');
    uploadPreview.classList.add('hidden');
    if (toStep2) toStep2.disabled = true;
    if (photoInput) photoInput.value = '';
    fittingGrid?.querySelectorAll('.fitting-item').forEach(i => i.classList.remove('selected'));
    selectedInfo?.classList.add('hidden');
    if (startFitting) startFitting.disabled = true;
  });

  startFitting?.addEventListener('click', async () => {
    if (!uploadedPhotoId || !selectedHanbokId) return;
    goToStep(3);
    const loading = document.getElementById('fittingLoading');
    const result = document.getElementById('fittingResult');
    loading?.classList.remove('hidden');
    result?.classList.add('hidden');

    let msgTimer = null;
    try {
      const fd = new FormData();
      fd.append('hanbok_id', selectedHanbokId);
      fd.append('photo_id', uploadedPhotoId);

      const loadingMsgs = [
        'AI가 한복을 분석하고 있습니다...',
        '가상 피팅 이미지를 생성 중입니다...',
        '거의 다 됐어요! 조금만 기다려주세요...',
      ];
      let msgIdx = 0;
      const loadingText = document.getElementById('loadingText');
      msgTimer = setInterval(() => {
        msgIdx = (msgIdx + 1) % loadingMsgs.length;
        if (loadingText) loadingText.textContent = loadingMsgs[msgIdx];
      }, 8000);

      const data = await apiFetch(API.generate, { method: 'POST', body: fd });
      clearInterval(msgTimer);
      console.log('[fitting] 서버 응답:', data);

      loading?.classList.add('hidden');
      result?.classList.remove('hidden');

      const msgEl = document.getElementById('resultMessage');
      const cardEl = document.getElementById('resultHanbokCard');
      if (msgEl) msgEl.textContent = data.message;

      const selectedItem = fittingGrid?.querySelector('.fitting-item.selected');
      if (cardEl) {
        // 1) AI 피팅 이미지 또는 사진+한복 나란히 표시
        let imageHTML = '';
        if (data.result_image_url) {
          imageHTML = `
            <div style="position:relative;border-radius:16px;overflow:hidden;margin-bottom:16px">
              <img src="${data.result_image_url}" alt="AI 피팅 결과" style="width:100%;border-radius:16px;display:block;">
              <div style="position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);padding:4px 12px;border-radius:20px;color:#fff;font-size:11px;font-weight:600;">✨ AI 피팅 결과</div>
            </div>`;
        } else if (data.photo_url) {
          const hanbokImgCol = selectedItem ? `
              <div style="position:relative;border-radius:12px;overflow:hidden">
                <img src="${selectedItem.dataset.image}" alt="${selectedItem.dataset.name}" style="width:100%;aspect-ratio:3/4;object-fit:cover;display:block;">
                <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.65));padding:8px 10px;color:#fff;font-size:11px;font-weight:600;">${selectedItem.dataset.name}</div>
              </div>` : '';
          imageHTML = `
            <div style="display:grid;grid-template-columns:${selectedItem ? '1fr 1fr' : '1fr'};gap:10px;margin-bottom:16px">
              <div style="position:relative;border-radius:12px;overflow:hidden">
                <img src="${data.photo_url}" alt="내 사진" style="width:100%;aspect-ratio:3/4;object-fit:cover;display:block;">
                <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.65));padding:8px 10px;color:#fff;font-size:11px;font-weight:600;">내 사진</div>
              </div>
              ${hanbokImgCol}
            </div>`;
        }

        // 2) AI 스타일 추천 텍스트
        let recHTML = '';
        if (data.ai_recommendation) {
          recHTML = `
            <div style="background:rgba(255,255,255,0.04);border-left:3px solid var(--gold);border-radius:8px;padding:12px 16px;margin-bottom:16px;text-align:left;">
              <div style="font-size:11px;font-weight:700;color:var(--gold);margin-bottom:6px;letter-spacing:0.08em;">✨ AI 스타일 추천</div>
              <p style="font-size:13px;color:var(--text-3);line-height:1.6;margin:0;">${data.ai_recommendation}</p>
            </div>`;
        }

        // 3) 피팅 정보 카드
        const infoHTML = selectedItem ? `
          <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(255,255,255,0.05);border-radius:12px;">
            <img src="${selectedItem.dataset.image}" alt="${selectedItem.dataset.name}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;flex-shrink:0;">
            <div>
              <div style="font-weight:700;font-size:0.9rem;color:var(--text-1);margin-bottom:2px;">${selectedItem.dataset.name}</div>
              <div style="font-size:0.75rem;color:var(--text-3);">피팅 ID: ${data.fitting_id}</div>
            </div>
          </div>` : '';

        cardEl.innerHTML = imageHTML + recHTML + infoHTML;
      }
    } catch (err) {
      clearInterval(msgTimer);
      loading?.classList.add('hidden');
      showToast(err.message, 'error');
      goToStep(2);
    }
  });
}

window.selectHanbok = function(item) {
  const fittingGrid = document.getElementById('fittingHanbokGrid');
  const selectedInfo = document.getElementById('selectedInfo');
  const selectedPreview = document.getElementById('selectedPreview');
  const selectedDetails = document.getElementById('selectedDetails');
  const startFitting = document.getElementById('startFitting');

  fittingGrid?.querySelectorAll('.fitting-item').forEach(i => i.classList.remove('selected'));
  item.classList.add('selected');
  selectedHanbokId = item.dataset.id;

  if (selectedPreview) {
    selectedPreview.innerHTML = `<img src="${item.dataset.image}" alt="${item.dataset.name}" style="width:80px;height:80px;border-radius:10px;object-fit:cover;">`;
  }
  if (selectedDetails) {
    selectedDetails.innerHTML = `
      <h4>${item.dataset.name}</h4>
      <p>AI 피팅을 시작하려면 아래 버튼을 눌러주세요.</p>
    `;
  }
  selectedInfo?.classList.remove('hidden');
  if (startFitting) startFitting.disabled = false;
};

/* ── 문의 폼 ──────────────────────────────── */
function initContactForm() {
  const form = document.getElementById('contactForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    const original = btn.textContent;
    btn.textContent = '전송 중...';
    btn.disabled = true;
    await new Promise(r => setTimeout(r, 1000));
    showToast('상담 신청이 완료되었습니다. 빠른 시간 내 연락드리겠습니다!', 'success');
    form.reset();
    btn.textContent = original;
    btn.disabled = false;
  });
}

/* ── 토스트 ───────────────────────────────── */
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  existing?.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  const color = type === 'success' ? 'var(--jade)' : type === 'error' ? 'var(--crimson)' : 'var(--gold)';
  toast.style.cssText = `
    position:fixed; bottom:32px; left:50%; transform:translateX(-50%) translateY(20px);
    background:var(--bg-3); border:1px solid ${color}; border-radius:50px;
    padding:14px 28px; font-size:0.9rem; color:var(--text-1);
    z-index:9999; opacity:0; transition:all 0.3s var(--ease);
    box-shadow:0 12px 40px rgba(0,0,0,0.4);
    white-space:nowrap; max-width:90vw;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ── 앵커 스무스 스크롤 ───────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 80;
      window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
    });
  });
}

/* ── 초기화 ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initNav();
  initReveal();
  initCounters();
  initReviews();
  initCatalog();
  initFitting();
  initContactForm();
  initSmoothScroll();
});
