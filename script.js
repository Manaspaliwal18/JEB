const API_URL = 'http://localhost:3000';

let stores = [];
let reviews = [];

/* =========================
   INIT
========================= */
async function initData() {
    try {
        const [s, r] = await Promise.all([
            fetch(`${API_URL}/stores`),
            fetch(`${API_URL}/reviews`)
        ]);

        stores = await s.json();
        reviews = await r.json();

        renderTopJewelers();
        renderHome();
        showGlobalReviews();
        populateDropdowns();
    } catch (error) {
        console.error("Failed to load data:", error);
    }
}

/* =========================
   NAVIGATION
========================= */
function showPage(page) {
    document.querySelectorAll('section').forEach(sec =>
        sec.classList.remove('active')
    );

    const target = document.getElementById(page);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-links a').forEach(a =>
        a.classList.remove('active')
    );

    const nav = document.getElementById('nav-' + page);
    if (nav) nav.classList.add('active');

    if (page === 'jeweler') {
        populateDropdowns();
        loadJewelerReviews();
    }

    window.scrollTo(0, 0);
}

/* =========================
   STORE CARD
========================= */
function createStoreCard(store) {
    const storeReviews = reviews.filter(r => r.storeId === store.id);
    const reviewCount = storeReviews.length;

    const avg = reviewCount
        ? (storeReviews.reduce((a, b) => a + b.rating, 0) / reviewCount).toFixed(1)
        : store.baseRating || 0;

    return `
        <div class="card">
            <div class="card-header">
                <img
                    src="${store.logo || ''}"
                    alt="${store.name}"
                    class="store-logo"
                    onerror="this.style.display='none'"
                />
                <h3>
                    ${store.name}
                    <span class="badge">Verified</span>
                </h3>
            </div>

            <p class="city">📍 ${store.city}</p>

            <div class="stars">
                ${'★'.repeat(Math.round(avg))} (${reviewCount} reviews)
            </div>

            <button class="btn" onclick="goToJeweler(${store.id})">
                View Reviews
            </button>
        </div>
    `;
}

/* =========================
   ALL STORES
========================= */
function renderHome(listData = stores) {
    const list = document.getElementById('store-list');
    if (!list) return;

    list.innerHTML = '';
    listData.forEach(store => {
        list.innerHTML += createStoreCard(store);
    });
}

/* =========================
   TOP JEWELERS
========================= */
function renderTopJewelers(listData = stores) {
    const slider = document.getElementById('top-jewelers-slider');
    if (!slider) return;

    slider.innerHTML = '';
    listData.slice(0, 3).forEach(store => {
        slider.innerHTML += createStoreCard(store);
    });
}

function scrollSlider(direction) {
    const slider = document.getElementById('top-jewelers-slider');
    if (!slider) return;

    slider.scrollBy({
        left: direction * 320,
        behavior: 'smooth'
    });
}

/* =========================
   CITY FILTER
========================= */
function filterByCity() {
    const select = document.getElementById('city-filter');
    if (!select) return;

    const city = select.value;

    const filtered =
        city === 'all'
            ? stores
            : stores.filter(s => s.city === city);

    renderHome(filtered);
    renderTopJewelers(filtered);
}

/* =========================
   DROPDOWNS
========================= */
function populateDropdowns() {
    const customer = document.getElementById('store-dropdown');
    const jeweler = document.getElementById('jeweler-store-select');

    if (!customer || !jeweler) return;

    const options = stores
        .map(s => `<option value="${s.id}">${s.name}</option>`)
        .join('');

    customer.innerHTML = options;
    jeweler.innerHTML = options;
}

/* =========================
   REVIEW SUBMIT
========================= */
document.getElementById('review-form')?.addEventListener('submit', async e => {
    e.preventDefault();

    const review = {
        storeId: Number(document.getElementById('store-dropdown').value),
        rating: Number(document.getElementById('star-rating').value),
        text: document.getElementById('review-text').value,
        user: "Guest User"
    };

    try {
        await fetch(`${API_URL}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(review)
        });

        reviews.unshift(review);
        showGlobalReviews();
        renderHome();
        renderTopJewelers();
        e.target.reset();

        alert("Thank you! Your review has been submitted.");
    } catch {
        alert("Failed to submit review.");
    }
});

/* =========================
   GLOBAL REVIEWS
========================= */
function showGlobalReviews() {
    const container = document.getElementById('global-reviews');
    if (!container) return;

    container.innerHTML = reviews.slice(0, 5).map(r => `
        <div class="review-item">
            <strong>${r.user}</strong>
            <div class="stars">${'★'.repeat(r.rating)}</div>
            <p>${r.text}</p>
        </div>
    `).join('');
}

/* =========================
   JEWELER DASHBOARD
========================= */
function loadJewelerReviews() {
    const select = document.getElementById('jeweler-store-select');
    if (!select) return;

    const storeId = Number(select.value);
    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    document.getElementById('jeweler-store-name').innerText =
        `Reviews for ${store.name}`;

    const list = document.getElementById('jeweler-reviews-list');
    const storeReviews = reviews.filter(r => r.storeId === storeId);

    if (storeReviews.length === 0) {
        list.innerHTML = '<p style="color:#777">No reviews yet.</p>';
        return;
    }

    list.innerHTML = storeReviews.map(r => `
        <div class="review-item">
            <strong>${r.user}</strong>
            <div class="stars">${'★'.repeat(r.rating)}</div>
            <p>${r.text}</p>
        </div>
    `).join('');
}

/* =========================
   QUICK NAV
========================= */
function goToJeweler(id) {
    showPage('jeweler');
    const select = document.getElementById('jeweler-store-select');
    if (select) select.value = id;
    loadJewelerReviews();
}

/* =========================
   JEWELER REGISTRATION
========================= */
document.getElementById('register-form')?.addEventListener('submit', async e => {
    e.preventDefault();

    const payload = {
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
        city: document.getElementById('register-city')?.value || ''
    };

    try {
        const res = await fetch(`${API_URL}/jewelers/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Registration failed");
            return;
        }

        alert("Registration successful! You can now claim your store.");
        showPage('jeweler');
        e.target.reset();
    } catch {
        alert("Server error. Try again later.");
    }
});

/* =========================
   START
========================= */
window.onload = initData;
function toggleNav() {
    document.getElementById("navLinks").classList.toggle("show");
}
