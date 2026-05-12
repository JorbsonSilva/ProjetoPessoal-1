// Importando o Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// --- SUAS CREDENCIAIS DO SUPABASE ---
const supabaseUrl = 'https://gzkjdsndtcgwjtjryoam.supabase.co';
const supabaseKey = 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6a2pkc25kdGNnd2p0anJ5b2FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTU1MTEsImV4cCI6MjA5NDE3MTUxMX0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Função que age como "Vigia de Porta"
async function verificarAcesso() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        // Sem crachá: expulsa na mesma hora (a tela ainda está invisível)
        window.location.href = 'login.html';
    } else {
        // Com crachá: mostra o e-mail no console e ACENDE A LUZ!
        console.log('Usuário autorizado:', session.user.email);
        
        // Remove o "display: none" do body e deixa a tela visível
        document.body.style.display = 'block'; 
    }
}

verificarAcesso();
