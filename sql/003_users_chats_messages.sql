-- Users, chats, and messages for SolarGPT chat persistence.
-- Run in Neon after 002_add_county_seal_url.sql.

CREATE TABLE IF NOT EXISTS solargpt.users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS solargpt.chats (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES solargpt.users(id) ON DELETE CASCADE,
  title      TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  archived   BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_chats_user_updated ON solargpt.chats(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS solargpt.messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id    UUID NOT NULL REFERENCES solargpt.chats(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata   JSONB
);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON solargpt.messages(chat_id, created_at ASC);
