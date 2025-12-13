 // --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyDfPayKm4sLU2lNdaBuOQzxgPMBmFAd0qk",
    authDomain: "controleviagens-ed5e9.firebaseapp.com",
    projectId: "controleviagens-ed5e9",
    storageBucket: "controleviagens-ed5e9.firebasestorage.app",
    messagingSenderId: "949452854484",
    appId: "1:949452854484:web:1609cb7d237c4985c41741"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// --- LOGIN / LOGOUT ---
auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-screen').style.display = 'block';
        carregarResumoHome(); // Carrega o caixa da Home
    } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('app-screen').style.display = 'none';
    }
});

function fazerLogin() {
    const email = document.getElementById('email-login').value;
    const senha = document.getElementById('senha-login').value;
    auth.signInWithEmailAndPassword(email, senha).catch(erro => alert("Erro: " + erro.message));
}

function fazerLogout() { auth.signOut(); }

// --- NAVEGAÇÃO ---
function mostrarAba(idAba) {
    document.querySelectorAll('.aba').forEach(el => el.classList.remove('ativa'));
    document.querySelectorAll('.btn-nav').forEach(el => el.classList.remove('active'));
    document.getElementById(idAba).classList.add('ativa');
    
    // Se clicou em relatório, carrega a lista padrão
    if(idAba === 'aba-relatorio') carregarRelatorioFiltrado();
    // Se clicou na home, atualiza o caixa
    if(idAba === 'aba-home') carregarResumoHome();
}

function alternarTema() {
    const checkbox = document.getElementById('check-tema');
    document.documentElement.setAttribute('data-theme', checkbox.checked ? 'dark' : 'light');
}

// --- SALVAR PASSAGEIRO ---
async function salvarPassageiro() {
    const nome = document.getElementById('nome').value.toUpperCase();
    const cpf = document.getElementById('cpf').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const data = document.getElementById('data').value;
    const evento = document.getElementById('evento').value;
    const onibus = document.getElementById('onibus').value;

    if (!nome || !valor) return alert("Preencha Nome e Valor!");

    try {
        await db.collection("viagens").add({
            nome, cpf, valor, data, evento, onibus,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("Passageiro Salvo!");
        document.getElementById('nome').value = "";
        document.getElementById('valor').value = "";
        carregarResumoHome(); // Atualiza o caixa
    } catch (e) {
        alert("Erro ao salvar: " + e.message);
    }
}

// --- RESUMO DA TELA INICIAL (CAIXA) ---
function carregarResumoHome() {
    let total = 0;
    let qtd = 0;
    db.collection("viagens").get().then(snap => {
        snap.forEach(doc => {
            total += doc.data().valor;
            qtd++;
        });
        document.getElementById('totalCaixa').innerText = `R$ ${total.toFixed(2)}`;
        document.getElementById('totalPassageiros').innerText = qtd;
    });
}

// --- RELATÓRIO COM FILTROS (LÓGICA NOVA) ---
async function carregarRelatorioFiltrado() {
    const divLista = document.getElementById('listaRelatorio');
    const filtroEvento = document.getElementById('buscaEvento').value;
    const filtroOnibus = document.getElementById('buscaOnibus').value;
    const filtroData = document.getElementById('buscaData').value;

    divLista.innerHTML = "<p style='text-align:center'>Carregando...</p>";

    const snap = await db.collection("viagens").orderBy("nome").get();
    
    let html = "";
    let totalFiltrado = 0;
    let qtdFiltrada = 0;
    
    // Título para impressão
    let tituloPrint = "RELATÓRIO GERAL";
    if(filtroEvento) tituloPrint += ` - ${filtroEvento}`;
    if(filtroOnibus) tituloPrint += ` - Ônibus ${filtroOnibus}`;
    document.getElementById('cabecalho-impresso').innerText = tituloPrint;

    snap.forEach(doc => {
        const p = doc.data();

        // Lógica de Filtro: Se o filtro existe e for diferente, pula
        if (filtroEvento && p.evento !== filtroEvento) return;
        if (filtroOnibus && p.onibus !== filtroOnibus) return;
        if (filtroData && p.data !== filtroData) return;

        totalFiltrado += p.valor;
        qtdFiltrada++;

        html += `
            <div class="item-lista">
                <div>
                    <strong>${qtdFiltrada}. ${p.nome}</strong> <br>
                    <small>CPF: ${p.cpf || '---'}</small> <br>
                    <small style="color:gray">${p.evento} | Bus ${p.onibus} | ${formatarData(p.data)}</small>
                </div>
                <div style="font-weight:bold;">
                    R$ ${p.valor.toFixed(2)}
                </div>
            </div>
        `;
    });

    if(qtdFiltrada === 0) html = "<p style='text-align:center'>Nenhum registro encontrado.</p>";

    divLista.innerHTML = html;
    document.getElementById('resumoQtd').innerText = qtdFiltrada;
    document.getElementById('resumoValor').innerText = `R$ ${totalFiltrado.toFixed(2)}`;
}

function formatarData(dataUS) {
    if(!dataUS) return "--/--";
    const partes = dataUS.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}