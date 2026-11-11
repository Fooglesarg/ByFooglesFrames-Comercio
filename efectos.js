/* =========================================================
   BYFOOGLES VISUALS — EFECTOS
   Todo liviano: sin librerías externas.
   ========================================================= */

const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const conMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- 1. Partículas conectadas en el hero ---------- */
(function particulas() {
    const canvas = document.querySelector('.hero-particulas');
    if (!canvas || menosMovimiento) return;
    const ctx = canvas.getContext('2d');
    const hero = canvas.parentElement;
    let ancho, alto, puntos = [], visible = true, animando = false;
    const mouse = { x: -9999, y: -9999 };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function preparar() {
        ancho = hero.clientWidth;
        alto = hero.clientHeight;
        canvas.width = ancho * dpr;
        canvas.height = alto * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Menos partículas en pantallas chicas para cuidar la batería
        const cantidad = Math.round(Math.min(90, (ancho * alto) / 16000));
        puntos = Array.from({ length: cantidad }, () => ({
            x: Math.random() * ancho,
            y: Math.random() * alto,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            r: Math.random() * 1.6 + 0.6
        }));
    }

    function dibujar() {
        if (!visible) { animando = false; return; }
        ctx.clearRect(0, 0, ancho, alto);
        const distancia = 130;
        for (let i = 0; i < puntos.length; i++) {
            const p = puntos[i];
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > ancho) p.vx *= -1;
            if (p.y < 0 || p.y > alto) p.vy *= -1;

            // El mouse empuja suavemente las partículas
            const dxm = p.x - mouse.x, dym = p.y - mouse.y;
            const dm = Math.hypot(dxm, dym);
            if (dm < 140) { p.x += dxm / dm * 1.2; p.y += dym / dm * 1.2; }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(140, 235, 255, 0.85)';
            ctx.fill();

            for (let j = i + 1; j < puntos.length; j++) {
                const q = puntos[j];
                const d = Math.hypot(p.x - q.x, p.y - q.y);
                if (d < distancia) {
                    ctx.strokeStyle = `rgba(0, 212, 255, ${0.22 * (1 - d / distancia)})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(dibujar);
    }

    function arrancar() {
        if (!animando && visible) { animando = true; requestAnimationFrame(dibujar); }
    }

    // Solo se anima si el hero está en pantalla y la pestaña está activa
    new IntersectionObserver(([e]) => { visible = e.isIntersecting && !document.hidden; arrancar(); }).observe(hero);
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; arrancar(); });

    hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

    let espera;
    window.addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(preparar, 200); });
    preparar();
    arrancar();
})();

/* ---------- 2. Texto que se escribe solo ---------- */
(function maquinaDeEscribir() {
    const el = document.querySelector('.escribe');
    if (!el || menosMovimiento) return;
    const palabras = el.dataset.palabras.split('|');
    let i = 0, letras = palabras[0].length, borrando = true;

    function paso() {
        const palabra = palabras[i];
        el.textContent = palabra.slice(0, letras);
        if (borrando) {
            if (letras > 0) { letras--; return setTimeout(paso, 35); }
            borrando = false;
            i = (i + 1) % palabras.length;
            return setTimeout(paso, 250);
        }
        if (letras < palabras[i].length) { letras++; el.textContent = palabras[i].slice(0, letras); return setTimeout(paso, 70); }
        borrando = true;
        setTimeout(paso, 2200);
    }
    setTimeout(paso, 2600);
})();

/* ---------- 3. Barra de progreso, navbar y luz del cursor ---------- */
(function scroll() {
    const nav = document.querySelector('.nav');
    const raiz = document.documentElement;
    const proceso = document.querySelector('.proceso');
    let pendiente = false;

    function actualizar() {
        pendiente = false;
        const max = raiz.scrollHeight - innerHeight;
        raiz.style.setProperty('--avance', max > 0 ? scrollY / max : 0);
        nav.classList.toggle('scrolleado', scrollY > 30);

        // Línea del proceso que se completa al bajar
        if (proceso) {
            const r = proceso.getBoundingClientRect();
            const avance = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / r.height));
            proceso.style.setProperty('--linea', avance);
        }
    }
    window.addEventListener('scroll', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(actualizar); } }, { passive: true });
    actualizar();

    if (conMouse && !menosMovimiento) {
        const luz = document.querySelector('.luz-cursor');
        window.addEventListener('pointermove', e => {
            luz.style.setProperty('--cx', e.clientX + 'px');
            luz.style.setProperty('--cy', e.clientY + 'px');
        }, { passive: true });
    }
})();

/* ---------- 4. Aparición al hacer scroll ---------- */
(function apariciones() {
    const elementos = document.querySelectorAll('.aparecer');
    if (!('IntersectionObserver' in window) || menosMovimiento) {
        elementos.forEach(el => el.classList.add('visible'));
        return;
    }
    // Retraso escalonado entre hermanos para efecto "cascada"
    elementos.forEach(el => {
        const hermanos = [...el.parentElement.children].filter(h => h.classList.contains('aparecer'));
        const indice = hermanos.indexOf(el);
        el.style.setProperty('--retraso', Math.min(indice, 6) * 0.07 + 's');
    });
    const obs = new IntersectionObserver(entradas => {
        entradas.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    elementos.forEach(el => obs.observe(el));
})();

/* ---------- 5. Foco de luz en tarjetas, inclinación 3D y botones magnéticos ---------- */
if (conMouse && !menosMovimiento) {
    document.querySelectorAll('.foco').forEach(card => {
        card.addEventListener('pointermove', e => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
            card.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
    });

    document.querySelectorAll('.inclinar').forEach(card => {
        card.addEventListener('pointermove', e => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            card.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
        });
        card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });

    document.querySelectorAll('.magnetico').forEach(btn => {
        btn.addEventListener('pointermove', e => {
            const r = btn.getBoundingClientRect();
            const x = e.clientX - r.left - r.width / 2;
            const y = e.clientY - r.top - r.height / 2;
            btn.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`;
        });
        btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
}

/* ---------- 6. Terminal que se escribe cuando aparece ---------- */
(function terminal() {
    const pre = document.querySelector('.terminal-texto');
    if (!pre) return;
    const lineas = JSON.parse(pre.dataset.lineas);

    function claseDe(linea) {
        if (linea.startsWith('$')) return 'comando';
        if (linea.startsWith('→')) return 'final';
        return '';
    }
    function pintarTodo() {
        pre.innerHTML = '';
        lineas.forEach(l => {
            const s = document.createElement('span');
            s.className = claseDe(l);
            s.textContent = l + '\n';
            pre.appendChild(s);
        });
    }
    if (menosMovimiento || !('IntersectionObserver' in window)) { pintarTodo(); return; }

    // Reservar el alto final para que la página no "salte"
    pintarTodo();
    pre.style.minHeight = pre.offsetHeight + 'px';
    pre.innerHTML = '';

    function escribir() {
        let n = 0, c = 0, span = null;
        const bloque = document.createElement('span');
        bloque.className = 'bloque';
        pre.appendChild(bloque);
        (function tic() {
            if (n >= lineas.length) return;
            const linea = lineas[n];
            if (!span) {
                span = document.createElement('span');
                span.className = claseDe(linea);
                pre.insertBefore(span, bloque);
            }
            const esComando = linea.startsWith('$');
            if (esComando) {
                span.textContent = linea.slice(0, ++c);
                if (c < linea.length) return setTimeout(tic, 38);
            } else {
                span.textContent = linea;
            }
            span.textContent += '\n';
            n++; c = 0; span = null;
            setTimeout(tic, esComando ? 500 : 320);
        })();
    }
    const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { escribir(); obs.disconnect(); }
    }, { threshold: 0.4 });
    obs.observe(pre);
})();

/* ---------- 7. Menú de celular ---------- */
const navBoton = document.querySelector('.nav-boton');
const navLinks = document.getElementById('menu');
function cerrarMenu() {
    navLinks.classList.remove('abierto');
    navBoton.setAttribute('aria-expanded', 'false');
    navBoton.setAttribute('aria-label', 'Abrir menú');
}
navBoton.addEventListener('click', () => {
    const abierto = navLinks.classList.toggle('abierto');
    navBoton.setAttribute('aria-expanded', String(abierto));
    navBoton.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', cerrarMenu));
document.addEventListener('click', e => { if (!e.target.closest('.nav')) cerrarMenu(); });

/* Resalta en el menú la sección que se está viendo */
(function seccionActiva() {
    const enlaces = [...navLinks.querySelectorAll('a[href^="#"]:not(.nav-cta)')];
    const obs = new IntersectionObserver(entradas => {
        entradas.forEach(e => {
            if (!e.isIntersecting) return;
            enlaces.forEach(a => a.classList.toggle('activo', a.getAttribute('href') === '#' + e.target.id));
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    enlaces.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) obs.observe(s); });
})();

/* ---------- 8. Pestañas de preguntas frecuentes ---------- */
(function pestanas() {
    const botones = document.querySelectorAll('.pestana');
    const indicador = document.querySelector('.pestana-indicador');
    function moverIndicador(btn) {
        indicador.style.setProperty('--ind-x', btn.offsetLeft + 'px');
        indicador.style.setProperty('--ind-w', btn.offsetWidth + 'px');
    }
    botones.forEach(btn => btn.addEventListener('click', () => {
        botones.forEach(b => {
            const activo = b === btn;
            b.classList.toggle('activa', activo);
            b.setAttribute('aria-selected', String(activo));
            document.getElementById(b.getAttribute('aria-controls')).hidden = !activo;
        });
        moverIndicador(btn);
    }));
    const inicial = document.querySelector('.pestana.activa');
    moverIndicador(inicial);
    // Recalcular cuando cargan las tipografías o cambia el tamaño
    document.fonts && document.fonts.ready.then(() => moverIndicador(document.querySelector('.pestana.activa')));
    window.addEventListener('resize', () => moverIndicador(document.querySelector('.pestana.activa')));
})();

/* ---------- 9. Visor de fotos con flechas, teclado y deslizar ---------- */
(function visor() {
    const visor = document.querySelector('.visor');
    const img = visor.querySelector('.visor-img');
    const contador = visor.querySelector('.visor-contador');
    const fotos = [...document.querySelectorAll('.galeria img, .proyecto-capturas img')];
    let actual = 0;

    function mostrar(i) {
        actual = (i + fotos.length) % fotos.length;
        const f = fotos[actual];
        img.src = f.dataset.grande || f.src;   // la versión grande se descarga solo al abrirla
        img.alt = f.alt;
        contador.textContent = `${actual + 1} / ${fotos.length}`;
        img.style.animation = 'none'; img.offsetHeight; img.style.animation = '';
    }
    function abrir(i) { mostrar(i); visor.hidden = false; document.body.style.overflow = 'hidden'; }
    function cerrar() { visor.hidden = true; document.body.style.overflow = ''; }

    fotos.forEach((f, i) => {
        f.addEventListener('click', () => abrir(i));
        // También se abren con el teclado (Tab + Enter)
        f.tabIndex = 0;
        f.setAttribute('role', 'button');
        f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(i); } });
    });
    visor.querySelector('.visor-cerrar').addEventListener('click', cerrar);
    visor.querySelector('.anterior').addEventListener('click', () => mostrar(actual - 1));
    visor.querySelector('.siguiente').addEventListener('click', () => mostrar(actual + 1));
    visor.addEventListener('click', e => { if (e.target === visor) cerrar(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { cerrar(); cerrarMenu(); }
        if (visor.hidden) return;
        if (e.key === 'ArrowLeft') mostrar(actual - 1);
        if (e.key === 'ArrowRight') mostrar(actual + 1);
    });
    let inicioX = null;
    visor.addEventListener('touchstart', e => { inicioX = e.touches[0].clientX; }, { passive: true });
    visor.addEventListener('touchend', e => {
        if (inicioX === null) return;
        const dx = e.changedTouches[0].clientX - inicioX;
        if (Math.abs(dx) > 50) mostrar(actual + (dx < 0 ? 1 : -1));
        inicioX = null;
    });
})();
