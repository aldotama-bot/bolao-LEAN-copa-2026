-- ============================================================
-- BOLÃO COPA DO MUNDO 2026 — Schema completo para Supabase
-- ============================================================

-- EXTENSÕES
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABELAS
-- ============================================================

-- Perfis de usuário (complementa o auth.users do Supabase)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  apelido text not null,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Times participantes
create table public.teams (
  id serial primary key,
  nome text not null,
  bandeira text not null,
  grupo char(1) not null
);

-- Partidas
create table public.matches (
  id serial primary key,
  fase text not null, -- 'Fase de Grupos','Oitavas','Quartas','Semifinais','3º Lugar','Final'
  grupo text,
  home_team_id int references public.teams(id),
  away_team_id int references public.teams(id),
  home_label text, -- para fases finais: '1A','2B' etc antes de definir times
  away_label text,
  data_jogo date,
  hora_jogo time,
  estadio text,
  home_score int,
  away_score int,
  encerrado boolean default false,
  created_at timestamptz default now()
);

-- Palpites
create table public.predictions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  match_id int references public.matches(id) on delete cascade,
  home_score int not null,
  away_score int not null,
  pontos int default 0,
  updated_at timestamptz default now(),
  unique(user_id, match_id)
);

-- Palpites especiais (campeão, vice, artilheiro)
create table public.special_predictions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique,
  champion_team_id int references public.teams(id),
  runner_team_id int references public.teams(id),
  top_scorer_name text,
  champion_pts int default 0,
  runner_pts int default 0,
  top_scorer_pts int default 0,
  updated_at timestamptz default now()
);

-- Ranking (calculado por trigger)
create table public.ranking (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  total_pts int default 0,
  exact_scores int default 0,
  correct_winner int default 0,
  total_predictions int default 0,
  updated_at timestamptz default now()
);

-- Hall da fama
create table public.hall_of_fame (
  id serial primary key,
  ano int not null,
  user_id uuid references public.profiles(id),
  apelido text not null,
  total_pts int not null,
  created_at timestamptz default now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
create index idx_predictions_user on public.predictions(user_id);
create index idx_predictions_match on public.predictions(match_id);
create index idx_matches_fase on public.matches(fase);
create index idx_ranking_pts on public.ranking(total_pts desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.predictions enable row level security;
alter table public.special_predictions enable row level security;
alter table public.ranking enable row level security;
alter table public.matches enable row level security;
alter table public.teams enable row level security;
alter table public.hall_of_fame enable row level security;

-- Profiles: cada um vê o próprio, todos podem ver todos (ranking)
create policy "Perfis visíveis a todos" on public.profiles for select using (true);
create policy "Usuário edita próprio perfil" on public.profiles for update using (auth.uid() = id);
create policy "Usuário cria próprio perfil" on public.profiles for insert with check (auth.uid() = id);

-- Predictions: todos veem, só o dono edita
create policy "Palpites visíveis a todos" on public.predictions for select using (true);
create policy "Usuário cria próprio palpite" on public.predictions for insert with check (auth.uid() = user_id);
create policy "Usuário edita próprio palpite" on public.predictions for update using (auth.uid() = user_id);

-- Special predictions
create policy "Especiais visíveis a todos" on public.special_predictions for select using (true);
create policy "Usuário cria especial" on public.special_predictions for insert with check (auth.uid() = user_id);
create policy "Usuário edita especial" on public.special_predictions for update using (auth.uid() = user_id);

-- Ranking: todos veem
create policy "Ranking visível a todos" on public.ranking for select using (true);
create policy "Sistema atualiza ranking" on public.ranking for all using (true);

-- Matches e teams: todos veem, só admin edita
create policy "Partidas visíveis a todos" on public.matches for select using (true);
create policy "Admin edita partidas" on public.matches for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "Times visíveis a todos" on public.teams for select using (true);
create policy "Admin edita times" on public.teams for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Hall da fama: todos veem
create policy "Hall visível a todos" on public.hall_of_fame for select using (true);

-- ============================================================
-- FUNÇÃO: Calcular pontos de um palpite
-- ============================================================
create or replace function public.calcular_pontos(
  real_home int, real_away int,
  pred_home int, pred_away int
) returns int language plpgsql as $$
declare
  real_winner text;
  pred_winner text;
begin
  if real_home = pred_home and real_away = pred_away then
    return 5; -- placar exato
  end if;
  real_winner := case when real_home > real_away then 'H' when real_home < real_away then 'A' else 'D' end;
  pred_winner := case when pred_home > pred_away then 'H' when pred_home < pred_away then 'A' else 'D' end;
  if real_winner = pred_winner and real_winner = 'D' then
    return 3; -- acertou empate
  end if;
  if real_winner = pred_winner then
    return 3; -- acertou vencedor
  end if;
  if (real_home - real_away) = (pred_home - pred_away) then
    return 2; -- acertou saldo
  end if;
  return 0;
end;
$$;

-- ============================================================
-- FUNÇÃO + TRIGGER: Recalcular ranking ao salvar palpite
-- ============================================================
create or replace function public.recalcular_ranking(p_user_id uuid)
returns void language plpgsql as $$
declare
  v_total int := 0;
  v_exact int := 0;
  v_winner int := 0;
  v_count int := 0;
  v_special_pts int := 0;
begin
  select
    coalesce(sum(pontos),0),
    coalesce(sum(case when pontos=5 then 1 else 0 end),0),
    coalesce(sum(case when pontos>=3 then 1 else 0 end),0),
    count(*)
  into v_total, v_exact, v_winner, v_count
  from public.predictions
  where user_id = p_user_id;

  select coalesce(champion_pts,0) + coalesce(runner_pts,0) + coalesce(top_scorer_pts,0)
  into v_special_pts
  from public.special_predictions
  where user_id = p_user_id;

  insert into public.ranking(user_id, total_pts, exact_scores, correct_winner, total_predictions, updated_at)
  values (p_user_id, v_total + coalesce(v_special_pts,0), v_exact, v_winner, v_count, now())
  on conflict (user_id) do update set
    total_pts = excluded.total_pts,
    exact_scores = excluded.exact_scores,
    correct_winner = excluded.correct_winner,
    total_predictions = excluded.total_predictions,
    updated_at = now();
end;
$$;

-- Trigger: ao encerrar uma partida, recalcula pontos de todos
create or replace function public.on_match_closed()
returns trigger language plpgsql as $$
declare
  v_user_id uuid;
  v_pts int;
begin
  if NEW.encerrado = true and OLD.encerrado = false then
    for v_user_id in (select user_id from public.predictions where match_id = NEW.id) loop
      select public.calcular_pontos(NEW.home_score, NEW.away_score, p.home_score, p.away_score)
      into v_pts
      from public.predictions p
      where p.user_id = v_user_id and p.match_id = NEW.id;

      update public.predictions
      set pontos = v_pts
      where user_id = v_user_id and match_id = NEW.id;

      perform public.recalcular_ranking(v_user_id);
    end loop;
  end if;
  return NEW;
end;
$$;

create trigger trg_match_closed
after update on public.matches
for each row execute function public.on_match_closed();

-- Trigger: ao salvar palpite, recalcula ranking daquele usuário
create or replace function public.on_prediction_saved()
returns trigger language plpgsql as $$
declare v_pts int;
begin
  select public.calcular_pontos(m.home_score, m.away_score, NEW.home_score, NEW.away_score)
  into v_pts
  from public.matches m where m.id = NEW.match_id;
  NEW.pontos := coalesce(v_pts, 0);
  NEW.updated_at := now();
  return NEW;
end;
$$;

create trigger trg_prediction_saved
before insert or update on public.predictions
for each row execute function public.on_prediction_saved();

-- ============================================================
-- DADOS INICIAIS: Times da Copa 2026
-- ============================================================
insert into public.teams (nome, bandeira, grupo) values
('Brasil','🇧🇷','C'),('Argentina','🇦🇷','A'),('França','🇫🇷','E'),
('Inglaterra','🏴󠁧󠁢󠁥󠁮󠁧󠁿','F'),('Espanha','🇪🇸','B'),('Alemanha','🇩🇪','B'),
('Portugal','🇵🇹','H'),('Holanda','🇳🇱','D'),('Uruguai','🇺🇾','A'),
('Colômbia','🇨🇴','C'),('México','🇲🇽','D'),('EUA','🇺🇸','A'),
('Canadá','🇨🇦','B'),('Japão','🇯🇵','E'),('Coreia do Sul','🇰🇷','G'),
('Marrocos','🇲🇦','F'),('Senegal','🇸🇳','G'),('Nigéria','🇳🇬','H'),
('Bélgica','🇧🇪','E'),('Croácia','🇭🇷','D'),('Sérvia','🇷🇸','G'),
('Suíça','🇨🇭','H'),('Austrália','🇦🇺','C'),('Equador','🇪🇨','F'),
('Polônia','🇵🇱','A'),('Turquia','🇹🇷','C'),('Arábia Saudita','🇸🇦','B'),
('Irã','🇮🇷','D'),('Peru','🇵🇪','G'),('Nova Zelândia','🇳🇿','H'),
('Eslovênia','🇸🇮','E'),('Guatemala','🇬🇹','F'),('Panamá','🇵🇦','A'),
('Jamaica','🇯🇲','B'),('Venezuela','🇻🇪','D'),('Chile','🇨🇱','H'),
('Costa Rica','🇨🇷','C'),('Malta','🇲🇹','E'),('Argélia','🇩🇿','F'),
('Gana','🇬🇭','G'),('República Checa','🇨🇿','A'),('Irlanda','🇮🇪','B'),
('Cazaquistão','🇰🇿','E'),('Congo','🇨🇩','H'),('Albânia','🇦🇱','G'),
('Indonésia','🇮🇩','C'),('Qatar','🇶🇦','D'),('Escócia','🏴󠁧󠁢󠁳󠁣󠁴󠁿','F');

-- ============================================================
-- DADOS INICIAIS: Jogos da Fase de Grupos (amostra)
-- Os demais podem ser adicionados pelo admin no painel
-- ============================================================
-- Grupo A
insert into public.matches (fase,grupo,home_team_id,away_team_id,data_jogo,hora_jogo) values
('Fase de Grupos','Grupo A',2,9,'2026-06-11','16:00'),
('Fase de Grupos','Grupo A',12,25,'2026-06-11','19:00'),
('Fase de Grupos','Grupo A',33,41,'2026-06-15','16:00'),
('Fase de Grupos','Grupo A',2,12,'2026-06-15','19:00'),
('Fase de Grupos','Grupo A',9,25,'2026-06-19','16:00'),
('Fase de Grupos','Grupo A',41,33,'2026-06-19','19:00');
-- Grupo B
insert into public.matches (fase,grupo,home_team_id,away_team_id,data_jogo,hora_jogo) values
('Fase de Grupos','Grupo B',5,6,'2026-06-12','16:00'),
('Fase de Grupos','Grupo B',13,27,'2026-06-12','19:00'),
('Fase de Grupos','Grupo B',34,42,'2026-06-16','16:00'),
('Fase de Grupos','Grupo B',5,13,'2026-06-16','19:00'),
('Fase de Grupos','Grupo B',6,27,'2026-06-20','16:00'),
('Fase de Grupos','Grupo B',42,34,'2026-06-20','19:00');
-- Grupo C
insert into public.matches (fase,grupo,home_team_id,away_team_id,data_jogo,hora_jogo) values
('Fase de Grupos','Grupo C',1,10,'2026-06-13','16:00'),
('Fase de Grupos','Grupo C',23,26,'2026-06-13','19:00'),
('Fase de Grupos','Grupo C',37,46,'2026-06-17','16:00'),
('Fase de Grupos','Grupo C',1,23,'2026-06-17','19:00'),
('Fase de Grupos','Grupo C',10,26,'2026-06-21','16:00'),
('Fase de Grupos','Grupo C',46,37,'2026-06-21','19:00');

-- Fases eliminatórias (times a definir)
insert into public.matches (fase,home_label,away_label,data_jogo) values
('Oitavas','1A','2B','2026-06-29'),('Oitavas','1C','2D','2026-06-29'),
('Oitavas','1B','2A','2026-06-30'),('Oitavas','1D','2C','2026-06-30'),
('Oitavas','1E','2F','2026-07-01'),('Oitavas','1G','2H','2026-07-01'),
('Oitavas','1F','2E','2026-07-02'),('Oitavas','1H','2G','2026-07-02'),
('Quartas','W1','W2','2026-07-05'),('Quartas','W3','W4','2026-07-05'),
('Quartas','W5','W6','2026-07-06'),('Quartas','W7','W8','2026-07-06'),
('Semifinais','W9','W10','2026-07-10'),('Semifinais','W11','W12','2026-07-10'),
('3º Lugar','L1','L2','2026-07-13'),
('Final','W13','W14','2026-07-19');
