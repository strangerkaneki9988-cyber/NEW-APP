create table if not exists public.story_mentions (
    id uuid primary key default gen_random_uuid(),
    story_id uuid not null references public.stories(id) on delete cascade,
    mentioned_user_id uuid not null references auth.users(id) on delete cascade,
    mentioned_by_user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),

    constraint story_mentions_unique_user
        unique (story_id, mentioned_user_id)
);

alter table public.story_mentions enable row level security;

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'story_mentions'
          and policyname = 'Users can view their story mentions'
    ) then
        create policy "Users can view their story mentions"
        on public.story_mentions
        for select
        to authenticated
        using (
            auth.uid() = mentioned_user_id
            or auth.uid() = mentioned_by_user_id
        );
    end if;

    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'story_mentions'
          and policyname = 'Story owners can create mentions'
    ) then
        create policy "Story owners can create mentions"
        on public.story_mentions
        for insert
        to authenticated
        with check (
            auth.uid() = mentioned_by_user_id
            and exists (
                select 1
                from public.stories
                where stories.id = story_id
                  and stories.user_id = auth.uid()
            )
            and mentioned_user_id <> auth.uid()
        );
    end if;

    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'story_mentions'
          and policyname = 'Story owners can update mentions'
    ) then
        create policy "Story owners can update mentions"
        on public.story_mentions
        for update
        to authenticated
        using (auth.uid() = mentioned_by_user_id)
        with check (auth.uid() = mentioned_by_user_id);
    end if;
end
$$;

-- Additive policy: it does not replace existing story visibility policies.
do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'stories'
          and policyname = 'Mentioned users can view active stories'
    ) then
        create policy "Mentioned users can view active stories"
        on public.stories
        for select
        to authenticated
        using (
            expires_at > now()
            and exists (
                select 1
                from public.story_mentions
                where story_mentions.story_id = stories.id
                  and story_mentions.mentioned_user_id = auth.uid()
            )
        );
    end if;
end
$$;

-- Required only if notifications does not already allow this existing client-side insert.
do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'notifications'
          and policyname = 'Users can create story mention notifications'
    ) then
        create policy "Users can create story mention notifications"
        on public.notifications
        for insert
        to authenticated
        with check (
            auth.uid() = actor_id
            and type = 'story_mention'
            and exists (
                select 1
                from public.story_mentions
                where story_mentions.story_id = notifications.post_id
                  and story_mentions.mentioned_user_id = notifications.user_id
                  and story_mentions.mentioned_by_user_id = auth.uid()
            )
        );
    end if;
end
$$;
