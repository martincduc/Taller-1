const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const routes = ["auth", "catalogo", "carrito", "checkout", "pasarela", "resultado", "seguimiento", "producto", "profile", "recovery"];

const API_BASE = "http://localhost:3000/api";
const API_PRODUCTOS = `${API_BASE}/productos`;
const API_AUTH = `${API_BASE}/auth`;
const API_ORDERS = `${API_BASE}/orders`;

const money = (val) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
const COMUNAS_RM = ["Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "Santiago", "San Joaquín", "San Miguel", "San Ramón", "Vitacura", "Puente Alto", "San Bernardo"].sort();

let shippingCost = 3990; 
let deliveryMethod = 'delivery';

function showToast(msg, type = 'info') {
  let c = $('.toast-container');
  if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
  if (c.children.length > 2) c.firstChild.remove();
  
  const t = document.createElement('div'); 
  t.className = `toast ${type}`; 
  t.innerText = msg;
  c.appendChild(t);
  
  setTimeout(() => { 
    t.style.opacity = '0'; 
    t.style.transform = 'translateY(10px)';
    setTimeout(() => { if(t.parentNode) t.parentNode.removeChild(t); }, 300);
  }, 3000);
}

function setLoading(btn, isLoading) {
  if (isLoading) { 
    btn.dataset.text = btn.innerText;
    btn.innerText = "Procesando..."; 
    btn.disabled = true; 
    btn.style.opacity = 0.7;
  } else { 
    btn.innerText = btn.dataset.text || "Listo"; 
    btn.disabled = false; 
    btn.style.opacity = 1;
  }
}

const CURRENT_USER_KEY = "lr:currentUser";
const TOKEN_KEY = "lr:token";
const LS_CART_KEY = "lr:cart";

const getCurrentUser = () => JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null");
const setCurrentUser = (u) => localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(u));
const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);

function clearSensitiveFields() {
  const ids = [
    "loginEmail",
    "loginPassword",
    "registerName",
    "registerEmail",
    "registerPassword",
    "registerConfirm",
    "recEmail",
    "recCode",
    "recNewPass",
    "profileName",
    "profileEmail",
    "addr",
    "telefonoCheckout",
    "q"
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === "SELECT") {
      el.selectedIndex = 0;
    } else {
      el.value = "";
    }
  });
  const comunaSelect = document.getElementById("comunaSelect");
  if (comunaSelect) comunaSelect.selectedIndex = 0;
}

const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LS_CART_KEY);
  clearSensitiveFields();
  updateUserSection();
  updateBadge();
  showToast("Sesión cerrada correctamente", "info");
  go('catalogo');
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
    sec.innerHTML = `
      <div class="user-menu">
        <div class="user-avatar" onclick="toggleMenu(event)">${user.name.charAt(0).toUpperCase()}</div>
        <div class="dropdown-menu hidden" id="userMenuDropdown">
          <div style="padding: 10px 14px; font-weight:700; color:var(--primary); font-size:0.85rem;">Hola, ${user.name.split(' ')[0]}</div>
          <button class="dropdown-item" onclick="go('profile')">👤 Mi Perfil</button>
          <button class="dropdown-item" onclick="go('seguimiento')">📦 Mis Pedidos</button>
          <button class="dropdown-item logout" onclick="logout()">🚪 Cerrar Sesión</button>
        </div>
      </div>`;
  } else { 
    sec.innerHTML = `<button class="btn-login" onclick="go('auth')">Iniciar Sesión</button>`; 
  }
}

window.toggleMenu = (e) => { e.stopPropagation(); document.getElementById('userMenuDropdown').classList.toggle('hidden'); };
document.addEventListener('click', () => { document.getElementById('userMenuDropdown')?.classList.add('hidden'); });

function loadProfile() {
    const user = getCurrentUser(); if(!user) return go('auth');
    $("#profileName").value = user.name; $("#profileEmail").value = user.email;
}

$("#btnSaveProfile").onclick = async () => {
    const btn = $("#btnSaveProfile"); const name = $("#profileName").value.trim(); const email = $("#profileEmail").value.trim(); const token = getToken();
    if(!name || !email) return showToast("Completa todos los campos", "error");
    setLoading(btn, true);
    try {
        const res = await fetch(`${API_AUTH}/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ name, email }) });
        const text = await res.text();
        if (!res.ok) throw new Error(text);
        const data = JSON.parse(text); setCurrentUser(data.user); updateUserSection(); showToast("Perfil actualizado", "success");
    } catch(err) { showToast("Error al actualizar", "error"); } finally { setLoading(btn, false); }
};

$("#btnSendCode").onclick = async () => {
    const btn = $("#btnSendCode");
    const email = $("#recEmail").value.trim();
    if(!email) return showToast("Ingresa tu correo", "error");
    setLoading(btn, true);
    try {
        const res = await fetch(`${API_AUTH}/forgot-password`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email}) });
        const data = await res.json();
        if(res.ok) {
            alert(`[SIMULACIÓN DE CORREO]\n\nTu código es: ${data.debugCode}\n\n(Cópialo para el siguiente paso)`);
            $("#recovery-step1").classList.add("hidden");
            $("#recovery-step2").classList.remove("hidden");
            showToast("Código enviado a tu correo", "success");
        } else { showToast(data.error, "error"); }
    } catch(err) { showToast("Error de conexión", "error"); } finally { setLoading(btn, false); }
};

$("#btnResetPass").onclick = async () => {
    const btn = $("#btnResetPass"); const email = $("#recEmail").value.trim(); const code = $("#recCode").value.trim(); const newPassword = $("#recNewPass").value.trim();
    if(!code || !newPassword) return showToast("Faltan datos", "error");
    setLoading(btn, true);
    try {
        const res = await fetch(`${API_AUTH}/reset-password`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email, code, newPassword}) });
        if(res.ok) {
            showToast("¡Contraseña actualizada!", "success");
            go('auth');
            $("#recovery-step1").classList.remove("hidden"); $("#recovery-step2").classList.add("hidden");
            clearSensitiveFields();
        } else { const data = await res.json(); showToast(data.error || "Error al cambiar clave", "error"); }
    } catch(err) { showToast("Error de conexión", "error"); } finally { setLoading(btn, false); }
};

function go(route) {
  routes.forEach(r => {
    const el = $("#view-" + r);
    if(el) {
       if (r === route) {
           el.classList.remove("hidden");
           el.style.animation = 'fadeIn 0.4s ease';
       } else {
           el.classList.add("hidden");
       }
    }
    $$('.nav-link').forEach(a => { 
        if((r == route && a.innerText.toLowerCase().includes('tienda') && r == 'catalogo') || (r == route && a.innerText.toLowerCase().includes('pedidos') && r == 'seguimiento')) {
            a.classList.add('active'); 
        } else if (r == route) {
        } else {
            if(route == 'catalogo' && a.innerText.includes('Tienda')) a.classList.add('active');
            else if(route == 'seguimiento' && a.innerText.includes('Pedidos')) a.classList.add('active');
            else a.classList.remove('active');
        }
    });
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
  if(!items.length) { grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:2rem; font-size:1.2rem; color:var(--text-light)">No encontramos productos 🥐</p>`; return; }
  
  items.forEach((p, index) => {
    const card = document.createElement("div"); 
    card.className = "card";
    card.style.animationDelay = `${index * 0.1}s`;
    
    const img = p.img || 'https://via.placeholder.com/300';
    card.innerHTML = `
      <div class="pic"><img src="${img}"></div>
      <div class="card-body">
        <h4>${p.nombre}</h4>
        <div class="price">${money(p.precio)}</div>
        <div class="stock ${p.stock>0?'ok':'agotado'}">${p.stock>0?'Stock: '+p.stock:'Agotado'}</div>
        <div class="row">
          <button class="mini btn-agregar-catalogo" ${p.stock===0?'disabled':''} onclick="event.stopPropagation(); agregar('${p.id}')">
             ${p.stock===0 ? 'Sin Stock' : 'Agregar +'}
          </button>
          <button class="mini" onclick="event.stopPropagation(); verProducto('${p.id}')">Ver detalle</button>
        </div>
      </div>`;
    card.onclick = () => verProducto(p.id); 
    grid.appendChild(card);
  });
  $("#pagInfo").innerText = `Página ${pag}`;
}

$("#prevPag").onclick = () => { if(pag>1){pag--; pintarCatalogo()} }; $("#nextPag").onclick = () => { pag++; pintarCatalogo() }; $("#btnBuscar").onclick = $("#aplicarFiltros").onclick = () => { pag=1; pintarCatalogo() };

function verProducto(id) {
  const p = productos.find(x => x.id == id); if(!p) return;
  $("#productoNombre").innerText = p.nombre; $("#productoPrecio").innerText = money(p.precio); $("#productoDesc").innerText = p.descripcion || "Una deliciosa preparación artesanal, hecha con ingredientes seleccionados y libres de gluten."; $("#productoImg").src = p.img || ''; $("#productoCategoria").innerText = p.cat;
  const stockEl = $("#productoStock");
  if (p.stock > 0) { stockEl.innerText = `En Stock: ${p.stock} un.`; stockEl.className = 'stock-pill'; stockEl.style.background = '#dcfce7'; stockEl.style.color = '#166534'; }
  else { stockEl.innerText = 'Producto Agotado'; stockEl.className = 'stock-pill'; stockEl.style.background = '#fee2e2'; stockEl.style.color = '#991b1b'; }
  $("#productoQty").value = 1;
  $("#qtyMenos").onclick = () => { let v = parseInt($("#productoQty").value); if(v > 1) $("#productoQty").value = v - 1; };
  $("#qtyMas").onclick = () => { let v = parseInt($("#productoQty").value); if(v < p.stock) $("#productoQty").value = v + 1; else showToast(`Solo quedan ${p.stock}`, "error"); };
  const btn = $("#btnAgregarDetalle"); btn.onclick = () => agregar(p.id, parseInt($("#productoQty").value));
  if (p.stock === 0) { btn.disabled = true; btn.innerText = "No disponible"; } else { btn.disabled = false; btn.innerText = "Agregar al Carrito 🛒"; }
  go('producto');
}

function agregar(id, qty=1) {
  const p = productos.find(x => x.id == id); if (!p || p.stock === 0) return showToast("Producto Agotado", "error");
  const cart = getCart(); const item = cart.find(x => x.id == id);
  if (item) {
    if (item.qty + qty <= p.stock) { item.qty += qty; showToast("Carrito actualizado", "success"); } else showToast(`No puedes llevar más de ${p.stock}`, "error");
  } else {
    if (qty <= p.stock) { cart.push({ id: p.id, qty }); showToast("¡Agregado al carrito!", "success"); } else showToast(`Stock insuficiente`, "error");
  }
  setCart(cart); updateBadge();
}

function updateBadge() {
  const cart = getCart(); const count = cart.reduce((acc, i) => acc + i.qty, 0);
  $("#cartCount").innerText = count; $(".cart-btn").classList.toggle('has-items', count > 0);
}

function pintarCarrito() {
  const cart = getCart(); const list = $("#carritoLista"); list.innerHTML = "";
  if(!cart.length) { list.innerHTML = `<div style="padding:4rem; text-align:center; color:var(--text-light); display:flex; flex-direction:column; align-items:center; gap:10px;"> <span style="font-size:3rem">🛒</span> <p>Tu carrito está vacío.</p></div>`; $("#btnConfirmarPedido").disabled = true; return; }
  $("#btnConfirmarPedido").disabled = false;
  let subtotal = 0;
  cart.forEach(i => {
    const p = productos.find(x=>x.id==i.id); if(!p) return;
    subtotal += p.precio * i.qty;
    const div = document.createElement("div"); div.className = "carrito-item";
    
    div.innerHTML = `
      <img src="${p.img}">
      <div><div style="font-weight:700">${p.nombre}</div><div style="font-size:0.9rem; color:var(--text-light)">${money(p.precio)}</div></div>
      <div class="qty-control" style="height:36px; width:fit-content">
        <button onclick="modificarQty('${i.id}', -1)" style="width:30px; height:30px; font-size:1rem">−</button>
        <input value="${i.qty}" readonly style="width:30px; height:30px; font-size:0.9rem">
        <button onclick="modificarQty('${i.id}', 1)" style="width:30px; height:30px; font-size:1rem">+</button>
      </div>
      <div style="font-weight:700; color:var(--primary)">${money(p.precio*i.qty)}</div>
      <button onclick="eliminarItem('${i.id}')" style="background:none; border:none; color:var(--danger); font-size:1.2rem; cursor:pointer">🗑️</button>`;
    list.appendChild(div);
  });
  $("#pillSubtotal").innerText = money(subtotal);
  $("#pillDespacho").innerText = money(shippingCost);
  $("#pillTotal").innerText = money(subtotal + shippingCost);
}

window.modificarQty = (id, d) => {
  const cart = getCart(); const item = cart.find(x=>x.id==id); const p = productos.find(x=>x.id==id);
  if(item && p) {
    const n = item.qty + d;
    if(n > 0 && n <= p.stock) { item.qty = n; setCart(cart); pintarCarrito(); updateBadge(); }
    else if(n > p.stock) showToast(`Máximo disponible: ${p.stock}`, "error");
  }
};
window.eliminarItem = (id) => { const cart = getCart().filter(x=>x.id!=id); setCart(cart); pintarCarrito(); updateBadge(); };

$("#btnConfirmarPedido").onclick = () => { if(!getCurrentUser()) { showToast("Necesitas iniciar sesión para comprar", "info"); go("auth"); } else { clearSensitiveFields(); go("checkout"); } };

function pintarCheckout() {
  const cart = getCart(); if(!cart.length) return go('carrito');
  const sel = $("#comunaSelect");
  if(sel.options.length <= 1) { COMUNAS_RM.forEach(c => { const o = document.createElement("option"); o.value = c; o.innerText = c; sel.appendChild(o); }); }
  $$('input[name="deliveryMethod"]').forEach(r => {
      r.addEventListener('change', (e) => {
          deliveryMethod = e.target.value;
          updateCheckoutTotal();
          if(deliveryMethod === 'pickup') { $("#deliveryFields").classList.add("hidden"); $("#pickupInfo").classList.remove("hidden"); shippingCost = 0; } 
          else { $("#deliveryFields").classList.remove("hidden"); $("#pickupInfo").classList.add("hidden"); shippingCost = 3990; }
          updateCheckoutTotal();
      });
  });
  let subtotal = 0;
  const lines = cart.map(i => { const p = productos.find(x=>x.id==i.id); if(!p) return ''; subtotal += p.precio * i.qty; return `• ${i.qty} x ${p.nombre}`; });
  $("#resumenTxt").innerText = lines.join('\n');
  $('input[value="delivery"]').click(); 
}

function updateCheckoutTotal() {
    const cart = getCart(); let sub = 0; cart.forEach(i => { const p = productos.find(x=>x.id==i.id); if(p) sub += p.precio*i.qty; });
    $("#ckTotal").innerText = `${money(sub + shippingCost)}`;
}

$("#goPasarela").onclick = async () => {
  const btn = $("#goPasarela"); const addr = $("#addr").value.trim(); const com = $("#comunaSelect").value;
  if (deliveryMethod === 'delivery' && (!addr || !com)) return showToast("Por favor ingresa tu dirección completa", "error");
  setLoading(btn, true); const token = getToken(); const cart = getCart();
  let subtotal = 0; cart.forEach(i => { const p = productos.find(x=>x.id==i.id); if(p) subtotal += p.precio*i.qty; });
  const total = subtotal + shippingCost;
  const items = cart.map(i => { const p = productos.find(x=>x.id==i.id); return { id: i.id, qty: i.qty, price: p.precio }; });
  try {
    const res = await fetch(API_ORDERS, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ total, address: addr, items, deliveryMethod, commune: com }) });
    const d = await res.json();
    if(res.ok) { localStorage.setItem("lr:lastOrder", d.orderId); localStorage.setItem("lr:tempOrderItems", JSON.stringify(items)); localStorage.setItem("lr:tempOrderTotal", total); localStorage.setItem("lr:tempDeliveryMethod", deliveryMethod); $("#ordenId").innerText = "#" + d.orderId; await cargarProductos(); clearSensitiveFields(); go("pasarela"); } else showToast(d.error || "Error al crear pedido", "error");
  } catch(e) { showToast("Error de conexión", "error"); } finally { setLoading(btn, false); }
};

$$(".pay-card").forEach(b => b.onclick = async () => {
  const res = b.dataset.result; const oid = localStorage.getItem("lr:lastOrder"); const token = getToken();
  $("#retornoText").innerText = "Procesando pago con el banco..."; $$(".pay-card").forEach(c => c.style.pointerEvents = "none");
  let status = res==="AUTHORIZED" ? "Pagado" : (res==="REJECTED" ? "Rechazado" : "Error");
  if(oid) { try { await fetch(`${API_ORDERS}/${oid}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status }) }); } catch(e){} }
  setTimeout(async () => {
    $$(".pay-card").forEach(c => c.style.pointerEvents = "auto");
    if (res === "AUTHORIZED") { await cargarProductos(); setCart([]); updateBadge(); $("#resOK").classList.remove("hidden"); $("#resREJ").classList.add("hidden"); $("#resERR").classList.add("hidden"); go("resultado"); }
    else if (res === "REJECTED") { $("#resOK").classList.add("hidden"); $("#resREJ").classList.remove("hidden"); $("#resERR").classList.add("hidden"); go("resultado"); }
    else { $("#resOK").classList.add("hidden"); $("#resREJ").classList.add("hidden"); $("#resERR").classList.remove("hidden"); go("resultado"); }
  }, 2000); 
});

window.verBoleta = () => {
    const oid = localStorage.getItem("lr:lastOrder"); 
    const items = JSON.parse(localStorage.getItem("lr:tempOrderItems") || "[]"); 
    const total = parseInt(localStorage.getItem("lr:tempOrderTotal") || 0); 
    const method = localStorage.getItem("lr:tempDeliveryMethod"); 
    const user = getCurrentUser();
    
    const neto = Math.round(total / 1.19);
    const iva = total - neto;
    const now = new Date();

    const container = $("#modal-boleta");
    container.innerHTML = `
      <div class="boleta-ticket">
        <div class="boleta-header">
           <h2>LIBRE & RICO</h2>
           <p>PANADERIA ARTESANAL SPA</p>
           <p>77.123.456-8</p>
           <p>AV. SIEMPRE VIVA 123, SANTIAGO</p>
           <br>
           <p><strong>BOLETA ELECTRÓNICA N° ${Math.floor(Math.random() * 100000)}</strong></p>
           <p>S.I.I. - SANTIAGO CENTRO</p>
        </div>

        <div class="boleta-info">
           <div class="info-line"><span>FECHA:</span> <span>${now.toLocaleDateString()} ${now.toLocaleTimeString()}</span></div>
           <div class="info-line"><span>CLIENTE:</span> <span>${user ? user.name.toUpperCase() : "CLIENTE"}</span></div>
           <div class="info-line"><span>ORDEN:</span> <span>#${oid}</span></div>
           <div class="info-line"><span>ENTREGA:</span> <span>${method === 'pickup' ? 'RETIRO' : 'DESPACHO'}</span></div>
        </div>

        <div class="boleta-items">
           <div class="tbl-header"><span>DESCRIPCION</span><span>TOTAL</span></div>
           ${items.map(i => {
               const p = productos.find(x => x.id == i.id);
               return `<div class="item-row"><span class="item-name">${i.qty} x ${p ? p.nombre.toUpperCase() : 'ARTICULO'}</span><span>${money(i.price * i.qty)}</span></div>`;
           }).join('')}
           ${method === 'delivery' ? `<div class="item-row"><span class="item-name">DESPACHO A DOMICILIO</span><span>${money(3990)}</span></div>` : ''}
        </div>

        <div class="boleta-total">
           <div class="info-line"><span>NETO:</span> <span>${money(neto)}</span></div>
           <div class="info-line"><span>IVA (19%):</span> <span>${money(iva)}</span></div>
           <div class="boleta-total" style="font-size:16px; margin-top:10px; border-top:1px dashed #000; padding-top:5px;"><span>TOTAL:</span> <span>${money(total)}</span></div>
        </div>

        <div class="boleta-footer">
           <div class="barcode"></div>
           <p>TIMBRE ELECTRÓNICO SII</p>
           <p>RES. 80 DE 2014 - VERIFIQUE EN WWW.SII.CL</p>
           <p>¡GRACIAS POR SU PREFERENCIA!</p>
        </div>

        <div class="boleta-actions">
           <button class="btn-print" onclick="window.print()">IMPRIMIR TICKET</button>
           <button class="btn-close" onclick="document.getElementById('modal-boleta').classList.add('hidden')">CERRAR</button>
        </div>
      </div>
    `;
    
    container.classList.remove("hidden");
};
window.cerrarBoleta = () => $("#modal-boleta").classList.add("hidden");

$("#btnLogin").onclick = async () => { const btn = $("#btnLogin"); const e=$("#loginEmail").value; const p=$("#loginPassword").value; setLoading(btn, true); try { const res = await fetch(`${API_AUTH}/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:e, password:p}) }); const d = await res.json(); if(res.ok) { setToken(d.token); setCurrentUser(d.user); clearSensitiveFields(); updateUserSection(); go('catalogo'); showToast(`Bienvenido, ${d.user.name}`, "success"); } else showToast(d.error, "error"); } catch(err) { showToast("Error servidor", "error"); } finally { setLoading(btn, false); } };
$("#btnRegister").onclick = async () => { const btn = $("#btnRegister"); const n=$("#registerName").value; const e=$("#registerEmail").value; const p=$("#registerPassword").value; if(!n || !e || !p) return showToast("Faltan campos", "error"); const passRegex = /^(?=.*[A-Z])(?=.*\d).{5,}$/; if (!passRegex.test(p)) return showToast("La contraseña es muy débil", "error"); setLoading(btn, true); try { const res = await fetch(`${API_AUTH}/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name:n, email:e, password:p}) }); if(res.ok) { showToast("Cuenta creada con éxito", "success"); clearSensitiveFields(); $("#switchToLogin").click(); } else showToast("Error al registrar", "error"); } catch(err) { showToast("Error servidor", "error"); } finally { setLoading(btn, false); } };
$("#switchToRegister").onclick = () => { $("#auth-login").classList.add("hidden"); $("#auth-register").classList.remove("hidden"); }; $("#switchToLogin").onclick = () => { $("#auth-register").classList.add("hidden"); $("#auth-login").classList.remove("hidden"); };

async function loadMyOrders() { 
    const list = $("#segHist"); 
    list.innerHTML = "<li style='text-align:center; padding:1rem; color:var(--text-light)'>Cargando historial...</li>"; 
    
    try { 
        const res = await fetch(`${API_ORDERS}/mine`, { headers: { 'Authorization': `Bearer ${getToken()}` } }); 
        const data = await res.json(); 
        list.innerHTML = ""; 
        
        if(!data.length) { 
            $("#segEstado").innerText="Sin pedidos"; 
            list.innerHTML="<li style='text-align:center; padding:2rem'>Aún no has realizado pedidos.</li>"; 
            return; 
        } 
        
        const last = data[0]; 
        $("#segEstado").innerText = `Último estado: ${last.status}`; 
        
        const getStatusColor = (s) => {
            if(s.includes('Pagado')) return 'var(--success)';
            if(s.includes('Rechazado') || s.includes('Anulado')) return 'var(--danger)';
            return 'var(--warning)';
        };

        data.forEach(o => { 
            const li = document.createElement("li"); 
            let itemsHtml = '';
            if(o.items && o.items.length > 0) {
                itemsHtml = o.items.map(i => {
                    let nombre = "Producto desconocido";
                    if (i.product && typeof i.product === 'object' && i.product.nombre) {
                        nombre = i.product.nombre;
                    } 
                    else if (i.product && typeof i.product === 'string') {
                        const pLocal = productos.find(p => p.id === i.product || p._id === i.product);
                        if (pLocal) nombre = pLocal.nombre;
                    }
                    return `<div>• ${i.qty} x ${nombre}</div>`;
                }).join('');
            } else {
                itemsHtml = '<div>Sin detalles</div>';
            }

            const shortId = o.id.slice(-6).toUpperCase();
            const canCancel = o.status !== 'Anulado' && o.status !== 'Entregado';
            const cancelButton = canCancel 
                ? `<button onclick="anularPedido('${o.id}')" style="margin-left:auto; font-size:0.8rem; padding:6px 12px; background:white; border:1px solid var(--danger); color:var(--danger); border-radius:6px; cursor:pointer; font-weight:600; transition:0.2s">Anular Pedido</button>`
                : '';

            li.innerHTML = `
                <div style="background: white; border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: var(--shadow-sm);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:10px;">
                        <div>
                            <strong style="font-size:1.1rem; color:var(--text)">Pedido #${shortId}</strong>
                            <div style="font-size:0.8rem; color:var(--text-light); margin-top:2px;">${new Date(o.createdAt).toLocaleString()}</div>
                        </div>
                        <span style="background:${getStatusColor(o.status)}; color:white; padding:4px 12px; border-radius:20px; font-size:0.8rem; font-weight:700;">${o.status}</span>
                    </div>
                    
                    <div style="margin-bottom:15px; color:var(--text-light); font-size:0.95rem; line-height:1.6;">
                        ${itemsHtml}
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                         <div style="font-weight:700; font-size:1.1rem; color:var(--text)">Total: ${money(o.total)}</div>
                         ${cancelButton}
                    </div>
                </div>`; 
            list.appendChild(li); 
        }); 
    } catch(e) { 
        console.error(e);
        list.innerHTML = "Error al cargar historial"; 
    } 
}
$("#btnActualizarSeg").onclick = loadMyOrders;

window.anularPedido = async (id) => {
    if(!confirm("¿Estás seguro de que quieres anular este pedido? Se restaurará el stock.")) return;
    
    try {
        const res = await fetch(`${API_ORDERS}/${id}/cancel`, { 
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${getToken()}` } 
        });
        const data = await res.json();
        
        if (res.ok) {
            showToast("Pedido anulado correctamente", "success");
            loadMyOrders(); 
        } else {
            showToast(data.error || "No se pudo anular (Reinicia el servidor)", "error");
        }
    } catch (e) {
        showToast("Error de conexión (Reinicia el servidor)", "error");
    }
};

const prevBtn = $('.carrusel-arrow.prev'); if(prevBtn) { let currentSlide = 0; const slides = $$('.carrusel-slide'); const totalSlides = slides.length; const moveSlide = (n) => { currentSlide = n; if(currentSlide<0) currentSlide=totalSlides-1; if(currentSlide>=totalSlides) currentSlide=0; $('#carruselInner').style.transform = `translateX(-${currentSlide*100}%)`; }; prevBtn.onclick = () => moveSlide(currentSlide-1); $('.carrusel-arrow.next').onclick = () => moveSlide(currentSlide+1); setInterval(() => moveSlide(currentSlide+1), 5000); }
updateUserSection(); verifySession(); cargarProductos(); updateBadge();
