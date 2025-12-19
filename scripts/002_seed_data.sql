-- Seed test users
INSERT INTO users (pi_username, pi_address, role, display_name, bio, subscription_tier) VALUES
('test_creator', 'GTEST1CREATOR1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'creator', 'DJ Stellar', 'Electronic music producer and NFT pioneer', 'premium'),
('test_collector', 'GTEST2COLLECTOR2XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'collector', 'Music Lover', 'Collecting the best audio NFTs', 'free')
ON CONFLICT (pi_username) DO NOTHING;

-- Seed wallets
INSERT INTO user_wallets (user_id, pi_address, available_balance, lifetime_earnings)
SELECT id, pi_address, 100.00, 0 FROM users WHERE pi_username = 'test_creator'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_wallets (user_id, pi_address, available_balance, lifetime_earnings)
SELECT id, pi_address, 50.00, 0 FROM users WHERE pi_username = 'test_collector'
ON CONFLICT (user_id) DO NOTHING;

-- Seed test NFTs
INSERT INTO nfts (
  creator_id, 
  current_owner_id, 
  title, 
  description, 
  genre, 
  duration,
  audio_preview_url,
  cover_image_url,
  edition_type,
  total_editions,
  price,
  resale_royalty_percent,
  status
)
SELECT 
  (SELECT id FROM users WHERE pi_username = 'test_creator'),
  (SELECT id FROM users WHERE pi_username = 'test_creator'),
  'Stellar Waves',
  'An ambient journey through the cosmos with synthesizers and space sounds',
  'Electronic',
  245,
  '/placeholder.svg?height=400&width=400',
  '/placeholder.svg?height=400&width=400',
  'limited',
  100,
  10.00,
  10.00,
  'active'
WHERE NOT EXISTS (SELECT 1 FROM nfts WHERE title = 'Stellar Waves');
