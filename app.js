// --- CONFIGURAÇÃO DO FIREBASE (Já preenchida com os dados da sua Imagem 4) ---
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

// --- SISTEMA DE LOGIN ---
auth.onAuthStateChanged((user) => {
    if (user) {
        // Se entrou, esconde login e mostra o app
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-screen').style.display = 'block';
        carregarLista(); 
    } else {
        // Se saiu, mostra login
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('app-screen').style.display = 'none';
    }
});

function fazerLogin() {
    const email = document.getElementById('email-login').value;
    const senha = document.getElementById('senha-login').value;
    
    auth.signInWithEmailAndPassword(email, senha)
        .catch((error) => {
            alert("Erro ao entrar: " + error.message);
        });
}

function fazerLogout() {
    auth.signOut();
}

// --- NAVEGAÇÃO POR ABAS ---
function mostrarAba(idAba) {
    // Esconde todas as abas
    document.querySelectorAll('.aba').forEach(aba => aba.classList.remove('ativa'));
    document.querySelectorAll('.btn-nav').forEach(btn => btn.classList.remove('active'));

    // Mostra a aba clicada
    document.getElementById(idAba).classList.add('ativa');
}

// --- TEMA ESCURO (DARK MODE) ---
function alternarTema() {
    const checkbox = document.getElementById('check-tema');
    if (checkbox.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

// --- FUNÇÕES DO SISTEMA ---
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
        alert("Passageiro salvo!");
        document.getElementById('nome').value = ""; // Limpa campo
        document.getElementById('valor').value = ""; // Limpa campo
        carregarLista();
    } catch (e) {
        alert("Erro ao salvar: " + e.message);
    }
}

function carregarLista() {
    let totalDinheiro = 0;
    let count = 0;
    const divRelatorio = document.getElementById('listaRelatorio');
    
    divRelatorio.innerHTML = "Carregando...";

    db.collection("viagens").orderBy("nome").get().then((snap) => {
        divRelatorio.innerHTML = "";
        snap.forEach(doc => {
            const p = doc.data();
            totalDinheiro += p.valor;
            count++;

            divRelatorio.innerHTML += `
                <div class="item-lista">
                    <strong>${p.nome}</strong> <br>
                    <small>Bus ${p.onibus} | ${p.evento}</small>
                    <span style="float:right; color:green; font-weight:bold;">R$ ${p.valor.toFixed(2)}</span>
                </div>
            `;
        });

        document.getElementById('totalCaixa').innerText = `R$ ${totalDinheiro.toFixed(2)}`;
        document.getElementById('totalPassageiros').innerText = count;
    });
} 
// Atualizacao para o GitHub