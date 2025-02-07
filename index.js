const API = (() => {
  const URL = "http://localhost:3000";
  const getCart = () => {
    // define your method to get cart data
    return fetch(`${URL}/cart`).then((res) => res.json());
  };

  const getInventory = () => {
    // define your method to get inventory data
    return fetch(`${URL}/inventory`).then((res) => res.json());
  };

  const addToCart = (inventoryItem, amount) => {
    return fetch(`${URL}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...inventoryItem,
        amount: amount,
      }),
    }).then((res) => res.json());
  };

  const updateCart = (id, newAmount) => {
    return fetch(`${URL}/cart/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: newAmount }),
    }).then((res) => res.json());
  };

  const deleteFromCart = (id) => {
    return fetch(`${URL}/cart/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());
  };

  const checkout = () => {
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };

  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart=newCart;
      this.#onChange();
    }
    set inventory(newInventory) {
      this.#inventory = newInventory;
      this.#onChange();
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }

  return {
    State,
    ...API,
  };
})();

const View = (() => {
  const inventoryEl = document.querySelector(".inventory__list");
  const cartEl = document.querySelector(".cart__list");

  const renderInventoryItems = (items) => {
    let inventoryTemplate = "";
    items.forEach((item) => {
      const inventoryItem = `<li id="${item.id}">
        <span>${item.content}</span>
        <button class="decrement-btn">-</button>
        <span class="quantity" data-id="${item.id}">1</span>
        <button class="increment-btn">+</button>
        <button class="addToCart-btn">Add</button>
      </li>`;
      inventoryTemplate += inventoryItem;
    });
    inventoryEl.innerHTML = inventoryTemplate;

    // Handle quantity increment and decrement
    document.querySelectorAll(".increment-btn").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const quantitySpan = event.target.previousElementSibling;
        let currentQuantity = parseInt(quantitySpan.textContent);
        quantitySpan.textContent = currentQuantity + 1;
      });
    });

    document.querySelectorAll(".decrement-btn").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const quantitySpan = event.target.nextElementSibling;
        let currentQuantity = parseInt(quantitySpan.textContent);
        if (currentQuantity > 1) {
          quantitySpan.textContent = currentQuantity - 1;
        }
      });
    });

    document.querySelectorAll(".addToCart-btn").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const parentLi = event.target.closest("li");
        const quantity = parseInt(parentLi.querySelector(".quantity").textContent);
        const itemId = parentLi.id;
        const selectedItem = items.find((item) => item.id == itemId);


        model.cart = [
          ...model.cart,
          { ...selectedItem, amount: quantity },
        ];
      });
    });
  };

  const renderCartItems = (items) => {
    let cartTemplate = "";
    items.forEach((item) => {
      const cartItem = `<li id="${item.id}">
        <span class="content">${item.content}</span>
      <span class="quantity" data-id="${item.id}">
        <button class="decrement-btn" style="display:none;">-</button>
        <span class="item-amount">${item.amount}</span>
        <button class="increment-btn" style="display:none;">+</button>
      </span>
      <button class="editItem-btn">Edit</button>
      <button class="deleteItem-btn">Delete</button>
      <button class="saveItem-btn" style="display:none;">Save</button>
    </li>`;
      cartTemplate += cartItem;
    });
    cartEl.innerHTML = cartTemplate;

    document.querySelectorAll(".increment-btn").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const parentLi = event.target.closest("li");
        const itemId = parentLi.id;
        const item = items.find((item) => item.id == itemId);
        const newAmount = item.amount + 1;

        model.cart = model.cart.map((cartItem) =>
          cartItem.id === itemId ? { ...cartItem, amount: newAmount } : cartItem
        );
      });
    });

    document.querySelectorAll(".decrement-btn").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const parentLi = event.target.closest("li");
        const itemId = parentLi.id;
        const item = items.find((item) => item.id == itemId);
        const newAmount = item.amount > 1 ? item.amount - 1 : 1;

        model.cart = model.cart.map((cartItem) =>
          cartItem.id === itemId ? { ...cartItem, amount: newAmount } : cartItem
        );
      });
    });

    document.querySelectorAll(".deleteItem-btn").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const itemId = event.target.closest("li").id;
        model.cart = model.cart.filter((item) => item.id !== itemId);
      });
    });
  };

  return {
    renderInventoryItems,
    renderCartItems,
  };
})();


const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();

  const handleAddToCart = () => {
    document.querySelector(".inventory__list").addEventListener("click", (event) => {
      if (event.target.classList.contains("addToCart-btn")) {
        const itemId = event.target.parentElement.id;
        const selectedItem = state.inventory.find(item => item.id == itemId);
        const quantity = parseInt(event.target.parentElement.querySelector(".quantity").innerText);
  
        const existingCartItem = state.cart.find(item => item.id === selectedItem.id);
  
        if (existingCartItem) {
          existingCartItem.amount += quantity;
          state.cart = [...state.cart];
        } else {
          state.cart = [...state.cart, {...selectedItem, amount: quantity}];
        }
      }
    });
  };

  // Handle Edit Item in Cart
  const handleEdit = () => {
    document.querySelector(".cart__list").addEventListener("click", (event) => {
      if (event.target.classList.contains("editItem-btn")) {
        const parentLi = event.target.closest("li");
        const incrementBtn = parentLi.querySelector(".increment-btn");
        const decrementBtn = parentLi.querySelector(".decrement-btn");
        const saveBtn = parentLi.querySelector(".saveItem-btn");

        incrementBtn.style.display = "inline";
        decrementBtn.style.display = "inline";
        saveBtn.style.display = "inline";
        parentLi.querySelector(".editItem-btn").style.display = "none";
        parentLi.querySelector(".deleteItem-btn").style.display = "none";
      }
    });
  };

  const handleEditAmount = () => {
    document.querySelector(".cart__list").addEventListener("click", (event) => {
      const parentLi = event.target.closest("li");
      const quantityEl = parentLi.querySelector(".item-amount");
      const itemId = parentLi.id;

      const item = state.cart.find(item => item.id === itemId);

      if (event.target.classList.contains("increment-btn")) {
        let currentQuantity = parseInt(quantityEl.innerText);
        currentQuantity += 1;
        quantityEl.innerText = currentQuantity;

        item.amount = currentQuantity;
      }

      if (event.target.classList.contains("decrement-btn")) {
        let currentQuantity = parseInt(quantityEl.innerText);
        if (currentQuantity > 1) {
          currentQuantity -= 1;
          quantityEl.innerText = currentQuantity;

          item.amount = currentQuantity;
        }
      }

    });
  };


  const handleSave = () => {
    document.querySelector(".cart__list").addEventListener("click", (event) => {
      if (event.target.classList.contains("saveItem-btn")) {
        const parentLi = event.target.closest("li");
        const incrementBtn = parentLi.querySelector(".increment-btn");
        const decrementBtn = parentLi.querySelector(".decrement-btn");
        const saveBtn = parentLi.querySelector(".saveItem-btn");

        incrementBtn.style.display = "none";
        decrementBtn.style.display = "none";
        saveBtn.style.display = "none";
        parentLi.querySelector(".editItem-btn").style.display = "inline";
        parentLi.querySelector(".deleteItem-btn").style.display = "inline";

        renderCartItems(state.cart);
      }
    });
  };

  // Handle Delete Item from Cart
  const handleDelete = () => {
    document.querySelector(".cart__list").addEventListener("click", (event) => {
      if (event.target.classList.contains("deleteItem-btn")) {
        const parentLi = event.target.closest("li");
        const itemId = parentLi.id;

        state.cart = state.cart.filter(item => item.id != itemId);

        parentLi.remove();
      }
    });
  };

  const handleCheckout = () => {
    document.querySelector(".checkout-btn").addEventListener("click", () => {
      model.checkout().then(() => {
        state.cart = [];
      });
    });
  };

  const init = () => {
    state.subscribe(() => {
      View.renderInventoryItems(state.inventory);
      View.renderCartItems(state.cart)
    });
    API.getInventory().then((data) => {
      state.inventory = data;
    });
    API.getCart().then((data) => {
      state.cart = data;
    });

    handleAddToCart();
    handleEdit();
    handleEditAmount();
    handleSave();
    handleDelete();
    handleCheckout();
  };

  return {
    init,
  };
})(Model, View);

Controller.init();
