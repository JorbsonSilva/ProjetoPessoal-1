// Importando o Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// --- SUAS CREDENCIAIS DO SUPABASE ---
const supabaseUrl = 'https://gzkjdsndtcgwjtjryoam.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6a2pkc25kdGNnd2p0anJ5b2FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTU1MTEsImV4cCI6MjA5NDE3MTUxMX0.j5DajOAeHIh4XVtF2I6Kve2LnEXMVVR46mT4TiI3BhY';
const supabase = createClient(supabaseUrl, supabaseKey);


// ==========================================
// 1. O VIGIA (PROTEÇÃO DE ROTA)
// ==========================================
async function verificarAcesso() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
            window.location.href = 'login.html';
            return; 
        }

        console.log('Usuário logado:', session.user.email);
        document.body.style.display = 'flex'; 

    } catch (erroInesperado) {
        console.error('Erro de acesso:', erroInesperado);
        window.location.href = 'login.html';
    }
}
verificarAcesso();


// ==========================================
// 2. ABRIR E FECHAR A JANELA MODAL
// ==========================================
const modal = document.getElementById('modal-entrada');
const btnAbrirModal = document.getElementById('btn-abrir-modal');
const btnFecharModal = document.getElementById('btn-fechar-modal');

if (btnAbrirModal && modal) {
    btnAbrirModal.addEventListener('click', () => {
        modal.style.display = 'flex';
    });
}

if (btnFecharModal && modal) {
    btnFecharModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

// Fecha clicando no fundo escuro
window.addEventListener('click', (evento) => {
    if (evento.target === modal) {
        modal.style.display = 'none';
    }
});


// ==========================================
// 3. SALVAR OPERAÇÃO NO BANCO DE DADOS
// ==========================================
const formNovaEntrada = document.getElementById('form-nova-entrada');

if (formNovaEntrada) {
    formNovaEntrada.addEventListener('submit', async (evento) => {
        // ESSA LINHA É A MÁGICA QUE IMPEDE A PÁGINA DE RECARREGAR
        evento.preventDefault(); 

        const btnSalvar = document.querySelector('.btn-salvar');
        btnSalvar.textContent = 'SALVANDO...'; // Muda o texto do botão
        btnSalvar.disabled = true; // Desativa o botão para não clicar duas vezes

        try {
            // Lemos a sessão que já está no navegador (infalível), em vez de pedir pro servidor de novo
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                alert('Sua sessão expirou. Por favor, faça login novamente.');
                window.location.href = 'login.html';
                return;
            }

            // Pega tudo que você digitou
            const ativo = document.getElementById('ativo').value;
            const direcao = document.getElementById('direcao').value;
            const valor = parseFloat(document.getElementById('valor').value);
            const payout = parseFloat(document.getElementById('payout').value);
            const resultado = document.getElementById('resultado').value;
            const tempo_grafico = document.getElementById('tempo_grafico').value;
            const tipo_vela = document.getElementById('tipo_vela').value;
            const data_operacao = document.getElementById('data_operacao').value;
            const motivo_entrada = document.getElementById('motivo_entrada').value;

            // Manda para a tabela 'operacoes' usando o ID da sessão local
            const { error } = await supabase
                .from('operacoes')
                .insert([
                    {
                        user_id: session.user.id, // <--- A MÁGICA MUDOU AQUI!
                        ativo: ativo,
                        direcao: direcao,
                        valor: valor,
                        payout: payout,
                        resultado: resultado,
                        tempo_grafico: tempo_grafico,
                        tipo_vela: tipo_vela,
                        data_operacao: data_operacao,
                        motivo_entrada: motivo_entrada
                    }
                ]);

            if (error) throw error; // Se o banco rejeitar, pula pro catch

            // Sucesso!
            alert('Operação registrada com sucesso no diário!');
            
            formNovaEntrada.reset();
            modal.style.display = 'none';

        } catch (erro) {
            console.error('Erro ao salvar no banco:', erro);
            alert('Falha ao salvar a operação! Erro: ' + erro.message);
        } finally {
            btnSalvar.textContent = 'SALVAR NO DIÁRIO';
            btnSalvar.disabled = false;
        }
    });
}

// ==========================================
//4 . ELEMENTOS DA BANCA
// ==========================================

const modalBanca = document.getElementById('modal-banca');
const btnAbrirBanca = document.getElementById('btn-abrir-banca');
const btnFecharBanca = document.getElementById('btn-fechar-banca');
const formTransacao = document.getElementById('form-transacao');

// Abrir/Fechar Banca
if (btnAbrirBanca) btnAbrirBanca.addEventListener('click', () => modalBanca.style.display = 'flex');
if (btnFecharBanca) btnFecharBanca.addEventListener('click', () => modalBanca.style.display = 'none');

// Salvar Transação
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
            // Aqui futuramente chamaremos uma função para atualizar o Capital Inicial na tela
        } catch (err) {
            alert('Erro: ' + err.message);
        } finally {
            btn.textContent = 'REGISTRAR MOVIMENTAÇÃO';
        }
    });
}

// --- FUNÇÃO PARA CARREGAR E CALCULAR TUDO ---
// ==========================================
// VARIÁVEIS GLOBAIS PARA A MATEMÁTICA INSTANTÂNEA
// ==========================================
let currentCapitalTotal = 0;
let currentLucroMes = 0;
let currentQtdEntradas = 0;

// ==========================================
// FUNÇÃO PARA CARREGAR TUDO
// ==========================================
async function carregarResumo() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session.user.id;
        
        // Pega o mês que está selecionado na caixinha do topo
        const seletorMes = document.getElementById('seletor-mes');
        const mesAtual = seletorMes ? parseInt(seletorMes.value) : new Date().getMonth();
        const anoAtual = new Date().getFullYear();

        const [ops, trans] = await Promise.all([
            supabase.from('operacoes').select('*').eq('user_id', userId),
            supabase.from('transacoes').select('*').eq('user_id', userId)
        ]);

        const operacoes = ops.data || [];
        const transacoes = trans.data || [];

        let lucroTotalTrades = 0;
        let lucroMesTrades = 0;
        let wins = 0, losses = 0;

        // Filtra apenas as operações do mês escolhido
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
            statsPorDia[dia].ops.push(op); // Salva as operações do dia para o log detalhado
        });

        let capitalEntrada = 0; 
        let saquesPermanentes = 0;
        let saquesMes = 0;

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
        
        // Atualiza as variáveis globais para o cálculo rápido da Meta
        currentCapitalTotal = capitalTotal;
        currentLucroMes = lucroMesTrades;
        currentQtdEntradas = opsMesAtual.length;

        // Atualiza Interface (Cards Básicos e Cabeçalho)
        document.getElementById('visor-capital-total').textContent = `$${capitalTotal.toFixed(2)}`;
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
            
            // Evento para abrir a janela de detalhes ao clicar na linha
            tr.addEventListener('click', () => abrirDetalhesDia(dia, st.ops));
            if(tbody) tbody.appendChild(tr);
        });

        // Atualiza a projeção de meta de forma independente
        atualizarProjecao();

    } catch (error) {
        console.error("Erro ao carregar resumo:", error);
    }
}

// ==========================================
// MATEMÁTICA INSTANTÂNEA DA PROJEÇÃO
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

// Evento que escuta as teclas na caixinha de Meta e atualiza instantaneamente
const inputMeta = document.getElementById('meta-mensal');
if(inputMeta) inputMeta.addEventListener('input', atualizarProjecao);

// Evento para atualizar todo o painel ao trocar de mês
const seletorMes = document.getElementById('seletor-mes');
if(seletorMes) seletorMes.addEventListener('change', carregarResumo);

// ==========================================
// FUNÇÃO PARA A TABELA DETALHADA (MODAL)
// ==========================================
function abrirDetalhesDia(dia, operacoesDoDia) {
    document.getElementById('titulo-detalhes').textContent = `Operations · Day ${dia}`;
    document.getElementById('subtitulo-detalhes').textContent = `${operacoesDoDia.length} entries · detailed log`;

    const tbody = document.getElementById('tabela-detalhes-corpo');
    tbody.innerHTML = ''; // Limpa a tabela antes de preencher

    operacoesDoDia.sort((a,b) => new Date(a.data_operacao) - new Date(b.data_operacao)).forEach(op => {
        const d = new Date(op.data_operacao);
        const hora = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
        
        const resultColor = op.resultado === 'Win' ? 'text-win' : (op.resultado === 'Loss' ? 'text-loss' : '');
        const sideIcon = op.direcao === 'Call' ? '↗ Buy' : '↘ Sell';
        const sideClass = op.direcao === 'Call' ? 'side-buy' : 'side-sell';
        
        const valorGanho = op.resultado === 'Win' ? (op.valor * (op.payout / 100)) : (op.resultado === 'Loss' ? -op.valor : 0);
        const signal = valorGanho >= 0 ? '+' : '';

        const badgeResultado = `<span class="badge ${op.resultado === 'Win' ? 'badge-positive' : (op.resultado === 'Loss' ? 'badge-negative' : '')}">${op.resultado}</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>⏱ ${hora}</td>
            <td style="font-weight: 600;">${op.ativo}</td>
            <td>$${op.valor}</td>
            <td>${op.payout}%</td>
            <td class="${sideClass}">${sideIcon}</td>
            <td>${badgeResultado}</td>
            <td class="${resultColor} font-weight-bold">${signal}$${Math.abs(valorGanho).toFixed(2)}</td>
            <td style="color: var(--text-muted);">${op.motivo_entrada || '-'}</td>
        `;
        tbody.appendChild(tr);
    });

    // Mostra o painel fixo lá embaixo
    const painel = document.getElementById('painel-detalhes');
    painel.style.display = 'block';
    
    // Rola a tela suavemente para mostrar a tabela
    painel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Fechar modal de detalhes
const btnFecharDetalhes = document.getElementById('btn-fechar-detalhes');
if(btnFecharDetalhes) {
    btnFecharDetalhes.addEventListener('click', () => {
        document.getElementById('modal-detalhes').style.display = 'none';
    });
}

function renderizarGrafico(operacoes) {
    const ctx = document.getElementById('graficoEvolucao').getContext('2d');
    
    // Lógica simples de lucro acumulado por tempo para o gráfico
    let acumulado = 0;
    const dados = operacoes.sort((a,b) => new Date(a.data_operacao) - new Date(b.data_operacao)).map(op => {
        const valor = op.resultado === 'Win' ? (op.valor * (op.payout / 100)) : (op.resultado === 'Loss' ? -op.valor : 0);
        acumulado += valor;
        return acumulado;
    });

    new Chart(ctx, {
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

// Chamar a função ao carregar a página
carregarResumo();

// --- CÁLCULO DO ROI (Retorno sobre Investimento) ---
        // O quanto você lucrou em relação ao que você tirou do próprio bolso
        const roiTotal = capitalEntrada > 0 ? ((lucroTotalTrades / capitalEntrada) * 100) : 0;

        // --- ATUALIZAR CABEÇALHO ---
        document.getElementById('visor-header-capital').textContent = `$${capitalTotal.toFixed(2)}`;
        
        // Elemento Resultado Mensal (com cor dinâmica Verde ou Vermelha)
        const headerResultado = document.getElementById('visor-header-resultado');
        headerResultado.textContent = `${lucroMesTrades >= 0 ? '+' : ''}$${lucroMesTrades.toFixed(2)}`;
        headerResultado.style.color = lucroMesTrades >= 0 ? 'var(--neon-green)' : 'var(--neon-red)';
        
        // Elemento ROI Total (com cor dinâmica Verde ou Vermelha)
        const headerRoi = document.getElementById('visor-header-roi');
        headerRoi.textContent = `${roiTotal >= 0 ? '+' : ''}${roiTotal.toFixed(2)}%`;
        headerRoi.style.color = roiTotal >= 0 ? 'var(--neon-green)' : 'var(--neon-red)';

