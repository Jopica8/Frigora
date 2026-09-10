const ingredientInput = document.getElementById("ingredientInput");
const addIngredientButton = document.getElementById("addIngredient");
const ingredientList = document.getElementById("ingredientList");
const generateRecipeButton = document.getElementById("generateRecipe");
const servings = document.getElementById("servings");
const maxTime = document.getElementById("maxTime");
const diet = document.getElementById("diet");

let ingredients = [];
let shoppingList = [];
let currentRecipe = null;

function loadShoppingList() {
    const savedShoppingList = localStorage.getItem("frigoraShoppingList");

    if (savedShoppingList) {
        const data = JSON.parse(savedShoppingList);

        shoppingList = data.map(item => ({
            name: typeof item === "string"
                ? item
                : String(item.name || ""),
            checked: typeof item === "object" && item.checked === true
        })).filter(item => item.name);
    }
}

function renderShoppingList() {
    const shoppingItems = document.getElementById("savedShoppingItems");

    const shoppingCount = document.getElementById("shoppingCount");

if (shoppingCount) {
    shoppingCount.textContent =
        `${shoppingList.length} ${shoppingList.length === 1 ? "Artikel" : "Artikel"}`;
}

    if (!shoppingItems) {
        return;
    }

    if (shoppingList.length === 0) {
        shoppingItems.innerHTML = `
            <p>Noch keine gespeicherten Zutaten.</p>
        `;
        return;
    }

    const openItems = shoppingList.filter(item => !item.checked);
    const completedItems = shoppingList.filter(item => item.checked);

    shoppingItems.innerHTML = `
        <div class="shopping-buttons">
            <button type="button" onclick="checkAllShoppingItems()">
                Alles abhaken
            </button>

            <button type="button" onclick="clearShoppingItems()">
                Liste leeren
            </button>
        </div>

<div class="shopping-items">
    <h3 class="shopping-heading">Noch zu kaufen</h3>

${openItems.length === 0 ? `
    <p class="shopping-complete">🎉 Alles erledigt!</p>
` : ""}

    ${openItems
        .map(item => `
            <label class="shopping-item">
                <input type="checkbox" onchange="saveShoppingListState()">
                <span>${item.name || item}</span>
            </label>
        `)
        .join("")}

    <h3 class="shopping-heading completed-heading">Erledigt</h3>

    ${completedItems
        .map(item => `
            <label class="shopping-item">
                <input type="checkbox" onchange="saveShoppingListState()" checked>
                <span>${item.name || item}</span>
            </label>
        `)
        .join("")}
</div>
    `;
}

function saveShoppingListState() {
    const checkboxes = document.querySelectorAll(
        "#savedShoppingItems .shopping-item input"
    );

    const checkedNames = Array.from(checkboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox =>
            checkbox.nextElementSibling.textContent.trim()
        );

    shoppingList = shoppingList.map(item => ({
        name: item.name || item,
        checked: checkedNames.includes(item.name || item)
    }));

    localStorage.setItem(
        "frigoraShoppingList",
        JSON.stringify(shoppingList)
    );

    renderShoppingList();
}
loadShoppingList();
renderShoppingList();

function renderIngredients() {
    ingredientList.innerHTML = "";

    ingredients.forEach((ingredient, index) => {

        const element = document.createElement("div");

        element.className = "ingredient";

        element.innerHTML = `
            <span>${ingredient}</span>
            <button onclick="removeIngredient(${index})">✕</button>
        `;

        ingredientList.appendChild(element);
    });
}

function addIngredient() {

    const ingredient = ingredientInput.value.trim();

    if (!ingredient) {
        return;
    }

    ingredients.push(ingredient);

    ingredientInput.value = "";

    renderIngredients();
}

function removeIngredient(index) {

    ingredients.splice(index, 1);

    renderIngredients();
}

addIngredientButton.addEventListener("click", addIngredient);

ingredientInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        addIngredient();
    }

});

generateRecipeButton.addEventListener("click", async () => {

    if (ingredients.length === 0) {
        alert("Bitte füge zuerst mindestens eine Zutat hinzu.");
        return;
    }

generateRecipeButton.disabled = true;
generateRecipeButton.textContent = "🤖 Rezept wird erstellt ...";

    const recipeSettings = {
        ingredients: ingredients,
        servings: Number(servings.value),
        maxTime: Number(maxTime.value),
        diet: diet.value
    };

    const recipeElement = document.getElementById("recipe");

    recipeElement.innerHTML = `
        <p>🤖 Frigora denkt nach...</p>
        <p>Dein Rezept wird gerade erstellt.</p>
    `;

    try {

        const response = await fetch("/api/generate-recipe", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(recipeSettings)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unbekannter Fehler");
        }

        const recipe = data.recipe;

const recipeName = recipe.match(/REZEPTNAME:\s*([\s\S]*?)(?=BESCHREIBUNG:)/)?.[1]?.trim() || "Dein Rezept";

const description = recipe.match(/BESCHREIBUNG:\s*([\s\S]*?)(?=ZEIT:)/)?.[1]?.trim() || "";

const time = recipe.match(/ZEIT:\s*([\s\S]*?)(?=SCHWIERIGKEIT:)/)?.[1]?.trim() || "";

const difficulty = recipe.match(/SCHWIERIGKEIT:\s*([\s\S]*?)(?=VERWENDETE ZUTATEN:)/)?.[1]?.trim() || "";

const usedIngredients = recipe.match(/VERWENDETE ZUTATEN:\s*([\s\S]*?)(?=ZUSÄTZLICHE ZUTATEN:)/)?.[1]?.trim() || "";

const additionalIngredients = recipe.match(/ZUSÄTZLICHE ZUTATEN:\s*([\s\S]*?)(?=ZUBEREITUNG:)/)?.[1]?.trim() || "";

shoppingList = additionalIngredients
    .split("\n")
    .filter(item => item.trim() !== "")
    .map(item => ({
        name: item.replace(/^- /, ""),
        checked: false
    }));

localStorage.setItem(
    "frigoraShoppingList",
    JSON.stringify(shoppingList)
);

renderShoppingList();

const preparation = recipe.match(/ZUBEREITUNG:\s*([\s\S]*)/)?.[1]?.trim() || "";

currentRecipe = {
    name: recipeName,
    description: description,
    time: time,
    difficulty: difficulty,
    ingredients: usedIngredients,
    additionalIngredients: additionalIngredients,
    preparation: preparation
};

recipeElement.innerHTML = `
    <div class="recipe-result">

        <h3>${recipeName}</h3>

        <button
    type="button"
    id="favoriteButton"
    onclick="saveFavorite()"
>
    ☆ Zu Favoriten hinzufügen
</button>

        <p class="recipe-description">
            ${description}
        </p>

        <div class="recipe-info">
            <div>
                <strong>⏱️ Zeit</strong>
                <span>${time}</span>
            </div>

            <div>
                <strong>📊 Schwierigkeit</strong>
                <span>${difficulty}</span>
            </div>
        </div>

        <div class="recipe-block">
            <h4>🥕 Verwendete Zutaten</h4>
            <p>${usedIngredients.replace(/\n/g, "<br>")}</p>
        </div>

        <div class="recipe-block shopping-list">
    <h4>🛒 Zusätzlich benötigt</h4>

    <div class="shopping-buttons">
    <button type="button" onclick="checkAllShoppingItems()">
        Alles abhaken
    </button>

    <button type="button" onclick="clearShoppingItems()">
        Liste leeren
    </button>
    </div>

    <div class="shopping-items">
        ${additionalIngredients
            .split("\n")
            .filter(item => item.trim() !== "")
            .map(item => `
                <label class="shopping-item">
                    <input type="checkbox">
                    <span>${item.replace(/^- /, "")}</span>
                </label>
            `)
            .join("")}
    </div>
</div>

        <div class="recipe-block">
            <h4>👨‍🍳 Zubereitung</h4>
            <p>${preparation.replace(/\n/g, "<br>")}</p>
        </div>

    </div>
`;

    } catch (error) {

        console.error(error);

        recipeElement.innerHTML = `
            <p>
                ❌ Das Rezept konnte leider nicht erstellt werden.
            </p>
            <p>
                Bitte überprüfe deine API-Konfiguration.
            </p>
        `;

    } finally {
        generateRecipeButton.disabled = false;
        generateRecipeButton.textContent = "🤖 Rezept erstellen";
    }

});

function checkAllShoppingItems() {
    const checkboxes = document.querySelectorAll(".shopping-item input");

    checkboxes.forEach((checkbox) => {
        checkbox.checked = true;
    });
}

function clearShoppingItems() {
    shoppingList = [];

    localStorage.removeItem("frigoraShoppingList");

    renderShoppingList();
}

function saveFavorite() {
    let favorites = JSON.parse(
        localStorage.getItem("frigoraFavorites")
    ) || [];

    const alreadySaved = favorites.some(
    favorite => favorite.name === currentRecipe.name
);

if (alreadySaved) {
    alert("⭐ Dieses Rezept ist bereits in deinen Favoriten!");
    return;
}

favorites.push(currentRecipe);

    localStorage.setItem(
        "frigoraFavorites",
        JSON.stringify(favorites)
    );

    loadFavorites();

    const button = document.getElementById("favoriteButton");

if (button) {
    button.textContent = "⭐ Bereits gespeichert";
    button.disabled = true;
}

    alert("⭐ Favorit gespeichert!");
}

function loadFavorites() {
    const favorites = JSON.parse(
        localStorage.getItem("frigoraFavorites")
    ) || [];

    const favoritesList = document.getElementById("favoritesList");

    if (favorites.length === 0) {
        favoritesList.innerHTML = `
            <p>Noch keine gespeicherten Rezepte.</p>
        `;
        return;
    }

    favoritesList.innerHTML = favorites.map(favorite => `
        <div class="favorite-item">
    <h3>⭐ ${favorite.name}</h3>
    <p>${favorite.description}</p>

    <button type="button" onclick="showFavorite(${favorites.indexOf(favorite)})">
    👨‍🍳 Rezept anzeigen
    </button>

    <button type="button" onclick="deleteFavorite(${favorites.indexOf(favorite)})">
        🗑️ Entfernen
    </button>
</div>
    `).join("");
}

loadFavorites();

function deleteFavorite(index) {
    let favorites = JSON.parse(
        localStorage.getItem("frigoraFavorites")
    ) || [];

    favorites.splice(index, 1);

    localStorage.setItem(
        "frigoraFavorites",
        JSON.stringify(favorites)
    );

    loadFavorites();
}

function showFavorite(index) {
    const favorites = JSON.parse(
        localStorage.getItem("frigoraFavorites")
    ) || [];

    const favorite = favorites[index];

    const display = document.getElementById("favoriteRecipeDisplay");

display.innerHTML = `
    <div class="favorite-recipe">
        <h2>👨‍🍳 ${favorite.name}</h2>
<p>${favorite.description}</p>

<p>⏱️ <strong>Zeit:</strong> ${favorite.time}</p>
<p>📊 <strong>Schwierigkeit:</strong> ${favorite.difficulty}</p>

<h3>🥕 Verwendete Zutaten</h3>
<ul>
    ${favorite.ingredients.replace(/\n/g, "<br>")}
</ul>

<h3>🛒 Zusätzlich benötigt</h3>
<p>${favorite.additionalIngredients.replace(/\n/g, "<br>")}</p>

<h3>Zubereitung</h3>
        <p>${favorite.preparation.replace(/\n/g, "<br>")}</p>
    </div>
`;
}
