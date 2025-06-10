let buyList = [
    { name: "Помідори", quantity: 2, bought: true, productId: 1 },
    { name: "Печиво", quantity: 2, bought: false, productId: 2 },
    { name: "Сир", quantity: 1, bought: false, productId: 3 }
];

let productIdCounter = 0;

const productList = document.querySelector(".product-list-main");
const purchasedList = document.querySelector(".purchased-product-list");
const unboughtList = document.querySelector(".unbought-product-list");
const productSearch = document.querySelector(".product-search");
const productInput = document.getElementById("product-search-input");
const addButton = document.getElementById("product-add-button");

const CSS_CLASSES = {
    productCard: "product-card",
    bought: "bought",
    inaccessible: "inaccessible"
};

document.addEventListener("DOMContentLoaded", () => {
    initializeList();
    renderBuyList();
});

function initializeList() {
    const savedList = localStorage.getItem("buyList");
    if (savedList) {
        buyList = JSON.parse(savedList);
        productIdCounter = buyList.reduce(
            (maxId, product) => product.productId > maxId ? product.productId : maxId, 0
        ) + 1;
    }
}

function renderBuyList() {
    productList.innerHTML = "";
    purchasedList.innerHTML = "";
    unboughtList.innerHTML = "";

    buyList.forEach(product => {
        const card = createProductCard(product);
        productList.appendChild(card);
        const summaryProduct = createSummaryProduct(product);
        if (product.bought) {
            purchasedList.appendChild(summaryProduct);
        } else {
            unboughtList.appendChild(summaryProduct);
        }
    });
}

function saveList() {
    localStorage.setItem("buyList", JSON.stringify(buyList));
}

function createButton(className, text, tooltip) {
    const button = document.createElement("button");
    button.classList.add(className);
    button.textContent = text;
    button.setAttribute("data-tooltip", tooltip);
    return button;
}

function createSpan(className, text) {
    const span = document.createElement("span");
    span.classList.add(className);
    span.textContent = text;
    return span;
}

function createProductCard(product) {
    const card = document.createElement("div");
    card.classList.add(CSS_CLASSES.productCard);
    card.setAttribute("data-product-id", product.productId);

    const productInfo = document.createElement("div");
    productInfo.classList.add("product-info");
    const productName = createSpan("product-name", product.name);
    if (product.bought) productName.classList.add(CSS_CLASSES.bought);
    productInfo.appendChild(productName);
    card.appendChild(productInfo);

    const quantityControls = document.createElement("div");
    quantityControls.classList.add("quantity-controls");
    const decreaseButton = createButton("decrease-button", "-", "Зменшити кількість");
    if (product.quantity === 1) {
        decreaseButton.setAttribute("disabled", "true");
        decreaseButton.setAttribute("data-tooltip", "Недоступно");
    }
    const quantityValue = createSpan("quantity-value", product.quantity);
    const increaseButton = createButton("increase-button", "+", "Збільшити кількість");

    if (product.bought) {
        decreaseButton.classList.add(CSS_CLASSES.inaccessible);
        increaseButton.classList.add(CSS_CLASSES.inaccessible);
    }
    quantityControls.appendChild(decreaseButton);
    quantityControls.appendChild(quantityValue);
    quantityControls.appendChild(increaseButton);
    card.appendChild(quantityControls);

    const productControls = document.createElement("div");
    productControls.classList.add("product-controls");
    const statusButton = createButton(
        "purchase-status-button",
        product.bought ? "Не куплено" : "Куплено",
        "Змінити статус"
    );
    const deleteButton = createButton("delete-button", "×", "Видалити товар");
    if (product.bought) deleteButton.classList.add(CSS_CLASSES.inaccessible);
    productControls.appendChild(statusButton);
    productControls.appendChild(deleteButton);
    card.appendChild(productControls);

    productName.addEventListener("click", () => {
        if (!productName.classList.contains(CSS_CLASSES.bought)) {
            renameProduct(product, productName);
        }
    });

    increaseButton.addEventListener("click", () => {
        product.quantity++;
        saveList();
        updateProductQuantity(product);
        updateSummaryQuantity(product);
    });

    decreaseButton.addEventListener("click", () => {
        product.quantity--;
        saveList();
        updateProductQuantity(product);
        updateSummaryQuantity(product);
    });

    statusButton.addEventListener("click", () => {
        product.bought = !product.bought;
        saveList();
        updateProductStatus(product);
        updateSummaryStatus(product);
    });

    deleteButton.addEventListener("click", () => {
        buyList = buyList.filter(p => p.productId !== product.productId);
        saveList();
        removeProductCard(product);
        removeSummaryProduct(product);
    });

    return card;
}

function createSummaryProduct(product) {
    const summaryProduct = document.createElement("div");
    summaryProduct.classList.add("summary-product");
    summaryProduct.setAttribute("data-product-id", product.productId);

    const productName = createSpan("summary-product-name", product.name);
    if (product.bought) productName.classList.add(CSS_CLASSES.bought);
    summaryProduct.appendChild(productName);

    const productQuantity = createSpan("summary-product-quantity", product.quantity);
    if (product.bought) productQuantity.classList.add(CSS_CLASSES.bought);
    summaryProduct.appendChild(productQuantity);
    return summaryProduct;
}

function renameProduct(product, nameSpan) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = product.name;
    input.setAttribute("id", "new-product-name");
    nameSpan.replaceWith(input);
    input.focus();
    input.addEventListener("blur", () => {
        const newName = input.value.trim();
        const isNameTaken = buyList.some(p => p.name.toLowerCase() === newName.toLowerCase() && p.productId !== product.productId);
        if (newName && !isNameTaken) {
            product.name = newName;
            saveList();
            updateSummaryProductName(product);
        }
        const newSpan = createSpan("product-name", product.name);
        if (product.bought) newSpan.classList.add(CSS_CLASSES.bought);
        newSpan.addEventListener("click", () => {
            if (!newSpan.classList.contains(CSS_CLASSES.bought)) {
                renameProduct(product, newSpan);
            }
        });
        input.replaceWith(newSpan);
    });
}

function updateSummaryProductName(product) {
    const summaryProduct = document.querySelector(`.summary-product[data-product-id="${product.productId}"]`);
    const productName = summaryProduct.querySelector(".summary-product-name");
    productName.textContent = product.name;
}

function updateProductQuantity(product) {
    const card = document.querySelector(`.product-card[data-product-id="${product.productId}"]`);
    const quantityValue = card.querySelector(".quantity-value");
    quantityValue.textContent = product.quantity;
    const decreaseButton = card.querySelector(".decrease-button");
    if (product.quantity === 1) {
        decreaseButton.setAttribute("disabled", "true");
        decreaseButton.setAttribute("data-tooltip", "Недоступно");
    } else {
        decreaseButton.removeAttribute("disabled");
        decreaseButton.setAttribute("data-tooltip", "Зменшити кількість");
    }
}

function updateSummaryQuantity(product) {
    const summaryProduct = document.querySelector(`.summary-product[data-product-id="${product.productId}"]`);
    const productQuantity = summaryProduct.querySelector(".summary-product-quantity");
    productQuantity.textContent = product.quantity;
}

function updateProductStatus(product) {
    const card = document.querySelector(`.product-card[data-product-id="${product.productId}"]`);
    const decreaseButton = card.querySelector(".decrease-button");
    const increaseButton = card.querySelector(".increase-button");
    const deleteButton = card.querySelector(".delete-button");
    const productName = card.querySelector(".product-name")
    const statusButton = card.querySelector(".purchase-status-button")

    decreaseButton.classList.toggle(CSS_CLASSES.inaccessible);
    increaseButton.classList.toggle(CSS_CLASSES.inaccessible);
    deleteButton.classList.toggle(CSS_CLASSES.inaccessible);
    productName.classList.toggle(CSS_CLASSES.bought);

    if (product.bought) {
        statusButton.textContent = "Не куплено";
    } else {
        statusButton.textContent = "Куплено";
    }
}

function updateSummaryStatus(product) {
    const summaryProduct = document.querySelector(`.summary-product[data-product-id="${product.productId}"]`);
    const productName = summaryProduct.querySelector(".summary-product-name");
    const productQuantity = summaryProduct.querySelector(".summary-product-quantity");

    productName.classList.toggle(CSS_CLASSES.bought);
    productQuantity.classList.toggle(CSS_CLASSES.bought);

    if (product.bought) {
        summaryProduct.remove();
        purchasedList.appendChild(summaryProduct);
    } else {
        summaryProduct.remove();
        unboughtList.appendChild(summaryProduct);
    }
}

function removeProductCard(product) {
    const card = document.querySelector(`.product-card[data-product-id="${product.productId}"]`);
    card.remove();
}

function removeSummaryProduct(product) {
    const summaryProduct = document.querySelector(`.summary-product[data-product-id="${product.productId}"]`);
    summaryProduct.remove();
}

function addProduct() {
    const name = productInput.value.trim();
    if (!name || buyList.some(product => product.name === name)) {
        return;
    }
    productIdCounter++;
    const newProduct = {
        name,
        quantity: 1,
        bought: false,
        productId: productIdCounter
    };
    buyList.push(newProduct);
    saveList();
    const productCard = createProductCard(newProduct);
    productList.appendChild(productCard);
    const summaryProduct = createSummaryProduct(newProduct);
    unboughtList.appendChild(summaryProduct);
    productInput.value = "";
    productInput.focus();
}

addButton.addEventListener("click", () => {
    addProduct();
});

productInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addProduct();
    }
});