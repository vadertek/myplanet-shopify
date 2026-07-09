if (document.querySelector('cart-drawer')) {
class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
    this.setHeaderCartIconAccessibility();
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector('#cart-icon-bubble');
    if (!cartLink) return;

    cartLink.setAttribute('role', 'button');
    cartLink.setAttribute('aria-haspopup', 'dialog');
    cartLink.addEventListener('click', (event) => {
      event.preventDefault();
      this.open(cartLink);
    });
    cartLink.addEventListener('keydown', (event) => {
      if (event.code.toUpperCase() === 'SPACE') {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {
      this.classList.add('animate', 'active');
    });

    this.addEventListener(
      'transitionend',
      () => {
        const containerToTrapFocusOn = this.classList.contains('is-empty')
          ? this.querySelector('.drawer__inner-empty')
          : document.getElementById('CartDrawer');
        const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
        trapFocus(containerToTrapFocusOn, focusElement);
      },
      { once: true }
    );

    document.body.classList.add('overflow-hidden');
  }

  close() {
    this.classList.remove('active');
    removeTrapFocus(this.activeElement);
    document.body.classList.remove('overflow-hidden');
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute('role', 'button');
    cartDrawerNote.setAttribute('aria-expanded', 'false');

    if (cartDrawerNote.nextElementSibling.getAttribute('id')) {
      cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener('click', (event) => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });

    cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
  }

  renderContents(parsedState) {
    this.querySelector('.drawer__inner').classList.contains('is-empty') &&
      this.querySelector('.drawer__inner').classList.remove('is-empty');
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector
        ? document.querySelector(section.selector)
        : document.getElementById(section.id);

      if (!sectionElement) return;
      sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
    });

    setTimeout(() => {
      this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
      this.open();
    });
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        selector: '#CartDrawer',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-drawer', CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      {
        id: 'CartDrawer',
        section: 'cart-drawer',
        selector: '.drawer__inner',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
    ];
  }
}

customElements.define('cart-drawer-items', CartDrawerItems);
}

(function () {
  const DRAWER_ID = 'cherie-cart-drawer';
  const ITEMS_ID = 'cherie-drawer-items';

  let addBusy = false;
  const lineState = new Map();

  function getDrawer() {
    return document.getElementById(DRAWER_ID);
  }

  function getToast() {
    return document.getElementById('cherie-cart-toast');
  }

  function isMpCartAjaxAvailable() {
    return !!getDrawer() || !!getToast();
  }

  function isMpDrawerAvailable() {
    return !!getDrawer();
  }

  function openDrawer() {
    const drawer = getDrawer();
    if (!drawer) return;

    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overflow-hidden');
  }

  function closeDrawer() {
    const drawer = getDrawer();
    if (!drawer) return;

    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');
  }

  function setItemBusy(key, isBusy) {
    if (!key || typeof CSS === 'undefined' || !CSS.escape) return;

    const itemEl = document.querySelector(`[data-cart-item][data-key="${CSS.escape(key)}"]`);
    if (!itemEl) return;

    itemEl.classList.toggle('is-loading', !!isBusy);
  }

  async function fetchCart() {
    const response = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Cart fetch failed');
    return response.json();
  }

  function moneyFromCents(cents, currency) {
    const locale = document.documentElement.lang || undefined;
    const currentCurrency = currency || window?.Shopify?.currency?.active || window?.Shopify?.currency?.shop || 'UAH';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currentCurrency,
      maximumFractionDigits: 0,
    }).format((Number(cents) || 0) / 100);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function renderEmpty(cart) {
    const count = Number(cart?.item_count || 0);

    return `
      <div class="flex flex-1 flex-col items-start justify-center rounded-2xl border border-[#C0D7ED] px-5 py-8">
        <p class="font-montserrat-bold text-[22px] leading-tight font-bold text-main-blue">Кошик порожній</p>
        <a class="mt-5 inline-flex min-h-12 items-center justify-center rounded-[10px] bg-main-blue px-6 text-center font-montserrat-bold text-[12px] leading-none font-bold text-white transition hover:bg-dark-blue focus-visible:bg-dark-blue md:rounded-[14px] md:text-[14px]" href="/collections/all">
          Продовжити покупки
        </a>
        <span class="hidden" data-cherie-empty-count>${count}</span>
      </div>
    `;
  }

  function renderItem(item, cart) {
    const key = escapeHtml(item.key);
    const image = item.image
      ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.product_title)}" class="max-h-full max-w-full object-contain" loading="lazy">`
      : '';
    const variant =
      item.variant_title && item.variant_title !== 'Default Title'
        ? `<p class="mt-1 truncate font-montserrat-reg text-[12px] leading-tight text-main-blue/70">${escapeHtml(item.variant_title)}</p>`
        : '';
    const compare =
      item.original_line_price > item.final_line_price
        ? `<p class="mt-1 font-montserrat-bold text-[12px] leading-none font-bold text-[#C0D7ED] line-through">${moneyFromCents(item.original_line_price, cart.currency)}</p>`
        : '';
    const decDisabled = item.quantity <= 1 ? ' text-[#C0D7ED]' : '';

    return `
      <article class="cherie-line relative grid grid-cols-[80px_minmax(0,1fr)_28px] gap-x-3 rounded-2xl border border-[#C0D7ED] bg-white p-3" data-cart-item data-key="${key}">
        <a href="${escapeHtml(item.url)}" class="row-span-3 flex h-20 w-20 items-center justify-center rounded-lg bg-[#C0D7ED]/20">${image}</a>

        <div class="min-w-0">
          <a href="${escapeHtml(item.url)}" class="line-clamp-2 font-montserrat-bold text-[14px] leading-tight font-bold text-dark-blue transition hover:text-main-blue">${escapeHtml(item.product_title)}</a>
          ${variant}
        </div>

        <button type="button" class="mp-cart-remove grid h-7 w-7 cursor-pointer place-items-center justify-self-end text-main-blue transition hover:text-dark-blue" data-cherie-cart-remove data-key="${key}" aria-label="Видалити товар">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 4h6M4 7h16M18 7l-.7 12.1A2 2 0 0 1 15.3 21H8.7a2 2 0 0 1-2-1.9L6 7M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <div class="col-start-2 col-end-4 mt-3 flex items-center justify-between gap-3">
          <div class="flex h-8 min-w-22 items-center justify-between rounded-full border border-main-blue px-3 font-montserrat-bold text-[12px] leading-none font-bold text-main-blue">
            <button type="button" class="cursor-pointer px-1${decDisabled}" data-cherie-qty-dec data-key="${key}" aria-label="Зменшити кількість">-</button>
            <input class="w-8 appearance-none bg-transparent text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" type="number" min="1" value="${item.quantity}" inputmode="numeric" data-cherie-qty-input data-key="${key}" aria-label="Кількість">
            <button type="button" class="cursor-pointer px-1" data-cherie-qty-inc data-key="${key}" aria-label="Збільшити кількість">+</button>
          </div>

          <div class="text-right">
            <p class="font-montserrat-bold text-[16px] leading-none font-bold text-main-blue">${moneyFromCents(item.final_line_price, cart.currency)}</p>
            ${compare}
          </div>
        </div>

        <div class="cherie-line-loader pointer-events-none absolute inset-0 hidden items-center justify-center rounded-2xl bg-white/70">
          <span class="cherie-spinner" aria-hidden="true"></span>
        </div>
      </article>
    `;
  }

  function syncSummary(cart) {
    document.querySelectorAll('[data-cherie-cart-count]').forEach((node) => {
      node.textContent = cart?.item_count ?? 0;
    });

    document.querySelectorAll('[data-cherie-cart-total]').forEach((node) => {
      node.textContent = moneyFromCents(cart?.total_price || 0, cart?.currency);
    });
  }

  function renderDrawer(cart) {
    const root = document.getElementById(ITEMS_ID);
    if (!root) return;

    if (!cart.items || cart.items.length === 0) {
      root.innerHTML = renderEmpty(cart);
      syncSummary(cart);
      return;
    }

    root.innerHTML = cart.items.map((item) => renderItem(item, cart)).join('');
    syncSummary(cart);

    for (const [key, state] of lineState.entries()) {
      if (state?.running) setItemBusy(key, true);
    }
  }

  async function addToCartAjax(form) {
    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form),
    });

    if (!response.ok) {
      let message = 'Не вдалося додати товар до кошика';
      try {
        const json = await response.json();
        message = json?.description || json?.message || message;
      } catch (error) {}
      throw new Error(message);
    }

    document.dispatchEvent(new CustomEvent('cart:updated'));
  }

  function queueChangeDebounced(key, desiredQty, delayMs = 250) {
    const qty = Math.max(1, parseInt(desiredQty || '1', 10));
    const state = lineState.get(key) || { desiredQty: qty, running: false, timerId: null };

    state.desiredQty = qty;
    if (state.timerId) clearTimeout(state.timerId);
    setItemBusy(key, true);

    state.timerId = setTimeout(async () => {
      if (state.running) return;

      state.running = true;
      lineState.set(key, state);

      try {
        const response = await fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ id: key, quantity: state.desiredQty }),
        });

        if (!response.ok) throw new Error('Не вдалося оновити кошик');

        const cart = await response.json();
        renderDrawer(cart);
        document.dispatchEvent(new CustomEvent('cart:updated'));
      } catch (error) {
        console.error(error);
        const cart = await fetchCart();
        renderDrawer(cart);
      } finally {
        state.running = false;
        state.timerId = null;
        lineState.set(key, state);
        setItemBusy(key, false);
      }
    }, delayMs);

    lineState.set(key, state);
  }

  function bumpQtyFromUI(key, delta) {
    if (!key || typeof CSS === 'undefined' || !CSS.escape) return;

    const line = document.querySelector(`[data-cart-item][data-key="${CSS.escape(key)}"]`);
    const input = line?.querySelector('[data-cherie-qty-input]');
    if (!input) return;

    const next = Math.max(1, (parseInt(input.value || '1', 10) || 1) + delta);
    input.value = String(next);
    queueChangeDebounced(key, next);
  }

  async function removeLine(key) {
    const state = lineState.get(key) || { desiredQty: 0, running: false, timerId: null };
    if (state.timerId) clearTimeout(state.timerId);

    state.running = true;
    lineState.set(key, state);
    setItemBusy(key, true);

    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: key, quantity: 0 }),
      });

      if (!response.ok) throw new Error('Не вдалося оновити кошик');

      const cart = await response.json();
      renderDrawer(cart);
      document.dispatchEvent(new CustomEvent('cart:updated'));
    } catch (error) {
      console.error(error);
      const cart = await fetchCart();
      renderDrawer(cart);
    } finally {
      state.running = false;
      state.timerId = null;
      lineState.set(key, state);
      setItemBusy(key, false);
    }
  }

  function showCartToast(text = 'Товар додано до кошика') {
    const toast = getToast();
    if (!toast) return;

    const toastText = toast.querySelector('[data-cherie-cart-toast-text]');
    if (toastText) {
      toastText.textContent = text;
    } else {
      toast.textContent = text;
    }
    toast.classList.remove('opacity-0', '-translate-y-4', 'scale-95');
    toast.classList.add('opacity-100', 'translate-y-0', 'scale-100');

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
      toast.classList.add('opacity-0', '-translate-y-4', 'scale-95');
    }, 4000);
  }

  document.addEventListener(
    'submit',
    async (event) => {
      if (!isMpCartAjaxAvailable()) return;

      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (!form.matches('form[action*="/cart/add"], form[action*="/cart/add.js"], form[action="/cart/add"]')) return;
      if (form.querySelector('.no-drawer')) return;

      const cartType = document.documentElement.dataset.cartType || 'drawer';
      if (cartType === 'page') return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (addBusy) return;
      addBusy = true;

      try {
        await addToCartAjax(form);

        if (cartType === 'drawer') {
          const cart = await fetchCart();
          renderDrawer(cart);
          openDrawer();
        }

        if (cartType === 'notification') showCartToast();
      } catch (error) {
        console.error(error);
        alert(error.message || 'Error');
      } finally {
        addBusy = false;
      }
    },
    true
  );

  document.addEventListener('click', async (event) => {
    if (!isMpDrawerAvailable()) return;

    const opener = event.target.closest('[data-cherie-cart-open], #cart-icon-bubble');
    const closer = event.target.closest('[data-cherie-cart-close]');
    const inc = event.target.closest('[data-cherie-qty-inc]');
    const dec = event.target.closest('[data-cherie-qty-dec]');
    const remove = event.target.closest('[data-cherie-cart-remove]');

    if (opener) {
      event.preventDefault();
      try {
        const cart = await fetchCart();
        renderDrawer(cart);
      } catch (error) {
        console.error(error);
      }
      openDrawer();
      return;
    }

    if (closer) {
      closeDrawer();
      return;
    }

    if (inc) {
      bumpQtyFromUI(inc.dataset.key, 1);
      return;
    }

    if (dec) {
      bumpQtyFromUI(dec.dataset.key, -1);
      return;
    }

    if (remove) {
      removeLine(remove.dataset.key);
    }
  });

  document.addEventListener('change', (event) => {
    if (!isMpDrawerAvailable()) return;

    const input = event.target.closest('[data-cherie-qty-input]');
    if (!input) return;

    const qty = Math.max(1, parseInt(input.value || '1', 10) || 1);
    input.value = String(qty);
    queueChangeDebounced(input.dataset.key, qty);
  });

  document.addEventListener('keyup', (event) => {
    if (event.code === 'Escape') closeDrawer();
  });
})();
