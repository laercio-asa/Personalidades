let personalidades;
let equipe;
let opcoes;
let state;
let erradas = 0;
const cartas = 15;
let jogador;
let computador

fetch('./js/personagens.json')
    .then(response => response.json())
    .then(data => personalidades = data)
    .then(() => iniciar());

function iniciar() {
    const selecionados = sortearSemRepeticao(personalidades, (cartas * 2));
    equipe = sortearSemRepeticao(selecionados, cartas);
    opcoes = selecionados.map(item => item.nome);

    jogador = equipe;
    computador = selecionados.filter(item => !jogador.includes(item));
    console.log("Jogador:", jogador);
    console.log("Computador:", computador);

    state = {
        points: 0,
        total: equipe.length,
        placed: new Map(), // photoId -> name
    };

    renderPhotos();
    renderOptions();
    updateScore();

    posicao();

    popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
    popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))
}

function posicao() {
    const margem = document.getElementById("menu").offsetHeight;
    document.getElementById("photos").style.marginTop = `${margem}px`;
}

function sortearSemRepeticao(array, quantidade = cartas) {
    // copia o array original para não modificar
    const copia = [...array];

    // embaralha usando Fisher–Yates
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }

    // retorna os "quantidade" primeiros itens
    return copia.slice(0, quantidade);
}


// ============ Utilidades ============
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
//const shuffle = arr => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
const shuffle = arr => arr.sort();

// ======= Render =======
function renderPhotos() {
    const container = $('#photos');
    container.innerHTML = '';
    equipe.forEach((p, idx) => {
        const card = document.createElement('article');
        card.className = 'card border-0';
        card.setAttribute('data-aos', 'flip-left');
        card.innerHTML = `
          <div class="badge2" tabindex="0" data-bs-custom-class="custom-popover" data-bs-trigger="focus" data-bs-toggle="popover" data-bs-title="Dica" data-bs-content="${p.descricao}">🚨</div>
          <div class="imgbox">
            <img src="./img/${p.img}" alt="Foto para adivinhar o personagem ${idx + 1}" onerror="this.alt='Falha ao carregar imagem'; this.style.objectFit='contain'; this.style.background='#0b1220'"/>
            <div class="dropZone" data-photo="${p.id}" aria-label="Solte um nome aqui" role="button" tabindex="0">
              Solte o nome aqui
            </div>
          </div>`;
        container.appendChild(card);
    });
}

function renderOptions() {
    const pool = $('#namePool');
    pool.innerHTML = '';
    shuffle(opcoes).forEach(name => {
        const chip = document.createElement('button');
        chip.className = 'chip';
        chip.type = 'button';
        chip.textContent = name;
        chip.setAttribute('draggable', 'true');
        chip.dataset.name = name;
        pool.appendChild(chip);
    });
    attachDragEvents();
}

function updateScore() {
    $('#points').textContent = state.points;
    $('#total').textContent = state.total;
}

// ======= Drag & Drop =======
let dragged = null;

function attachDragEvents() {
    $$('.chip').forEach(chip => {
        chip.addEventListener('dragstart', e => {
            if (chip.classList.contains('locked')) { e.preventDefault(); return; }
            dragged = chip;
            chip.classList.add('dragging');
            e.dataTransfer.setData('text/plain', chip.dataset.name);
            e.dataTransfer.effectAllowed = 'move';
        });
        chip.addEventListener('dragend', () => {
            chip.classList.remove('dragging');
            dragged = null;
        });
    });

    $$('.dropZone').forEach(zone => {
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('hover'); e.dataTransfer.dropEffect = 'move'; });
        zone.addEventListener('dragleave', () => zone.classList.remove('hover'));
        zone.addEventListener('drop', e => {
            e.preventDefault(); zone.classList.remove('hover');
            if (!dragged) return;
            const name = dragged.dataset.name;
            placeNameOnPhoto(zone, name, dragged);
        });

        // Acessibilidade: permitir "soltar" com Enter/Espaço usando o chip focado
        zone.addEventListener('keydown', e => {
            if ((e.key === 'Enter' || e.key === ' ') && document.activeElement?.classList.contains('chip')) {
                e.preventDefault();
                const chip = document.activeElement;
                placeNameOnPhoto(zone, chip.dataset.name, chip);
            }
        });
    });

    // Permitir devolver nomes para a pool
    const pool = $('#namePool');
    pool.addEventListener('dragover', e => { e.preventDefault(); });
    pool.addEventListener('drop', e => {
        e.preventDefault();
        const name = e.dataTransfer.getData('text/plain');
        if (!dragged) return;
        pool.appendChild(dragged);
        dragged.classList.remove('locked');
        dragged.removeAttribute('aria-disabled');
        // se estava correto em alguma foto, desmarcar
        const entry = Array.from(state.placed.entries()).find(([, v]) => v === name);
        if (entry) {
            const [photoId] = entry;
            state.placed.delete(photoId);
            const zone = document.querySelector(`.dropZone[data-photo="${photoId}"]`);
            zone.textContent = 'Solte o nome aqui';
            zone.classList.remove('correct', 'wrong');
            recalcPoints();
        }
    });
}

function placeNameOnPhoto(zone, name, chip) {
    const photoId = zone.dataset.photo;
    const photo = equipe.find(p => p.id == photoId);

    const correct = photo.nome == name;

    // Se já havia um nome nessa foto, devolve para a pool
    if (state.placed.has(photoId)) {
        erradas += 1;
        const prevName = state.placed.get(photoId);
        const prevChip = $(`.chip[data-name="${CSS.escape(prevName)}"]`);
        if (prevChip) { $('#namePool').appendChild(prevChip); prevChip.classList.remove('locked'); prevChip.removeAttribute('aria-disabled'); }
    }

    zone.textContent = name;
    zone.classList.remove('correct', 'wrong');
    zone.classList.add(correct ? 'correct' : 'wrong');
    state.placed.set(photoId, name);

    // Trava a ficha se estiver correta; mantém solta se estiver errada
    if (correct) {
        chip.classList.add('locked');
        chip.setAttribute('aria-disabled', 'true');
    }

    recalcPoints();

    // Vitória simples
    if (state.points === state.total) {
        setTimeout(() => {
            alert('🎉 Parabéns! Agora você já conhece todos as Personalidades!\nVamos para a Batalha das Personalidades!');
            document.getElementById("titulo").innerHTML = "🔥 Batalha de Personalidades";
            document.getElementById("names").style.display = "none";
            document.getElementById("photos").style.display = "none";
            document.getElementById("batalha-container").classList.remove("d-none");
            atualizarContador();
            exibirCartasAntes();
        }, 120);
        console.log(`Vitória com ${erradas} tentativas erradas.`);
    }
}

function recalcPoints() {
    state.points = equipe.reduce((acc, p) => acc + (state.placed.get(p.id) === p.nome ? 1 : 0), 0);
    updateScore();
}

// ======= Controles =======
$('#shuffleBtn')?.addEventListener('click', () => {
    renderOptions();
});

$('#resetBtn')?.addEventListener('click', () => {
    state.points = 0; state.placed.clear(); updateScore(); renderPhotos(); renderOptions();
    iniciar();
});

// ======= Inicialização =======
// (function init() {
//     renderPhotos();
//     renderOptions();
//     updateScore();
// })();



var prevScrollpos = window.pageYOffset; // Pega a posição inicial da rolagem

window.onscroll = function () {
    var currentScrollPos = window.pageYOffset; // Pega a posição atual

    if (prevScrollpos > currentScrollPos) {
        // Rolando para cima: mostra a navbar (top: 0)
        document.getElementById("titulo").style.display = "block";
        document.getElementById("controls").style.display = "flex";
    } else {
        // Rolando para baixo: esconde a navbar (top: -[altura da navbar])
        // Substitua '-60px' pela altura real da sua barra de navegação para um melhor efeito
        document.getElementById("titulo").style.display = "none";
        document.getElementById("controls").style.display = "none";
    }

    prevScrollpos = currentScrollPos; // Atualiza a posição anterior para o próximo evento de rolagem
}



// batalha das personalidades
function atualizarContador() {
    document.getElementById("contador").innerText =
        `Cartas - Você: ${jogador.length} | Computador: ${computador.length}`;
}

function exibirCartasAntes() {
    let cartaJogador = jogador[0];
    let cartaComputador = computador[0];

    document.getElementById("carta-jogador").innerHTML = `
        <div class="card h-100 bg-black border border-primary text-white" data-aos="flip-left">
            <h3 class="px-2 bg-primary pb-2">${cartaJogador.nome}</h3>
            <img src="./img/${cartaJogador.img || ''}" class="pt-2 card-img-top" alt="...">
            <div class="card-body">
                <h5 class="card-title bg-primary py-2 px-2">🎯 ${cartaJogador.area}</h5>
                <p class="card-text my-4 mx-2">${cartaJogador.descricao}</p>
                <ol class="list-group list-group-flush">
                <li class="list-group-item list-group-item-black d-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto">
                    <div class="fw-bold h5">🧠 Inteligência:</div>
                    </div>
                    <span class="badge text-bg-primary rounded-pill" style="font-size: 1em;">${cartaJogador.inteligencia}</span>
                </li>
                <li class="list-group-item list-group-item-black d-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto">
                    <div class="fw-bold h5">💬 Carisma:</div>
                    </div>
                    <span class="badge text-bg-primary rounded-pill" style="font-size: 1em;">${cartaJogador.carisma}</span>
                </li>
                <li class="list-group-item list-group-item-black d-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto">
                    <div class="fw-bold h5">🔥 Coragem:</div>
                    </div>
                    <span class="badge text-bg-primary rounded-pill" style="font-size: 1em;">${cartaJogador.coragem}</span>
                </li>
                </ol>
            </div>
        </div>
      `;

    document.getElementById("carta-computador").innerHTML = `
        <div class="card h-100 bg-black border border-primary text-white" data-aos="flip-left">
            <h3 class="px-2 bg-primary pb-2">${cartaComputador.nome}</h3>
            <img src="./img/${cartaComputador.img || ''}" class="pt-2 card-img-top" alt="...">
            <div class="card-body">
                <h5 class="card-title bg-primary py-2 px-2">🎯 ${cartaComputador.area}</h5>
                <p class="card-text my-4 mx-2">${cartaComputador.descricao}</p>
                <ol class="list-group list-group-flush">
                <li class="list-group-item list-group-item-black d-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto">
                    <div class="fw-bold h5">🧠 Inteligência:</div>
                    </div>
                    <span class="badge text-bg-primary rounded-pill" style="font-size: 1em;">?</span>
                </li>
                <li class="list-group-item list-group-item-black d-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto">
                    <div class="fw-bold h5">💬 Carisma:</div>
                    </div>
                    <span class="badge text-bg-primary rounded-pill" style="font-size: 1em;">?</span>
                </li>
                <li class="list-group-item list-group-item-black d-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto">
                    <div class="fw-bold h5">🔥 Coragem:</div>
                    </div>
                    <span class="badge text-bg-primary rounded-pill" style="font-size: 1em;">?</span>
                </li>
                </ol>
            </div>
        </div>
  `;

}

function batalhar(caracteristica) {
    let cartaJogador = jogador[0];
    let cartaComputador = computador[0];
    let valorJ = cartaJogador[caracteristica];
    let valorC = cartaComputador[caracteristica];
    let resultado = "";

    // Mostra agora as duas cartas completas
    document.getElementById("carta-computador").innerHTML = `
          <img src="./img/${cartaComputador.img || ''}" alt="Imagem">
          <h2>${cartaComputador.nome}</h2>
          <p><strong>Área:</strong> ${cartaComputador.area}</p>
          <p>${cartaComputador.descricao}</p>
          <p>🧠 Inteligência: ${cartaComputador.inteligencia}</p>
          <p>💬 Carisma: ${cartaComputador.carisma}</p>
          <p>🔥 Coragem: ${cartaComputador.coragem}</p>
        `;

    if (valorJ > valorC) {
        resultado = `<span class="font-size:2em">🎉<span><br>Você venceu esta rodada!<br>${caracteristica.toUpperCase()}`;
        jogador.push(cartaJogador);
        cor = "#00dd30";
    } else if (valorJ < valorC) {
        resultado = `💀<br>Você perdeu! As cartas foram descartadas.<br>${caracteristica.toUpperCase()}`;
        cor = "#e20000";
        // cartas descartadas
    } else {
        resultado = `⚖️<br>Empate! Ambas as cartas foram descartadas.<br>${caracteristica.toUpperCase()}`;
        cor = "#e20000";
        // descartadas
    }

    jogador.shift();
    computador.shift();

    document.getElementById("resultado").innerHTML = `<h3>${resultado}<h2>`;
    document.getElementById("resultado").style.color = cor;
    document.getElementById("resultado").style.display = "block";
    // document.getElementById("botoes").innerHTML = "";

    setTimeout(proximaRodada, 2500);
}

function proximaRodada() {
    // document.getElementById("resultado").innerHTML = "";
    document.getElementById("resultado").style.display = "none";
    if (jogador.length === 0 || computador.length === 0) {
        atualizarContador();
        let vencedorFinal =
            jogador.length > computador.length ? `<h3>🏆 Você venceu o computador e sobrou(aram) ${jogador.length} carta(s).</h3>` : "<h3>O computador venceu!</h3>";
        document.getElementById("resultado").innerHTML = vencedorFinal;
        document.getElementById("resultado").style.display = "block";
        document.getElementById("resultado").style.color = "#f9c74f";
        // document.getElementById("botoes").innerHTML = "";
        return;
    }

    atualizarContador();
    exibirCartasAntes();
}

