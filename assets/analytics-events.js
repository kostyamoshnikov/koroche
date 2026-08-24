// === Отслеживание конверсионных действий + собственная статистика ({короче}) ===
//
// Часть с собственной статистикой (pageview + категории кликов в
// свою Google Таблицу) — идея и код с сайта AELITA PRODUCTION
// (партнёр, тот же юрлицо), см. AELITA_pack-v123, _tools/Analytics/.
// Дополняет Яндекс.Метрику, не заменяет — см. README сайта, раздел
// «Аналитика», и _tools/analytics/README.md здесь.
//
// Заодно: убраны вызовы dataLayer/gtag — GTM и GA4 удалены с сайта
// ещё в koroche-v11 (см. README сайта, раздел «Аналитика»), эти
// вызовы с тех пор были безвредным мёртвым кодом (написать было
// некому). Убраны сейчас, раз уж этот файл и так переписывается
// целиком под собственную статистику.
(function () {
  // === Собственная статистика — дополняет Метрику, не заменяет её ===
  // ⚠️ ЗАПОЛНИТЬ после деплоя _tools/analytics/worker.js — URL воркера
  // выглядит как https://koroche-analytics.ВАШ-SUBDOMAIN.workers.dev
  // Пока пусто — сбор просто не отправляется никуда, ошибок нет.
  const OWN_ANALYTICS_URL = '';

  let ownBuffer = [];
  let ownFlushTimer = null;

  function ownConsent() {
    try { return !!localStorage.getItem('cookies_accepted'); } catch (e) { return false; }
  }

  function sessionId() {
    try {
      let id = sessionStorage.getItem('koroche_sid');
      if (!id) {
        id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        sessionStorage.setItem('koroche_sid', id);
      }
      return id;
    } catch (e) { return ''; }
  }

  function deviceType() {
    return window.matchMedia && window.matchMedia('(max-width: 760px)').matches ? 'mobile' : 'desktop';
  }

  function pageLang() {
    return /^\/en\//.test(location.pathname) ? 'en' : 'ru';
  }

  function utmParam(name) {
    try { return new URLSearchParams(location.search).get(name) || ''; } catch (e) { return ''; }
  }

  function ownFlush(useBeacon) {
    if (!ownBuffer.length || !OWN_ANALYTICS_URL) { ownBuffer = []; return; }
    const payload = JSON.stringify({ events: ownBuffer });
    ownBuffer = [];
    if (useBeacon && navigator.sendBeacon) {
      try {
        navigator.sendBeacon(OWN_ANALYTICS_URL, new Blob([payload], { type: 'application/json' }));
        return;
      } catch (e) { /* падаем на fetch ниже */ }
    }
    try {
      fetch(OWN_ANALYTICS_URL, { method: 'POST', body: payload, keepalive: true }).catch(function () {});
    } catch (e) { /* тихо игнорируем — статистика никогда не должна ломать сайт */ }
  }

  function ownTrack(eventName, extra) {
    if (!ownConsent() || !OWN_ANALYTICS_URL) return;
    ownBuffer.push(Object.assign({
      event: eventName,
      page: location.pathname,
      ref: document.referrer || '',
      utm_source: utmParam('utm_source'),
      utm_medium: utmParam('utm_medium'),
      utm_campaign: utmParam('utm_campaign'),
      device: deviceType(),
      lang: pageLang(),
      session: sessionId(),
      ts: Date.now(),
    }, extra || {}));
    // Раз в ~8 секунд, если накопилось что отправить — не по одному
    // запросу на каждое событие. Финальная отправка при уходе со
    // страницы — через pagehide/visibilitychange ниже, sendBeacon'ом.
    if (!ownFlushTimer) {
      ownFlushTimer = setTimeout(function () { ownFlushTimer = null; ownFlush(false); }, 8000);
    }
  }

  // Вызывается из main.js в двух точках — как и loadMetrika() у
  // AELITA: если согласие уже было дано раньше (при заходе на новую
  // страницу) и сразу в момент нажатия «Принять» на баннере. До
  // согласия — не фиксируем вообще ничего, ни один просмотр страницы.
  window.KOROCHE_initOwnStats = function () {
    if (!ownConsent()) return;
    ownTrack('pageview', {});
  };

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') ownFlush(true);
  });
  window.addEventListener('pagehide', function () { ownFlush(true); });

  // === Единая точка входа: цель уходит в Метрику И в собственную статистику ===
  function track(goal, params) {
    params = params || {};
    if (window.ym) {
      try { window.ym(110846274, 'reachGoal', goal, params); } catch (e) {}
    }
    // Пиксель VK Рекламы (window._tmr, см. блок «VK Ads pixel» в head
    // каждой страницы) — window.KOROCHE_VK_PIXEL_ID заполняется только
    // если VK_PIXEL_ID там не 0, то есть пиксель реально создан.
    if (window._tmr && window.KOROCHE_VK_PIXEL_ID) {
      try { window._tmr.push({ id: window.KOROCHE_VK_PIXEL_ID, type: 'reachGoal', goal: goal }); } catch (e) {}
    }
    ownTrack(goal, params);
  }

  // Достаёт слаг страницы из внутренней ссылки вида /slug/ или /en/slug/.
  // Для внешних ссылок возвращает href как есть.
  function slugFromHref(href) {
    var m = href.match(/^\/(?:en\/)?([a-z0-9-]+)\/?(?:[?#].*)?$/);
    return m ? m[1] : href;
  }

  // Клики по ссылкам: телефон, почта, Telegram-канал/бот, билеты,
  // карточки спектаклей/людей
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const cls = ' ' + (a.className || '') + ' ';

    if (href.indexOf('tel:') === 0) {
      track('phone_click', { link_url: href });
      return;
    }
    if (href.indexOf('mailto:') === 0) {
      track('email_click', { link_url: href });
      return;
    }
    if (href.indexOf('t.me/') !== -1) {
      track(href.indexOf('_bot') !== -1 ? 'telegram_bot_click' : 'telegram_channel_click', { link_url: href });
      return;
    }
    if (/\/tickets\/?($|[?#])/.test(href)) {
      track('tickets_page_click', { link_url: href });
      return;
    }

    // --- карточки спектаклей: piece-card (части «Археологии»),
    //     other-card (репертуар на страницах спектаклей), work-card
    //     (репертуар на страницах Бычковой/Сачкова/Сенокосовой),
    //     rep-item (список репертуара на главной, включая архивные) ---
    if (/ (piece-card|other-card|work-card|rep-item) /.test(cls)) {
      var cardType = cls.match(/ (piece-card|other-card|work-card|rep-item) /)[1];
      track('show_card_click', { link_url: href, slug: slugFromHref(href), card_type: cardType, page: location.pathname });
      return;
    }

    // --- карточки людей: команда на главной, персональные страницы ---
    if (/ person-card /.test(cls)) {
      track('person_card_click', { link_url: href, slug: slugFromHref(href), page: location.pathname });
      return;
    }
  }, true);

  // --- кнопка установки PWA — не <a>, обычная <button> ---
  document.addEventListener('click', function (e) {
    var installBtn = e.target.closest('.install-btn');
    if (installBtn) {
      track('pwa_install_click', { page: location.pathname });
    }
  }, true);

  // Клик по кнопке отправки форм (subscribeEmail и другие будущие обработчики
  // подписки/формы) — отмечает попытку отправки; фактическая доставка идёт
  // через Formspree/Telegram-воркер в самих формах.
  // 'subscribeEmail' сохраняет прежнее имя цели lead_email_subscribe_click,
  // чтобы не сломать уже настроенные цели в Метрике; остальные обработчики
  // идут под общим form_submit_click.
  var FORM_TRIGGERS = ['subscribeEmail', 'subscribe', 'handleForm', 'handleSubmit', 'joinClub'];
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[onclick]');
    if (!el) return;
    const onclick = (el.getAttribute('onclick') || '').trim();
    const matched = FORM_TRIGGERS.filter(function (fn) { return onclick.indexOf(fn + '(') === 0; })[0];
    if (!matched) return;
    if (matched === 'subscribeEmail') {
      track('lead_email_subscribe_click', { page: location.pathname });
    } else {
      track('form_submit_click', { form_handler: matched, page: location.pathname });
    }
  }, true);

  // Включение звука на hero-видео (страницы спектаклей) — сигнал вовлечённости
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('#teaser-sound-btn, .teaser-sound-btn');
    if (!btn) return;
    setTimeout(function () {
      if (btn.classList.contains('on')) {
        track('video_sound_on', { page: location.pathname });
      }
    }, 0);
  }, true);
})();
