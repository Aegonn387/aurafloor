-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pi_username VARCHAR(255) UNIQUE NOT NULL,
  pi_address VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('creator', 'collector')),
  display_name VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  email VARCHAR(255),
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  subscription_expires_at TIMESTAMP,
  messaging_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_pi_username ON users(pi_username);
CREATE INDEX idx_users_pi_address ON users(pi_address);
CREATE INDEX idx_users_role ON users(role);

-- Wallets table
CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  pi_address VARCHAR(255) NOT NULL,
  available_balance DECIMAL(20, 7) DEFAULT 0 CHECK (available_balance >= 0),
  pending_balance DECIMAL(20, 7) DEFAULT 0 CHECK (pending_balance >= 0),
  lifetime_earnings DECIMAL(20, 7) DEFAULT 0,
  lifetime_spent DECIMAL(20, 7) DEFAULT 0,
  last_payout_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wallets_user ON user_wallets(user_id);

-- NFTs table
CREATE TABLE IF NOT EXISTS nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blockchain_nft_id VARCHAR(255) UNIQUE,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_owner_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  genre VARCHAR(100),
  duration INTEGER, -- in seconds
  audio_preview_url TEXT,
  audio_standard_url TEXT,
  audio_hq_url TEXT,
  audio_ipfs_hash VARCHAR(255),
  cover_image_url TEXT,
  cover_image_ipfs_hash VARCHAR(255),
  metadata JSONB,
  edition_type VARCHAR(20) CHECK (edition_type IN ('limited', 'unlimited', 'one_of_one')),
  total_editions INTEGER,
  sold_count INTEGER DEFAULT 0,
  price DECIMAL(20, 7) NOT NULL,
  resale_royalty_percent DECIMAL(5, 2) DEFAULT 10.00 CHECK (resale_royalty_percent BETWEEN 5 AND 15),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'under_review', 'removed')),
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  blockchain_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_nfts_creator ON nfts(creator_id);
CREATE INDEX idx_nfts_owner ON nfts(current_owner_id);
CREATE INDEX idx_nfts_blockchain ON nfts(blockchain_nft_id);
CREATE INDEX idx_nfts_status ON nfts(status);
CREATE INDEX idx_nfts_genre ON nfts(genre);
CREATE INDEX idx_nfts_created ON nfts(created_at DESC);

-- NFT Ownership history
CREATE TABLE IF NOT EXISTS nft_ownership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nft_id UUID REFERENCES nfts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP DEFAULT NOW(),
  purchase_price DECIMAL(20, 7)
);

CREATE INDEX idx_ownership_nft ON nft_ownership(nft_id);
CREATE INDEX idx_ownership_user ON nft_ownership(user_id);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('purchase', 'resale', 'tip', 'mint_fee', 'subscription', 'ad_revenue', 'deposit', 'withdrawal')),
  from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  nft_id UUID REFERENCES nfts(id) ON DELETE SET NULL,
  amount DECIMAL(20, 7) NOT NULL,
  platform_fee DECIMAL(20, 7) DEFAULT 0,
  creator_royalty DECIMAL(20, 7) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'failed', 'refunded')),
  pi_payment_id VARCHAR(255) UNIQUE,
  blockchain_tx_hash VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_transactions_from ON transactions(from_user_id);
CREATE INDEX idx_transactions_to ON transactions(to_user_id);
CREATE INDEX idx_transactions_nft ON transactions(nft_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_pi_payment ON transactions(pi_payment_id);

-- Ledger entries (double-entry accounting)
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  account_type VARCHAR(50) CHECK (account_type IN ('wallet', 'escrow', 'pending', 'platform_revenue')),
  amount DECIMAL(20, 7) NOT NULL, -- Positive for credit, negative for debit
  balance_after DECIMAL(20, 7),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ledger_user ON ledger_entries(user_id);
CREATE INDEX idx_ledger_transaction ON ledger_entries(transaction_id);
CREATE INDEX idx_ledger_created ON ledger_entries(created_at DESC);

-- Stream logs
CREATE TABLE IF NOT EXISTS stream_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nft_id UUID REFERENCES nfts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  quality VARCHAR(20),
  duration_seconds INTEGER,
  watched_ad BOOLEAN DEFAULT false,
  ad_impression_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_streams_nft ON stream_logs(nft_id);
CREATE INDEX idx_streams_user ON stream_logs(user_id);
CREATE INDEX idx_streams_created ON stream_logs(created_at DESC);

-- Ad revenue distributions
CREATE TABLE IF NOT EXISTS ad_revenue_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  stream_count INTEGER DEFAULT 0,
  ad_impressions INTEGER DEFAULT 0,
  revenue_share DECIMAL(20, 7) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'calculated' CHECK (status IN ('calculated', 'paid', 'pending')),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ad_revenue_creator ON ad_revenue_distributions(creator_id);
CREATE INDEX idx_ad_revenue_period ON ad_revenue_distributions(period_start, period_end);

-- Community posts
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nft_id UUID REFERENCES nfts(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_nft ON posts(nft_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_created ON comments(created_at DESC);

-- Likes (polymorphic - can like posts, comments, NFTs)
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  likeable_type VARCHAR(50) NOT NULL CHECK (likeable_type IN ('post', 'comment', 'nft')),
  likeable_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, likeable_type, likeable_id)
);

CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_likes_likeable ON likes(likeable_type, likeable_id);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_from ON messages(from_user_id);
CREATE INDEX idx_messages_to ON messages(to_user_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reported_content_type VARCHAR(50) NOT NULL,
  reported_content_id UUID NOT NULL,
  reason VARCHAR(100) NOT NULL,
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_content ON reports(reported_content_type, reported_content_id);

-- Ad impressions
CREATE TABLE IF NOT EXISTS ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  nft_id UUID REFERENCES nfts(id) ON DELETE SET NULL,
  ad_network VARCHAR(100) DEFAULT 'pi_network',
  ad_type VARCHAR(50) CHECK (ad_type IN ('audio', 'video', 'banner')),
  revenue DECIMAL(20, 7) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ad_impressions_user ON ad_impressions(user_id);
CREATE INDEX idx_ad_impressions_nft ON ad_impressions(nft_id);
CREATE INDEX idx_ad_impressions_created ON ad_impressions(created_at DESC);
