let personalidades;
let equipe;
let opcoes;
let state;
let erradas = 0;
let cartas = 5;
let jogador;
let computador

fetch('./js/personagens.json')
    .then(response => response.json())
    .then(data => personalidades = data)
    .then(() => iniciar());

function iniciar() {

    var myModal = new bootstrap.Modal(document.getElementById('inicialModal'), {
        // Opções podem ser configuradas aqui, por exemplo:
        // keyboard: false
    });

    // 2. Chame o método show() para abrir o modal
    myModal.show();

    document.getElementById("nome-jogador").focus();

    posicao();
}

function iniciar_jogo(c) {
    cartas = c;
    const selecionados = sortearSemRepeticao(personalidades, (cartas * 2));
    equipe = sortearSemRepeticao(selecionados, cartas);
    opcoes = selecionados.map(item => item.nome);

    jogador = equipe;
    computador = selecionados.filter(item => !jogador.includes(item));

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
    document.getElementById("board").style.marginTop = `${margem}px`;
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
        const raridade = p.raridade == "raro" ? 'border border-5 border-warning' : '';
        card.innerHTML = `
          <div class="badge2" tabindex="0" data-bs-custom-class="custom-popover" data-bs-trigger="focus" data-bs-toggle="popover" data-bs-title="Dica" data-bs-content="${p.descricao}">🚨</div>
          <div class="imgbox">
            <img class="${raridade}" src="./img/${p.img}" alt="Foto para adivinhar o personagem ${idx + 1}" onerror="this.alt='Falha ao carregar imagem'; this.style.objectFit='contain'; this.style.background='#0b1220'"/>
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

    if (zone.classList.contains('correct')) {
        return; // já está correto ali
    }

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
        totalAcerto = cartas - erradas;
        if (totalAcerto == cartas) {
            document.getElementById("texto-modal").innerHTML = `🤗 Você acertou todas as personalidades.`;
        }
        else if (totalAcerto > 0) {
            document.getElementById("texto-modal").innerHTML = `😀 Você acertou de primeira ${totalAcerto} personalidade(s).`;
        }
        else {
            document.getElementById("texto-modal").innerHTML = `😢 Você não acertou nenhuma personalidades de primeira!`;
        }

        var myModal = new bootstrap.Modal(document.getElementById('staticBackdrop'), {
            // Opções podem ser configuradas aqui, por exemplo:
            // keyboard: false
        });

        // 2. Chame o método show() para abrir o modal
        myModal.show();
        /*
                setTimeout(() => {
                    //alert('🎉 Parabéns! Agora você já conhece todos as Personalidades!\nVamos para a Batalha das Personalidades!');            
                    document.getElementById("titulo").innerHTML = "🔥 Batalha de Personalidades";
                    document.getElementById("names").style.display = "none";
                    document.getElementById("board").style.display = "none";
                    document.getElementById("batalha-container").classList.remove("d-none");
                    atualizarContador();
                    exibirCartasAntes();
        
                }, 120);
                */
        //console.log(`Vitória com ${erradas} tentativas erradas.`);
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

    // if (prevScrollpos > currentScrollPos) {
    if (currentScrollPos < 20) {
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
    document.getElementById("contador").innerHTML =
        `
        <div class="row d-md-flex d-none">
            <div class="col-auto h2 fw-bold py-2 px-4 ms-5 bg-primary rounded-pill">${jogador.length}</div>
            <div class="col-md col-8 text-primary pt-3 h3  text-start">👤 você</div>
            <div class="col-md-auto d-md-flex d-none h3 pt-3">x</div>
            <div class="col-md col-8 ms-auto text-success pt-3 h3 text-end">computador 💻</div>
            <div class="col-auto h2 fw-bold py-2 px-4 me-5 bg-primary rounded-pill">${computador.length}</div>
        </div>
        `;
    document.getElementById("valor-jogador").innerHTML = jogador.length;
    document.getElementById("valor-computador").innerHTML = computador.length;
}

function exibirCartasAntes() {
    let cartaJogador = jogador[0];
    let cartaComputador = computador[0];

    $raro = cartaJogador.raridade == "raro" ? 'border border-5 border-warning' : 'border border-primary';
    document.getElementById("carta-jogador").innerHTML = `
        <div class="card h-100 bg-black ${$raro} text-white" data-aos="flip-left" data-aos-offset="0">
            <div class="row p-0 m-0">
                <div class="col-6 col-md-12 p-0 m-0">
                    <h6 class="text-center p-1 mb-0 text-primary fw-bold">SUA CARTA!</h6>
                    <h4 class="text-center bg-primary p-2 mb-0">${cartaJogador.nome}</h4>
                    <div class="img-batalha" style="
                        background-image: url(./img/${cartaJogador.img || ''});
                    "></div>
                </div>
                <div class="col-6 col-md-12 d-md-none d-block p-0 m-0">
                    <h6 class="text-center p-1 mb-0 text-success fw-bold">Computador!</h6>
                    <h4 class="text-center bg-success p-2 mb-0">${cartaComputador.nome}</h4>
                    <div class="badge2" tabindex="0" data-bs-custom-class="custom-popover" data-bs-trigger="focus" data-bs-toggle="popover" data-bs-title="Dica" data-bs-content="${cartaComputador.descricao}">🚨</div>
                    
                    <div class="img-batalha" style="
                        background-image: url(./img/${cartaComputador.img || ''});
                    "></div>
                </div>
            </div>
            <div class="card-body p-1">
                <h5 class="card-title bg-primary p-1">🎯 ${cartaJogador.area}</h5>
                <p class="card-text p-2" id="desc-jogador">${cartaJogador.descricao}</p>
                <ol class="list-group list-group-flush">
                <li class="list-group-item list-group-item-black">
                    <div class="ms-2 me-auto">
                    <div class="fw-bold" ><button id="btn-inteligencia" class="btn btn-warning w-100 btn-escolha rounded-pill w-100 d-flex justify-content-between align-items-start"
                    onclick="batalhar('inteligencia')">🧠 Inteligência <span id="inteligencia" class="badge text-bg-primary rounded" style="font-size: 1em;">${cartaJogador.inteligencia}</span></button></div>
                    </div>
                    
                </li>
                <li class="list-group-item list-group-item-black">
                    <div class="ms-2 me-auto">
                    <div class="fw-bold" ><button id="btn-carisma" class="btn btn-warning w-100 btn-escolha rounded-pill w-100 d-flex justify-content-between align-items-start" 
                    onclick="batalhar('carisma')">💬 Carisma <span id="carisma" class="badge text-bg-primary rounded" style="font-size: 1em;">${cartaJogador.carisma}</span></button></div>
                    </div>
                    
                </li>
                <li class="list-group-item list-group-item-black">
                    <div class="ms-2 me-auto">
                    <div class="fw-bold"><button id="btn-coragem" class="btn btn-warning w-100 btn-escolha rounded-pill w-100 d-flex justify-content-between align-items-start" 
                    onclick="batalhar('coragem')">🔥 Coragem <span id="coragem" class="badge text-bg-primary rounded" style="font-size: 1em; margin-top:5px;">${cartaJogador.coragem}</span></button></div>
                    </div>
                </li>
                </ol>
            </div>
        </div>
    `;

    $raro = cartaComputador.raridade == "raro" ? 'border border-5 border-warning' : 'border border-success';
    document.getElementById("carta-computador").innerHTML = `
        <div class="card h-100 bg-black ${$raro} text-white" data-aos="flip-left" data-aos-offset="0">
            <h6 class="text-center p-1 mb-0 text-success fw-bold">CARTA COMPUTADOR!</h6>
            <h4 class="text-center bg-success p-2 mb-0">${cartaComputador.nome}</h4>
            <div style="
                height: 180px;
                background-image: url(./img/${cartaComputador.img || ''});
                background-position: center;
                background-size: contain;
            "></div>
            <div class="card-body p-1">
                <h5 class="card-title bg-success p-1">🎯 ${cartaComputador.area}</h5>
                <p class="card-text p-2" id="desc-computador">${cartaComputador.descricao}</p>
                <ol class="list-group list-group-flush">
                <li class="list-group-item list-group-item-black d-flex justify-content-between align-items-start py-3">
                    <div class="ms-2 me-auto">
                    <div class="fw-bold h5">🧠 Inteligência:</div>
                    </div>
                    <span class="badge text-bg-success rounded" style="font-size: 1em;" id="valor-inteligencia">?</span>
                </li>
                <li class="list-group-item list-group-item-black d-flex justify-content-between align-items-start pt-3">
                    <div class="ms-2 me-auto">
                    <div class="fw-bold h5">💬 Carisma:</div>
                    </div>
                    <span class="badge text-bg-success rounded" style="font-size: 1em;" id="valor-carisma">?</span>
                </li>
                <li class="list-group-item list-group-item-black d-flex justify-content-between align-items-start py-3">
                    <div class="ms-2 me-auto">
                    <div class="fw-bold h5">🔥 Coragem:</div>
                    </div>
                    <span class="badge text-bg-success rounded" style="font-size: 1em;" id="valor-coragem">?</span>
                </li>
                </ol>
            </div>
        </div>
    `;

    document.getElementById("pergunta").innerHTML = `
        <h2 class="text-center">Qual característica de <span class="text-primary">${cartaJogador.nome}</span> é mais forte que a de <span class="text-success">${cartaComputador.nome}</span>?</h2>
        <small>Segundo o ChatGPT.</small>
    `;

    hj = document.getElementById("desc-jogador").offsetHeight;
    hc = document.getElementById("desc-computador").offsetHeight;
    if (hj > hc) {
        document.getElementById("desc-computador").style.height = hj + "px";
    }
    else {
        document.getElementById("desc-jogador").style.height = hc + "px";
    }

}

function batalhar(caracteristica) {
    let cartaJogador = jogador[0];
    let cartaComputador = computador[0];
    let valorJ = cartaJogador[caracteristica];
    let valorC = cartaComputador[caracteristica];
    let resultado = "";

    document.getElementById("btn-inteligencia").style.backgroundColor = (caracteristica === 'inteligencia') ? "#f9c74f" : "#838383";
    document.getElementById("btn-carisma").style.backgroundColor = (caracteristica === 'carisma') ? "#f9c74f" : "#838383";
    document.getElementById("btn-coragem").style.backgroundColor = (caracteristica === 'coragem') ? "#f9c74f" : "#838383";
    document.getElementById("btn-inteligencia").disabled = true;
    document.getElementById("btn-carisma").disabled = true;
    document.getElementById("btn-coragem").disabled = true;


    // Mostra agora as duas cartas completas
    $raro = cartaComputador.raridade == "raro" ? 'border border-5 border-warning' : 'border border-success';
    document.getElementById("valor-inteligencia").innerHTML = cartaComputador.inteligencia;
    document.getElementById("valor-carisma").innerHTML = cartaComputador.carisma;
    document.getElementById("valor-coragem").innerHTML = cartaComputador.coragem;


    if (valorJ > valorC) {
        resultado = `<span style="font-size:3rem">🎉</span><br>Você venceu esta rodada!`;
        jogador.push(cartaJogador, cartaComputador);
        cor = "#8698fdff";
    } else if (valorJ < valorC) {
        resultado = `<span style="font-size:3rem">💀</span><br>Você perdeu!`;
        computador.push(cartaJogador, cartaComputador);
        cor = "#87fa70ff";
        // cartas descartadas
    } else {
        resultado = `<span style="font-size:3rem">⚖️</span><br>Empate! Ambas as cartas foram descartadas.`;
        cor = "#ffc011ff";
    }

    jogador.shift();
    computador.shift();

    const aguarde = `<div class="d-flex align-items-center mt-4 text-white">
                    <strong role="status">Carregando...</strong>
                    <div class="spinner-border ms-auto" aria-hidden="true"></div>
                    </div>`;
    document.getElementById("resultado").innerHTML = `<h2>${resultado}</h2>${aguarde}`;
    document.getElementById("resultado").style.color = cor;
    document.getElementById("resultado").style.display = "block";

    tamanho = ((document.getElementById("pergunta").offsetWidth - 360) / 2);
    if (tamanho > 0) {
        document.getElementById("resultado").style.marginLeft = `${tamanho}px`;
    }
    // document.getElementById("botoes").innerHTML = "";
    document.getElementById("progresso").scrollIntoView();
    atualizarContador();
    setTimeout(proximaRodada, 4000);
}

function continuar() {
    document.getElementById("titulo").innerHTML = "🔥 Batalha de Personalidades";
    document.getElementById("names").style.display = "none";
    document.getElementById("board").style.display = "none";
    document.getElementById("batalha-container").classList.remove("d-none");
    document.getElementById("photo-personagens").classList.add("d-none");
    document.getElementById("batalha-personagens").classList.remove("d-none");
    atualizarContador();
    exibirCartasAntes();
    document.getElementById("progresso").scrollIntoView();
}

function proximaRodada() {
    // document.getElementById("resultado").innerHTML = "";
    document.getElementById("resultado").style.display = "none";
    if (jogador.length === 0 || computador.length === 0) {
        atualizarContador();
        let vencedorFinal =
            jogador.length == computador.length ? `<span style="color:#ffc011ff;">Empatou, os dois ganharam!</span>` : (jogador.length > computador.length ? `<span style="color:#516bffff;">Você venceu o computador!</span>` : `<span style="color:#59fc39ff;">O computador venceu!</span>`);
        document.getElementById("resultado").innerHTML = `<h2><span style="font-size:3rem">🏆</span><br>${vencedorFinal}</h2>`;
        document.getElementById("resultado").style.display = "block";
        document.getElementById("resultado").style.color = "#f9c74f";
        document.getElementById("resultado").style.color = "#f9c74f";
        document.getElementById("pergunta").classList.add("d-none");
        document.getElementById("carta-jogador").classList.add("d-none");
        document.getElementById("carta-computador").classList.add("d-none");

        // document.getElementById("botoes").innerHTML = "";
        return;
    }

    document.getElementById("btn-inteligencia").style.backgroundColor = "#f9c74f";
    document.getElementById("btn-carisma").style.backgroundColor = "#f9c74f";
    document.getElementById("btn-coragem").style.backgroundColor = "#f9c74f";
    document.getElementById("btn-inteligencia").disabled = false;
    document.getElementById("btn-carisma").disabled = false;
    document.getElementById("btn-coragem").disabled = false;
    exibirCartasAntes();
}

