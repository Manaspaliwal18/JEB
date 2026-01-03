const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT ||3000;
const DATA_FILE = path.join(__dirname, 'data.json');

/* ===============================
   MIDDLEWARE
================================ */
app.use(cors());
app.use(express.json());

/* ===============================
   FILE HELPERS
================================ */
function readData() {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = {
            stores: [],
            jewelers: [],
            reviews: []
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

/* ===============================
   STORES
================================ */

// GET all stores
app.get('/stores', (req, res) => {
    const data = readData();
    res.json(data.stores);
});

// POST store (admin / future use)
app.post('/stores', (req, res) => {
    const data = readData();

    const newStore = {
        id: Date.now(),
        name: req.body.name,
        city: req.body.city || "Not provided",
        baseRating: 0,
        logo: req.body.logo || "",
        ownerId: null,
        verified: false
    };

    data.stores.push(newStore);
    writeData(data);

    res.status(201).json(newStore);
});

/* ===============================
   REVIEWS
================================ */

// GET all reviews
app.get('/reviews', (req, res) => {
    const data = readData();
    res.json(data.reviews);
});

// POST new review
app.post('/reviews', (req, res) => {
    const { storeId, rating, text, user } = req.body;

    if (!storeId || !rating || !text) {
        return res.status(400).json({ error: "Invalid review data" });
    }

    const data = readData();

    const newReview = {
        id: Date.now(),
        storeId,
        rating,
        text,
        user: user || "Guest User",
        createdAt: new Date().toISOString()
    };

    data.reviews.unshift(newReview);
    writeData(data);

    res.status(201).json(newReview);
});

/* ===============================
   JEWELER BUSINESS REGISTRATION
================================ */

app.post('/jewelers/register', (req, res) => {
    const {
        ownerName,
        email,
        password,
        storeName,
        storeCity,
        storeLogo,
        bisDeclared,
        bisCertificateImage
    } = req.body;

    if (
        !ownerName ||
        !email ||
        !password ||
        !storeName ||
        !bisDeclared ||
        !bisCertificateImage
    ) {
        return res.status(400).json({
            error: "All required fields must be provided"
        });
    }

    const data = readData();

    if (data.jewelers.find(j => j.email === email)) {
        return res.status(409).json({ error: "Email already registered" });
    }

    const jewelerId = Date.now();
    const storeId = Date.now() + 1;

    const store = {
        id: storeId,
        name: storeName,
        city: storeCity || "Not provided",
        baseRating: 0,
        logo: storeLogo || "",
        ownerId: jewelerId,
        verified: false
    };

    const jeweler = {
        id: jewelerId,
        ownerName,
        email,
        password, // ⚠ hash later
        storeId,
        bisDeclared: true,
        bisCertificateImage,
        verificationStatus: "pending",
        createdAt: new Date().toISOString()
    };

    data.stores.push(store);
    data.jewelers.push(jeweler);

    writeData(data);

    res.status(201).json({
        message: "Registration successful. Store pending verification."
    });
});

/* ===============================
   CLAIM EXISTING STORE
================================ */

app.post('/stores/:id/claim', (req, res) => {
    const storeId = Number(req.params.id);
    const { jewelerId } = req.body;

    if (!jewelerId) {
        return res.status(400).json({ error: "Jeweler ID required" });
    }

    const data = readData();

    const store = data.stores.find(s => s.id === storeId);
    if (!store) {
        return res.status(404).json({ error: "Store not found" });
    }

    if (store.ownerId) {
        return res.status(409).json({ error: "Store already claimed" });
    }

    const jeweler = data.jewelers.find(j => j.id === jewelerId);
    if (!jeweler) {
        return res.status(404).json({ error: "Jeweler not found" });
    }

    store.ownerId = jewelerId;
    jeweler.storeId = storeId;

    writeData(data);

    res.json({
        message: "Store claimed successfully",
        store
    });
});

/* ===============================
   SERVER START
================================ */

app.listen(PORT, () => {
    console.log(`🚀 Jewel e Bazaar backend running at http://localhost:${PORT}`);
});
