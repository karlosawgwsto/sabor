
// Mesma origem do backend: mantenha vazio.
// Outra origem: por exemplo, "http://localhost:3000".
const SERVER_ORIGIN = "http://localhost:3000";
const API_BASE = `${SERVER_ORIGIN}/api/`;

const $ = (id) => document.getElementById(id);

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const placeholderSvg = `
      <svg xmlns="http://www.w3.org/2000/svg"
           width="120" height="120" viewBox="0 0 120 120">
        <rect width="120" height="120" rx="16" fill="#edf5e8"/>
        <path d="M32 82V38h56v44H32Z"
              fill="none" stroke="#4d702b" stroke-width="4"/>
        <circle cx="48" cy="51" r="6" fill="#a8df65"/>
        <path d="m35 77 18-18 12 12 9-9 11 15"
              fill="none" stroke="#4d702b" stroke-width="4"/>
      </svg>
    `;

const PLACEHOLDER =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(placeholderSvg);

let products = [];
let editingId = null;
let deletingId = null;
let currentImage = "";
let objectUrl = null;
let loading = false;
let saving = false;
let deleting = false;
let listError = "";

function showNotice(message, error = false) {
  $("notice").textContent = message;
  $("notice").classList.toggle("error", error);
  $("notice").hidden = false;
}

function showError(id, message) {
  $(id).textContent = message;
  $(id).hidden = false;
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function categoryKey(product) {
  return String(product.category || product.categoryLabel || "");
}

function categoryLabel(product) {
  return String(
    product.categoryLabel || product.category || "Sem categoria"
  );
}

function imageUrl(path) {
  if (!path) return PLACEHOLDER;

  try {
    const url = new URL(
      String(path),
      SERVER_ORIGIN || window.location.origin
    );

    return ["http:", "https:"].includes(url.protocol)
      ? url.href
      : PLACEHOLDER;
  } catch {
    return PLACEHOLDER;
  }
}

function formatPrice(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);
  return Number.isFinite(number) ? money.format(number) : "—";
}

function editablePrice(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number.toFixed(2).replace(".", ",")
    : "";
}

function parsePrice(value, label) {
  const text = String(value).trim();

  if (!/^\d{1,8}([.,]\d{1,2})?$/.test(text)) {
    throw new Error(
      `${label}: informe um valor de 0 a 99999999,99, ` +
      "com até duas casas decimais e sem separador de milhar."
    );
  }

  const number = Number(text.replace(",", "."));

  if (!Number.isFinite(number) || number < 0 || number > 99999999.99) {
    throw new Error(`${label}: valor fora do limite permitido.`);
  }

  return number.toFixed(2);
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "same-origin",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (response.ok) {
        throw new Error("O servidor retornou uma resposta que não é JSON.");
      }
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      data?.mensagem ||
      `Erro HTTP ${response.status}`
    );
  }

  return data;
}

function updateStats() {
  $("totalProducts").textContent = products.length;
  $("navCount").textContent = products.length;

  $("totalCategories").textContent = new Set(
    products.map(categoryKey).filter(Boolean)
  ).size;

  $("totalDiscounts").textContent = products.filter((product) => {
    const price = Number(product.price);
    const oldPrice = Number(product.oldPrice);

    return Number.isFinite(price) &&
      Number.isFinite(oldPrice) &&
      oldPrice > price;
  }).length;
}

function updateCategoryFilter() {
  const selected = $("categoryFilter").value;
  const categories = new Map();

  products.forEach((product) => {
    const key = categoryKey(product);
    if (key) categories.set(key, categoryLabel(product));
  });

  $("categoryFilter").replaceChildren(
    new Option("Todas as categorias", "")
  );

  [...categories.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "pt-BR"))
    .forEach(([value, label]) => {
      $("categoryFilter").add(new Option(label, value));
    });

  if (categories.has(selected)) {
    $("categoryFilter").value = selected;
  }
}

function textCell(value, className = "") {
  const td = document.createElement("td");
  td.textContent = value;
  td.className = className;
  return td;
}

function pillCell(value) {
  const td = document.createElement("td");

  if (!value) {
    td.textContent = "—";
    return td;
  }

  const span = document.createElement("span");
  span.className = "pill";
  span.textContent = value;
  span.title = value;
  td.append(span);

  return td;
}

function createRow(product) {
  const row = document.createElement("tr");
  const productCell = document.createElement("td");
  const container = document.createElement("div");
  container.className = "product-cell";

  const image = document.createElement("img");
  image.className = "thumb";
  image.alt = "";
  image.loading = "lazy";
  image.src = imageUrl(product.image);

  image.addEventListener("error", () => {
    image.src = PLACEHOLDER;
  }, { once: true });

  const description = document.createElement("div");
  const name = document.createElement("span");
  name.className = "product-name";
  name.textContent = product.name || "Produto sem nome";
  name.title = product.name || "";

  const id = document.createElement("span");
  id.className = "product-meta";
  id.textContent = `ID #${product.id}`;

  description.append(name, id);
  container.append(image, description);
  productCell.append(container);

  const actionsCell = document.createElement("td");
  const actions = document.createElement("div");
  actions.className = "actions";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "action-btn";
  editButton.textContent = "Editar";
  editButton.setAttribute("aria-label", `Editar ${product.name}`);
  editButton.addEventListener("click", () => openProduct(product));

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "action-btn delete";
  deleteButton.textContent = "Remover";
  deleteButton.setAttribute("aria-label", `Remover ${product.name}`);
  deleteButton.addEventListener("click", () => openDelete(product));

  actions.append(editButton, deleteButton);
  actionsCell.append(actions);

  row.append(
    productCell,
    pillCell(categoryLabel(product)),
    textCell(product.unit || "—"),
    textCell(formatPrice(product.price), "price"),
    textCell(formatPrice(product.oldPrice)),
    pillCell(product.badge),
    actionsCell
  );

  return row;
}

function renderProducts() {
  $("productRows").replaceChildren();

  if (loading || listError) {
    $("tableWrap").hidden = true;
    $("listState").hidden = false;
    $("listState").textContent = loading
      ? "Carregando produtos..."
      : listError;

    $("listCount").textContent = loading
      ? "Consultando catálogo."
      : "Não foi possível carregar o catálogo.";

    return;
  }

  const search = normalizeText($("search").value.trim());
  const selectedCategory = $("categoryFilter").value;

  const filtered = products.filter((product) => {
    const searchable = normalizeText([
      product.id,
      product.name,
      product.category,
      product.categoryLabel
    ].join(" "));

    return searchable.includes(search) &&
      (!selectedCategory || categoryKey(product) === selectedCategory);
  });

  $("tableWrap").hidden = filtered.length === 0;
  $("listState").hidden = filtered.length > 0;

  if (!filtered.length) {
    $("listState").textContent = products.length
      ? "Nenhum produto corresponde aos filtros informados."
      : "Seu catálogo está vazio. Clique em “Novo produto” para começar.";
  } else {
    const fragment = document.createDocumentFragment();

    filtered.forEach((product) => {
      fragment.append(createRow(product));
    });

    $("productRows").append(fragment);
  }

  $("listCount").textContent =
    `Exibindo ${filtered.length} de ${products.length} produto(s).`;
}

async function loadProducts() {
  if (loading) return false;

  loading = true;
  listError = "";
  $("refresh").disabled = true;
  renderProducts();

  try {
    const data = await request("produto/listar");

    if (!Array.isArray(data)) {
      throw new Error("A listagem deve retornar um array de produtos.");
    }

    products = data;
    updateStats();
    updateCategoryFilter();

    return true;
  } catch (error) {
    listError = `Não foi possível listar os produtos: ${error.message}`;
    return false;
  } finally {
    loading = false;
    $("refresh").disabled = false;
    renderProducts();
  }
}

function clearObjectUrl() {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }
}

function setPreview(source) {
  $("imagePreview").src = source || PLACEHOLDER;
}

$("imagePreview").addEventListener("error", () => {
  if ($("imagePreview").getAttribute("src") !== PLACEHOLDER) {
    setPreview(PLACEHOLDER);
    $("imageHint").textContent =
      "Não foi possível visualizar a imagem.";
  }
});

function restoreImageSelection() {
  clearObjectUrl();
  $("imageFile").value = "";
  $("clearImage").hidden = true;

  const editing = editingId !== null;

  setPreview(editing ? imageUrl(currentImage) : PLACEHOLDER);

  $("fileName").textContent = editing
    ? "Nenhuma nova imagem selecionada."
    : "Nenhum arquivo selecionado.";

  $("imageHint").textContent = editing
    ? "A imagem atual será mantida se você não selecionar outra."
    : "Selecione uma imagem para cadastrar o produto.";
}

function openProduct(product = null) {
  $("productForm").reset();
  $("formError").hidden = true;

  editingId = product ? product.id : null;
  currentImage = product?.image || "";

  const editing = editingId !== null;

  $("dialogTitle").textContent = editing
    ? "Editar produto"
    : "Novo produto";

  $("saveProduct").textContent = editing
    ? "Salvar alterações"
    : "Cadastrar produto";

  $("imageLabel").textContent = editing
    ? "Imagem do produto"
    : "Imagem do produto *";

  ["name", "category", "categoryLabel", "unit", "badge"].forEach((field) => {
    $(field).value = product?.[field] ?? "";
  });

  $("price").value = editing ? editablePrice(product.price) : "";
  $("oldPrice").value = editing ? editablePrice(product.oldPrice) : "";

  restoreImageSelection();
  $("productDialog").showModal();
  $("name").focus();
}

$("chooseImage").addEventListener("click", () => {
  $("imageFile").click();
});

$("clearImage").addEventListener("click", restoreImageSelection);

$("imageFile").addEventListener("change", () => {
  const file = $("imageFile").files[0];

  if (!file) {
    restoreImageSelection();
    return;
  }

  if (!file.type.startsWith("image/")) {
    restoreImageSelection();
    showError("formError", "Selecione um arquivo de imagem.");
    return;
  }

  clearObjectUrl();
  $("formError").hidden = true;

  objectUrl = URL.createObjectURL(file);
  setPreview(objectUrl);

  $("fileName").textContent =
    `${file.name} • ${(file.size / 1024).toFixed(1)} KB`;

  $("imageHint").textContent =
    "A imagem será enviada quando você salvar o produto.";

  $("clearImage").hidden = false;
});

function closeProduct() {
  if (!saving) $("productDialog").close();
}

$("productDialog").addEventListener("close", () => {
  clearObjectUrl();
  $("imageFile").value = "";
  setPreview(PLACEHOLDER);
});

$("productDialog").addEventListener("cancel", (event) => {
  if (saving) event.preventDefault();
});

function setSaving(value) {
  saving = value;

  $("productForm").querySelectorAll("button, input").forEach((element) => {
    element.disabled = value;
  });

  $("saveProduct").textContent = value
    ? "Salvando..."
    : editingId !== null
      ? "Salvar alterações"
      : "Cadastrar produto";
}

$("productForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (saving) return;

  $("formError").hidden = true;

  const editing = editingId !== null;
  const id = editingId;
  const file = $("imageFile").files[0];

  let formData;

  try {
    const name = $("name").value.trim();

    if (!name) {
      throw new Error("Informe o nome do produto.");
    }

    if (!editing && !file) {
      throw new Error("Selecione uma imagem para cadastrar o produto.");
    }

    if (file && !file.type.startsWith("image/")) {
      throw new Error("Selecione um arquivo de imagem.");
    }

    const payload = {
      name,
      category: $("category").value.trim(),
      categoryLabel: $("categoryLabel").value.trim(),
      unit: $("unit").value.trim(),
      price: parsePrice($("price").value, "Preço atual"),
      oldPrice: parsePrice($("oldPrice").value, "Preço anterior"),
      badge: $("badge").value.trim()
    };

    formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Na edição, sem arquivo, o backend preserva a imagem atual.
    if (file) {
      formData.append("image", file);
    }
  } catch (error) {
    showError("formError", error.message);
    return;
  }

  setSaving(true);

  try {
    const path = editing
      ? `produto/atualizar/${encodeURIComponent(id)}`
      : "produto/cadastrar";

    // Não definir Content-Type manualmente ao enviar FormData.
    await request(path, {
      method: "POST",
      body: formData
    });
  } catch (error) {
    showError("formError", error.message);
    return;
  } finally {
    setSaving(false);
  }

  $("productDialog").close();

  const refreshed = await loadProducts();
  const message = editing
    ? "Produto atualizado com sucesso."
    : "Produto cadastrado com sucesso.";

  showNotice(
    refreshed
      ? message
      : `${message} Não foi possível recarregar a lista. ` +
      "Clique em “Atualizar lista”.",
    !refreshed
  );
});

function openDelete(product) {
  deletingId = product.id;
  $("deleteError").hidden = true;

  $("deleteDescription").textContent =
    `Deseja remover “${product.name}” (ID #${product.id})?`;

  $("deleteDialog").showModal();
  $("cancelDelete").focus();
}

function closeDelete() {
  if (!deleting) $("deleteDialog").close();
}

$("deleteDialog").addEventListener("cancel", (event) => {
  if (deleting) event.preventDefault();
});

$("confirmDelete").addEventListener("click", async () => {
  if (deleting || deletingId === null) return;

  const id = deletingId;
  deleting = true;
  $("deleteError").hidden = true;

  $("deleteDialog").querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });

  $("confirmDelete").textContent = "Removendo...";

  try {
    await request(`produto/apagar/${encodeURIComponent(id)}`, {
      method: "POST"
    });
  } catch (error) {
    showError("deleteError", error.message);
    return;
  } finally {
    deleting = false;

    $("deleteDialog").querySelectorAll("button").forEach((button) => {
      button.disabled = false;
    });

    $("confirmDelete").textContent = "Remover produto";
  }

  $("deleteDialog").close();
  deletingId = null;

  const refreshed = await loadProducts();

  showNotice(
    refreshed
      ? "Produto removido com sucesso."
      : "Produto removido, mas a lista não pôde ser recarregada. " +
      "Clique em “Atualizar lista”.",
    !refreshed
  );
});

$("newProduct").addEventListener("click", () => openProduct());
$("refresh").addEventListener("click", loadProducts);
$("search").addEventListener("input", renderProducts);
$("categoryFilter").addEventListener("change", renderProducts);

$("closeProduct").addEventListener("click", closeProduct);
$("cancelProduct").addEventListener("click", closeProduct);
$("closeDelete").addEventListener("click", closeDelete);
$("cancelDelete").addEventListener("click", closeDelete);

setPreview(PLACEHOLDER);
loadProducts();
