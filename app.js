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
async function carregarResumo() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session.user.id;
        const agora = new Date();
        const mesAtual = agora.getMonth();
        const anoAtual = agora.getFullYear();

        // 1. Busca Operações e Transações
        const [ops, trans] = await Promise.all([
            supabase.from('operacoes').select('*').eq('user_id', userId),
            supabase.from('transacoes').select('*').eq('user_id', userId)
        ]);

        const operacoes = ops.data || [];
        const transacoes = trans.data || [];

        // --- CÁLCULOS MATEMÁTICOS ---
        
        // Lucro de todas as operações (Win - Loss)
        let lucroTotalTrades = 0;
        let lucroMesTrades = 0;
        let wins = 0, losses = 0;

        operacoes.forEach(op => {
            const valorGanho = op.resultado === 'Win' ? (op.valor * (op.payout / 100)) : (op.resultado === 'Loss' ? -op.valor : 0);
            lucroTotalTrades += valorGanho;

            const dataOp = new Date(op.data_operacao);
            if(dataOp.getMonth() === mesAtual && dataOp.getFullYear() === anoAtual) {
                lucroMesTrades += valorGanho;
                if(op.resultado === 'Win') wins++;
                if(op.resultado === 'Loss') losses++;
            }
        });

        // Transações da Banca Global
        let capitalEntrada = 0; // Capital Inicial + Aportes
        let saquesPermanentes = 0;
        let saquesMes = 0;

        transacoes.forEach(t => {
            const val = parseFloat(t.valor);
            const dataT = new Date(t.data_transacao);

            if(t.tipo === 'Capital Inicial' || t.tipo === 'Aporte') capitalEntrada += val;
            if(t.tipo === 'Saque Permanente') saquesPermanentes += val;

            // Para o DARF (Saques do mês atual)
            if(dataT.getMonth() === mesAtual && dataT.getFullYear() === anoAtual) {
                if(t.tipo === 'Saque Reserva' || t.tipo === 'Saque Permanente') saquesMes += val;
            }
        });

        // --- CÁLCULOS FINAIS ---
        const capitalTotal = capitalEntrada + lucroTotalTrades - saquesPermanentes;
        const winRate = (wins + losses) > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : 0;
        
        // DARF: 15% sobre o que foi sacado, limitado ao lucro do mês
        const lucroParaImposto = Math.min(lucroMesTrades, saquesMes);
        const impostoDarf = lucroParaImposto > 0 ? (lucroParaImposto * 0.15) : 0;

        // --- ATUALIZAR INTERFACE ---
        document.getElementById('visor-capital-total').textContent = `$${capitalTotal.toFixed(2)}`;
        document.getElementById('visor-lucro-mes').textContent = `${lucroMesTrades >= 0 ? '+' : ''}$${lucroMesTrades.toFixed(2)}`;
        document.getElementById('visor-lucro-total').textContent = `${lucroTotalTrades >= 0 ? '+' : ''}$${lucroTotalTrades.toFixed(2)}`;
        document.getElementById('visor-winrate').textContent = `${winRate}%`;
        document.getElementById('visor-entradas').textContent = wins + losses;
        document.getElementById('visor-wins-losses').textContent = `${wins}W · ${losses}L`;
        document.getElementById('visor-imposto').textContent = `$${impostoDarf.toFixed(2)}`;

        // Renderizar o Gráfico
        renderizarGrafico(operacoes);

    } catch (error) {
        console.error("Erro ao carregar resumo:", error);
    }
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