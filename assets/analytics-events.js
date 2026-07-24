// === Отслеживание конверсионных действий ({короче}) ===
// Событие уходит в Яндекс.Метрику (reachGoal), в dataLayer (подхватывается GTM)
// и в GA4 (gtag), если он подключён на странице напрямую — без необходимости
// заранее создавать цели в интерфейсах.
(function () {
  function track(goal, params) {
    params = params || {};
    if (window.ym) {
      try { window.ym(110846274, 'reachGoal', goal, params); } catch (e) {}
    }
    if (window.gtag) {
      try { window.gtag('event', goal, params); } catch (e) {}
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: goal }, params));
  }

  // Клики по ссылкам: телефон, почта, Telegram-канал/бот, переход на билеты
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';

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
    }
  }, true);

  // Клик по кнопке отправки форм (subscribeEmail и другие будущие обработчики
  // подписки/формы) — отмечает попытку отправки; фактическая доставка идёт
  // через Formspree в самих формах.
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
