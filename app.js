const NUMERO_WHATSAPP = "525643852908";
const CLAVE_CARRITO = "avenasTrasnochadasCarrito";

// --- ESTADO DEL CARRITO ---
let carrito = cargarCarrito();

function cargarCarrito() {
  try {
    const guardado = localStorage.getItem(CLAVE_CARRITO);
    return guardado ? JSON.parse(guardado) : [];
  } catch (error) {
    return [];
  }
}

function guardarCarrito() {
  try {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
  } catch (error) {
    // Si falla el guardado (modo privado, etc.), el carrito sigue en memoria
  }
}

// Lee las casillas de proteína/creatina marcadas dentro de un contenedor
function leerExtrasSeleccionados(contenedor) {
  const casillas = contenedor.querySelectorAll(
    'input[type="checkbox"]:checked',
  );
  return Array.from(casillas).map((casilla) => ({
    nombre: casilla.dataset.extra,
    precio: Number(casilla.dataset.precio),
  }));
}

// 1. Agregar una avena individual al carrito (desde su tarjeta)
function agregarAvenaAlCarrito(boton, sabor, precioBase) {
  const tarjeta = boton.closest(".tarjeta");
  const extras = leerExtrasSeleccionados(tarjeta);

  carrito.push({
    tipo: "individual",
    nombre: sabor,
    precioBase,
    extras,
    cantidad: 1,
  });

  // Desmarcamos las casillas para el siguiente pedido
  tarjeta
    .querySelectorAll('input[type="checkbox"]')
    .forEach((c) => (c.checked = false));

  guardarCarrito();
  renderCarrito();
  abrirCarrito();
}

// 2. Agregar un plan (semanal, quincenal o mensual) al carrito
function agregarPlanAlCarrito(boton, nombrePlan, precioBase) {
  const contenedorExtras = boton
    .closest(".tarjeta-plan")
    .querySelector(".extras");
  const extras = leerExtrasSeleccionados(contenedorExtras);

  carrito.push({
    tipo: "plan",
    nombre: nombrePlan,
    precioBase,
    extras,
    cantidad: 1,
  });

  contenedorExtras
    .querySelectorAll('input[type="checkbox"]')
    .forEach((c) => (c.checked = false));

  guardarCarrito();
  renderCarrito();
  abrirCarrito();
}

function precioLineaItem(item) {
  const extrasTotal = item.extras.reduce(
    (suma, extra) => suma + extra.precio,
    0,
  );
  return (item.precioBase + extrasTotal) * item.cantidad;
}

function cambiarCantidad(indice, delta) {
  const item = carrito[indice];
  if (!item) return;

  item.cantidad += delta;
  if (item.cantidad < 1) {
    carrito.splice(indice, 1);
  }

  guardarCarrito();
  renderCarrito();
}

function eliminarDelCarrito(indice) {
  carrito.splice(indice, 1);
  guardarCarrito();
  renderCarrito();
}

function vaciarCarrito() {
  carrito = [];
  guardarCarrito();
  renderCarrito();
}

function renderCarrito() {
  const contenedor = document.getElementById("carritoItems");
  const totalEl = document.getElementById("carritoTotal");
  const contadorEl = document.getElementById("carritoContador");

  contadorEl.textContent = carrito.reduce(
    (suma, item) => suma + item.cantidad,
    0,
  );

  if (carrito.length === 0) {
    contenedor.innerHTML =
      '<p class="carrito-vacio">Todavía no agregas nada.</p>';
    totalEl.textContent = "$0";
    return;
  }

  contenedor.innerHTML = "";
  let total = 0;

  carrito.forEach((item, indice) => {
    const subtotal = precioLineaItem(item);
    total += subtotal;

    const extrasTexto = item.extras.length
      ? item.extras.map((e) => e.nombre).join(" + ")
      : "Sin extras";

    const fila = document.createElement("div");
    fila.className = "carrito-item";
    fila.innerHTML = `
      <div class="carrito-item-titulo">
        <span>${item.nombre}</span>
        <span>$${subtotal}</span>
      </div>
      <div class="carrito-item-extras">${extrasTexto}</div>
      <div class="carrito-item-controles">
        <div class="carrito-cantidad">
          <button type="button" onclick="cambiarCantidad(${indice}, -1)">-</button>
          <span>${item.cantidad}</span>
          <button type="button" onclick="cambiarCantidad(${indice}, 1)">+</button>
        </div>
        <button type="button" class="carrito-quitar" onclick="eliminarDelCarrito(${indice})">Quitar</button>
      </div>
    `;
    contenedor.appendChild(fila);
  });

  totalEl.textContent = `$${total}`;
}

function construirMensajePedido() {
  if (carrito.length === 0) return "";

  let mensaje = "¡Hola! Quiero pedir lo siguiente:%0A%0A";
  let total = 0;

  carrito.forEach((item) => {
    const subtotal = precioLineaItem(item);
    total += subtotal;
    const extrasTexto = item.extras.length
      ? ` (${item.extras.map((e) => e.nombre).join(" + ")})`
      : "";
    mensaje += `• ${item.cantidad}x ${item.nombre}${extrasTexto} - $${subtotal}%0A`;
  });

  mensaje += `%0ATotal: $${total} MXN%0ANos vemos en el Smart Fit Tepozanes.`;
  return mensaje;
}

function enviarPedidoPorWhatsApp() {
  if (carrito.length === 0) return;
  const mensaje = construirMensajePedido();
  window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${mensaje}`, "_blank");
}

// --- ABRIR / CERRAR CARRITO ---
function abrirCarrito() {
  document.getElementById("carritoPanel").classList.add("abierto");
  document.getElementById("carritoOverlay").classList.add("abierto");
  document.getElementById("carritoPanel").setAttribute("aria-hidden", "false");
}

function cerrarCarritoPanel() {
  document.getElementById("carritoPanel").classList.remove("abierto");
  document.getElementById("carritoOverlay").classList.remove("abierto");
  document.getElementById("carritoPanel").setAttribute("aria-hidden", "true");
}

document.getElementById("btnCarrito").addEventListener("click", abrirCarrito);
document
  .getElementById("cerrarCarrito")
  .addEventListener("click", cerrarCarritoPanel);
document
  .getElementById("carritoOverlay")
  .addEventListener("click", cerrarCarritoPanel);
document.getElementById("btnVaciar").addEventListener("click", vaciarCarrito);
document
  .getElementById("btnEnviarPedido")
  .addEventListener("click", enviarPedidoPorWhatsApp);

// Pinta el carrito guardado (si el cliente recarga la página)
renderCarrito();

// --- MENÚ MÓVIL (hamburguesa) ---
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const abierto = navLinks.classList.toggle("abierto");
    navToggle.setAttribute("aria-expanded", abierto ? "true" : "false");
  });

  navLinks.querySelectorAll("a").forEach((enlace) => {
    enlace.addEventListener("click", () => {
      navLinks.classList.remove("abierto");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// --- ANIMACIÓN DE APARICIÓN AL HACER SCROLL ---
const tarjetas = document.querySelectorAll(".tarjeta");

const observador = new IntersectionObserver(
  (entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add("visible");
        observador.unobserve(entrada.target);
      }
    });
  },
  {
    threshold: 0.15,
  },
);

tarjetas.forEach((tarjeta) => {
  observador.observe(tarjeta);
});
