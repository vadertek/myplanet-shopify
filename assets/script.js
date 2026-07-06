// Shared includes: loads HTML partials such as header and footer into [data-include] placeholders.
document.querySelectorAll('[data-include]').forEach(async (element) => {
    const url = element.dataset.include;

    if (!url) {
        return;
    }

    const response = await fetch(url);

    if (!response.ok) {
        console.error(`Failed to load component: ${url}`);
        return;
    }

    element.innerHTML = await response.text();
});

// Header: toggles the mobile navigation menu and animates the burger icon.
document.addEventListener('click', (event) => {
    const burger = event.target.closest('[data-burger]');

    if (!burger) {
        return;
    }

    const header = burger.closest('header');
    const menu = header?.querySelector('[data-mobile-menu]');
    const topLine = burger.querySelector('[data-burger-line="top"]');
    const middleLine = burger.querySelector('[data-burger-line="middle"]');
    const bottomLine = burger.querySelector('[data-burger-line="bottom"]');
    const isOpen = burger.getAttribute('aria-expanded') === 'true';

    burger.setAttribute('aria-expanded', String(!isOpen));

    menu?.classList.toggle('max-h-0', isOpen);
    menu?.classList.toggle('max-h-80', !isOpen);
    menu?.classList.toggle('-translate-y-2', isOpen);
    menu?.classList.toggle('translate-y-0', !isOpen);
    menu?.classList.toggle('opacity-0', isOpen);
    menu?.classList.toggle('opacity-100', !isOpen);
    menu?.classList.toggle('pointer-events-none', isOpen);
    menu?.classList.toggle('pointer-events-auto', !isOpen);

    topLine?.classList.toggle('translate-y-2', !isOpen);
    topLine?.classList.toggle('rotate-45', !isOpen);
    middleLine?.classList.toggle('opacity-0', !isOpen);
    bottomLine?.classList.toggle('-translate-y-2', !isOpen);
    bottomLine?.classList.toggle('-rotate-45', !isOpen);
});

// In Trends section: controls category tabs and desktop product pagination; mobile sliding is handled in swiper.js.
document.querySelectorAll('[data-trends]').forEach((section) => {
    const tabs = Array.from(section.querySelectorAll('[data-trends-tab]'));
    const cards = Array.from(section.querySelectorAll('[data-trend-card]'));
    const prevButtons = section.querySelectorAll('[data-trends-prev]');
    const nextButtons = section.querySelectorAll('[data-trends-next]');
    const activeClasses = ['bg-main-blue', 'text-white'];
    const inactiveClasses = ['bg-[#C0D7ED]/30', 'text-main-blue'];
    let activeCategory = 'all';
    let startIndex = 0;

    // In Trends layout helpers: desktop shows 4 products, mobile shows 1 sliding product.
    const getVisibleCount = () => (window.matchMedia('(min-width: 768px)').matches ? 4 : 1);
    const isDesktop = () => window.matchMedia('(min-width: 768px)').matches;

    // In Trends filters: returns products that belong to the active tab category.
    const getFilteredCards = () =>
        cards.filter((card) => {
            const categories = card.dataset.category?.split(' ') ?? [];
            return categories.includes(activeCategory);
        });

    // In Trends tabs: updates the visual active state and accessibility state.
    const setActiveTab = (activeTab) => {
        tabs.forEach((tab) => {
            const isActive = tab === activeTab;
            tab.setAttribute('aria-selected', String(isActive));
            tab.classList.toggle(activeClasses[0], isActive);
            tab.classList.toggle(activeClasses[1], isActive);
            tab.classList.toggle(inactiveClasses[0], !isActive);
            tab.classList.toggle(inactiveClasses[1], !isActive);
        });
    };

    // In Trends render: desktop paginates 4 cards; mobile leaves matching cards for Swiper.
    const renderCards = (options = {}) => {
        const filteredCards = getFilteredCards();
        const visibleCount = getVisibleCount();
        const maxStartIndex = Math.max(filteredCards.length - visibleCount, 0);
        startIndex = Math.min(startIndex, maxStartIndex);

        cards.forEach((card) => {
            const filteredIndex = filteredCards.indexOf(card);
            const isVisible = isDesktop() ? filteredIndex >= startIndex && filteredIndex < startIndex + visibleCount : filteredIndex >= 0;
            card.hidden = !isVisible;
        });

        window.updateTrendsSwiper?.(options.reset);
    };

    // In Trends arrows: moves to the previous or next product group with looped navigation.
    const moveSlide = (direction) => {
        const filteredCards = getFilteredCards();
        const visibleCount = getVisibleCount();
        const maxStartIndex = Math.max(filteredCards.length - visibleCount, 0);
        startIndex = direction < 0 ? (startIndex <= 0 ? maxStartIndex : startIndex - 1) : startIndex >= maxStartIndex ? 0 : startIndex + 1;
        renderCards();
    };

    // In Trends tabs: switches category and scrolls the active tab into view on mobile.
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            activeCategory = tab.dataset.trendsTab ?? 'all';
            startIndex = 0;
            setActiveTab(tab);
            renderCards({ reset: true });
            tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        });
    });

    // In Trends controls: arrow buttons drive the same product navigation on desktop and mobile.
    prevButtons.forEach((button) => {
        button.addEventListener('click', () => {
            moveSlide(-1);
        });
    });

    nextButtons.forEach((button) => {
        button.addEventListener('click', () => {
            moveSlide(1);
        });
    });

    // In Trends responsive sync: recalculates visible products when crossing mobile/desktop widths.
    window.addEventListener('resize', renderCards);
    renderCards();
});

// Products grid: filters collection cards by category tabs without pagination.
document.querySelectorAll('[data-products]').forEach((section) => {
    const tabs = Array.from(section.querySelectorAll('[data-products-tab]'));
    const cards = Array.from(section.querySelectorAll('[data-product-card]'));
    const activeClasses = ['bg-main-blue', 'text-white'];
    const inactiveClasses = ['bg-[#C0D7ED]/30', 'text-main-blue'];

    const setActiveTab = (activeTab) => {
        tabs.forEach((tab) => {
            const isActive = tab === activeTab;
            tab.setAttribute('aria-selected', String(isActive));
            tab.classList.toggle(activeClasses[0], isActive);
            tab.classList.toggle(activeClasses[1], isActive);
            tab.classList.toggle(inactiveClasses[0], !isActive);
            tab.classList.toggle(inactiveClasses[1], !isActive);
        });
    };

    const filterCards = (category) => {
        cards.forEach((card) => {
            const categories = card.dataset.category?.split(' ') ?? [];
            card.hidden = !categories.includes(category);
        });
    };

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const category = tab.dataset.productsTab ?? 'all';
            setActiveTab(tab);
            filterCards(category);
            tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        });
    });

    filterCards('all');
});

// FAQ section: keeps one answer open and animates accordion panel height.
document.querySelectorAll('[data-faq]').forEach((section) => {
    const items = Array.from(section.querySelectorAll('[data-faq-item]'));

    const setItemState = (item, isOpen) => {
        const button = item.querySelector('[data-faq-button]');
        const panel = item.querySelector('[data-faq-panel]');
        const icon = item.querySelector('[data-faq-icon]');

        button?.setAttribute('aria-expanded', String(isOpen));
        icon?.classList.toggle('rotate-45', isOpen);

        if (!panel) {
            return;
        }

        panel.style.maxHeight = isOpen ? `${panel.scrollHeight}px` : '0px';
    };

    items.forEach((item, index) => {
        const button = item.querySelector('[data-faq-button]');
        setItemState(item, index === 0);

        button?.addEventListener('click', () => {
            const isOpen = button.getAttribute('aria-expanded') === 'true';

            items.forEach((currentItem) => {
                setItemState(currentItem, currentItem === item && !isOpen);
            });
        });
    });
});
