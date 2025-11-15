let personalidades;
let nivelRanking;
let equipe;
let opcoes;
let state;
let erradas = 0;
let cartas = 5;
let jogador;
let computador
let nomeJogador = "";
let nivel = 1;

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

    posicao();
}


// Exemplo simplificado
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let source;
let audioStarted = 0;

async function tocarAudio() {
    url = "./audio/musica.mp3";
    if (audioStarted == 0) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = true;
        source.connect(audioContext.destination);
        source.start();
        audioStarted = 1;
        document.getElementById("iconeAudio").src = "./img/audio.png"
    }
    else if (audioStarted == 1) {
        audioContext.suspend();
        audioStarted = 2;
        document.getElementById("iconeAudio").src = "./img/audio-sem.png"
    }
    else {
        audioContext.resume();
        audioStarted = 1;
        document.getElementById("iconeAudio").src = "./img/audio.png"
    }
}

function mostrarPersonalidades() {
    dica = '';
    document.getElementById("dica").innerHTML = dica;
    document.getElementById("tituloTexto").innerHTML = `<img src="./img/flaticon.png" height="36">  Conheça todas as personalidades!`;
    document.getElementById("score").innerHTML = `Total de personalidades: ${personalidades.length}`;
    equipe = personalidades;
    equipe.sort((a, b) => a.nome.localeCompare(b.nome));;
    renderPhotos(1);
    popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
    popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))
}

function iniciar_jogo(c) {

    tocarAudio();

    dica = 'Dica: você pode trocar um nome arrastando-o outro nome em cima do anterior.';
    document.getElementById("dica").innerHTML = dica;
    setInterval(atualizarTempo, 1000);

    cartas = c;

    if (c == 5) {
        iconeNivel = 'semente.png';
        nivelCartas = 0;
        nivel = 1;
    }
    else if (c == 10) {
        iconeNivel = 'quilombo.png';
        nivelCartas = 2;
        nivel = 2;
    }
    else if (c == 15) {
        iconeNivel = 'baoba.png';
        nivelCartas = 3;
        nivel = 3;
    }
    else if (c == 20) {
        iconeNivel = 'ori.png';
        nivelCartas = 5;
        nivel = 4;
    }
    document.getElementById("score").innerHTML = 'Acertos: <span id="points">0</span>/<span id="total">0</span>';
    document.getElementById("tituloTexto").innerHTML = `acerte os nomes<span class="d-md-inline d-none"> de sua equipe!</span>`;
    nomeJogador = prompt("Deseja informar seu nome?");
    nomeJogador = nomeJogador ? nomeJogador.trim() : "Jogador";

    document.querySelector(".nome-jogador").textContent = nomeJogador + " ";
    document.querySelector(".icone-nivel").src = "./img/" + iconeNivel;

    const selecionados = sortearSemRepeticao(personalidades, ((cartas * 2) + nivelCartas));
    equipe = sortearSemRepeticao(selecionados, cartas);
    opcoes = selecionados.map(item => item.nome);

    jogador = equipe;
    computador = selecionados.filter(item => !jogador.includes(item));

    state = {
        points: 0,
        total: equipe.length,
        placed: new Map(), // photoId -> name
    };

    renderPhotos(0);
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
function renderPhotos(tipo = 0) {
    const container = $('#photos');
    container.innerHTML = '';
    equipe.forEach((p, idx) => {
        const card = document.createElement('article');
        card.className = 'card border-0';
        card.setAttribute('data-aos', 'flip-left');
        const raridade = p.raridade == "raro" ? 'border border-5 border-warning' : '';
        if (tipo == 1) {
            area = `${p.area}`;
            zone = `<div class="dropZone correct" data-photo="${p.id}" role="button" tabindex="0">
              ${p.nome}
            </div>`;
        } else {
            area = "Dica";
            zone = `<div class="dropZone" data-photo="${p.id}" aria-label="Solte um nome aqui" role="button" tabindex="0">
              Solte o nome aqui
            </div>`;
        };
        card.innerHTML = `
          <div class="badge2" tabindex="0" data-bs-custom-class="custom-popover" data-bs-trigger="focus" data-bs-toggle="popover" data-bs-title="${area}" data-bs-content="${p.descricao}">🚨</div>
          <div class="imgbox">
            <img class="${raridade}" src="./img/${p.img}" alt="Foto para adivinhar o personagem ${idx + 1}" onerror="this.alt='Falha ao carregar imagem'; this.style.objectFit='contain'; this.style.background='#0b1220'"/>
            ${zone}
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
    state.points = 0; state.placed.clear(); updateScore(); renderPhotos(0); renderOptions();
    iniciar();
});



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
            <div class="col-md mb-1 col-8 text-primary pt-2 h4 text-end">${nomeJogador.toUpperCase()}</div>
            <div class="col-auto mb-0 h3 fw-bold py-1 px-4 mx-0 bg-primary rounded">${jogador.length}</div>
            <div class="col-md-auto mb-1 d-md-flex d-none h4 pt-1">vs</div>
            <div class="col-auto mb-0 h3 fw-bold py-1 px-4 mx-0 bg-primary rounded">${computador.length}</div>
            <div class="col-md mb-1 col-8 ms-auto text-success pt-2 h4 text-start">COMPUTADOR</div>
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
                <h6 class="text-center p-1 mb-0 text-primary fw-bold">SUA CARTA!</h6>
                <div class="col-6 p-0 m-0">
                    <h4 class="text-center bg-primary p-2 mb-0">${cartaJogador.nome}</h4>
                    <div class="img-batalha" style="
                        background-image: url(./img/${cartaJogador.img || ''});
                    "></div>
                </div>
                <div class="col-6 col-sm-12 d-sm-none d-block p-0 m-0">
                    <h6 class="text-center p-1 mb-0 text-success fw-bold">Computador!</h6>
                    <h4 class="text-center bg-success p-2 mb-0">${cartaComputador.nome}</h4>
                    <div class="badge2"><a href="#carta-computador">🚨</a></div>
                    
                    <div class="img-batalha" style="
                        background-image: url(./img/${cartaComputador.img || ''});
                    "></div>
                </div>
                <div class="col-12 col-sm-6 p-2 m-0">
                    <h6 class="card-title bg-primary p-1">🎯 ${cartaJogador.area}</h6>
                    <p class="card-text p-2" id="desc-jogador">${cartaJogador.descricao}</p>
                </div
            </div>
            <div class="card-body p-1">
                <ol class="list-group list-group-flush">
                 <li class="list-group-item list-group-item-black">Escolha uma das caracteristicas de sua Personalidade
                 </li>
                <li class="list-group-item list-group-item-black">
                    <div class="ms-2 me-auto">
                    <div class="fw-bold" ><button id="btn-inteligencia" class="btn btn-warning btn-escolha w-75 rounded-pill d-flex justify-content-between align-items-start"
                    onclick="batalhar('inteligencia')">🧠 Inteligência <span id="inteligencia" class="badge text-bg-primary rounded" style="font-size: 1rem;">${cartaJogador.inteligencia}</span></button></div>
                    </div>
                    
                </li>
                <li class="list-group-item list-group-item-black">
                    <div class="ms-2 me-auto">
                    <div class="fw-bold" ><button id="btn-carisma" class="btn btn-warning btn-escolha w-75 rounded-pill d-flex justify-content-between align-items-start" 
                    onclick="batalhar('carisma')">💬 Carisma <span id="carisma" class="badge text-bg-primary rounded" style="font-size: 1rem;">${cartaJogador.carisma}</span></button></div>
                    </div>
                    
                </li>
                <li class="list-group-item list-group-item-black">
                    <div class="ms-2 me-auto">
                    <div class="fw-bold"><button id="btn-coragem" class="btn btn-warning btn-escolha w-75 rounded-pill d-flex justify-content-between align-items-start" 
                    onclick="batalhar('coragem')">🔥 Coragem <span id="coragem" class="badge text-bg-primary rounded" style="font-size: 1rem;">${cartaJogador.coragem}</span></button></div>
                    </div>
                </li>
                </ol>
            </div>
        </div>
    `;

    $raro = cartaComputador.raridade == "raro" ? 'border border-5 border-warning' : 'border border-success';
    document.getElementById("carta-computador").innerHTML = `
        <div class="card h-100 bg-black ${$raro} text-white" data-aos="flip-left" data-aos-offset="0">
            <div class="row p-0 m-0">
                <h6 class="text-center p-1 mb-0 text-success fw-bold">CARTA COMPUTADOR!</h6>
                <div class="col-6 p-0 m-0">
                    <h4 class="text-center bg-success p-2 mb-0">${cartaComputador.nome}</h4>
                    <div style="
                        height: 180px;
                        background-image: url(./img/${cartaComputador.img || ''});
                        background-position: center;
                        background-size: contain;
                    "></div>
                </div>
                <div class="col-12 col-sm-6 p-2 m-0">
                    <h6 class="card-title bg-success p-1">🎯 ${cartaComputador.area}</h6>
                    <p class="card-text p-2" id="desc-computador">${cartaComputador.descricao}</p>
                </div>
            </div>
            <div class="card-body p-1">
                <ol class="list-group list-group-flush">
                 <li class="list-group-item list-group-item-black">&nbsp;
                 </li>
                <li class="list-group-item list-group-item-black d-flex justify-content-between align-items-start pb-2 pt-3">
                    <div class="ms-2 me-auto">
                    <div class="fw-bold h5">🧠 Inteligência:</div>
                    </div>
                    <span class="badge text-bg-success rounded" style="font-size: 1em;" id="valor-inteligencia">?</span>
                </li>
                <li class="list-group-item list-group-item-black d-flex justify-content-between align-items-start pb-2 pt-3">
                    <div class="ms-2 me-auto">
                    <div class="fw-bold h5">💬 Carisma:</div>
                    </div>
                    <span class="badge text-bg-success rounded" style="font-size: 1em;" id="valor-carisma">?</span>
                </li>
                <li class="list-group-item list-group-item-black d-flex justify-content-between align-items-start pb-2 pt-3">
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
        <h5 class="text-center mb-1">Qual característica de <span class="text-primary">${cartaJogador.nome}</span> é mais forte que a de <span class="text-success">${cartaComputador.nome}</span>? <small style="font-size:0.8rem">(Segundo o ChatGPT.)</small></h5>
        
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
        resultado = `<img src="./img/vitoria.png" height="100"><br>Você venceu esta rodada!`;
        jogador.push(cartaJogador, cartaComputador);
        cor = "#fcec12ff";
    } else if (valorJ < valorC) {
        resultado = `<img src="./img/derrota.png" height="100"><br>Você perdeu!`;
        computador.push(cartaJogador, cartaComputador);
        cor = "#8606dbff";
        // cartas descartadas
    } else {
        resultado = `<img src="./img/empate.png" height="100"><br>Empate!<br>Ambas as cartas foram descartadas.`;
        cor = "#ffc011ff";
    }

    jogador.shift();
    computador.shift();

    document.getElementById("resultado").innerHTML = `<h2>${resultado}</h2>`;
    document.getElementById("resultado").style.color = cor;

    var myModal = new bootstrap.Modal(document.getElementById('resultadoModal'), {});
    myModal.show();


    // document.getElementById("botoes").innerHTML = "";
    document.getElementById("progresso").scrollIntoView();
    atualizarContador();
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
    dica = 'Escolha a melhor caracteristica de seu personagem para vencer a batalha de trunfo!.';
    document.getElementById("dica").innerHTML = dica;
    document.getElementById("progresso").scrollIntoView();
    var myToastEl = document.getElementById('liveToast');

    var myToast = new bootstrap.Toast(myToastEl);

    myToast.show();

}

function proximaRodada() {
    // document.getElementById("resultado").innerHTML = "";
    if (jogador.length === 0 || computador.length === 0) {
        atualizarContador();

        const min = Math.floor(segundos / 60);
        const sec = segundos % 60;

        if (nomeJogador == "Jogador" || nomeJogador == "") {
            nomeJogador = prompt("Parabéns, gostaria de informar o seu nome?");
        }
        if (nomeJogador.trim() == "") { nomeJogador = "Jogador"; }

        fetch("https://feirapretaeducac1.websiteseguro.com/php/ranking.php?tempo=" + segundos + "&personalidade=" + (cartas - erradas) + "&cartas=" + jogador.length + "&nivel=" + nivel + "&nome=" + nomeJogador.replaceAll(" ", "%20"))
            .then(response => response.json())

        let vencedorFinal =
            jogador.length == computador.length ? `<span style="color:#ffc011ff;">Empatou, os dois ganharam!</span>` : (jogador.length > computador.length ? `<span style="color:#516bffff;"><img src="./img/ganhou.png" height="100"><br>Você venceu o computador!</span>` : `<span style="color:#59fc39ff;"><img src="./img/perdeu.png" height="100"><br>O computador venceu!</span>`);

        let resultadoFinal = `
            <ol class="list-group list-group-numbered">
                <li class="list-group-item d-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto">
                    <div class="fw-bold">Tempo Total</div>
                    </div>
                    <span class="tempo">${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto">
                    <div class="fw-bold">Acerto de Personalidades</div>
                    </div>
                    <span class="badge text-bg-primary rounded-pill" style="font-size:1rem">${cartas - erradas}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto">
                    <div class="fw-bold">Cartas na mão</div>
                    </div>
                    <span class="badge text-bg-primary rounded-pill" style="font-size:1rem">${jogador.length}</span>
                </li>
                </ol>
        `;

        document.getElementById("resultadoFinal").innerHTML = `<h2>${vencedorFinal}</h2>${resultadoFinal}`;
        document.getElementById("resultadoFinal").style.display = "block";
        document.getElementById("resultadoFinal").style.color = "#f9c74f";
        document.getElementById("resultadoFinal").style.color = "#f9c74f";
        document.getElementById("pergunta").classList.add("d-none");
        document.getElementById("carta-jogador").classList.add("d-none");
        document.getElementById("carta-computador").classList.add("d-none");

        var myModal = new bootstrap.Modal(document.getElementById('finalModal'), {});
        myModal.show();

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

function mostrarRanking(tipo) {
    fetch("https://feirapretaeducac1.websiteseguro.com/php/posicao.php")
        .then(response => response.json())
        .then(data => nivelRanking = data)
        .then(() => ranking(tipo));
}

function ranking(tipo) {
    nivelRanking.forEach((p, id) => {
        document.getElementById("nivel-" + id).innerHTML = p[0];
    });
    mostrarBtn('ranking', tipo)
}


function mostrarBtn(botao, tipo) {
    if (tipo == 2) {
        document.getElementById("btn-" + botao).setAttribute('data-bs-toggle', "modal");
        document.getElementById("btn-" + botao).setAttribute('data-bs-target', `#inicialModal`);
        document.getElementById("btn-" + botao).removeAttribute('data-bs-dismiss');
    }
    else {
        document.getElementById("btn-" + botao).removeAttribute('data-bs-toggle');
        document.getElementById("btn-" + botao).removeAttribute('data-bs-target');
        document.getElementById("btn-" + botao).setAttribute('data-bs-dismiss', "modal");
    }
}