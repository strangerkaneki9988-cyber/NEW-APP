create table if not exists public.notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    text text not null,
    mood text,
    music jsonb,
    audience text not null default 'public' check (audience in ('public', 'followers', 'private')),
    created_at timestamptz not null default now(),
    expires_at timestamptz not null default (now() + interval '24 hours'),
    constraint notes_text_length check (char_length(trim(text)) > 0 and char_length(trim(text)) <= 60)
);

alter table public.notes enable row level security;

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'notes'
          and policyname = 'Users can view allowed notes'
    ) then
        create policy "Users can view allowed notes"
        on public.notes
        for select
        to authenticated
        using (
            auth.uid() = user_id
            or audience = 'public'
            or (
                audience = 'followers'
                and exists (
                    select 1
                    from public.follows f
                    where f.follower_id = auth.uid()
                      and f.following_id = notes.user_id
                )
            )
        );
    end if;

    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'notes'
          and policyname = 'Users can create their own notes'
    ) then
        create policy "Users can create their own notes"
        on public.notes
        for insert
        to authenticated
        with check (
            auth.uid() = user_id
            and char_length(trim(text)) > 0
            and char_length(trim(text)) <= 60
        );
    end if;

    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'notes'
          and policyname = 'Users can update their own notes'
    ) then
        create policy "Users can update their own notes"
        on public.notes
        for update
        to authenticated
        using (auth.uid() = user_id)
        with check (
            auth.uid() = user_id
            and char_length(trim(text)) > 0
            and char_length(trim(text)) <= 60
        );
    end if;

    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'notes'
          and policyname = 'Users can delete their own notes'
    ) then
        create policy "Users can delete their own notes"
        on public.notes
        for delete
        to authenticated
        using (auth.uid() = user_id);
    end if;
end
$$;

create index if not exists idx_notes_user_created_at
    on public.notes (user_id, created_at desc);

create index if not exists idx_notes_expires_at
    on public.notes (expires_at);
