const luxuryEase = 'power4.inOut';
const productCatalog = window.AURA_PRODUCTS || [{
        id: "tukan-vanilla-sky",
        name: "Tukan Vanilla Sky",
        brand: "Tukan",
        gender: "Women",
        releaseYear: 2023,
        image: "87a7d4e573634b967e8b66c049d7267a.jpg",
        bg: "#d4b89f",
        notes: { top: "Sweet Almond", heart: "Madagascar Vanilla", base: "Warm Amber" },
        season: "Fall / Winter",
        time: "Day / Cozy",
        variants: [
            { size: "50ml", price: 85 },
            { size: "100ml", price: 120 }
        ]
    },
    {
        id: "rouge-extrait",
        name: "Rouge Extrait",
        brand: "AURA Exclusives",
        gender: "Unisex",
        releaseYear: 2021,
        image: "6f2d12e0a8a2b7c38804dfe71fe20bbb.jpg",
        bg: "#5a0a0a",
        notes: { top: "Bitter Almond / Saffron", heart: "Egyptian Jasmine", base: "Cedarwood / Musk" },
        season: "Fall / Winter",
        time: "Night / Signature",
        variants: [
            { size: "70ml", price: 295 },
            { size: "200ml", price: 425 }
        ]
    },
    {
        id: "ysl-black-opium",
        name: "Black Opium",
        brand: "Yves Saint Laurent",
        gender: "Women",
        releaseYear: 2014,
        image: "7382ff3d4b574eb980ce00f10e1bf917.jpg",
        bg: "#111111",
        notes: { top: "Pear / Pink Pepper", heart: "Coffee / Jasmine", base: "Vanilla / Patchouli" },
        season: "Winter",
        time: "Night / Clubbing",
        variants: [
            { size: "30ml", price: 85 },
            { size: "50ml", price: 115 },
            { size: "90ml", price: 155 }
        ]
    },
    {
        id: "tf-lost-cherry",
        name: "Lost Cherry",
        brand: "Tom Ford",
        gender: "Unisex",
        releaseYear: 2018,
        image: "e3fbfbf594a1524d5bdd2aeffbff7991.jpg",
        bg: "#5c0b11",
        notes: { top: "Black Cherry / Almond", heart: "Plum / Turkish Rose", base: "Tonka Bean / Vanilla" },
        season: "Fall / Winter",
        time: "Night / Date",
        variants: [
            { size: "30ml", price: 250 },
            { size: "50ml", price: 395 },
            { size: "100ml", price: 550 }
        ]
    }];
const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
    duration: 1.7,
    smoothWheel: true,
    lerp: 0.08
});

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

const productName = document.querySelector('.detail-product-name');
const productEyebrow = document.querySelector('.product-eyebrow');
const productLede = document.querySelector('.product-lede');
const productPrice = document.querySelector('.product-page-price');
const productSeason = document.querySelector('.product-season');
const productTime = document.querySelector('.product-time');
const heroBottle = document.querySelector('.hero-bottle');
const pinnedBottle = document.querySelector('.pin-bottle');
const noteList = document.querySelector('.note-list');
const mobileNoteTrack = document.querySelector('.mobile-note-track');
const addButtons = document.querySelectorAll('.product-add-button');
let activeProduct = null;

function renderProductNotes(product) {
    const noteGroups = [
        ['top', 'Top Note'],
        ['heart', 'Heart Note'],
        ['base', 'Base Note']
    ];

    noteList.replaceChildren(...noteGroups.map(([key, label], index) => {
        const item = document.createElement('article');
        item.className = `note-item${index === 0 ? ' is-active' : ''}`;
        item.dataset.note = key;

        const number = document.createElement('span');
        number.className = 'note-index';
        number.textContent = String(index + 1).padStart(2, '0');

        const content = document.createElement('div');
        const category = document.createElement('small');
        category.textContent = label;
        const value = document.createElement('h3');
        value.textContent = product.notes[key];
        content.append(category, value);
        item.append(number, content);
        return item;
    }));

    mobileNoteTrack.replaceChildren(...noteGroups.map(([key, label], index) => {
        const slide = document.createElement('article');
        slide.className = 'mobile-note-slide';
        slide.setAttribute('aria-label', `${label}: ${product.notes[key]}`);

        const content = document.createElement('div');
        content.className = 'mobile-note-copy';
        const meta = document.createElement('div');
        meta.className = 'mobile-note-meta';
        const group = document.createElement('span');
        group.textContent = `OLFACTORY COMPLEX / ${label}`;
        const indexLabel = document.createElement('span');
        indexLabel.textContent = `${String(index + 1).padStart(2, '0')} / 03`;
        meta.append(group, indexLabel);

        const value = document.createElement('h2');
        value.textContent = product.notes[key];
        content.append(meta, value);
        slide.append(content);
        return slide;
    }));
}

function getRoutedProduct() {
    const match = /^#product\/([a-z0-9-]+)$/i.exec(window.location.hash);
    return match ? productCatalog.find((product) => product.id === match[1]) : null;
}

function renderProduct(product) {
    if (!product) return;
    activeProduct = product;
    document.title = `${product.name} | AURA PARFUMS`;
    productName.textContent = product.name;
    productEyebrow.textContent = `AURA / ${product.name}`;
    productLede.textContent = `A considered composition of ${product.notes.top.toLowerCase()}, ${product.notes.heart.toLowerCase()}, and ${product.notes.base.toLowerCase()}.`;
    productPrice.textContent = currencyFormatter.format(product.price);
    productSeason.textContent = product.season;
    productTime.textContent = product.time;
    heroBottle.src = product.image;
    heroBottle.alt = `${product.name} fragrance bottle`;
    pinnedBottle.src = product.image;
    pinnedBottle.alt = `${product.name} fragrance bottle`;
    renderProductNotes(product);
    ScrollTrigger.refresh();
}

function readCart() {
    try {
        const savedCart = JSON.parse(localStorage.getItem('aura-cart') || '[]');
        return Array.isArray(savedCart) ? savedCart : [];
    } catch {
        return [];
    }
}

function updateBagCount() {
    const count = readCart().reduce((total, item) => total + (Number(item.quantity) || 0), 0);
    document.querySelectorAll('.bag-count').forEach((element) => {
        element.textContent = count;
    });
}

function addActiveProductToBag() {
    if (!activeProduct) return;

    const cart = readCart();
    const existingItem = cart.find((item) => item.productId === activeProduct.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            productId: activeProduct.id,
            title: activeProduct.name,
            image: activeProduct.image,
            price: activeProduct.price,
            quantity: 1
        });
    }

    try {
        localStorage.setItem('aura-cart', JSON.stringify(cart));
    } catch {
        return;
    }

    updateBagCount();
    addButtons.forEach((button) => {
        button.textContent = 'ADDED TO BAG';
        window.setTimeout(() => {
            button.textContent = 'ADD TO BAG';
        }, 1600);
    });
}

function syncProductRoute() {
    const product = getRoutedProduct() || productCatalog[0];
    if (product) renderProduct(product);
}

window.addEventListener('popstate', syncProductRoute);
window.addEventListener('hashchange', syncProductRoute);
syncProductRoute();
updateBagCount();

addButtons.forEach((button) => button.addEventListener('click', addActiveProductToBag));

const discoverNotesButton = document.querySelector('[data-scroll-target]');
if (discoverNotesButton) {
    discoverNotesButton.addEventListener('click', () => {
        const ingredientsStage = document.querySelector('.ingredients-stage');
        if (ingredientsStage) lenis.scrollTo(ingredientsStage, { duration: 1.6 });
    });
}

const heroReveal = gsap.timeline({ defaults: { ease: luxuryEase } });
heroReveal
    .from('.hero-copy .eyebrow', { y: 30, opacity: 0, duration: 1.1 })
    .from('.hero-copy h1', { y: 50, opacity: 0, duration: 1.5 }, '-=0.7')
    .from('.hero-copy .lede', { y: 26, opacity: 0, duration: 1.2 }, '-=0.8')
    .from('.hero-actions', { y: 24, opacity: 0, duration: 1.2 }, '-=0.8')
    .from('.hero-visual', { scale: 1.16, opacity: 0, duration: 1.8 }, '-=1.3');

const noteItems = gsap.utils.toArray('.note-item');
if (window.matchMedia('(min-width: 769px)').matches) {
    const bottlePanel = document.querySelector('.bottle-column');
    const ingredientsStage = document.querySelector('.ingredients-stage');
    if (bottlePanel && ingredientsStage) {
        ScrollTrigger.create({
            trigger: ingredientsStage,
            pin: bottlePanel,
            start: 'top top',
            end: 'bottom bottom',
            pinSpacing: false,
            invalidateOnRefresh: true
        });
    }

    noteItems.forEach((item) => {
        ScrollTrigger.create({
            trigger: item,
            start: 'center center',
            end: 'center center+=1',
            onEnter: () => item.classList.add('is-active'),
            onLeaveBack: () => item.classList.remove('is-active')
        });
    });
}

gsap.from('.cta-panel', {
    y: 40,
    opacity: 0,
    duration: 1.3,
    ease: luxuryEase,
    scrollTrigger: {
        trigger: '.cta-panel',
        start: 'top 84%'
    }
});

window.addEventListener('resize', () => ScrollTrigger.refresh());
