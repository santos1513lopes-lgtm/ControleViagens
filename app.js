 // --- CONFIGURAÇÃO DO FIREBASE ---
// SUBSTITUA O TRECHO ABAIXO PELO CÓDIGO QUE COPIASTE DO FIREBASE
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO_ID",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "NUMEROS",
    appId: "CODIGO_GRANDE"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- FUNÇÕES DO APLICATIVO ---

async function salvarPassageiro() {
    const nome = document.getElementById('nome').value.toUpperCase();
    const cpf = document.getElementById('cpf').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const data = document.getElementById('data').value;
    const evento = document.getElementById('evento').value;
    const onibus = document.getElementById('onibus').value;

    if (!nome || !valor) {
        alert("Por favor, preencha pelo menos Nome e Valor.");
        return;
    }

    // Verifica lotação (lógica simples: conta quantos já existem nesse ônibus/evento)
    const snapshot = await db.collection("viagens")
        .where("evento", "==", evento)
        .where("onibus", "==", onibus)
        .get();

    if (snapshot.size >= 50) {
        alert(`O Ônibus ${onibus} para o evento ${evento} já atingiu 50 passageiros!`);
        return;
    }

    // Salva no Banco de Dados
    db.collection("viagens").add({
        nome: nome,
        cpf: cpf,
        valor: valor,
        data: data,
        evento: evento,
        onibus: onibus,
        timestamp: firebase.firestore.FieldValue.serverTimestamp() // Data de registro
    }).then(() => {
        alert("Passageiro salvo com sucesso!");
        limparFormulario();
        carregarLista(); // Atualiza a tela
    }).catch((error) => {
        console.error("Erro ao salvar: ", error);
        alert("Erro ao salvar. Verifique o console.");
    });
}

function carregarLista() {
    const divLista = document.getElementById('listaPassageiros');
    divLista.innerHTML = "Carregando...";
    
    let totalDinheiro = 0;
    let totalPessoas = 0;

    // Busca todos os dados e ordena por nome
    db.collection("viagens").orderBy("nome").get().then((querySnapshot) => {
        divLista.innerHTML = ""; // Limpa a lista atual

        querySnapshot.forEach((doc) => {
            const p = doc.data();
            
            // Soma para o financeiro
            totalDinheiro += p.valor;
            totalPessoas += 1;

            // Cria o visual de cada passageiro na lista
            divLista.innerHTML += `
                <div class="item-lista">
                    <strong>${p.nome}</strong> <br>
                    <span class="tag-onibus">Ônibus ${p.onibus}</span> - ${p.evento} <br>
                    Pagou: R$ ${p.valor.toFixed(2)} em ${formatarData(p.data)}
                </div>
            `;
        });

        // Atualiza o painel financeiro
        document.getElementById('totalCaixa').innerText = `R$ ${totalDinheiro.toFixed(2)}`;
        document.getElementById('totalPassageiros').innerText = totalPessoas;
    });
}

function limparFormulario() {
    document.getElementById('nome').value = '';
    document.getElementById('cpf').value = '';
    document.getElementById('valor').value = '';
}

function formatarData(dataAmericana) {
    if(!dataAmericana) return "--/--";
    const partes = dataAmericana.split('-');
    return `${partes[2]}/${partes[1]}`;
}

// Carrega a lista assim que abre o app
carregarLista();