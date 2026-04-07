document.addEventListener("DOMContentLoaded", function () {

    if (document.querySelector('.empty-cart')) {

        anime({
            targets: '.empty-img',
            translateY: [-40, 0],
            opacity: [0, 1],
            duration: 1200,
            easing: 'easeOutElastic(1, .7)'
        });

        anime({
            targets: '.empty-title, .empty-desc, .shop-btn',
            opacity: [0, 1],
            translateY: [20, 0],
            delay: anime.stagger(200),
            duration: 800,
            easing: 'easeOutQuad'
        });

        anime({
            targets: '.product-card',
            opacity: [0, 1],
            translateY: [30, 0],
            delay: anime.stagger(150),
            duration: 700,
            easing: 'easeOutQuad'
        });
    }
});