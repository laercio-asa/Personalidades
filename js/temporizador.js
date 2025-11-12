let segundos = 0;

function formatarTempo(segundos) {
    const min = Math.floor(segundos / 60);
    const sec = segundos % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function atualizarTempo() {
    segundos++;
    document.getElementById("tempo").textContent = formatarTempo(segundos);
}

// Inicia o cronômetro automaticamente
