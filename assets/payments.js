// {короче} — помощник для кнопок «Оплатить».
// Идея и контракт запроса/ответа — с сайта AELITA PRODUCTION
// (партнёр, тот же юрлицо), см. AELITA_pack-v123, Site/assets/
// payments.js. Бэкенд — их же Yandex Cloud Function (152-ФЗ требует
// первичный приём персональных данных для платежа физически в РФ,
// см. _tools/payments/README.md), не Cloudflare.
//
// ⚠️ ОТЛИЧИЕ ОТ ВЕРСИИ АЭЛИТЫ: у них с pack-v117 оплата обязательно
// требует вход в личный кабинет — здесь такой системы нет, сделано
// под гостевую оплату (имя + контакт, без токена), тот же принцип,
// что был у самой Аэлиты до pack-v117. Это осознанное упрощение под
// масштаб «Короче», но не окончательное решение — см. открытый вопрос
// в _tools/payments/README.md: если общий с Аэлитой бэкенд всё равно
// потребует токен, этот файл придётся переписать под их контракт.
//
// Не подключён ни на одной странице сайта — продавать пока нечего
// (см. /tickets/: показов с датой и ценой ещё нет). Готов к
// подключению, когда появится первый платный показ.
(function () {
  var LANG = document.documentElement.lang === 'en' ? 'en' : 'ru';

  var TEXT = {
    ru: {
      notConfigured: 'Оплата на сайте ещё не подключена — напишите нам напрямую, поможем оформить: aelita.production@yandex.ru',
      missingFields: 'Заполните имя и контакт — без них не отправим',
      badAmount: 'Укажите сумму от 100 до 100 000 ₽',
      processing: 'Переходим к оплате…',
      failed: 'Оплата не началась. Попробуйте ещё раз — или напишите нам напрямую, поможем оформить.',
    },
    en: {
      notConfigured: "Payment isn't connected on the site yet — email us directly and we'll help set it up: aelita.production@yandex.ru",
      missingFields: "Fill in your name and contact — we can't send this without them",
      badAmount: 'Enter an amount between 100 and 100,000 ₽',
      processing: 'Redirecting to payment…',
      failed: "Payment didn't start. Try again — or email us directly and we'll help sort it out.",
    },
  };
  var t = TEXT[LANG];

  // ЗАПОЛНИТЬ, когда бэкенд будет готов принимать продукты «Короче» —
  // см. _tools/payments/README.md, раздел «Что понадобится от
  // бэкенда». Публичный URL вида
  // https://functions.yandexcloud.net/<id функции>. Пока пусто —
  // кнопка «Оплатить» показывает понятное сообщение вместо тихой
  // поломки, сайт при этом не ломается.
  var CREATE_PAYMENT_URL = '';

  // product — код показа/билета (например, 'ticket:shows:2026-09-12'
  // — точная схема ещё не согласована с бэкендом, см. README).
  // amount — только если цена не зашита на сервере для этого product.
  window.KOROCHE_pay = async function (product, opts) {
    opts = opts || {};
    var name = (opts.name || '').trim();
    var contact = (opts.contact || '').trim();
    var amount = opts.amount;
    var comment = opts.comment || '';
    var buttonEl = opts.buttonEl || null;

    if (!CREATE_PAYMENT_URL) {
      alert(t.notConfigured);
      return;
    }
    if (!name || !contact) {
      alert(t.missingFields);
      return;
    }
    if (amount !== undefined && amount !== null) {
      var n = Number(amount);
      if (!n || n < 100 || n > 100000) {
        alert(t.badAmount);
        return;
      }
    }

    var originalText = buttonEl ? buttonEl.textContent : '';
    if (buttonEl) { buttonEl.disabled = true; buttonEl.textContent = t.processing; }

    // Метка в return_url — чтобы страница, на которую вернёт оплата,
    // могла показать понятное «мы вас ждали» вместо тишины. Это не
    // подтверждение самой оплаты — та подтверждается асинхронно через
    // webhook на сервере, фронтенд об этом узнать в моменте не может.
    var returnUrl = new URL(location.href);
    returnUrl.searchParams.set('koroche_paid', '1');

    try {
      var res = await fetch(CREATE_PAYMENT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: product, name: name, contact: contact, amount: amount, comment: comment, return_url: returnUrl.toString() }),
      });
      var data = await res.json();
      if (data && data.confirmation_url) {
        location.href = data.confirmation_url;
        return; // уходим со страницы — не нужно возвращать кнопку в исходное состояние
      }
      alert(t.failed);
    } catch (e) {
      alert(t.failed);
    }
    if (buttonEl) { buttonEl.disabled = false; buttonEl.textContent = originalText; }
  };
})();
