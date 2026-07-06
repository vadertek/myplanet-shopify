// In Trends mobile slider.
let trendsSwiper = null;

const initTrendsSwiper = (reset = false) => {
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;

    if (isDesktop) {
        trendsSwiper?.destroy(true, true);
        trendsSwiper = null;
        return;
    }

    if (!trendsSwiper) {
        trendsSwiper = new Swiper('[data-trends-swiper]', {
            slidesPerView: 1,
            speed: 350,
            watchOverflow: true,
            navigation: {
                prevEl: '[data-trends-swiper-prev]',
                nextEl: '[data-trends-swiper-next]',
            },
        });
    }

    trendsSwiper.update();

    if (reset) {
        trendsSwiper.slideTo(0, 0);
    }
};

window.updateTrendsSwiper = initTrendsSwiper;
window.addEventListener('resize', () => initTrendsSwiper());

// Reviews slider.
const initReviewsSwiper = () => {
    if (typeof Swiper === 'undefined' || !document.querySelector('[data-reviews-swiper]')) {
        return;
    }

    new Swiper('[data-reviews-swiper]', {
        slidesPerView: 1.08,
        spaceBetween: 10,
        speed: 350,
        watchOverflow: true,
        navigation: {
            prevEl: '[data-reviews-prev], [data-reviews-mobile-prev]',
            nextEl: '[data-reviews-next], [data-reviews-mobile-next]',
        },
        breakpoints: {
            768: {
                slidesPerView: 2.35,
                spaceBetween: 8,
            },
            1200: {
                slidesPerView: 3.35,
                spaceBetween: 8,
            },
            1450: {
                slidesPerView: 4,
                spaceBetween: 8,
            },
        },
    });
};

initReviewsSwiper();

// Good to Know slider.
const initGoodToKnowSwiper = () => {
    if (typeof Swiper === 'undefined' || !document.querySelector('[data-good-swiper]')) {
        return;
    }

    new Swiper('[data-good-swiper]', {
        slidesPerView: 1.05,
        spaceBetween: 8,
        speed: 350,
        watchOverflow: true,
        navigation: {
            prevEl: '[data-good-prev], [data-good-mobile-prev]',
            nextEl: '[data-good-next], [data-good-mobile-next]',
        },
        breakpoints: {
            768: {
                slidesPerView: 2,
                spaceBetween: 8,
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 8,
            },
            1450: {
                slidesPerView: 4,
                spaceBetween: 8,
            },
        },
    });
};

initGoodToKnowSwiper();

// Stores slider.
const initStoresSwiper = () => {
    if (typeof Swiper === 'undefined' || !document.querySelector('[data-stores-swiper]')) {
        return;
    }

    new Swiper('[data-stores-swiper]', {
        slidesPerView: 1.5,
        spaceBetween: 16,
        speed: 350,
        watchOverflow: true,
        navigation: {
            prevEl: '[data-stores-prev]',
            nextEl: '[data-stores-next]',
        },
        breakpoints: {
            768: {
                slidesPerView: 3,
                spaceBetween: 32,
            },
            1024: {
                slidesPerView: 4,
                spaceBetween: 44,
            },
        },
    });
};

initStoresSwiper();
