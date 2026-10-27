const defaultTheme = '#070707';
const luxuryEase = 'power4.inOut';
const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const productCatalog = window.AURA_PRODUCTS || [];
let activeGenderFilter = 'all';
let activeSort = 'featured';
let activeBrandFilter = 'all'; // ΝΕΟ
let searchQuery = ''; // ΝΕΟ
let collectionAnimationContext = null;

function getStartingVariant(product) {
    if (!product.variants || product.variants.length === 0) return { price: 0 };
    return product.variants.reduce((starting, variant) => variant.price < starting.price ? variant : starting);
}

function renderCollection(animate = true) {
    const collection = document.querySelector('.collection');
    if (!collection) return;

    collectionAnimationContext?.revert();
    const query = searchQuery.toLowerCase().trim();

    // ΝΕΟ: Φιλτράρισμα με βάση το Φύλο, τη Μάρκα και την Αναζήτηση
    const visibleProducts = productCatalog.filter((product) => {
        const matchesGender = (activeGenderFilter === 'all' || product.gender.includes(activeGenderFilter));
        const matchesBrand = (activeBrandFilter === 'all' || product.brand === activeBrandFilter);
        
        const matchesSearch = !query || 
            (product.name && product.name.toLowerCase().includes(query)) ||
            (product.brand && product.brand.toLowerCase().includes(query)) ||
            (product.notes && Object.values(product.notes).some(note => note.toLowerCase().includes(query)));

        return matchesGender && matchesBrand && matchesSearch;
    });

    if (activeSort === 'price-asc') {
        visibleProducts.sort((first, second) => getStartingVariant(first).price - getStartingVariant(second).price);
    } else if (activeSort === 'price-desc') {
        visibleProducts.sort((first, second) => getStartingVariant(second).price - getStartingVariant(first).price);
    } else if (activeSort === 'release-desc') {
        visibleProducts.sort((first, second) => (second.releaseYear || 0) - (first.releaseYear || 0));
    } else if (activeSort === 'release-asc') {
        visibleProducts.sort((first, second) => (first.releaseYear || 0) - (second.releaseYear || 0));
    }

    collection.replaceChildren(...visibleProducts.map((product) => {
        const card = document.createElement('article');
        card.className = 'col-item product-trigger';
        card.dataset.productId = product.id;
        card.dataset.bg = product.bg;
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        
        const startingPrice = currencyFormatter.format(getStartingVariant(product).price);
        card.setAttribute('aria-label', `View ${product.name}, from ${startingPrice}`);

        const wrapper = document.createElement('div');
        wrapper.className = 'reveal-wrapper';
        wrapper.dataset.cursor = 'VIEW';
        const image = document.createElement('img');
        image.className = 'reveal-img';
        image.src = product.image;
        image.alt = `${product.name} fragrance bottle`;
        wrapper.append(image);

        const meta = document.createElement('div');
        meta.className = 'product-meta';
        const name = document.createElement('p');
        name.className = 'product-label';
        name.textContent = product.name;
        const price = document.createElement('span');
        price.className = 'product-price';
        
        price.textContent = (product.variants && product.variants.length > 1) ? `FROM ${startingPrice}` : startingPrice;
        meta.append(name, price);

        const notes = document.createElement('p');
        notes.className = 'product-notes-short';
        if(product.notes) {
            notes.textContent = `TOP: ${product.notes.top} / HEART: ${product.notes.heart} / BASE: ${product.notes.base}`;
        }
        card.append(wrapper, meta, notes);

        card.addEventListener('click', () => openProductDetail(product));
        card.addEventListener('pointerenter', () => {
            if(window.gsap) gsap.to(document.body, { backgroundColor: product.bg || defaultTheme, duration: 1.2, ease: luxuryEase });
        });
        card.addEventListener('pointerleave', () => {
            if(window.gsap) gsap.to(document.body, { backgroundColor: defaultTheme, duration: 1.2, ease: luxuryEase });
        });
        
        return card;
    }));

    if (window.gsap) {
        collectionAnimationContext = gsap.context(() => {
            collection.querySelectorAll('.reveal-wrapper').forEach((wrapper) => {
                gsap.to(wrapper, {
                    clipPath: 'inset(0% 0 0 0)',
                    duration: 1.5,
                    ease: luxuryEase,
                    scrollTrigger: { trigger: wrapper, start: 'top 88%' }
                });
                gsap.to(wrapper.querySelector('img'), {
                    scale: 1,
                    duration: 1.5,
                    ease: luxuryEase,
                    scrollTrigger: { trigger: wrapper, start: 'top 88%' }
                });
            });

            if (animate && collection.children.length) {
                gsap.from(collection.children, {
                    autoAlpha: 0,
                    y: 18,
                    duration: 0.65,
                    stagger: 0.025,
                    ease: luxuryEase
                });
            }
        }, collection);
        if(window.ScrollTrigger) ScrollTrigger.refresh();
    }
}

// ΝΕΟ: Αρχικοποίηση Φίλτρων Μάρκας & Αναζήτησης
function initBrandAndSearch() {
    const container = document.getElementById('brand-filters-container');
    const searchInput = document.getElementById('perfume-search');

    if (container && productCatalog.length > 0) {
        const brands = ['all', ...new Set(productCatalog.map(p => p.brand || 'AURA'))];
        
        container.replaceChildren(...brands.map(brand => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `brand-filter${brand === 'all' ? ' is-active' : ''}`;
            btn.dataset.brand = brand;
            btn.textContent = brand === 'all' ? 'All Brands' : brand;
            
            btn.addEventListener('click', () => {
                activeBrandFilter = brand;
                container.querySelectorAll('.brand-filter').forEach(b => b.classList.toggle('is-active', b === btn));
                renderCollection();
            });
            return btn;
        }));
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderCollection();
        });
    }
}

// Καλούμε την αρχικοποίηση
initBrandAndSearch();

// --- Smooth Scrolling (Lenis) ---
const lenis = new Lenis({
    duration: 1.8,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

gsap.registerPlugin(ScrollTrigger);
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0, 0);
renderCollection(false);

const genderFilterButtons = document.querySelectorAll('.gender-filter');
const sortTrigger = document.querySelector('.sort-trigger');
const sortCurrent = document.querySelector('.sort-current');
const sortMenu = document.querySelector('.sort-menu');

genderFilterButtons.forEach((button) => {
    button.addEventListener('click', () => {
        activeGenderFilter = button.dataset.gender;
        genderFilterButtons.forEach((filterButton) => {
            const isActive = filterButton === button;
            filterButton.classList.toggle('is-active', isActive);
            filterButton.setAttribute('aria-pressed', String(isActive));
        });
        renderCollection();
    });
});

if (sortTrigger && sortMenu) {
    sortTrigger.addEventListener('click', () => {
        const isExpanded = sortTrigger.getAttribute('aria-expanded') === 'true';
        sortTrigger.setAttribute('aria-expanded', String(!isExpanded));
        sortMenu.hidden = isExpanded;
    });

    sortMenu.addEventListener('click', (event) => {
        const option = event.target.closest('[data-sort]');
        if (!option) return;

        activeSort = option.dataset.sort;
        sortCurrent.textContent = option.textContent;
        sortMenu.querySelectorAll('[data-sort]').forEach((sortOption) => {
            sortOption.setAttribute('aria-pressed', String(sortOption === option));
        });
        sortTrigger.setAttribute('aria-expanded', 'false');
        sortMenu.hidden = true;
        renderCollection();
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.sort-control')) {
            sortTrigger.setAttribute('aria-expanded', 'false');
            sortMenu.hidden = true;
        }
    });
}

// --- Preloader ---
const preloader = document.querySelector('.preloader');
const preloaderCounter = document.querySelector('.preloader-counter');
const loaderValue = { value: 0 };

function setupPreloader() {
    if (!preloader || !preloaderCounter) return;

    gsap.to(loaderValue, {
        value: 100,
        duration: 2.8,
        ease: luxuryEase,
        onUpdate: () => {
            preloaderCounter.textContent = `${Math.round(loaderValue.value)}%`;
        },
        onComplete: () => {
            gsap.to(preloader, {
                yPercent: -100,
                duration: 1.6,
                ease: 'expo.inOut',
                onComplete: () => {
                    initHeroAnimations();
                    initHeritageText();
                }
            });
        }
    });
}

function splitTextIntoChars(selector) {
    document.querySelectorAll(selector).forEach((text) => {
        if (text.dataset.splitReady === 'true') return;

        const content = text.innerHTML;
        text.innerHTML = '';

        content.split('<br>').forEach((line) => {
            const lineDiv = document.createElement('div');
            lineDiv.style.overflow = 'hidden';

            line.split('').forEach((char) => {
                const span = document.createElement('span');
                span.className = 'char';
                span.innerHTML = char === ' ' ? '&nbsp;' : `<span class="char-inner">${char}</span>`;
                lineDiv.appendChild(span);
            });

            text.appendChild(lineDiv);
        });

        text.dataset.splitReady = 'true';
    });
}

function initHeroAnimations() {
    splitTextIntoChars('.hero .split-text');

    gsap.fromTo('.hero-content > *',
        { autoAlpha: 0, y: 28 },
        { autoAlpha: 1, y: 0, duration: 2.1, stagger: 0.12, ease: luxuryEase }
    );

    gsap.to('.hero .char-inner', {
        y: '0%',
        duration: 2.2,
        ease: 'expo.out',
        stagger: 0.05,
        delay: 0.15
    });

    gsap.from('.hero-visual', {
        scale: 1.18,
        duration: 2.4,
        ease: 'expo.out'
    });

    gsap.from('.hero-img', {
        scale: 1.5,
        duration: 2.4,
        ease: 'expo.out'
    });
}

function initHeritageText() {
    document.querySelectorAll('.heritage-copy').forEach((copy) => {
        const words = copy.textContent.trim().split(/\s+/).map((word) => `<span class="word">${word}</span>`).join(' ');
        copy.innerHTML = words;

        const wordEls = copy.querySelectorAll('.word');
        gsap.fromTo(wordEls,
            { opacity: 0.12 },
            {
                opacity: 1,
                stagger: 0.08,
                ease: 'none',
                scrollTrigger: {
                    trigger: copy,
                    start: 'top 72%',
                    end: 'bottom 28%',
                    scrub: 1.3
                }
            }
        );
    });
}

// --- Cursor Logic ---
const cursor = document.querySelector('.cursor');
const cursorText = document.querySelector('.cursor-text');
let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;

document.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

gsap.ticker.add(() => {
    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;
    gsap.set(cursor, { x: cursorX, y: cursorY });
});

document.querySelectorAll('[data-cursor]').forEach((item) => {
    item.addEventListener('mouseenter', () => {
        cursor.classList.add('active');
        cursorText.innerText = item.dataset.cursor;
    });

    item.addEventListener('mouseleave', () => {
        cursor.classList.remove('active');
        cursorText.innerText = '';
    });
});

// --- Smoke Trail ---
const smokeCanvas = document.getElementById('smoke-canvas');
const smokeCtx = smokeCanvas ? smokeCanvas.getContext('2d') : null;
const smokeParticles = [];

function resizeSmokeCanvas() {
    if (!smokeCanvas || !smokeCtx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    smokeCanvas.width = window.innerWidth * dpr;
    smokeCanvas.height = window.innerHeight * dpr;
    smokeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function addSmokeParticle(x, y) {
    if (!smokeCtx) return;

    for (let i = 0; i < 2; i += 1) {
        smokeParticles.push({
            x: x + (Math.random() - 0.5) * 18,
            y: y + (Math.random() - 0.5) * 18,
            radius: 12 + Math.random() * 26,
            alpha: 0.05 + Math.random() * 0.12,
            vx: (Math.random() - 0.5) * 0.7,
            vy: (Math.random() - 0.5) * 0.6 - 0.2,
            life: 38 + Math.random() * 20
        });
    }
}

function animateSmoke() {
    if (!smokeCanvas || !smokeCtx) return;

    smokeCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = smokeParticles.length - 1; i >= 0; i -= 1) {
        const particle = smokeParticles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.radius *= 0.986;
        particle.alpha *= 0.96;
        particle.life -= 1;

        if (particle.life <= 0 || particle.alpha <= 0.02) {
            smokeParticles.splice(i, 1);
            continue;
        }

        const gradient = smokeCtx.createRadialGradient(
            particle.x,
            particle.y,
            0,
            particle.x,
            particle.y,
            particle.radius
        );
        gradient.addColorStop(0, `rgba(255, 246, 233, ${particle.alpha})`);
        gradient.addColorStop(0.52, `rgba(213, 184, 139, ${particle.alpha * 0.7})`);
        gradient.addColorStop(1, 'rgba(213, 184, 139, 0)');

        smokeCtx.fillStyle = gradient;
        smokeCtx.beginPath();
        smokeCtx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        smokeCtx.fill();
    }

    requestAnimationFrame(animateSmoke);
}

document.addEventListener('pointermove', (event) => {
    addSmokeParticle(event.clientX, event.clientY);
});

window.addEventListener('resize', resizeSmokeCanvas);
resizeSmokeCanvas();
animateSmoke();

// --- Infinite Marquee ---
const marqueeTrack = document.querySelector('.marquee-track');
if (marqueeTrack) {
    gsap.to(marqueeTrack, {
        xPercent: -50,
        duration: 26,
        ease: 'none',
        repeat: -1
    });
}

// --- CART DRAWER LOGIC ---
const cartOpenBtn = document.querySelector('.cart-open-btn');
const cartCount = document.querySelector('.cart-open-btn .menu-btn-text');
const closeCartBtn = document.querySelector('.close-cart');
const cartDrawer = document.querySelector('.cart-drawer');
const cartOverlay = document.querySelector('.cart-overlay');
const cartBody = document.querySelector('.cart-body');
const cartTotal = document.querySelector('.cart-total');
const checkoutBtn = document.querySelector('.checkout-btn');
const paymentModal = document.querySelector('.payment-modal');
const paymentTitle = document.querySelector('#payment-title');
const paymentMessage = document.querySelector('.payment-message');
const paymentReturnBtn = document.querySelector('.payment-return');
const modalAddToCartBtn = document.querySelector('.add-to-cart-btn');
const modalVariantOptions = document.querySelector('.modal-variant-options');

let cartItems = [];
let activeProduct = null;
let activeVariant = null;

try {
    const savedCart = JSON.parse(localStorage.getItem('aura-cart') || '[]');
    if (Array.isArray(savedCart)) {
        cartItems = savedCart
            .filter((item) => item && typeof item.title === 'string' && typeof item.image === 'string' && Number.isFinite(item.price) && Number.isInteger(item.quantity) && item.quantity > 0)
            .map((item) => ({
                ...item,
                variantId: item.variantId || 'legacy',
                variantSize: item.variantSize || 'Standard'
            }));
    }
} catch {
    cartItems = [];
}

function saveCart() {
    try {
        localStorage.setItem('aura-cart', JSON.stringify(cartItems));
    } catch (error) {
        // The cart remains available for this session if storage is unavailable.
    }
}

function renderCart() {
    if (!cartBody) return;

    cartBody.replaceChildren();
    const quantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (cartCount) cartCount.textContent = `BAG (${quantity})`;
    if (cartTotal) cartTotal.textContent = currencyFormatter.format(total);
    if (checkoutBtn) checkoutBtn.disabled = cartItems.length === 0;

    if (cartItems.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-cart-msg';
        emptyMessage.append('Your bag is currently empty.');
        emptyMessage.append(document.createElement('br'));
        emptyMessage.append('Discover your signature scent.');
        cartBody.append(emptyMessage);
        cartBody.classList.remove('has-items');
        return;
    }

    cartBody.classList.add('has-items');
    cartItems.forEach((item) => {
        const row = document.createElement('article');
        row.className = 'cart-item';

        const image = document.createElement('img');
        image.src = item.image;
        image.alt = item.title;

        const details = document.createElement('div');
        details.className = 'cart-item-details';
        const title = document.createElement('h4');
        title.textContent = item.title;
        const price = document.createElement('p');
        price.textContent = `${item.variantSize || 'Standard'} · ${currencyFormatter.format(item.price)}`;
        details.append(title, price);

        const quantityControls = document.createElement('div');
        quantityControls.className = 'cart-quantity';
        const decrease = document.createElement('button');
        decrease.type = 'button';
        decrease.textContent = '-';
        decrease.setAttribute('aria-label', `Remove one ${item.title}, ${item.variantSize || 'Standard'}`);
        decrease.addEventListener('click', () => updateQuantity(item.productId, item.variantId, -1));
        const count = document.createElement('span');
        count.textContent = item.quantity;
        const increase = document.createElement('button');
        increase.type = 'button';
        increase.textContent = '+';
        increase.setAttribute('aria-label', `Add one ${item.title}, ${item.variantSize || 'Standard'}`);
        increase.addEventListener('click', () => updateQuantity(item.productId, item.variantId, 1));
        quantityControls.append(decrease, count, increase);

        row.append(image, details, quantityControls);
        cartBody.append(row);
    });
}

function updateQuantity(productId, variantId, change) {
    const item = cartItems.find((entry) => entry.productId === productId && entry.variantId === variantId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) cartItems = cartItems.filter((entry) => entry !== item);
    saveCart();
    renderCart();
}

function openCart() {
    if (!cartDrawer || !cartOverlay) return;
    if (!cartDrawer.open) cartDrawer.showModal();
    lenis.stop();
    gsap.to(cartOverlay, { opacity: 1, pointerEvents: 'all', duration: 0.5, ease: luxuryEase });
    gsap.to(cartDrawer, { x: '0%', duration: 1.1, ease: luxuryEase });
}

function closeCart() {
    if (!cartDrawer || !cartOverlay || !cartDrawer.open) return;
    lenis.start();
    gsap.to(cartOverlay, { opacity: 0, pointerEvents: 'none', duration: 0.5, ease: luxuryEase });
    gsap.to(cartDrawer, {
        x: '100%',
        duration: 0.9,
        ease: luxuryEase,
        onComplete: () => cartDrawer.close()
    });
}

if (cartOpenBtn) cartOpenBtn.addEventListener('click', openCart);
if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

document.querySelectorAll('a[href^="#"], [data-scroll-target]').forEach((control) => {
    control.addEventListener('click', (event) => {
        const selector = control.getAttribute('href') || control.dataset.scrollTarget;
        const target = selector && document.querySelector(selector);
        if (!target) return;

        event.preventDefault();
        lenis.scrollTo(target, { duration: 1.4 });
    });
});

// --- PRODUCT MODAL LOGIC ---
const products = document.querySelectorAll('.product-trigger');
const productModal = document.querySelector('.product-modal');
const closeModalBtn = document.querySelector('.close-modal');
const modalImg = document.querySelector('.modal-img');
const modalTitle = document.querySelector('.modal-title');
const modalPrice = document.querySelector('.modal-price');
const modalDesc = document.querySelector('.modal-desc');
const modalNotes = document.querySelector('.modal-notes');
const modalSeason = document.querySelector('.product-season');
const modalTime = document.querySelector('.product-time');
const modalDetailLink = document.querySelector('.product-detail-link');

function renderNotes(notes) {
    if (!modalNotes) return;

    modalNotes.replaceChildren(...['top', 'heart', 'base'].map((key) => {
        const entry = document.createElement('div');
        entry.className = 'note-pill';
        const label = document.createElement('span');
        label.textContent = key;
        const value = document.createElement('strong');
        value.textContent = notes[key];
        entry.append(label, value);
        return entry;
    }));
}

function renderVariantOptions(product, container, selectedVariant, onSelect) {
    if (!container) return;

    container.replaceChildren(...product.variants.map((variant) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'size-option';
        option.setAttribute('aria-pressed', String(variant.size === selectedVariant.size));

        const size = document.createElement('span');
        size.textContent = variant.size;
        const price = document.createElement('small');
        price.textContent = currencyFormatter.format(variant.price);
        option.append(size, price);
        option.addEventListener('click', () => {
            container.querySelectorAll('.size-option').forEach((button) => {
                button.setAttribute('aria-pressed', String(button === option));
            });
            onSelect(variant);
        });
        return option;
    }));
}

function getProductFromRoute() {
    const match = /^#product\/([a-z0-9-]+)$/i.exec(window.location.hash);
    return match ? productCatalog.find((product) => product.id === match[1]) : null;
}

function openProductDetail(product, updateRoute = true) {
    if (!product) return;
    activeProduct = product;

    if (updateRoute) {
        window.history.pushState({ productId: product.id }, '', `#product/${product.id}`);
    }

    if (modalTitle) modalTitle.textContent = product.name;
    if (modalPrice) modalPrice.textContent = currencyFormatter.format(product.price);
    if (modalImg) {
        modalImg.src = product.image;
        modalImg.alt = `${product.name} fragrance bottle`;
    }
    if (modalDesc) modalDesc.textContent = `${product.name}, composed for a lasting impression.`;
    if (modalSeason) modalSeason.textContent = product.season;
    if (modalTime) modalTime.textContent = product.time;
    if (modalDetailLink) modalDetailLink.href = `product.html#product/${product.id}`;
    renderNotes(product.notes);

    lenis.stop();
    if (productModal) {
        gsap.to(productModal, {
            opacity: 1,
            pointerEvents: 'all',
            duration: 1.1,
            ease: luxuryEase
        });
    }

    gsap.fromTo('.modal-img-container',
        { y: 70, opacity: 0, rotateY: -12 },
        { y: 0, opacity: 1, rotateY: -10, duration: 2.2, delay: 0.18, ease: luxuryEase }
    );

    gsap.fromTo('.modal-info > *',
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.8, stagger: 0.08, delay: 0.28, ease: luxuryEase }
    );
}

function closeProductDetail(updateRoute = true) {
    if (updateRoute && window.location.hash.startsWith('#product/')) {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#collection`);
    }
    activeProduct = null;
    lenis.start();
    gsap.to(productModal, {
        opacity: 0,
        pointerEvents: 'none',
        duration: 0.9,
        ease: luxuryEase
    });
}

function syncProductRoute() {
    const product = getProductFromRoute();
    if (product) {
        openProductDetail(product, false);
    } else if (activeProduct) {
        closeProductDetail(false);
    }
}

products.forEach((card) => {
    const openCardProduct = () => {
        const product = productCatalog.find((entry) => entry.id === card.dataset.productId);
        openProductDetail(product);
    };

    card.addEventListener('click', openCardProduct);
    card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openCardProduct();
        }
    });
});

window.addEventListener('popstate', syncProductRoute);
const routedProduct = getProductFromRoute();
if (routedProduct) openProductDetail(routedProduct, false);

if (modalAddToCartBtn) {
    modalAddToCartBtn.addEventListener('click', () => {
        if (!activeProduct || !Number.isFinite(activeProduct.price)) return;

        const existingItem = cartItems.find((item) => item.productId === activeProduct.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cartItems.push({
                productId: activeProduct.id,
                title: activeProduct.name,
                image: activeProduct.image,
                price: activeProduct.price,
                quantity: 1
            });
        }

        saveCart();
        renderCart();
        closeProductDetail();
        gsap.delayedCall(0.45, () => {
            openCart();
        });
    });
}

function closePaymentModal() {
    if (!paymentModal?.open) return;
    paymentModal.classList.remove('is-open');
    window.setTimeout(() => {
        if (!paymentModal.classList.contains('is-open') && paymentModal.open) paymentModal.close();
    }, 350);
}

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (cartItems.length === 0 || !paymentModal) return;

        checkoutBtn.disabled = true;
        if (!paymentModal.open) paymentModal.showModal();
        paymentModal.classList.add('is-open');
        paymentModal.dataset.state = 'processing';
        paymentTitle.textContent = 'Processing payment';
        paymentMessage.textContent = 'Please wait while we prepare your order. This demo will not charge you.';
        paymentReturnBtn.hidden = true;

        window.setTimeout(() => {
            const orderReference = `AURA-${Date.now().toString().slice(-8)}`;
            cartItems = [];
            saveCart();
            renderCart();
            closeCart();
            paymentModal.dataset.state = 'success';
            paymentTitle.textContent = 'Order confirmed';
            paymentMessage.textContent = `Demo checkout complete. No payment was charged. Order reference: ${orderReference}.`;
            paymentReturnBtn.hidden = false;
        }, 1600);
    });
}

if (paymentReturnBtn) {
    paymentReturnBtn.addEventListener('click', () => {
        closePaymentModal();
        const collection = document.querySelector('#collection');
        if (collection) lenis.scrollTo(collection, { duration: 1.4 });
    });
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (paymentModal && paymentModal.classList.contains('is-open') && paymentReturnBtn && !paymentReturnBtn.hidden) {
            closePaymentModal();
        } else {
            closeCart();
        }
    }
});

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        closeProductDetail();
    });
}

document.body.style.backgroundColor = defaultTheme;
renderCart();
if (window.location.hash === '#bag') openCart();
setupPreloader();
function initBrandFilters() {
    const container = document.getElementById('brand-filters-container');
    if (!container || !productCatalog) return;

    // Βρίσκει μοναδικές μάρκες από τα προϊόντα
    const brands = ['all', ...new Set(productCatalog.map(p => p.brand || 'Aura'))];
    
    container.replaceChildren(...brands.map(brand => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `brand-filter${brand === 'all' ? ' is-active' : ''}`;
        btn.dataset.brand = brand;
        btn.textContent = brand === 'all' ? 'All Brands' : brand;
        
        btn.addEventListener('click', () => {
            activeBrandFilter = brand;
            container.querySelectorAll('.brand-filter').forEach(b => b.classList.toggle('is-active', b === btn));
            renderCollection();
        });
        return btn;
    }));
}

// Κάλεσε τη συνάρτηση initBrandFilters() στην αρχή ή κάτω από το renderCollection(false);
const query = searchQuery.toLowerCase().trim();

const visibleProducts = productCatalog.filter((product) => {
    const matchesGender = (activeGenderFilter === 'all' || product.gender === activeGenderFilter);
    const matchesBrand = (activeBrandFilter === 'all' || product.brand === activeBrandFilter);
    
    // Έλεγχος αν ταιριάζει στην αναζήτηση (όνομα, νότες ή μάρκα)
    const matchesSearch = !query || 
        product.name.toLowerCase().includes(query) ||
        (product.brand && product.brand.toLowerCase().includes(query)) ||
        Object.values(product.notes).some(note => note.toLowerCase().includes(query));

    return matchesGender && matchesBrand && matchesSearch;
});
const searchInput = document.getElementById('perfume-search');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderCollection();
    });
}

// Και μην ξεχάσεις να καλέσεις την αρχικοποίηση των μαρκών:
initBrandFilters();
// --- COOKIES LOGIC ---
const cookieBanner = document.getElementById('cookie-banner');
const acceptCookiesBtn = document.getElementById('accept-cookies');

if (!localStorage.getItem('aura_cookies_accepted')) {
    setTimeout(() => {
        cookieBanner.classList.add('show');
    }, 2000); // Εμφανίζεται μετά από 2 δευτερόλεπτα
}

acceptCookiesBtn.addEventListener('click', () => {
    localStorage.setItem('aura_cookies_accepted', 'true');
    cookieBanner.classList.remove('show');
});
// ... existing code ...

// --- AURA AGENT LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const aiBtn = document.querySelector('.ai-trigger-btn');
    const aiModal = document.getElementById('ai-modal');
    const aiClose = document.querySelector('.ai-close');
    const aiOverlay = document.querySelector('.ai-overlay');
    const aiInput = document.getElementById('ai-prompt');
    const aiSubmit = document.getElementById('ai-submit');
    const aiResults = document.getElementById('ai-results');

    function toggleAIModal() {
        if (aiModal) {
            aiModal.classList.toggle('is-open');
            if (aiModal.classList.contains('is-open') && aiInput) {
                setTimeout(() => aiInput.focus(), 100);
            }
        }
    }

    if (aiBtn) aiBtn.addEventListener('click', toggleAIModal);
    if (aiClose) aiClose.addEventListener('click', toggleAIModal);
    if (aiOverlay) aiOverlay.addEventListener('click', toggleAIModal);

    function getAIRecommendations(query) {
        const q = query.toLowerCase();
        const catalog = window.AURA_PRODUCTS || []; 
        let scoredProducts = catalog.map(p => {
            let score = 0;
            const notesStr = p.notes ? `${p.notes.top} ${p.notes.heart} ${p.notes.base}`.toLowerCase() : '';
            
            if (q.split(' ').some(word => word.length > 2 && notesStr.includes(word))) score += 3;
            if ((q.includes('sweet') || q.includes('vanilla')) && notesStr.includes('vanilla')) score += 3;
            if ((q.includes('wood') || q.includes('dark')) && (notesStr.includes('wood') || notesStr.includes('cedar'))) score += 3;
            if ((q.includes('fresh') || q.includes('summer')) && notesStr.includes('citrus')) score += 3;
            
            if (q.includes('date') || q.includes('night') || q.includes('club')) {
                if (p.time && p.time.toLowerCase().includes('night')) score += 4;
            }
            if (q.includes('winter') || q.includes('cold')) {
                if (p.season && p.season.toLowerCase().includes('winter')) score += 3;
            }
            return { product: p, score: score };
        });

        scoredProducts.sort((a, b) => b.score - a.score);
        return scoredProducts.filter(item => item.score > 0).slice(0, 3).map(item => item.product);
    }

    if (aiSubmit) {
        aiSubmit.addEventListener('click', () => {
            if (!aiInput) return;
            const query = aiInput.value.trim();
            if (!query) return;
            
            if (aiResults) aiResults.innerHTML = '<p style="color:var(--gold); font-size:0.7rem; font-style:italic;">AURA Agent is analyzing your profile...</p>';
            
            setTimeout(() => {
                const matches = getAIRecommendations(query);
                if (aiResults) aiResults.innerHTML = '';
                
                if (matches.length === 0) {
                    if (aiResults) aiResults.innerHTML = '<p style="color:var(--muted); font-size:0.7rem;">We couldn\'t find an exact match. Try exploring our main collection.</p>';
                    return;
                }
                
                matches.forEach(p => {
                    const item = document.createElement('div');
                    item.className = 'ai-result-item';
                    item.innerHTML = `
                        <img src="${p.image}" alt="${p.name}">
                        <div class="ai-result-info">
                            <h4>${p.name}</h4>
                            <p>${p.brand} • ${p.time}</p>
                        </div>
                    `;
                    item.addEventListener('click', () => {
                        toggleAIModal();
                        if (typeof openProductDetail === 'function') openProductDetail(p);
                    });
                    if (aiResults) aiResults.appendChild(item);
                });
            }, 1200);
        });
    }
});
