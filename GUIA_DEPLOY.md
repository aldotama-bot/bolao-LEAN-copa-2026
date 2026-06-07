# 🏆 GUIA COMPLETO DE DEPLOY — Bolão Copa 2026
## Custo: R$ 0,00 | Tempo estimado: 45–60 minutos

---

## O QUE VOCÊ VAI PRECISAR

- Conta Google (você já tem ✅)
- Um computador com acesso à internet
- Cerca de 1 hora de atenção

Ao final, você terá um link tipo:
**https://bolao-copa-2026.vercel.app**
que qualquer pessoa pode acessar de qualquer lugar!

---

## PARTE 1 — GITHUB (onde o código fica guardado)
**Tempo: ~10 minutos**

1. Acesse **https://github.com** e clique em "Sign up"
2. Use sua conta Google para criar a conta
3. Confirme o e-mail se pedido
4. Após entrar, clique no botão verde **"New"** (canto superior esquerdo)
5. Em "Repository name" escreva: `bolao-copa-2026`
6. Deixe em **Public** mesmo
7. Clique em **"Create repository"**

Agora você precisa enviar os arquivos do bolão para lá.
A forma mais fácil é usando o GitHub Desktop:

8. Acesse **https://desktop.github.com** e instale o programa
9. Faça login com sua conta GitHub
10. Clique em "Add an Existing Repository from your Hard Drive"
11. Selecione a pasta `bolao2026` que você tem no computador
    (a pasta com todos os arquivos deste projeto)
12. Clique em "Publish repository"
13. Confirme publicando para o repositório `bolao-copa-2026`

✅ **Código no GitHub — feito!**

---

## PARTE 2 — SUPABASE (banco de dados gratuito)
**Tempo: ~15 minutos**

O Supabase é onde os dados de todos os participantes ficam salvos.

1. Acesse **https://supabase.com**
2. Clique em **"Start your project"**
3. Faça login com sua conta Google
4. Clique em **"New project"**
5. Preencha:
   - **Name:** `bolao-copa-2026`
   - **Database Password:** crie uma senha forte (anote ela!)
   - **Region:** escolha `South America (São Paulo)`
6. Clique em **"Create new project"** e aguarde ~2 minutos

### Criar o banco de dados

7. No menu lateral, clique em **"SQL Editor"**
8. Clique em **"New query"**
9. Abra o arquivo `supabase/migrations/001_schema.sql` deste projeto
10. Copie **todo o conteúdo** do arquivo
11. Cole no editor do Supabase
12. Clique em **"Run"** (botão verde)
13. Aguarde aparecer "Success" — isso cria todas as tabelas e jogos!

### Pegar as chaves de acesso

14. No menu lateral, clique em **"Settings"** → **"API"**
15. Copie e anote dois valores:
    - **Project URL** (parece: `https://xyzxyz.supabase.co`)
    - **anon public** key (uma chave longa)

### Ativar login com Google

16. Ainda em Settings, clique em **"Authentication"** → **"Providers"**
17. Clique em **"Google"**
18. Ative o toggle
19. Em "Authorized Client IDs" coloque `*` por enquanto
    (você pode configurar melhor depois)
20. Salve

✅ **Supabase configurado — feito!**

---

## PARTE 3 — VERCEL (hospedagem gratuita)
**Tempo: ~10 minutos**

A Vercel publica seu site na internet gratuitamente.

1. Acesse **https://vercel.com**
2. Clique em **"Sign Up"** → escolha **"Continue with GitHub"**
3. Autorize a Vercel a acessar seu GitHub
4. Na tela inicial, clique em **"Add New Project"**
5. Encontre o repositório `bolao-copa-2026` e clique em **"Import"**
6. Na tela de configuração, clique em **"Environment Variables"**
7. Adicione as seguintes variáveis (uma de cada vez):

| Nome | Valor |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Cole aqui o Project URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cole aqui a anon key do Supabase |

8. Clique em **"Deploy"**
9. Aguarde ~3 minutos — a Vercel vai construir e publicar o site

10. Ao finalizar, você verá um link como:
    **https://bolao-copa-2026-seunome.vercel.app**

✅ **Site no ar — feito!**

---

## PARTE 4 — CONFIGURAÇÕES FINAIS
**Tempo: ~5 minutos**

### Tornar-se administrador

1. Acesse seu site e faça login com seu e-mail ou Google
2. Coloque seu apelido quando pedido
3. Agora vá ao Supabase → **"Table Editor"** → tabela **"profiles"**
4. Encontre seu usuário e clique nele
5. Mude o campo `is_admin` de `false` para `true`
6. Salve

Pronto! Ao entrar no site agora, você verá a aba ⚙️ Admin.

### Configurar URL de redirecionamento (login Google)

1. No Supabase → Settings → Authentication → URL Configuration
2. Em "Site URL" coloque o seu link da Vercel
3. Em "Redirect URLs" clique em Add URL e coloque:
   `https://SEU-LINK.vercel.app/**`
4. Salve

---

## PARTE 5 — COMPARTILHAR COM OS AMIGOS

Mande o link para todo mundo pelo WhatsApp:

```
Pessoal! Tá aberto o Bolão da Copa 2026! 🏆⚽
Acesse: https://SEU-LINK.vercel.app
Faça login e comece a dar seus palpites!
```

Cada pessoa:
1. Acessa o link
2. Faz login com Google ou e-mail
3. Escolhe um apelido
4. Começa a palpitar!

---

## DURANTE A COPA — SEU PAPEL COMO ADMINISTRADOR

Depois de cada jogo encerrado:

1. Acesse o site e vá na aba **⚙️ Admin**
2. Selecione a fase (ex: Fase de Grupos)
3. Digite o placar oficial da partida encerrada
4. Clique em **"Salvar"**
5. O sistema calcula automaticamente os pontos de todos e atualiza o ranking!

---

## PONTUAÇÃO (para informar seus amigos)

| Situação | Pontos |
|----------|--------|
| Placar exato (ex: Brasil 2×1) | ⭐⭐⭐⭐⭐ 5 pts |
| Acertou o vencedor (ex: Brasil ganhou) | ⭐⭐⭐ 3 pts |
| Acertou que ia empatar | ⭐⭐⭐ 3 pts |
| Acertou a diferença de gols | ⭐⭐ 2 pts |
| Errou tudo | 0 pts |
| Campeão certo (especial) | 🏆 20 pts |
| Vice certo (especial) | 🥈 10 pts |
| Artilheiro certo (especial) | ⚽ 10 pts |

---

## PROBLEMAS COMUNS

**"Erro ao fazer login com Google"**
→ Verifique se configurou a URL de redirecionamento no Supabase (Parte 4)

**"Não consigo ver a aba Admin"**
→ Verifique se mudou o is_admin para true na tabela profiles do Supabase

**"Site não abre / erro de build"**
→ Verifique se as variáveis de ambiente da Vercel estão corretas

**Precisar de ajuda?**
→ Abra o Claude e descreva o erro — posso ajudar a resolver!

---

## CUSTOS

| Serviço | Plano gratuito |
|---------|---------------|
| GitHub | ✅ Gratuito para sempre |
| Supabase | ✅ Gratuito até 500MB de dados e 50.000 usuários/mês |
| Vercel | ✅ Gratuito para projetos pessoais |
| **Total** | **R$ 0,00** |

Para 20–50 participantes durante a Copa do Mundo, os limites gratuitos são mais que suficientes.

---

Bom bolão! 🇧🇷⚽🏆
