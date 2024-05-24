document.addEventListener('DOMContentLoaded', function () {
    const apiUrl = 'http://localhost:3000';

    if (document.getElementById('registerForm')) {
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const response = await fetch(`${apiUrl}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (response.ok) {
                alert('Зарегистрация прошла успешно!');
                window.location.href = 'login.html';
            } else {
                alert('Регистрация не удалась!');
            }
        });
    }

    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const response = await fetch(`${apiUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                alert('Успешный вход в систему!');
                window.location.href = 'index-user.html';
            } else {
                alert('Не удалось войти в систему!');
            }
        });
    }

    if (document.getElementById('addProductForm')) {
        document.getElementById('addProductForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const price = document.getElementById('price').value;
            const weight = document.getElementById('weight').value;
            const image = document.getElementById('image').value;
            const response = await fetch(`${apiUrl}/admin/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name, price, weight, image })
            });
            if (response.ok) {
                alert('Продукт успешно добавлен!');
                window.location.reload();
            } else {
                alert('Не удалось добавить товар!');
            }
        });
    }

    const loadProducts = async () => {
        const response = await fetch(`${apiUrl}/products`);
        const products = await response.json();
        const productsContainer = document.getElementById('products');
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('col-md-4');
            productCard.innerHTML = `
                <div class="card">
                    <img src="${product.image}" class="card-img-top" alt="${product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text">₽${product.price}</p>
                        <p class="card-text">${product.weight}</p>
                        <button class="btn btn-primary add-to-cart" data-id="${product.id}">В корзину</button>
                    </div>
                </div>
            `;
            productsContainer.appendChild(productCard);
        });

        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', async (e) => {
                const productId = e.target.getAttribute('data-id');
                const response = await fetch(`${apiUrl}/cart`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ productId })
                });
                if (response.ok) {
                    alert('Товар добавлен в корзину!');
                } else {
                    alert('Не удалось добавить товар в корзину!');
                }
            });
        });
    };

    if (document.getElementById('products')) {
        loadProducts();
    }

    const loadCartItems = async () => {
        const response = await fetch(`${apiUrl}/cart`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const cartItems = await response.json();
        const cartItemsContainer = document.getElementById('cartItems');
        cartItemsContainer.innerHTML = '';
        cartItems.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.classList.add('col-md-4');
            cartItem.innerHTML = `
                <div class="card">
                    <img src="${item.product.image}" class="card-img-top" alt="${item.product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${item.product.name}</h5>
                        <p class="card-text">$${item.product.price}</p>
                        <p class="card-text">${item.product.weight}</p>
                        <p class="card-text">Quantity: ${item.quantity}</p>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(cartItem);
        });
    };

    if (document.getElementById('cartItems')) {
        loadCartItems();
    }

    if (document.getElementById('checkoutBtn')) {
        document.getElementById('checkoutBtn').addEventListener('click', async () => {
            const response = await fetch(`${apiUrl}/checkout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                alert('Оформление заказа прошло успешно!');
                window.location.reload();
            } else {
                alert('Не удалось оформить заказ!');
            }
        });
    }
});
