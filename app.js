const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const routes = ["auth", "catalogo", "carrito", "checkout", "pasarela", "resultado", "seguimiento", "producto", "profile"];

const API_BASE = "http://localhost:3000/api";
const API_PRODUCTOS = `${API_BASE}/productos`;
const API_AUTH = `${API_BASE}/auth`;
const API_ORDERS = `${API_BASE}/orders`;

const money = (val) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);

// --- COMUNAS RM ---
const COMUNAS_RM = [
    "Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia",
    "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea",
    "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia",
    "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "Santiago", "San Joaquín", "San Miguel",
    "San Ramón", "Vitacura", "Puente Alto", "San Bernardo"
].sort();

// --- LOGICA DE ENVIO Y COSTOS ---
let shippingCost = 3990; // Default
let deliveryMethod = 'delivery';

// --- TOASTS ---
function showToast(msg, type = 'info') {
  let c = $('.toast-container');
  if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
  if (c.children.length > 2) c.firstChild.remove();
  const t = document.createElement('div'); t.className = `toast ${type}`; t.innerText = msg;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('hiding'); t.addEventListener('animationend', () => { if(t.parentNode) t.parentNode.removeChild(t); }); }, 3000);
}

function setLoading(btn, isLoading) {
  if (isLoading) { btn.classList.add('btn-loading'); btn.disabled = true; } 
  else { btn.classList.remove('btn-loading'); btn.disabled = false; }
}

const CURRENT_USER_KEY = "lr:currentUser";
const TOKEN_KEY = "lr:token";
const LS_CART_KEY = "lr:cart";

const getCurrentUser = () => JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null");
const setCurrentUser = (u) => localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(u));
const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);

const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LS_CART_KEY);
  updateUserSection(); updateBadge(); showToast("Sesión cerrada", "info"); go('catalogo');
};

async function verifySession() {
  const token = getToken(); if (!token) return;
  try {
    const res = await fetch(`${API_ORDERS}/mine`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.status === 401 || res.status === 403) { localStorage.removeItem(CURRENT_USER_KEY); localStorage.removeItem(TOKEN_KEY); updateUserSection(); }
  } catch (err) {}
}

function updateUserSection() {
  const sec = $("#userSection"); const user = getCurrentUser();
  if (user) {
    sec.innerHTML = `<div class="user-menu"><div class="user-dropdown"><div class="user-avatar" onclick="toggleMenu(event)">${user.name.charAt(0).toUpperCase()}</div><div class="dropdown-menu hidden" id="userMenuDropdown"><button class="dropdown-item" onclick="go('profile')">👤 Mi Perfil</button><button class="dropdown-item" onclick="go('seguimiento')">📦 Mis Pedidos</button><button class="dropdown-item logout" onclick="logout()">🚪 Cerrar Sesión</button></div></div></div>`;
  } else { sec.innerHTML = `<button class="btn-login" onclick="go('auth')">Ingresar</button>`; }
}

window.toggleMenu = (e) => { e.stopPropagation(); document.getElementById('userMenuDropdown').classList.toggle('hidden'); };
document.addEventListener('click', () => { document.getElementById('userMenuDropdown')?.classList.add('hidden'); });

function loadProfile() {
    const user = getCurrentUser(); if(!user) return go('auth');
    $("#profileName").value = user.name; $("#profileEmail").value = user.email;
}

$("#btnSaveProfile").onclick = async () => {
    const btn = $("#btnSaveProfile"); const name = $("#profileName").value.trim(); const email = $("#profileEmail").value.trim(); const token = getToken();
    if(!name || !email) return showToast("Completa campos", "error");
    setLoading(btn, true);
    try {
        const res = await fetch(`${API_AUTH}/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ name, email }) });
        const text = await res.text();
        if (!res.ok) throw new Error(text);
        const data = JSON.parse(text); setCurrentUser(data.user); updateUserSection(); showToast("Perfil actualizado", "success");
    } catch(err) { showToast("Error al actualizar", "error"); } finally { setLoading(btn, false); }
};

function go(route) {
  routes.forEach(r => {
    const el = $("#view-" + r); if(el) el.classList.toggle("hidden", r !== route);
    $$('.nav-link').forEach(a => { if(a.innerText.toLowerCase().includes(route) || (route=='catalogo' && a.innerText.includes('Catálogo'))) a.classList.add('active'); else a.classList.remove('active'); });
  });
  if (route === "catalogo") pintarCatalogo();
  if (route === "carrito") pintarCarrito();
  if (route === "checkout") pintarCheckout();
  if (route === "profile") loadProfile();
  if (route === "seguimiento") { if (!getCurrentUser()) { showToast("Debes iniciar sesión", "error"); return go("auth"); } loadMyOrders(); }
  window.scrollTo(0, 0);
}

let productos = [];
const getCart = () => JSON.parse(localStorage.getItem(LS_CART_KEY) || "[]");
const setCart = (v) => localStorage.setItem(LS_CART_KEY, JSON.stringify(v));
let pag = 1, pageSize = 8;

async function cargarProductos() {
  try {
    const res = await fetch(API_PRODUCTOS); productos = await res.json();
    seedFiltros(); if(!$("#view-catalogo").classList.contains("hidden")) pintarCatalogo();
  } catch (e) { console.error(e); }
}

function seedFiltros() {
  const s = $("#fCategoria"); if(s.children.length <= 1) { s.innerHTML = `<option value="">Categorías</option>`; [...new Set(productos.map(p => p.cat))].forEach(c => { const o = document.createElement("option"); o.value = c; o.innerText = c; s.appendChild(o); }); }
}

function pintarCatalogo() {
  if(!productos.length) return;
  let arr = [...productos]; const q = $("#q").value.toLowerCase(); const c = $("#fCategoria").value;
  if(q) arr = arr.filter(p => p.nombre.toLowerCase().includes(q)); if(c) arr = arr.filter(p => p.cat === c);
  const start = (pag-1)*pageSize; const items = arr.slice(start, start+pageSize);
  const grid = $("#grid"); grid.innerHTML = "";
  if(!items.length) { grid.innerHTML = `<p>No hay productos.</p>`; return; }
  items.forEach(p => {
    const card = document.createElement("div"); card.className = "card";
    const img = p.img || 'https://via.placeholder.com/300';
    card.innerHTML = `<div class="pic"><img src="${img}"></div><div class="card-body"><h4>${p.nombre}</h4><div class="price">${money(p.precio)}</div><div class="stock ${p.stock>0?'ok':'agotado'}">${p.stock>0?'Stock: '+p.stock:'Agotado'}</div><div class="row"><button class="mini btn-agregar-catalogo" ${p.stock===0?'disabled':''} onclick="event.stopPropagation(); agregar(${p.id})">Agregar</button><button class="mini" onclick="event.stopPropagation(); verProducto(${p.id})">Ver</button></div></div>`;
    card.onclick = () => verProducto(p.id); grid.appendChild(card);
  });
  $("#pagInfo").innerText = `Pág ${pag}`;
}

$("#prevPag").onclick = () => { if(pag>1){pag--; pintarCatalogo()} }; $("#nextPag").onclick = () => { pag++; pintarCatalogo() }; $("#btnBuscar").onclick = $("#aplicarFiltros").onclick = () => { pag=1; pintarCatalogo() };

function verProducto(id) {
  const p = productos.find(x => x.id == id); if(!p) return;
  $("#productoNombre").innerText = p.nombre; $("#productoPrecio").innerText = money(p.precio); $("#productoDesc").innerText = p.descripcion || "Sin descripción"; $("#productoImg").src = p.img || ''; $("#productoCategoria").innerText = p.cat;
  const stockEl = $("#productoStock");
  if (p.stock > 0) { stockEl.innerText = `Stock: ${p.stock}`; stockEl.className = 'stock-pill'; stockEl.style.background = '#dcfce7'; stockEl.style.color = '#166534'; }
  else { stockEl.innerText = 'Agotado'; stockEl.className = 'stock-pill'; stockEl.style.background = '#fee2e2'; stockEl.style.color = '#991b1b'; }
  $("#productoQty").value = 1;
  $("#qtyMenos").onclick = () => { let v = parseInt($("#productoQty").value); if(v > 1) $("#productoQty").value = v - 1; };
  $("#qtyMas").onclick = () => { let v = parseInt($("#productoQty").value); if(v < p.stock) $("#productoQty").value = v + 1; else showToast(`Solo quedan ${p.stock}`, "error"); };
  const btn = $("#btnAgregarDetalle"); btn.onclick = () => agregar(p.id, parseInt($("#productoQty").value));
  if (p.stock === 0) { btn.disabled = true; btn.innerText = "Agotado"; } else { btn.disabled = false; btn.innerText = "Agregar al Carrito"; }
  go('producto');
}

function agregar(id, qty=1) {
  const p = productos.find(x => x.id == id); if (!p || p.stock === 0) return showToast("Agotado", "error");
  const cart = getCart(); const item = cart.find(x => x.id == id);
  if (item) {
    if (item.qty + qty <= p.stock) { item.qty += qty; showToast("Actualizado", "success"); } else showToast(`Stock límite (${p.stock})`, "error");
  } else {
    if (qty <= p.stock) { cart.push({ id: p.id, qty }); showToast("Agregado", "success"); } else showToast(`Stock insuficiente`, "error");
  }
  setCart(cart); updateBadge();
}

function updateBadge() {
  const cart = getCart(); const count = cart.reduce((acc, i) => acc + i.qty, 0);
  $("#cartCount").innerText = count; $(".cart-btn").classList.toggle('has-items', count > 0);
}

function pintarCarrito() {
  const cart = getCart(); const list = $("#carritoLista"); list.innerHTML = "";
  if(!cart.length) { list.innerHTML = `<div style="padding:2rem; text-align:center; color:#64748b">Vacío</div>`; $("#btnConfirmarPedido").disabled = true; return; }
  $("#btnConfirmarPedido").disabled = false;
  let subtotal = 0;
  cart.forEach(i => {
    const p = productos.find(x=>x.id==i.id); if(!p) return;
    subtotal += p.precio * i.qty;
    const div = document.createElement("div"); div.className = "carrito-item";
    div.innerHTML = `<img src="${p.img}"><div><div style="font-weight:600">${p.nombre}</div><div style="font-size:0.9rem; color:#64748b">${money(p.precio)}</div></div><div class="qty-control" style="height:32px"><button onclick="modificarQty(${i.id}, -1)">−</button><input value="${i.qty}" readonly style="width:40px"><button onclick="modificarQty(${i.id}, 1)">+</button></div><div style="font-weight:700">${money(p.precio*i.qty)}</div><button onclick="eliminarItem(${i.id})" style="background:none; border:none; color:#ef4444; font-size:1.2rem">✕</button>`;
    list.appendChild(div);
  });
  $("#pillSubtotal").innerText = money(subtotal);
  // En carrito usamos envío default referencial
  $("#pillDespacho").innerText = money(shippingCost);
  $("#pillTotal").innerText = money(subtotal + shippingCost);
}

window.modificarQty = (id, d) => {
  const cart = getCart(); const item = cart.find(x=>x.id==id); const p = productos.find(x=>x.id==id);
  if(item && p) {
    const n = item.qty + d;
    if(n > 0 && n <= p.stock) { item.qty = n; setCart(cart); pintarCarrito(); updateBadge(); }
    else if(n > p.stock) showToast(`Máximo (${p.stock})`, "error");
  }
};
window.eliminarItem = (id) => { const cart = getCart().filter(x=>x.id!=id); setCart(cart); pintarCarrito(); updateBadge(); };

$("#btnConfirmarPedido").onclick = () => { if(!getCurrentUser()) { showToast("Inicia sesión", "info"); go("auth"); } else go("checkout"); };

// --- LÓGICA CHECKOUT CON RADIO BUTTONS ---
function pintarCheckout() {
  const cart = getCart(); if(!cart.length) return go('carrito');
  
  // Poblar comunas
  const sel = $("#comunaSelect");
  if(sel.options.length <= 1) {
      COMUNAS_RM.forEach(c => { const o = document.createElement("option"); o.value = c; o.innerText = c; sel.appendChild(o); });
  }

  // Listener para radios
  $$('input[name="deliveryMethod"]').forEach(r => {
      r.addEventListener('change', (e) => {
          deliveryMethod = e.target.value;
          updateCheckoutTotal();
          if(deliveryMethod === 'pickup') {
              $("#deliveryFields").classList.add("hidden");
              $("#pickupInfo").classList.remove("hidden");
              shippingCost = 0;
          } else {
              $("#deliveryFields").classList.remove("hidden");
              $("#pickupInfo").classList.add("hidden");
              shippingCost = 3990;
          }
          updateCheckoutTotal();
      });
  });

  // Texto Resumen
  let subtotal = 0;
  const lines = cart.map(i => {
    const p = productos.find(x=>x.id==i.id); if(!p) return '';
    subtotal += p.precio * i.qty;
    return `• ${i.qty} x ${p.nombre}`;
  });
  $("#resumenTxt").innerText = lines.join('\n');
  
  // Trigger initial state
  $('input[value="delivery"]').click(); 
}

function updateCheckoutTotal() {
    const cart = getCart();
    let sub = 0;
    cart.forEach(i => { const p = productos.find(x=>x.id==i.id); if(p) sub += p.precio*i.qty; });
    $("#ckTotal").innerText = `${money(sub + shippingCost)} (${deliveryMethod === 'pickup' ? 'Retiro' : 'Despacho'})`;
}

$("#goPasarela").onclick = async () => {
  const btn = $("#goPasarela");
  const addr = $("#addr").value.trim();
  const com = $("#comunaSelect").value;
  
  // Validaciones según método
  if (deliveryMethod === 'delivery' && (!addr || !com)) return showToast("Falta dirección/comuna", "error");
  
  setLoading(btn, true);
  const token = getToken();
  const cart = getCart();
  
  let subtotal = 0;
  cart.forEach(i => { const p = productos.find(x=>x.id==i.id); if(p) subtotal += p.precio*i.qty; });
  const total = subtotal + shippingCost;

  const items = cart.map(i => { const p = productos.find(x=>x.id==i.id); return { id: i.id, qty: i.qty, price: p.precio }; });

  try {
    const res = await fetch(API_ORDERS, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ 
          total, 
          address: addr, 
          items,
          deliveryMethod,
          commune: com
      })
    });
    const d = await res.json();
    if(res.ok) {
       localStorage.setItem("lr:lastOrder", d.orderId);
       localStorage.setItem("lr:tempOrderItems", JSON.stringify(items));
       localStorage.setItem("lr:tempOrderTotal", total);
       localStorage.setItem("lr:tempDeliveryMethod", deliveryMethod); // Guardar para boleta
       
       $("#ordenId").innerText = "#" + d.orderId;
       await cargarProductos();
       go("pasarela");
    } else showToast(d.error || "Error al crear", "error");
  } catch(e) { showToast("Error conexión", "error"); } finally { setLoading(btn, false); }
};

// --- PASARELA ---
$$(".pay-card").forEach(b => b.onclick = async () => {
  const res = b.dataset.result; const oid = localStorage.getItem("lr:lastOrder"); const token = getToken();
  $("#retornoText").innerText = "Procesando..."; $$(".pay-card").forEach(c => c.style.pointerEvents = "none");
  let status = res==="AUTHORIZED" ? "Pagado" : (res==="REJECTED" ? "Rechazado" : "Error");
  if(oid) { try { await fetch(`${API_ORDERS}/${oid}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status }) }); } catch(e){} }
  setTimeout(async () => {
    $$(".pay-card").forEach(c => c.style.pointerEvents = "auto");
    if (res === "AUTHORIZED") { await cargarProductos(); setCart([]); updateBadge(); $("#resOK").classList.remove("hidden"); $("#resREJ").classList.add("hidden"); $("#resERR").classList.add("hidden"); go("resultado"); }
    else if (res === "REJECTED") { $("#resOK").classList.add("hidden"); $("#resREJ").classList.remove("hidden"); $("#resERR").classList.add("hidden"); go("resultado"); }
    else { $("#resOK").classList.add("hidden"); $("#resREJ").classList.add("hidden"); $("#resERR").classList.remove("hidden"); go("resultado"); }
  }, 1500);
});

// --- BOLETA ---
window.verBoleta = () => {
    const oid = localStorage.getItem("lr:lastOrder");
    const items = JSON.parse(localStorage.getItem("lr:tempOrderItems") || "[]");
    const total = localStorage.getItem("lr:tempOrderTotal");
    const method = localStorage.getItem("lr:tempDeliveryMethod");
    const user = getCurrentUser();

    $("#bolOrden").innerText = "#" + oid;
    $("#bolCliente").innerText = user ? user.name : "Cliente";
    $("#bolMetodo").innerText = method === 'pickup' ? 'Retiro en Tienda' : 'Despacho a Domicilio';
    $("#bolTotal").innerText = money(parseInt(total || 0));

    const cont = $("#bolItems"); cont.innerHTML = "";
    items.forEach(i => {
        const p = productos.find(x => x.id == i.id);
        if(p) { const row = document.createElement("div"); row.className = "ticket-item"; row.innerHTML = `<span>${i.qty} x ${p.nombre}</span> <span>${money(i.price * i.qty)}</span>`; cont.appendChild(row); }
    });
    
    // Mostrar costo envío en boleta
    const costoEnvio = method === 'pickup' ? 0 : 3990;
    const ship = document.createElement("div"); ship.className = "ticket-item"; ship.innerHTML = `<span>Envío/Retiro</span> <span>${money(costoEnvio)}</span>`; cont.appendChild(ship);

    $("#modal-boleta").classList.remove("hidden");
};
window.cerrarBoleta = () => $("#modal-boleta").classList.add("hidden");

// --- AUTH ---
$("#btnLogin").onclick = async () => { const btn = $("#btnLogin"); const e=$("#loginEmail").value; const p=$("#loginPassword").value; setLoading(btn, true); try { const res = await fetch(`${API_AUTH}/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:e, password:p}) }); const d = await res.json(); if(res.ok) { setToken(d.token); setCurrentUser(d.user); updateUserSection(); go('catalogo'); } else showToast(d.error, "error"); } catch(err) { showToast("Error servidor", "error"); } finally { setLoading(btn, false); } };
$("#btnRegister").onclick = async () => { const btn = $("#btnRegister"); const n=$("#registerName").value; const e=$("#registerEmail").value; const p=$("#registerPassword").value; if(!n || !e || !p) return showToast("Faltan campos", "error"); const passRegex = /^(?=.*[A-Z])(?=.*\d).{5,}$/; if (!passRegex.test(p)) return showToast("Clave débil (Min 5, 1 Mayus, 1 Num)", "error"); setLoading(btn, true); try { const res = await fetch(`${API_AUTH}/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name:n, email:e, password:p}) }); if(res.ok) { showToast("Registrado", "success"); $("#switchToLogin").click(); } else showToast("Error registro", "error"); } catch(err) { showToast("Error servidor", "error"); } finally { setLoading(btn, false); } };
$("#switchToRegister").onclick = () => { $("#auth-login").classList.add("hidden"); $("#auth-register").classList.remove("hidden"); }; $("#switchToLogin").onclick = () => { $("#auth-register").classList.add("hidden"); $("#auth-login").classList.remove("hidden"); };

// --- SEGUIMIENTO ---
async function loadMyOrders() { const list = $("#segHist"); list.innerHTML = "<li>Cargando...</li>"; try { const res = await fetch(`${API_ORDERS}/mine`, { headers: { 'Authorization': `Bearer ${getToken()}` } }); const data = await res.json(); list.innerHTML = ""; if(!data.length) { $("#segEstado").innerText="Sin pedidos"; return; } const last = data[0]; $("#segEstado").innerText = `Último: ${last.status}`; const getStatusColor = (s) => s.includes('Pagado') ? 'var(--success)' : (s.includes('Rechazado') ? 'var(--danger)' : 'var(--warning)'); data.forEach(o => { const li = document.createElement("li"); li.innerHTML = `<div style="display:flex; justify-content:space-between; margin-bottom:4px"><strong>#${o.id}</strong><span style="color:${getStatusColor(o.status)}; font-weight:700">${o.status}</span></div><div style="font-size:0.9rem; color:#64748b">${new Date(o.createdAt).toLocaleDateString()} | ${money(o.total)} | ${o.deliveryMethod === 'pickup' ? '🏪 Retiro' : '🚚 Despacho'}</div>`; list.appendChild(li); }); } catch(e) { list.innerHTML = "Error al cargar"; } }
$("#btnActualizarSeg").onclick = loadMyOrders;

// INIT
const prevBtn = $('.carrusel-arrow.prev'); if(prevBtn) { let currentSlide = 0; const slides = $$('.carrusel-slide'); const totalSlides = slides.length; const moveSlide = (n) => { currentSlide = n; if(currentSlide<0) currentSlide=totalSlides-1; if(currentSlide>=totalSlides) currentSlide=0; $('#carruselInner').style.transform = `translateX(-${currentSlide*100}%)`; }; prevBtn.onclick = () => moveSlide(currentSlide-1); $('.carrusel-arrow.next').onclick = () => moveSlide(currentSlide+1); setInterval(() => moveSlide(currentSlide+1), 5000); }
updateUserSection(); verifySession(); cargarProductos(); updateBadge();