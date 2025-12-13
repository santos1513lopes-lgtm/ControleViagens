 // --- CONFIGURAÇÃO ---
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
let cacheClientes = []; 

// --- FORMATADORES ---
function formatarMoeda(i) {
    let v = i.value.replace(/\D/g, ''); 
    v = (v / 100).toFixed(2) + ''; v = v.replace(".", ","); 
    v = v.replace(/(\d)(\d{3})(\d{3}),/g, "$1.$2.$3,"); v = v.replace(/(\d)(\d{3}),/g, "$1.$2,"); 
    i.value = "R$ " + v;
}
function converterMoedaParaFloat(valorString) {
    if (!valorString) return 0;
    let limpo = valorString.replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
    return parseFloat(limpo);
}
function formatarReais(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// --- LOGIN ---
auth.onAuthStateChanged(user => {
    if (user) { document.getElementById('login-screen').style.display = 'none'; document.getElementById('app-screen').style.display = 'block'; carregarTudo(); } 
    else { document.getElementById('login-screen').style.display = 'flex'; document.getElementById('app-screen').style.display = 'none'; }
});
function fazerLogin() { const email = document.getElementById('email-login').value; const senha = document.getElementById('senha-login').value; auth.signInWithEmailAndPassword(email, senha).catch(e => alert("Erro: " + e.message)); }
function fazerLogout() { auth.signOut(); }
function alternarTema() { const html = document.documentElement; const icon = document.getElementById('icon-tema'); if (html.getAttribute('data-theme') !== 'dark') { html.setAttribute('data-theme', 'dark'); icon.innerText = 'light_mode'; } else { html.setAttribute('data-theme', 'light'); icon.innerText = 'dark_mode'; } }

// --- NAVEGAÇÃO ---
function mostrarAba(id) {
    document.querySelectorAll('.aba').forEach(e => e.classList.remove('ativa'));
    document.querySelectorAll('.btn-nav').forEach(e => e.classList.remove('active'));
    document.getElementById(id).classList.add('ativa');
    const btns = document.querySelectorAll('.btn-nav');
    btns.forEach(btn => { if(btn.getAttribute('onclick') === `mostrarAba('${id}')`) btn.classList.add('active'); });
    if(id === 'aba-relatorio') carregarRelatorioFiltrado();
    if(id === 'aba-clientes') carregarClientesBase();
    if(id === 'aba-despesas') carregarDespesas();
    if(id === 'aba-home') carregarResumoHome();
}

// --- GESTÃO DE DESPESAS (ATUALIZADA) ---
async function salvarDespesa() {
    const idEdicao = document.getElementById('id-despesa-editar').value;
    const desc = document.getElementById('desc-despesa').value.toUpperCase();
    const valorInput = document.getElementById('valor-despesa').value;
    const valorFloat = converterMoedaParaFloat(valorInput);
    const status = document.getElementById('status-despesa').value;

    if (!desc || !valorFloat) return alert("Preencha a descrição e o valor!");

    try {
        if (idEdicao) {
            // EDITAR
            await db.collection("despesas").doc(idEdicao).update({
                descricao: desc,
                valor: valorFloat,
                status: status
            });
            alert("Despesa atualizada!");
        } else {
            // CRIAR NOVA
            await db.collection("despesas").add({
                descricao: desc,
                valor: valorFloat,
                status: status,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert("Despesa registrada!");
        }
        cancelarEdicaoDespesa();
        carregarDespesas();
    } catch (e) { alert("Erro: " + e.message); }
}

async function carregarDespesas() {
    const divLista = document.getElementById('listaDespesas');
    divLista.innerHTML = "Carregando...";
    const snap = await db.collection("despesas").orderBy("timestamp", "desc").get();
    let html = "";
    
    snap.forEach(doc => {
        const d = doc.data();
        const statusClass = d.status === 'Pendente' ? 'pendente' : 'quitado';
        
        // Adicionei o botão de editar (Lápis)
        html += `
            <div class="item-lista item-despesa">
                <div>
                    ${d.descricao} <span class="tag ${statusClass}">${d.status || 'Quitado'}</span>
                </div>
                <div style="text-align:right">
                    <strong>- ${formatarReais(d.valor)}</strong>
                    <div style="margin-top:5px;">
                        <i class="material-icons icon-btn" onclick="editarDespesa('${doc.id}', '${d.descricao}', ${d.valor}, '${d.status}')" style="color:#ffa000">edit</i>
                        <i class="material-icons icon-btn" onclick="excluirDespesa('${doc.id}')" style="color:#d32f2f; margin-left:10px;">delete</i>
                    </div>
                </div>
            </div>
        `;
    });
    
    divLista.innerHTML = html || "Nenhuma despesa lançada.";
}

// FUNÇÃO PARA EDITAR DESPESA (POPULA O FORMULÁRIO)
function editarDespesa(id, desc, valor, status) {
    document.getElementById('id-despesa-editar').value = id;
    document.getElementById('desc-despesa').value = desc;
    
    // Formata o valor para o input
    document.getElementById('valor-despesa').value = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('status-despesa').value = status || 'Quitado';
    
    // Muda o botão
    const btn = document.getElementById('btn-salvar-despesa');
    btn.innerText = "Salvar Alteração";
    btn.style.background = "#ffa000";
    document.getElementById('btn-cancelar-despesa').style.display = "block";
    
    // Rola para cima
    document.querySelector('.container').scrollIntoView();
}

function cancelarEdicaoDespesa() {
    document.getElementById('id-despesa-editar').value = "";
    document.getElementById('desc-despesa').value = "";
    document.getElementById('valor-despesa').value = "";
    document.getElementById('status-despesa').value = "Quitado";
    
    const btn = document.getElementById('btn-salvar-despesa');
    btn.innerText = "Registrar Saída";
    btn.style.background = "#d32f2f";
    document.getElementById('btn-cancelar-despesa').style.display = "none";
}

async function excluirDespesa(id) {
    if(confirm("Remover esta despesa?")) {
        await db.collection("despesas").doc(id).delete();
        carregarDespesas();
    }
}

// --- DASHBOARD (HOME) ---
async function carregarResumoHome() { 
    // 1. Soma Entradas
    let totalEntradas = 0;
    let pendenteEntrada = 0;
    const snapViagens = await db.collection("viagens").get();
    snapViagens.forEach(doc => { 
        const p = doc.data(); 
        totalEntradas += p.valor; 
        if(p.status === 'Pendente') pendenteEntrada += p.valor; 
    });

    // 2. Soma Despesas (Saídas)
    let totalSaidasPagas = 0;
    let totalSaidasPendentes = 0; // Novo acumulador
    const snapDespesas = await db.collection("despesas").get();
    snapDespesas.forEach(doc => { 
        const d = doc.data();
        if (d.status === 'Quitado' || !d.status) { 
            totalSaidasPagas += d.valor; 
        } else {
            totalSaidasPendentes += d.valor; // Soma o que falta pagar
        }
    });

    // 3. Calcula Saldo (Entradas - Saídas PAGAS)
    const saldo = totalEntradas - totalSaidasPagas;

    // 4. Atualiza Tela
    // CARTÃO 1: Agora mostra as Contas a Pagar (Futuro)
    document.getElementById('dash-pendentes-desp').innerText = formatarReais(totalSaidasPendentes);
    
    // CARTÃO 2: Mostra o que já saiu (Pago)
    document.getElementById('dash-saidas').innerText = formatarReais(totalSaidasPagas);
    
    // CARTÃO 3: Saldo Real
    const elSaldo = document.getElementById('dash-saldo');
    elSaldo.innerText = formatarReais(saldo);
    elSaldo.style.color = saldo >= 0 ? '#2196F3' : '#d32f2f';

    // Resumo
    document.getElementById('totalCaixa').innerText = formatarReais(totalEntradas); 
    document.getElementById('totalPendentes').innerText = formatarReais(pendenteEntrada); 

    // Lista Recente
    const div = document.getElementById('listaRecentes'); 
    div.innerHTML = ""; 
    const snapRecentes = await db.collection("viagens").orderBy("timestamp", "desc").limit(5).get(); 
    snapRecentes.forEach(doc => div.innerHTML += montarItemHTML(doc.id, doc.data(), false));
}

// --- RESTO DO CÓDIGO (MANTIDO) ---
function atualizarVisualCpf() { const chk = document.getElementById('check-mostrar-cpf'); const lista = document.getElementById('listaRelatorio'); if (chk.checked) lista.classList.remove('ocultar-cpf'); else lista.classList.add('ocultar-cpf'); }
async function exportarExcel() {
    const fEv = document.getElementById('buscaEvento').value; const fBus = document.getElementById('buscaOnibus').value; const fSt = document.getElementById('buscaStatus').value; const fDt = document.getElementById('buscaData').value; const mostrarCpf = document.getElementById('check-mostrar-cpf').checked;
    const snap = await db.collection("viagens").orderBy("nome").get();
    let csvContent = mostrarCpf ? "NOME;CPF;DATA;EVENTO;ONIBUS;VALOR;STATUS\n" : "NOME;DATA;EVENTO;ONIBUS;VALOR;STATUS\n";
    let count = 0;
    snap.forEach(doc => {
        const p = doc.data();
        if (fEv && p.evento !== fEv) return; if (fBus && p.onibus !== fBus) return; if (fSt && (p.status || 'Pago') !== fSt) return; if (fDt && p.data !== fDt) return;
        const dataFmt = p.data ? p.data.split('-').reverse().join('/') : ""; const valFmt = p.valor.toFixed(2).replace('.', ','); const st = p.status || "Pago";
        if (mostrarCpf) csvContent += `${p.nome};'${p.cpf};${dataFmt};${p.evento};${p.onibus};${valFmt};${st}\n`; else csvContent += `${p.nome};${dataFmt};${p.evento};${p.onibus};${valFmt};${st}\n`;
        count++;
    });
    if (count === 0) return alert("Nenhum dado encontrado.");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob);
    const tipoLista = mostrarCpf ? "ComCPF" : "SemCPF";
    link.download = `Lista_${tipoLista}_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}
async function salvarClienteBase() { const idEdicao = document.getElementById('id-cliente-editar').value; const nome = document.getElementById('novoNomeCliente').value.toUpperCase(); const cpf = document.getElementById('novoCpfCliente').value; const tel = document.getElementById('novoTelCliente').value; if (!nome) return alert("O Nome é obrigatório!"); try { if (idEdicao) { await db.collection("clientes").doc(idEdicao).update({ nome, cpf, tel }); alert("Cliente atualizado!"); } else { await db.collection("clientes").add({ nome, cpf, tel, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); alert("Cliente cadastrado!"); } cancelarEdicaoCliente(); carregarClientesBase(); } catch (e) { alert("Erro: " + e.message); } }
async function carregarClientesBase() { const divLista = document.getElementById('listaClientesBase'); const datalist = document.getElementById('lista-sugestoes'); divLista.innerHTML = "Atualizando..."; const snap = await db.collection("clientes").orderBy("nome").get(); let html = ""; cacheClientes = []; datalist.innerHTML = ""; snap.forEach(doc => { const c = doc.data(); cacheClientes.push(c); const option = document.createElement('option'); option.value = c.nome; datalist.appendChild(option); html += `<div class="item-lista"><div><strong>${c.nome}</strong><br><small>CPF: ${c.cpf || '--'} | Tel: ${c.tel || '--'}</small></div><div class="acoes-item"><i class="material-icons icon-btn" onclick="editarCliente('${doc.id}', '${c.nome}', '${c.cpf || ''}', '${c.tel || ''}')" style="color:#ffa000">edit</i><i class="material-icons icon-btn" onclick="excluirCliente('${doc.id}')" style="color:#d32f2f">delete</i></div></div>`; }); divLista.innerHTML = html || "Nenhum cliente cadastrado."; }
function editarCliente(id, nome, cpf, tel) { document.getElementById('id-cliente-editar').value = id; document.getElementById('novoNomeCliente').value = nome; document.getElementById('novoCpfCliente').value = cpf; document.getElementById('novoTelCliente').value = tel; document.getElementById('btn-salvar-cliente').innerText = "Salvar Alteração"; document.getElementById('btn-salvar-cliente').style.background = "#ffa000"; document.getElementById('btn-cancelar-cliente').style.display = "block"; document.querySelector('.container').scrollIntoView(); }
function cancelarEdicaoCliente() { document.getElementById('id-cliente-editar').value = ""; document.getElementById('novoNomeCliente').value = ""; document.getElementById('novoCpfCliente').value = ""; document.getElementById('novoTelCliente').value = ""; document.getElementById('btn-salvar-cliente').innerText = "Cadastrar Novo"; document.getElementById('btn-salvar-cliente').style.background = "#007bff"; document.getElementById('btn-cancelar-cliente').style.display = "none"; }
async function excluirCliente(id) { if(confirm("Remover cliente?")) { await db.collection("clientes").doc(id).delete(); carregarClientesBase(); } }
function verificarCliente() { const nomeDigitado = document.getElementById('nome').value.toUpperCase(); const aviso = document.getElementById('aviso-cliente'); const boxSalvar = document.getElementById('opcao-salvar-cliente'); const cpfInput = document.getElementById('cpf'); if (!nomeDigitado) { aviso.className = 'aviso-neutro'; aviso.innerText = 'Digite o nome...'; boxSalvar.style.display = 'none'; return; } const clienteEncontrado = cacheClientes.find(c => c.nome === nomeDigitado); if (clienteEncontrado) { aviso.className = 'aviso-encontrado'; aviso.innerHTML = '<i class="material-icons" style="font-size:12px">check_circle</i> Cliente cadastrado!'; cpfInput.value = clienteEncontrado.cpf; boxSalvar.style.display = 'none'; document.getElementById('check-salvar-cliente').checked = false; } else { aviso.className = 'aviso-novo'; aviso.innerText = 'Novo passageiro identificado'; boxSalvar.style.display = 'block'; } }
async function salvarPassageiro() { const id = document.getElementById('id-passageiro').value; const nome = document.getElementById('nome').value.toUpperCase(); const cpf = document.getElementById('cpf').value; const salvarComoCliente = document.getElementById('check-salvar-cliente').checked; const valorInput = document.getElementById('valor').value; const valorFloat = converterMoedaParaFloat(valorInput); const dados = { nome, cpf, valor: valorFloat, status: document.getElementById('status').value, data: document.getElementById('data').value, evento: document.getElementById('evento').value, onibus: document.getElementById('onibus').value, timestamp: firebase.firestore.FieldValue.serverTimestamp() }; if (!dados.nome || !dados.valor) return alert("Preencha Nome e Valor!"); try { if (id) { await db.collection("viagens").doc(id).update(dados); if (salvarComoCliente) { const jaExiste = cacheClientes.find(c => c.nome === nome); if (!jaExiste) { await db.collection("clientes").add({ nome, cpf, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); alert("Atualizado e salvo como Cliente!"); carregarClientesBase(); } else { alert("Atualizado!"); } } else { alert("Atualizado!"); } } else { await db.collection("viagens").add(dados); if (salvarComoCliente) { await db.collection("clientes").add({ nome, cpf, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); alert("Salvo e adicionado aos Clientes!"); carregarClientesBase(); } else { alert("Salvo!"); } } fecharModal(); carregarTudo(); } catch (e) { alert("Erro: " + e.message); } }
function abrirModal(idEdicao = null) { const modal = document.getElementById('modal-form'); modal.style.display = 'flex'; document.getElementById('aviso-cliente').className = 'aviso-neutro'; document.getElementById('aviso-cliente').innerText = 'Digite para verificar'; document.getElementById('opcao-salvar-cliente').style.display = 'none'; document.getElementById('check-salvar-cliente').checked = false; if (idEdicao) { document.getElementById('titulo-modal').innerText = "Editar Viagem"; } else { document.getElementById('titulo-modal').innerText = "Nova Viagem"; limparFormulario(); document.getElementById('data').valueAsDate = new Date(); } }
function fecharModal() { document.getElementById('modal-form').style.display = 'none'; }
function limparFormulario() { document.getElementById('id-passageiro').value = ""; document.getElementById('nome').value = ""; document.getElementById('cpf').value = ""; document.getElementById('valor').value = ""; document.getElementById('status').value = "Pago"; }
async function editarPassageiro(id) { const doc = await db.collection("viagens").doc(id).get(); const p = doc.data(); document.getElementById('id-passageiro').value = id; document.getElementById('nome').value = p.nome; document.getElementById('cpf').value = p.cpf; const valorFormatado = p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); document.getElementById('valor').value = valorFormatado; document.getElementById('status').value = p.status || 'Pago'; document.getElementById('data').value = p.data; document.getElementById('evento').value = p.evento; document.getElementById('onibus').value = p.onibus; abrirModal(id); verificarCliente(); }
async function excluirPassageiro(id) { if(confirm("Excluir viagem?")) { await db.collection("viagens").doc(id).delete(); carregarTudo(); } }
function carregarTudo() { carregarResumoHome(); carregarRelatorioFiltrado(); carregarClientesBase(); }
async function carregarRelatorioFiltrado() { const div = document.getElementById('listaRelatorio'); const fEv = document.getElementById('buscaEvento').value; const fBus = document.getElementById('buscaOnibus').value; const fSt = document.getElementById('buscaStatus').value; const fDt = document.getElementById('buscaData').value; div.innerHTML = "Carregando..."; const snap = await db.collection("viagens").orderBy("nome").get(); let html = ""; let qtd = 0, val = 0; let tit = "LISTA DE PASSAGEIROS"; if(fEv) tit += ` - ${fEv}`; if(fBus) tit += ` - ÔNIBUS ${fBus}`; if(fDt) tit += ` - ${fDt.split('-').reverse().join('/')}`; document.getElementById('cabecalho-impresso').innerText = tit; snap.forEach(doc => { const p = doc.data(); if (fEv && p.evento !== fEv) return; if (fBus && p.onibus !== fBus) return; if (fSt && (p.status || 'Pago') !== fSt) return; if (fDt && p.data !== fDt) return; qtd++; if(p.status === 'Pago' || !p.status) val += p.valor; html += montarItemHTML(doc.id, p, true); }); div.innerHTML = html || "<p>Nenhum registro.</p>"; document.getElementById('resumoQtd').innerText = qtd; document.getElementById('resumoValor').innerText = val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); atualizarVisualCpf(); }
function montarItemHTML(id, p, comBotoes) { const stCls = (p.status === 'Pendente') ? 'pendente' : 'pago'; const stTxt = p.status || 'Pago'; const cpf = p.cpf ? `CPF: ${p.cpf}` : ''; const btns = comBotoes ? `<div class="acoes-item"><i class="material-icons icon-btn" onclick="editarPassageiro('${id}')" style="color:#ffa000">edit</i><i class="material-icons icon-btn" onclick="excluirPassageiro('${id}')" style="color:#d32f2f">delete</i></div>` : ''; return `<div class="item-lista"><div class="dados-passageiro"><span class="info-principal">${p.nome}</span><span class="cpf-lateral">${cpf}</span><br><span class="detalhes-viagem">${p.data.split('-').reverse().join('/')} | ${p.evento} | Ônibus ${p.onibus} <span class="tag ${stCls}">${stTxt}</span></span></div><div style="text-align:right" class="valor-visual"><strong>${p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>${btns}</div></div>`; }