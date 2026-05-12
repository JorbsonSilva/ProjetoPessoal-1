// Importando o Supabase direto da internet (CDN)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// --- SUAS CREDENCIAIS DO SUPABASE ---
// Cole a URL e a Chave "anon public" entre as aspas
const supabaseUrl = 'https://gzkjdsndtcgwjtjryoam.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6a2pkc25kdGNnd2p0anJ5b2FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTU1MTEsImV4cCI6MjA5NDE3MTUxMX0.j5DajOAeHIh4XVtF2I6Kve2LnEXMVVR46mT4TiI3BhY';

// Inicializando a conexão
const supabase = createClient(supabaseUrl, supabaseKey);

// Capturando o formulário e o botão
const formLogin = document.getElementById('form-login');
const btnLogin = document.querySelector('.btn-login');

// Escutando o evento de "submit" (quando você clica no botão entrar)
formLogin.addEventListener('submit', async (evento) => {
    // Isso impede a página de recarregar e piscar a tela
    evento.preventDefault();

    // Pegando os valores que você digitou
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    // Mudando o texto do botão para mostrar que está pensando
    btnLogin.textContent = 'Carregando...';

    // Tentando fazer o login no Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: senha,
    });

    // Voltando o botão ao normal
    btnLogin.textContent = 'Entrar no Sistema';

    // Verificando se deu erro (ex: senha errada)
    if (error) {
        alert('Erro ao acessar: ' + error.message);
    } else {
        // Agora ele te manda para o Dashboard automaticamente!
        window.location.href = 'dashboard.html';
    }
});