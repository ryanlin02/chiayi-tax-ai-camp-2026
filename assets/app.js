(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const toast = $('#toast');
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  const menuButton = $('.menu-button');
  const siteNav = $('#site-nav');
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    siteNav.classList.toggle('open', !open);
  });
  $$('#site-nav a').forEach(link => link.addEventListener('click', () => {
    menuButton.setAttribute('aria-expanded', 'false');
    siteNav.classList.remove('open');
  }));

  $$('.copy-button').forEach(button => button.addEventListener('click', async () => {
    const target = document.getElementById(button.dataset.copyTarget);
    try {
      await navigator.clipboard.writeText(target.textContent.trim());
      showToast('提示詞已複製，可以貼到 AI 工作台。');
    } catch {
      const range = document.createRange();
      range.selectNodeContents(target);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      showToast('瀏覽器無法自動複製，文字已選取，請按 Ctrl/Cmd＋C。');
    }
  }));

  $$('.reveal-button').forEach(button => button.addEventListener('click', () => {
    const reveal = button.nextElementSibling;
    const willOpen = reveal.hidden;
    reveal.hidden = !willOpen;
    button.setAttribute('aria-expanded', String(willOpen));
    button.textContent = willOpen ? '收起提示詞' : '查看可用提示詞';
  }));

  const cohortRadios = $$('input[name="cohort"]');
  const tabs = $$('[data-cohort-tab]');
  const panels = $$('[data-cohort-panel]');
  const submitCards = $$('[data-submit-card]');
  const cohortStatusTitle = $('#cohort-status-title');
  const cohortStatusCopy = $('#cohort-status-copy');
  const cohortJump = $('#cohort-jump');
  const missionCohortSummary = $('#mission-cohort-summary');
  const cohortDetails = {
    morning: { label: '上午梯次', topics: '反賄選＋納保官' },
    afternoon: { label: '下午梯次', topics: '反詐騙＋稅籍異動即時通' }
  };

  function setCohort(cohort, announce = false) {
    const detail = cohortDetails[cohort] || cohortDetails.morning;
    cohortRadios.forEach(radio => { radio.checked = radio.value === cohort; });
    tabs.forEach(tab => {
      const active = tab.dataset.cohortTab === cohort;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel.dataset.cohortPanel !== cohort; });
    submitCards.forEach(card => { card.hidden = card.dataset.submitCard !== cohort; });
    cohortStatusTitle.textContent = `已選擇${detail.label}`;
    cohortStatusCopy.textContent = `今日任務：${detail.topics}`;
    cohortJump.textContent = `查看${detail.label.replace('梯次', '')}任務 ↓`;
    missionCohortSummary.textContent = `目前顯示：${detail.label}｜${detail.topics}`;
    try { localStorage.setItem('tax-ai-cohort', cohort); } catch { /* private mode */ }
    if (announce) showToast(`已切換為${detail.label}：${detail.topics}`);
  }

  cohortRadios.forEach(radio => radio.addEventListener('change', () => setCohort(radio.value, true)));
  tabs.forEach(tab => {
    tab.addEventListener('click', () => setCohort(tab.dataset.cohortTab, true));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const cohort = tab.dataset.cohortTab === 'morning' ? 'afternoon' : 'morning';
      setCohort(cohort);
      $(`[data-cohort-tab="${cohort}"]`).focus();
    });
  });
  let savedCohort = 'morning';
  try { savedCohort = localStorage.getItem('tax-ai-cohort') || 'morning'; } catch { /* private mode */ }
  setCohort(savedCohort === 'afternoon' ? 'afternoon' : 'morning');

  const form = $('#card-form');
  const canvas = $('#card-canvas');
  const ctx = canvas.getContext('2d');
  const fields = {
    name: $('#student-name'), topic: $('#topic'), title: $('#card-title'),
    point1: $('#point-1'), point2: $('#point-2'), point3: $('#point-3'), image: $('#card-image')
  };
  const filenamePreview = $('#filename-preview');
  const removeImage = $('#remove-image');
  const errorBox = $('#form-error');
  let uploadedImage = null;

  const themes = {
    '反賄選': { label: '公民廉政', file: '反賄選', dark: '#5c2b1f', main: '#bd6135', pale: '#f8e9df', icon: '✓' },
    '納保官': { label: '財稅知識', file: '納保官', dark: '#064e4b', main: '#087e79', pale: '#e0f2ef', icon: 'i' },
    '反詐騙': { label: '公民廉政', file: '反詐騙', dark: '#651f25', main: '#a53b3b', pale: '#f8e4e5', icon: '!' },
    '稅籍異動即時通': { label: '財稅知識', file: '稅籍異動即時通', dark: '#164866', main: '#266b93', pale: '#e1edf4', icon: '↗' }
  };

  function roundedRect(context, x, y, width, height, radius, fill) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.fillStyle = fill;
    context.fill();
  }

  function wrapText(context, text, maxWidth, maxLines = 2) {
    const chars = [...(text || '')];
    const lines = [];
    let line = '';
    for (const char of chars) {
      const test = line + char;
      if (context.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = char;
        if (lines.length === maxLines - 1) break;
      } else line = test;
    }
    const consumed = lines.join('').length;
    const remaining = chars.slice(consumed).join('');
    if (lines.length < maxLines && remaining) lines.push(remaining);
    if (lines.length === maxLines && lines.join('').length < chars.length) {
      let last = lines[maxLines - 1];
      while (context.measureText(last + '…').width > maxWidth && last.length) last = last.slice(0, -1);
      lines[maxLines - 1] = last + '…';
    }
    return lines;
  }

  function drawCover(image, x, y, width, height) {
    const scale = Math.max(width / image.width, height / image.height);
    const sw = width / scale;
    const sh = height / scale;
    const sx = (image.width - sw) / 2;
    const sy = (image.height - sh) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 30);
    ctx.clip();
    ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
    ctx.restore();
  }

  function drawCard() {
    const theme = themes[fields.topic.value];
    const width = canvas.width;
    ctx.clearRect(0, 0, width, width);
    ctx.fillStyle = '#fffdf8';
    ctx.fillRect(0, 0, width, width);
    ctx.fillStyle = theme.dark;
    ctx.fillRect(0, 0, width, 196);
    ctx.fillStyle = theme.main;
    ctx.fillRect(0, 196, 22, 884);

    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#bce8e2';
    ctx.font = '700 28px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('AI 幫我讀懂財稅', 72, 65);
    roundedRect(ctx, 780, 42, 222, 54, 27, 'rgba(255,255,255,.13)');
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 25px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(theme.label, 891, 78);
    ctx.textAlign = 'left';
    ctx.font = '900 66px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText(fields.topic.options[fields.topic.selectedIndex].text, 72, 154);

    const title = fields.title.value.trim() || '三個重點一次看懂';
    ctx.fillStyle = theme.dark;
    ctx.font = '900 52px "PingFang TC", "Microsoft JhengHei", sans-serif';
    const titleLines = wrapText(ctx, title, uploadedImage ? 560 : 900, 2);
    titleLines.forEach((line, index) => ctx.fillText(line, 72, 276 + index * 66));

    if (uploadedImage) {
      drawCover(uploadedImage, 700, 240, 310, 250);
    } else {
      roundedRect(ctx, 700, 240, 310, 250, 30, theme.pale);
      ctx.strokeStyle = theme.main;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(855, 335, 57, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = theme.main;
      ctx.textAlign = 'center';
      ctx.font = '900 70px system-ui, sans-serif';
      ctx.fillText(theme.icon, 855, 360);
      ctx.font = '700 22px "PingFang TC", sans-serif';
      ctx.fillText('我的學習重點', 855, 444);
      ctx.textAlign = 'left';
    }

    const points = [fields.point1.value.trim(), fields.point2.value.trim(), fields.point3.value.trim()];
    const fallback = ['用自己的話寫下第一個重點', '確認答案和官方資料一致', '告訴讀者可以採取的下一步'];
    const startY = 520;
    points.forEach((point, index) => {
      const y = startY + index * 156;
      roundedRect(ctx, 68, y, 944, 132, 24, index % 2 ? '#f7f3ea' : '#f0f5f3');
      ctx.fillStyle = theme.main;
      ctx.beginPath();
      ctx.arc(126, y + 66, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = '900 29px system-ui, sans-serif';
      ctx.fillText(String(index + 1), 126, y + 77);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#13232c';
      ctx.font = '750 34px "PingFang TC", "Microsoft JhengHei", sans-serif';
      const lines = wrapText(ctx, point || fallback[index], 820, 2);
      const lineY = y + (lines.length === 1 ? 78 : 57);
      lines.forEach((line, lineIndex) => ctx.fillText(line, 184, lineY + lineIndex * 45));
    });

    ctx.strokeStyle = '#d7e0df';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(68, 1000); ctx.lineTo(1012, 1000); ctx.stroke();
    ctx.fillStyle = '#526670';
    ctx.font = '600 23px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('資料經官方事實卡查證｜AI 協助整理，內容由我確認', 72, 1042);
    const displayName = fields.name.value.trim() || '姓名';
    ctx.textAlign = 'right';
    ctx.fillStyle = theme.dark;
    ctx.font = '800 25px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText(displayName, 1008, 1042);
    ctx.textAlign = 'left';

    const safeName = sanitizeFilename(displayName);
    filenamePreview.textContent = `預計檔名：${safeName}_${theme.file}.png`;
  }

  function sanitizeFilename(value) {
    return (value || '姓名').replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '') || '姓名';
  }

  function updateCounter(input, output) { output.textContent = [...input.value].length; }
  const counters = [
    [fields.title, $('#title-count')], [fields.point1, $('#point-1-count')],
    [fields.point2, $('#point-2-count')], [fields.point3, $('#point-3-count')]
  ];
  counters.forEach(([input, output]) => input.addEventListener('input', () => updateCounter(input, output)));
  Object.values(fields).filter(field => field !== fields.image).forEach(field => {
    field.addEventListener('input', drawCard);
    field.addEventListener('change', drawCard);
  });

  fields.image.addEventListener('change', () => {
    const file = fields.image.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('請選擇 JPG、PNG 或 WebP 圖片。');
      fields.image.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = event => {
      const image = new Image();
      image.onload = () => { uploadedImage = image; removeImage.hidden = false; drawCard(); };
      image.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
  removeImage.addEventListener('click', () => {
    uploadedImage = null;
    fields.image.value = '';
    removeImage.hidden = true;
    drawCard();
  });

  $$('.use-topic').forEach(button => button.addEventListener('click', () => {
    fields.topic.value = button.dataset.topic;
    fields.title.value = '三個重點一次看懂';
    updateCounter(fields.title, $('#title-count'));
    drawCard();
    $('#card-maker').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => fields.name.focus(), 400);
  }));

  form.addEventListener('submit', event => {
    event.preventDefault();
    const required = [fields.name, fields.title, fields.point1, fields.point2, fields.point3];
    const empty = required.find(field => !field.value.trim());
    if (empty) {
      errorBox.textContent = '還有必填欄位沒有完成。請填寫姓名、標題與三個重點。';
      errorBox.hidden = false;
      empty.focus();
      return;
    }
    errorBox.hidden = true;
    drawCard();
    const theme = themes[fields.topic.value];
    const link = document.createElement('a');
    link.download = `${sanitizeFilename(fields.name.value)}_${theme.file}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('圖卡已下載。請打開圖片檢查後再繳交。');
  });

  drawCard();
})();
