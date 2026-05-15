// Importando o Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// --- SUAS CREDENCIAIS DO SUPABASE ---
const supabaseUrl = 'https://gzkjdsndtcgwjtjryoam.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6a2pkc25kdGNnd2p0anJ5b2FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTU1MTEsImV4cCI6MjA5NDE3MTUxMX0.j5DajOAeHIh4XVtF2I6Kve2LnEXMVVR46mT4TiI3BhY';
const supabase = createClient(supabaseUrl, supabaseKey);


// ==========================================
// 1. O VIGIA E MODAIS (EVENTOS BÁSICOS)
// ==========================================
async function verificarAcesso() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) { window.location.href = 'login.html'; return; }
        console.log('Usuário logado:', session.user.email);
        document.body.style.display = 'block'; 
    } catch (erro) {
        window.location.href = 'login.html';
    }
}
verificarAcesso();

// Modal Nova Entrada
const modal = document.getElementById('modal-entrada');
const btnAbrirModal = document.getElementById('btn-abrir-modal');
const btnFecharModal = document.getElementById('btn-fechar-modal');
if (btnAbrirModal) btnAbrirModal.addEventListener('click', () => modal.style.display = 'flex');
if (btnFecharModal) btnFecharModal.addEventListener('click', () => modal.style.display = 'none');

// Modal Banca
const modalBanca = document.getElementById('modal-banca');
const btnAbrirBanca = document.getElementById('btn-abrir-banca');
const btnFecharBanca = document.getElementById('btn-fechar-banca');
if (btnAbrirBanca) btnAbrirBanca.addEventListener('click', () => modalBanca.style.display = 'flex');
if (btnFecharBanca) btnFecharBanca.addEventListener('click', () => modalBanca.style.display = 'none');

// Fechar Modal Detalhes (Estava perdido, agora está no lugar certo)
const modalDetalhes = document.getElementById('modal-detalhes');
const btnFecharDetalhes = document.getElementById('btn-fechar-detalhes');
if (btnFecharDetalhes) btnFecharDetalhes.addEventListener('click', () => modalDetalhes.style.display = 'none');

window.addEventListener('click', (evento) => {
    if (evento.target === modal) modal.style.display = 'none';
    if (evento.target === modalBanca) modalBanca.style.display = 'none';
    if (evento.target === modalDetalhes) modalDetalhes.style.display = 'none';
});


// ==========================================
// 2. SALVAR DADOS (OPERAÇÕES E TRANSAÇÕES)
// ==========================================
const formNovaEntrada = document.getElementById('form-nova-entrada');
if (formNovaEntrada) {
    formNovaEntrada.addEventListener('submit', async (evento) => {
        evento.preventDefault(); 
        const btnSalvar = document.querySelector('.btn-salvar');
        btnSalvar.textContent = 'SALVANDO...'; btnSalvar.disabled = true;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const { error } = await supabase.from('operacoes').insert([{
                user_id: session.user.id,
                ativo: document.getElementById('ativo').value,
                direcao: document.getElementById('direcao').value,
                valor: parseFloat(document.getElementById('valor').value),
                payout: parseFloat(document.getElementById('payout').value),
                resultado: document.getElementById('resultado').value,
                tempo_grafico: document.getElementById('tempo_grafico').value,
                tipo_vela: document.getElementById('tipo_vela').value,
                data_operacao: document.getElementById('data_operacao').value,
                motivo_entrada: document.getElementById('motivo_entrada').value
            }]);
            if (error) throw error;
            alert('Operação registrada com sucesso!');
            formNovaEntrada.reset();
            modal.style.display = 'none';
            carregarResumo(); // Atualiza painel instantaneamente
        } catch (erro) {
            alert('Falha ao salvar a operação! Erro: ' + erro.message);
        } finally {
            btnSalvar.textContent = 'SALVAR NO DIÁRIO'; btnSalvar.disabled = false;
        }
    });
}

const formTransacao = document.getElementById('form-transacao');
if (formTransacao) {
    formTransacao.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.textContent = 'PROCESSANDO...';
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const { error } = await supabase.from('transacoes').insert([{
                user_id: session.user.id,
                tipo: document.getElementById('tipo_transacao').value,
                valor: parseFloat(document.getElementById('valor_transacao').value),
                metodo: document.getElementById('metodo_transacao').value,
                data_transacao: document.getElementById('data_transacao').value
            }]);
            if (error) throw error;
            alert('Movimentação registrada!');
            formTransacao.reset();
            modalBanca.style.display = 'none';
            carregarResumo();
        } catch (err) {
            alert('Erro: ' + err.message);
        } finally {
            btn.textContent = 'REGISTRAR MOVIMENTAÇÃO';
        }
    });
}


// ==========================================
// 3. INTELIGÊNCIA DO PAINEL (CÁLCULOS GERAIS)
// ==========================================
let currentCapitalTotal = 0;
let currentLucroMes = 0;
let currentQtdEntradas = 0;

async function carregarResumo() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session.user.id;
        
        const seletorMes = document.getElementById('seletor-mes');
        const mesAtual = seletorMes ? parseInt(seletorMes.value) : new Date().getMonth();
        const anoAtual = new Date().getFullYear();

        // Troca o título grandão com o nome do mês selecionado
        const tituloDisplay = document.getElementById('titulo-mes-display');
        if (tituloDisplay && seletorMes) {
            const nomeMes = seletorMes.options[seletorMes.selectedIndex].text;
            tituloDisplay.textContent = `${nomeMes} · Desempenho`;
        }

        const [ops, trans] = await Promise.all([
            supabase.from('operacoes').select('*').eq('user_id', userId),
            supabase.from('transacoes').select('*').eq('user_id', userId)
        ]);

        const operacoes = ops.data || [];
        const transacoes = trans.data || [];

        let lucroTotalTrades = 0, lucroMesTrades = 0, wins = 0, losses = 0;
        const opsMesAtual = operacoes.filter(op => {
            const d = new Date(op.data_operacao);
            return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
        });

        operacoes.forEach(op => {
            const valorGanho = op.resultado === 'Win' ? (op.valor * (op.payout / 100)) : (op.resultado === 'Loss' ? -op.valor : 0);
            lucroTotalTrades += valorGanho;
        });

        const statsPorDia = {};
        opsMesAtual.forEach(op => {
            const valorGanho = op.resultado === 'Win' ? (op.valor * (op.payout / 100)) : (op.resultado === 'Loss' ? -op.valor : 0);
            lucroMesTrades += valorGanho;
            
            if(op.resultado === 'Win') wins++;
            if(op.resultado === 'Loss') losses++;

            const dia = new Date(op.data_operacao).getDate();
            if(!statsPorDia[dia]) statsPorDia[dia] = { entradas: 0, wins: 0, losses: 0, resultado: 0, ops: [] };
            
            statsPorDia[dia].entradas++;
            if(op.resultado === 'Win') statsPorDia[dia].wins++;
            if(op.resultado === 'Loss') statsPorDia[dia].losses++;
            statsPorDia[dia].resultado += valorGanho;
            statsPorDia[dia].ops.push(op); 
        });

        let capitalEntrada = 0, saquesPermanentes = 0, saquesMes = 0;
        transacoes.forEach(t => {
            const val = parseFloat(t.valor);
            const d = new Date(t.data_transacao);
            if(t.tipo === 'Capital Inicial' || t.tipo === 'Aporte') capitalEntrada += val;
            if(t.tipo === 'Saque Permanente') saquesPermanentes += val;
            if(d.getMonth() === mesAtual && d.getFullYear() === anoAtual) {
                if(t.tipo === 'Saque Reserva' || t.tipo === 'Saque Permanente') saquesMes += val;
            }
        });

        const capitalTotal = capitalEntrada + lucroTotalTrades - saquesPermanentes;
        
        // --- O ROI AGORA ESTÁ DENTRO DA CAIXA CERTA! ---
        const roiTotal = capitalEntrada > 0 ? ((lucroTotalTrades / capitalEntrada) * 100) : 0;
        const headerRoi = document.getElementById('visor-header-roi');
        if(headerRoi) {
            headerRoi.textContent = `${roiTotal >= 0 ? '+' : ''}${roiTotal.toFixed(2)}%`;
            headerRoi.style.color = roiTotal >= 0 ? 'var(--neon-green)' : 'var(--neon-red)';
        }
        
        currentCapitalTotal = capitalTotal;
        currentLucroMes = lucroMesTrades;
        currentQtdEntradas = opsMesAtual.length;

        // Atualiza Cards Principais
        document.getElementById('visor-capital-total').textContent = `$${capitalTotal.toFixed(2)}`;
        document.getElementById('visor-header-capital').textContent = `$${capitalTotal.toFixed(2)}`;
        
        const headerResultado = document.getElementById('visor-header-resultado');
        if(headerResultado) {
            headerResultado.textContent = `${lucroMesTrades >= 0 ? '+' : ''}$${lucroMesTrades.toFixed(2)}`;
            headerResultado.style.color = lucroMesTrades >= 0 ? 'var(--neon-green)' : 'var(--neon-red)';
        }

        document.getElementById('visor-lucro-mes').textContent = `${lucroMesTrades >= 0 ? '+' : ''}$${lucroMesTrades.toFixed(2)}`;
        document.getElementById('visor-lucro-total').textContent = `${lucroTotalTrades >= 0 ? '+' : ''}$${lucroTotalTrades.toFixed(2)}`;
        document.getElementById('visor-entradas').textContent = wins + losses;
        document.getElementById('visor-wins-losses').textContent = `${wins}W · ${losses}L`;
        
        const winRate = (wins + losses) > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : 0;
        document.getElementById('visor-winrate').textContent = `${winRate}%`;

        // Preenche a Tabela Diária
        const tbody = document.getElementById('tabela-resultados-corpo');
        if(tbody) tbody.innerHTML = '';

        const diasOrdenados = Object.keys(statsPorDia).map(Number).sort((a,b) => a - b);
        diasOrdenados.forEach(dia => {
            const st = statsPorDia[dia];
            const pctDiaria = capitalTotal > 0 ? (st.resultado / capitalTotal) * 100 : 0;
            const resColor = st.resultado >= 0 ? 'text-win' : 'text-loss';
            const badgeClass = st.resultado >= 0 ? 'badge-positive' : 'badge-negative';
            const signal = st.resultado >= 0 ? '+' : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>Dia ${dia}</td>
                <td>${st.entradas}</td>
                <td><span class="text-win">${st.wins}</span> / <span class="text-loss">${st.losses}</span></td>
                <td class="${resColor}">${signal}$${st.resultado.toFixed(2)}</td>
                <td class="${resColor}">${signal}${pctDiaria.toFixed(2)}%</td>
                <td>$${capitalTotal.toFixed(2)}</td>
                <td><span class="badge ${badgeClass}">${st.resultado >= 0 ? 'Positivo' : 'Negativo'}</span></td>
            `;
            tr.addEventListener('click', () => abrirDetalhesDia(dia, st.ops));
            if(tbody) tbody.appendChild(tr);
        });

        atualizarProjecao();
        renderizarGrafico(opsMesAtual); // Passa apenas as operações do mês para o gráfico

    } catch (error) {
        console.error("Erro ao carregar resumo:", error);
    }
}

// ==========================================
// 4. METAS E DETALHES
// ==========================================
function atualizarProjecao() {
    const metaInput = document.getElementById('meta-mensal');
    const metaPerc = metaInput ? parseFloat(metaInput.value) : 20;
    
    const metaEmDinheiro = currentCapitalTotal * (metaPerc / 100);
    const faltaParaMeta = metaEmDinheiro - currentLucroMes;
    const mediaLucroPorEntrada = currentQtdEntradas > 0 ? currentLucroMes / currentQtdEntradas : 0;
    
    let entradasEstimadas = '---';
    if(faltaParaMeta <= 0) {
        entradasEstimadas = 'BATIDA! 🏆';
    } else if (mediaLucroPorEntrada > 0) {
        entradasEstimadas = Math.ceil(faltaParaMeta / mediaLucroPorEntrada) + ' cliques';
    } else {
        entradasEstimadas = 'Sem média ⚠️';
    }

    const progresso = metaEmDinheiro > 0 ? (currentLucroMes / metaEmDinheiro) * 100 : 0;
    const progressoLimitado = Math.max(0, Math.min(100, progresso));

    if(document.getElementById('visor-meta-valor')) document.getElementById('visor-meta-valor').textContent = `$${metaEmDinheiro.toFixed(2)}`;
    if(document.getElementById('visor-meta-restante')) document.getElementById('visor-meta-restante').textContent = faltaParaMeta > 0 ? `$${faltaParaMeta.toFixed(2)}` : '$0.00';
    if(document.getElementById('visor-entradas-estimadas')) document.getElementById('visor-entradas-estimadas').textContent = entradasEstimadas;
    if(document.getElementById('visor-progresso-percent')) document.getElementById('visor-progresso-percent').textContent = `${progressoLimitado.toFixed(1)}%`;
    if(document.getElementById('barra-progresso')) document.getElementById('barra-progresso').style.width = `${progressoLimitado}%`;
}

// Eventos de Gatilho Rápido
const inputMeta = document.getElementById('meta-mensal');
if(inputMeta) inputMeta.addEventListener('input', atualizarProjecao);

const seletorMes = document.getElementById('seletor-mes');
if(seletorMes) seletorMes.addEventListener('change', carregarResumo);

// Abrir Tabela Detalhada
function abrirDetalhesDia(dia, operacoesDoDia) {
    document.getElementById('titulo-detalhes').textContent = `Operações · Dia ${dia}`;
    document.getElementById('subtitulo-detalhes').textContent = `${operacoesDoDia.length} entradas · log detalhado`;

    const tbody = document.getElementById('tabela-detalhes-corpo');
    tbody.innerHTML = ''; 

    operacoesDoDia.sort((a,b) => new Date(a.data_operacao) - new Date(b.data_operacao)).forEach(op => {
        const d = new Date(op.data_operacao);
        const hora = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
        const resultColor = op.resultado === 'Win' ? 'text-win' : (op.resultado === 'Loss' ? 'text-loss' : '');
        const sideIcon = op.direcao === 'Call' ? '↗ Compra' : '↘ Venda';
        const sideClass = op.direcao === 'Call' ? 'side-buy' : 'side-sell';
        const valorGanho = op.resultado === 'Win' ? (op.valor * (op.payout / 100)) : (op.resultado === 'Loss' ? -op.valor : 0);
        const signal = valorGanho >= 0 ? '+' : '';
        const badgeResultado = `<span class="badge ${op.resultado === 'Win' ? 'badge-positive' : (op.resultado === 'Loss' ? 'badge-negative' : '')}">${op.resultado}</span>`;

        const tr = document.createElement('tr');
        // ATENÇÃO: Adicionei o onclick direto aqui chamando o window.deletarOperacao (infalível)
        tr.innerHTML = `
            <td>⏱ ${hora}</td>
            <td style="font-weight: 600;">${op.ativo}</td>
            <td>$${op.valor}</td>
            <td>${op.payout}%</td>
            <td class="${sideClass} text-center">${sideIcon}</td>
            <td class="text-center">${badgeResultado}</td>
            <td class="${resultColor} font-weight-bold">${signal}$${Math.abs(valorGanho).toFixed(2)}</td>
            <td style="color: var(--text-muted);">${op.motivo_entrada || '-'}</td>
            <td class="text-center">
                <button class="btn-delete" onclick="window.deletarOperacao('${op.id}')" title="Excluir Entrada">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    modalDetalhes.style.display = 'flex';
}

// Gráfico
function renderizarGrafico(operacoes) {
    const canvas = document.getElementById('graficoEvolucao');
    if(!canvas) return;
    
    // Se já existe um gráfico, destrua-o antes de desenhar o novo (previne bug de sobreposição ao mudar de mês)
    if(window.meuGrafico) window.meuGrafico.destroy();

    const ctx = canvas.getContext('2d');
    let acumulado = 0;
    const dados = operacoes.sort((a,b) => new Date(a.data_operacao) - new Date(b.data_operacao)).map(op => {
        const valor = op.resultado === 'Win' ? (op.valor * (op.payout / 100)) : (op.resultado === 'Loss' ? -op.valor : 0);
        acumulado += valor;
        return acumulado;
    });

    window.meuGrafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: operacoes.map((_, i) => i + 1),
            datasets: [{
                label: 'Evolução de Lucro ($)',
                data: dados,
                borderColor: '#00ffa3',
                backgroundColor: 'rgba(0, 255, 163, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: '#333' }, ticks: { color: '#888' } },
                x: { grid: { display: false }, ticks: { color: '#888' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// ==========================================
// 5. EXCLUIR OPERAÇÃO DO BANCO (GLOBAL)
// ==========================================
window.deletarOperacao = async function(id) {
    const confirmacao = confirm("Tem certeza que deseja excluir esta operação?");
    if (confirmacao) {
        try {
            const { error } = await supabase.from('operacoes').delete().eq('id', id);
            if (error) throw error;
            
            alert('Operação excluída com sucesso!');
            document.getElementById('modal-detalhes').style.display = 'none';
            carregarResumo(); 
        } catch (error) {
            alert("Erro ao excluir: " + error.message);
        }
    }
};

// Iniciar
carregarResumo();

// ==========================================
// 6. HISTÓRICO DE MOVIMENTAÇÕES DE BANCA
// ==========================================

const modalHistoricoBanca = document.getElementById('modal-historico-banca');
const btnVerHistorico = document.getElementById('btn-ver-historico-banca');
const btnFecharHistorico = document.getElementById('btn-fechar-historico-banca');

if (btnVerHistorico) {
    btnVerHistorico.addEventListener('click', () => {
        // Fecha o modal de registro para abrir o de histórico
        document.getElementById('modal-banca').style.display = 'none';
        abrirHistoricoBanca();
    });
}

if (btnFecharHistorico) {
    btnFecharHistorico.addEventListener('click', () => {
        modalHistoricoBanca.style.display = 'none';
    });
}

async function abrirHistoricoBanca() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const { data: transacoes, error } = await supabase
            .from('transacoes')
            .select('*')
            .eq('user_id', session.user.id)
            .order('data_transacao', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('tabela-historico-banca-corpo');
        tbody.innerHTML = '';

        transacoes.forEach(t => {
            const d = new Date(t.data_transacao);
            const dataFormatada = d.toLocaleDateString('pt-BR') + ' ' + d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
            
            const colorClass = (t.tipo.includes('Saque')) ? 'text-loss' : 'text-win';
            const sinal = (t.tipo.includes('Saque')) ? '-' : '+';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-size: 0.85rem;">${dataFormatada}</td>
                <td style="font-weight: 600;">${t.tipo}</td>
                <td class="${colorClass}">${sinal}$${t.valor.toFixed(2)}</td>
                <td>${t.metodo}</td>
                <td class="text-center">
                    <button class="btn-delete" onclick="window.deletarTransacao('${t.id}')" title="Excluir Registro">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        modalHistoricoBanca.style.display = 'flex';

    } catch (error) {
        alert("Erro ao carregar histórico: " + error.message);
    }
}

// Função para deletar movimentação de banca
window.deletarTransacao = async function(id) {
    if (confirm("Deseja excluir este registro de banca? Isso afetará seu Capital Total imediatamente.")) {
        try {
            const { error } = await supabase.from('transacoes').delete().eq('id', id);
            if (error) throw error;
            
            alert('Registro removido!');
            modalHistoricoBanca.style.display = 'none';
            carregarResumo(); // Recalcula tudo na tela principal
        } catch (error) {
            alert("Erro ao excluir: " + error.message);
        }
    }
};