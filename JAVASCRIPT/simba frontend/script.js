const API_URL = 'http://localhost:5000/api';

// --- NEW: Helper to decode JWT token to check user role ---
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

// --- UI Navigation & State Management ---
function navigate(sectionId) {
    document.querySelectorAll('section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(`section-${sectionId}`).classList.remove('hidden');

    if (sectionId === 'shop') fetchProducts();
}

function updateNav() {
    const token = localStorage.getItem('token');
    const guestLinks = document.getElementById('guest-links');
    const authLinks = document.getElementById('auth-links');
    const brandName = document.querySelector('h1');

    if (token) {
        const userData = parseJwt(token);
        const isAdmin = userData && userData.role === 'admin';

        guestLinks.classList.add('hidden');
        authLinks.classList.remove('hidden');
        authLinks.classList.add('flex');

        // Logic for Admin Dashboard Button
        const addProductBtn = document.querySelector('[onclick="navigate(\'add-product\')"]');
        if (isAdmin) {
            addProductBtn.classList.remove('hidden');
            brandName.innerHTML = `FreshMart <span class="text-xs bg-yellow-400 text-green-900 px-2 py-1 rounded ml-2 font-bold uppercase">Admin</span>`;
        } else {
            addProductBtn.classList.add('hidden');
            brandName.innerHTML = `FreshMart`;
        }
    } else {
        guestLinks.classList.remove('hidden');
        authLinks.classList.add('hidden');
        authLinks.classList.remove('flex');
        brandName.innerHTML = `FreshMart`;
    }
}

// --- Authentication ---
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('token', data.token);
            alert('Login successful!');
            updateNav();
            navigate('shop');
            e.target.reset();
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (err) { console.error("Login error:", err); }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('token', data.token);
            alert('Registration successful!');
            updateNav();
            navigate('shop');
            e.target.reset();
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (err) { console.error("Register error:", err); }
});

function logout() {
    localStorage.removeItem('token');
    updateNav();
    navigate('login');
}

// --- Product Management ---
async function fetchProducts(searchQuery = '') {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '<p class="text-gray-500 col-span-full text-center">Loading fresh items...</p>';

    const token = localStorage.getItem('token');
    const userData = token ? parseJwt(token) : null;
    const isAdmin = userData && userData.role === 'admin';

    try {
        const res = await fetch(`${API_URL}/products?search=${searchQuery}`);
        const data = await res.json();

        if (!data.products || data.products.length === 0) {
            grid.innerHTML = '<p class="text-gray-500 col-span-full text-center">No products found.</p>';
            return;
        }

        grid.innerHTML = data.products.map(p => `
            <div class="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 overflow-hidden flex flex-col">
                <img src="${p.image || 'https://via.placeholder.com/300'}" alt="${p.name}" class="w-full h-48 object-cover">
                <div class="p-5 flex-grow flex flex-col">
                    <span class="text-xs font-semibold tracking-wide text-green-600 uppercase mb-1">${p.category}</span>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">${p.name}</h3>
                    <p class="text-gray-600 text-sm mb-4 line-clamp-2">${p.description || 'No description available.'}</p>
                    <div class="mt-auto flex justify-between items-center">
                        <span class="text-lg font-extrabold text-green-700">${p.price} RWF</span>
                        
                        ${isAdmin ? `
                        <button onclick="deleteProduct('${p._id}')" class="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        grid.innerHTML = '<p class="text-red-500 col-span-full text-center">Error connecting to the server.</p>';
        console.error("Fetch error:", err);
    }
}

// Search real-time listener
document.getElementById('searchInput').addEventListener('input', (e) => {
    fetchProducts(e.target.value);
});

// Add Product via FormData
document.getElementById('addProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return alert('You must be logged in to add products.');

    const formData = new FormData();
    formData.append('name', document.getElementById('prodName').value);
    formData.append('price', document.getElementById('prodPrice').value);
    formData.append('category', document.getElementById('prodCategory').value);
    formData.append('description', document.getElementById('prodDescription').value);
    formData.append('image', document.getElementById('prodImage').files[0]);

    try {
        const res = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (res.ok) {
            alert('Product added successfully!');
            e.target.reset();
            navigate('shop');
        } else {
            const data = await res.json();
            alert(data.message || 'Failed to add product');
        }
    } catch (err) { console.error("Add product error:", err); }
});

// Delete Product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            fetchProducts();
        } else {
            alert('Failed to delete product. Are you authorized?');
        }
    } catch (err) { console.error("Delete error:", err); }
}

// --- Initialization ---
updateNav();
fetchProducts();