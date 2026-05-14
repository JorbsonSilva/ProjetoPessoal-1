// Importando o Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// --- SUAS CREDENCIAIS DO SUPABASE ---
const supabaseUrl = 'https://gzkjdsndtcgwjtjryoam.supabase.co';
const supabaseKey = 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6a2pkc25kdGNnd2p0anJ5b2FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTU1MTEsImV4cCI6MjA5NDE3MTUxMX0';
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