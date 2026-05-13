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

// Abre o Modal ao clicar em "Nova Entrada"
btnAbrirModal.addEventListener('click', () => {
    modal.style.display = 'flex';
});

// Fecha o Modal ao clicar no "X"
btnFecharModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Fecha o Modal se clicar fora da caixa (no fundo escuro)
window.addEventListener('click', (evento) => {
    if (evento.target === modal) {
        modal.style.display = 'none';
    }
});