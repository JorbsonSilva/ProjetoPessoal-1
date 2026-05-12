// Importando o Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// --- SUAS CREDENCIAIS DO SUPABASE ---
const supabaseUrl = 'https://gzkjdsndtcgwjtjryoam.supabase.co';
const supabaseKey = 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6a2pkc25kdGNnd2p0anJ5b2FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTU1MTEsImV4cCI6MjA5NDE3MTUxMX0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Função que age como "Vigia de Porta"
async function verificarAcesso() {
    // Pergunta ao Supabase se existe uma sessão ativa (se o crachá está no navegador)
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        // Se NÃO tem sessão, bloqueia o acesso e joga pro login
        window.location.href = 'login.html';
    } else {
        // Se tem sessão, deixa a página carregar normal e até mostra o e-mail no console
        console.log('Usuário autorizado:', session.user.email);
    }
}

// Executa o vigia assim que o JavaScript carrega
verificarAcesso();