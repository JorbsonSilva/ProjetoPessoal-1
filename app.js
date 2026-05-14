// Importando o Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// --- SUAS CREDENCIAIS DO SUPABASE ---
const supabaseUrl = 'https://gzkjdsndtcgwjtjryoam.supabase.co';
const supabaseKey = 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6a2pkc25kdGNnd2p0anJ5b2FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTU1MTEsImV4cCI6MjA5NDE3MTUxMX0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Função que age como "Vigia de Porta"
async function verificarAcesso() {
    try {
        // Tenta pegar a sessão
        const { data: { session }, error } = await supabase.auth.getSession();

        // Se o Supabase retornar um erro ou se não houver sessão...
        if (error || !session) {
            window.location.href = 'login.html';
            return; // Faz o código parar aqui
        }

        // Se chegou aqui, está tudo certo!
        console.log('Usuário autorizado:', session.user.email);
        
        // Acende a luz usando 'flex' para manter nosso CSS funcionando
        document.body.style.display = 'flex'; 

    } catch (erroInesperado) {
        // Se a internet cair ou o código quebrar, não deixa a tela branca
        console.error('Erro ao verificar acesso:', erroInesperado);
        window.location.href = 'login.html';
    }
}

verificarAcesso();

// --- LÓGICA DO MODAL ---
const modal = document.getElementById('modal-entrada');
const btnAbrirModal = document.getElementById('btn-abrir-modal');
const btnFecharModal = document.getElementById('btn-fechar-modal');

// O "if" garante que ele só adicione a função se os elementos existirem na tela
if (btnAbrirModal && modal) {
    btnAbrirModal.addEventListener('click', () => {
        console.log('Botão Nova Entrada clicado!'); // Espião para o F12
        modal.style.display = 'flex';
    });
} else {
    console.error('Erro: Botão ou Modal não encontrados no HTML!');
}

if (btnFecharModal && modal) {
    btnFecharModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

// Fecha o Modal se clicar fora da caixa (no fundo escuro)
window.addEventListener('click', (evento) => {
    if (evento.target === modal) {
        modal.style.display = 'none';
    }
});

// --- SALVAR NO BANCO DE DADOS ---
const formNovaEntrada = document.getElementById('form-nova-entrada');

if (formNovaEntrada) {
    formNovaEntrada.addEventListener('submit', async (evento) => {
        // Impede a página de recarregar
        evento.preventDefault();

        // Pega o botão para mudar o texto enquanto carrega
        const btnSalvar = document.querySelector('.btn-salvar');
        btnSalvar.textContent = 'Salvando...';
        btnSalvar.disabled = true;

        try {
            // 1. Pega quem é o usuário logado no momento
            const { data: { user } } = await supabase.auth.getUser();

            // 2. Coleta os dados que você digitou no formulário
            const ativo = document.getElementById('ativo').value;
            const direcao = document.getElementById('direcao').value;
            const valor = parseFloat(document.getElementById('valor').value);
            const payout = parseFloat(document.getElementById('payout').value);
            const resultado = document.getElementById('resultado').value;
            const tempo_grafico = document.getElementById('tempo_grafico').value;
            const tipo_vela = document.getElementById('tipo_vela').value;
            const data_operacao = document.getElementById('data_operacao').value;
            const motivo_entrada = document.getElementById('motivo_entrada').value;

            // 3. Envia o pacote todo para a tabela 'operacoes' do Supabase
            const { error } = await supabase
                .from('operacoes')
                .insert([
                    {
                        user_id: user.id, // Liga a operação a VOCÊ
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

            // Se o Supabase reclamar de algo, a gente joga pro "catch"
            if (error) throw error;

            // Se deu tudo certo:
            alert('Operação registrada com sucesso!');
            
            // Limpa o formulário e esconde a janela
            formNovaEntrada.reset();
            modal.style.display = 'none';

        } catch (erro) {
            console.error('Erro ao salvar:', erro);
            alert('Falha ao salvar a operação: ' + erro.message);
        } finally {
            // Volta o botão ao normal
            btnSalvar.textContent = 'Salvar no Diário';
            btnSalvar.disabled = false;
        }
    });
}