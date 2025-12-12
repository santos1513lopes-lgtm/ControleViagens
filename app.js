 // --- CONFIGURAÇÃO (COLE SEU CÓDIGO DA IMAGEM AQUI) ---
const firebaseConfig = {
    apiKey: "SUA_API_KEY", // Pegue da imagem Screenshot_4
    authDomain: "controle...",
    projectId: "controle...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
};

// Inicializa
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// --- CONTROLE DE LOGIN ---
auth.onAuthStateChanged((user) => {
    if (user) {
        // Usuário logado
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-screen').style.display = 'block';
        carregarLista(); // Carrega dados ao entrar
    } else {
        // Usuário deslogado
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('app-screen').style.display = 'none';
    }
});

function fazerLogin() {
    const email = document.getElementById('email-login').value;
    const senha = document.getElementById('senha-login').value;
    const msg = document.getElementById('msg-erro');

    auth.signInWithEmailAndPassword(email, senha)
        .catch((error) => {
            msg.style.display = 'block';
            msg.innerText = "Erro: " + error.message;
        });
}

function fazerLogout() {
    auth.signOut();
}

// --- CONTROLE DE ABAS ---
function mostrarAba(idAba) {
    // Esconde todas as abas
    document.querySelectorAll('.aba').forEach(el => el.classList.remove('ativa'));
    document.querySelectorAll('.btn-nav').forEach(el => el.classList.remove('active'));
    
    // Mostra a escolhida
    document.getElementById(idAba).classList.add('ativa');
    
    // Destaca o ícone (simples lógica para achar o botão certo, pode ser melhorada)
    // Aqui apenas removemos o destaque visual anterior
}

// --- TEMA (DARK MODE) ---
function alternarTema() {
    const checkbox = document.getElementById('check-tema');
    if (checkbox.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

// --- FUNÇÕES DO SISTEMA (IGUAIS AS ANTERIORES, COM MELHORIAS) ---

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
        alert("Salvo com sucesso!");
        // Limpar campos
        document.getElementById('nome').value = "";
        document.getElementById('valor').value = "";
        carregarLista();
    } catch (e) {
        alert("Erro ao salvar: " + e.message);
    }
}

function carregarLista() {
    let totalDinheiro = 0;
    let count = 0;
    const divRecentes = document.getElementById('listaRecentes');
    const divRelatorio = document.getElementById('listaPassageiros');
    
    divRecentes.innerHTML = ""; 
    divRelatorio.innerHTML = "";

    db.collection("viagens").orderBy("nome").get().then((snap) => {
        snap.forEach(doc => {
            const p = doc.data();
            totalDinheiro += p.valor;
            count++;

            const htmlItem = `
                <div class="item-lista" style="border-bottom: 1px solid #ccc; padding: 5px;">
                    <strong>${p.nome}</strong> - R$ ${p.valor} <br>
                    <small>${p.evento} (Ônibus ${p.onibus})</small>
                </div>
            `;
            
            // Adiciona a todos no relatório
            divRelatorio.innerHTML += htmlItem;
            
            // Adiciona os 5 primeiros na Home como "Recentes" (simplificado)
            if (count <= 5) divRecentes.innerHTML += htmlItem;
        });

        document.getElementById('totalCaixa').innerText = `R$ ${totalDinheiro.toFixed(2)}`;
        document.getElementById('totalPassageiros').innerText = count;
    });
}