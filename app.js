 // --- CONFIGURAÇÃO (SUA CHAVE AQUI) ---
const firebaseConfig = {
    apiKey: "AIzaSyDfPayKm4sLU2lNdaBuOQzxgPMBmFAd0qk",
    authDomain: "controleviagens-ed5e9.firebaseapp.com",
    projectId: "controleviagens-ed5e9",
    storageBucket: "controleviagens-ed5e9.firebasestorage.app",
    messagingSenderId: "949452854484",
    appId: "1:949452854484:web:1609cb7d237c4985c41741"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// --- LOGIN ---
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-screen').style.display = 'block';
        carregarTudo();
    } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('app-screen').style.display = 'none';
    }
});

function fazerLogin() {
    const email = document.getElementById('email-login').value;
    const senha = document.getElementById('senha-login').value;
    auth.signInWithEmailAndPassword(email, senha).catch(e => alert("Erro: " + e.message));
}
function fazerLogout() { auth.signOut(); }

// --- CONTROLE DO MODAL ---
function abrirModal(idEdicao = null) {
    const modal = document.getElementById('modal-form');
    modal.style.display = 'flex';
    
    if (idEdicao) {
        document.getElementById('titulo-modal').innerText = "Editar Passageiro";
    } else {
        document.getElementById('titulo-modal').innerText = "Novo Passageiro";
        limparFormulario();
        // Define data de hoje como padrão
        document.getElementById('data').valueAsDate = new Date();
    }
}

function fecharModal() {
    document.getElementById('modal-form').style.display = 'none';
}

function limparFormulario() {
    document.getElementById('id-passageiro').value = "";
    document.getElementById('nome').value = "";
    document.getElementById('cpf').value = "";
    document.getElementById('valor').value = "";
    document.getElementById('status').value = "Pago";
}

// --- CRUD (SALVAR, EDITAR, EXCLUIR) ---
async function salvarPassageiro() {
    const id = document.getElementById('id-passageiro').value;
    const dados = {
        nome: document.getElementById('nome').value.toUpperCase(),
        cpf: document.getElementById('cpf').value,
        valor: parseFloat(document.getElementById('valor').value),
        status: document.getElementById('status').value, // Novo campo
        data: document.getElementById('data').value,
        evento: document.getElementById('evento').value,
        onibus: document.getElementById('onibus').value,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (!dados.nome || !dados.valor) return alert("Preencha Nome e Valor!");

    try {
        if (id) {
            // Se tem ID, é Edição
            await db.collection("viagens").doc(id).update(dados);
            alert("Atualizado com sucesso!");
        } else {
            // Se não tem ID, é Novo
            await db.collection("viagens").add(dados);
            alert("Cadastrado com sucesso!");
        }
        fecharModal();
        carregarTudo();
    } catch (e) {
        alert("Erro: " + e.message);
    }
}

async function editarPassageiro(id) {
    const doc = await db.collection("viagens").doc(id).get();
    const p = doc.data();
    
    document.getElementById('id-passageiro').value = id;
    document.getElementById('nome').value = p.nome;
    document.getElementById('cpf').value = p.cpf;
    document.getElementById('valor').value = p.valor;
    document.getElementById('status').value = p.status || 'Pago';
    document.getElementById('data').value = p.data;
    document.getElementById('evento').value = p.evento;
    document.getElementById('onibus').value = p.onibus;
    
    abrirModal(id);
}

async function excluirPassageiro(id) {
    if(confirm("Tem certeza que deseja excluir?")) {
        await db.collection("viagens").doc(id).delete();
        carregarTudo();
    }
}

// --- LISTAGEM E RELATÓRIOS ---
function carregarTudo() {
    carregarResumoHome();
    carregarRelatorioFiltrado();
}

async function carregarResumoHome() {
    let total = 0, pendente = 0;
    const divRecentes = document.getElementById('listaRecentes');
    divRecentes.innerHTML = "";

    // Pega os últimos 5 para a Home
    const snap = await db.collection("viagens").orderBy("timestamp", "desc").limit(5).get();
    
    snap.forEach(doc => {
        const p = doc.data();
        divRecentes.innerHTML += montarItemHTML(doc.id, p, false);
    });

    // Calcula Totais Gerais
    const fullSnap = await db.collection("viagens").get();
    fullSnap.forEach(doc => {
        const p = doc.data();
        if(p.status === 'Pago' || !p.status) total += p.valor; // Se não tiver status, conta como pago
        if(p.status === 'Pendente') pendente += p.valor;
    });

    document.getElementById('totalCaixa').innerText = `R$ ${total.toFixed(2)}`;
    document.getElementById('totalPendentes').innerText = `R$ ${pendente.toFixed(2)}`;
}

async function carregarRelatorioFiltrado() {
    const divLista = document.getElementById('listaRelatorio');
    const fEvento = document.getElementById('buscaEvento').value;
    const fOnibus = document.getElementById('buscaOnibus').value;
    const fStatus = document.getElementById('buscaStatus').value;

    divLista.innerHTML = "Carregando...";
    const snap = await db.collection("viagens").orderBy("nome").get();
    
    let html = "";
    let qtd = 0, valorTotal = 0;
    let titulo = "RELATÓRIO";
    if(fEvento) titulo += " - " + fEvento;
    if(fOnibus) titulo += " - Ônibus " + fOnibus;
    document.getElementById('cabecalho-impresso').innerText = titulo;

    snap.forEach(doc => {
        const p = doc.data();
        // Filtros
        if (fEvento && p.evento !== fEvento) return;
        if (fOnibus && p.onibus !== fOnibus) return;
        if (fStatus && (p.status || 'Pago') !== fStatus) return;

        qtd++;
        if(p.status === 'Pago' || !p.status) valorTotal += p.valor;

        html += montarItemHTML(doc.id, p, true);
    });

    divLista.innerHTML = html || "<p>Nenhum registro.</p>";
    document.getElementById('resumoQtd').innerText = qtd;
    document.getElementById('resumoValor').innerText = `R$ ${valorTotal.toFixed(2)}`;
}

// Monta o visual de cada linha
function montarItemHTML(id, p, comBotoes) {
    const statusClass = (p.status === 'Pendente') ? 'pendente' : 'pago';
    const statusTexto = p.status || 'Pago';
    
    // Botões só aparecem se 'comBotoes' for true (na lista completa)
    const botoes = comBotoes ? `
        <div class="acoes-item no-print">
            <i class="material-icons icon-btn" onclick="editarPassageiro('${id}')" style="color:#ffa000">edit</i>
            <i class="material-icons icon-btn" onclick="excluirPassageiro('${id}')" style="color:#d32f2f">delete</i>
        </div>
    ` : '';

    return `
        <div class="item-lista">
            <div>
                <strong>${p.nome}</strong> <span class="tag ${statusClass}">${statusTexto}</span><br>
                <small>${p.evento} | Bus ${p.onibus} | ${formatarData(p.data)}</small>
            </div>
            <div style="text-align:right">
                <strong>R$ ${p.valor.toFixed(2)}</strong>
                ${botoes}
            </div>
        </div>
    `;
}

function formatarData(d) {
    if(!d) return "--/--";
    return d.split('-').reverse().join('/');
}

function mostrarAba(id) {
    document.querySelectorAll('.aba').forEach(e => e.classList.remove('ativa'));
    document.getElementById(id).classList.add('ativa');
    if(id === 'aba-relatorio') carregarRelatorioFiltrado();
}

function alternarTema() {
    const chk = document.getElementById('check-tema');
    document.documentElement.setAttribute('data-theme', chk.checked ? 'dark' : 'light');
}