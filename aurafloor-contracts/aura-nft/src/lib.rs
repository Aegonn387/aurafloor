#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, String, symbol_short};
use shared::{RoyaltyInfo, validate_royalty_info, RoyaltyError};

#[contract]
pub struct AuraNFT;

#[contractimpl]
impl AuraNFT {
    /// Initialize the NFT contract
    pub fn initialize(
        env: Env,
        admin: Address,
        name: String,
        symbol: String,
        base_uri: String,
    ) {
        // Only allow initialization once
        if env.storage().instance().has(&"initialized") {
            panic!("Contract already initialized");
        }
        
        // Store contract metadata
        env.storage().instance().set(&"admin", &admin);
        env.storage().instance().set(&"name", &name);
        env.storage().instance().set(&"symbol", &symbol);
        env.storage().instance().set(&"base_uri", &base_uri);
        env.storage().instance().set(&"next_token_id", &0u64);
        env.storage().instance().set(&"initialized", &true);
    }
    
    /// Mint a new audio NFT with royalty information
    /// @param metadata_ipfs_cid: Pinata IPFS CID for audio metadata
    /// @param audio_r2_url: Cloudflare R2 URL for audio file
    /// @param royalty_info: Royalty configuration (5-15%, fixed perpetuity)
    pub fn mint(
        env: Env,
        minter: Address,
        metadata_ipfs_cid: String,
        audio_r2_url: String,
        royalty_info: RoyaltyInfo,
    ) -> Result<u64, RoyaltyError> {
        // Verify minter authorization
        minter.require_auth();
        
        // Validate royalty information (5-15%, etc.)
        validate_royalty_info(&env, &royalty_info)?;
        
        // Generate token ID
        let next_id: u64 = env.storage().instance().get(&"next_token_id").unwrap();
        env.storage().instance().set(&"next_token_id", &(next_id + 1));
        
        // Store token owner
        let owner_key = (symbol_short!("owner"), next_id);
        env.storage().instance().set(&owner_key, &minter);
        
        // Store royalty info
        let royalty_key = (symbol_short!("royalty"), next_id);
        env.storage().instance().set(&royalty_key, &royalty_info);
        
        // Store IPFS CID for metadata
        let cid_key = (symbol_short!("ipfs"), next_id);
        env.storage().instance().set(&cid_key, &metadata_ipfs_cid);
        
        // Store R2 URL
        let url_key = (symbol_short!("r2url"), next_id);
        env.storage().instance().set(&url_key, &audio_r2_url);
        
        // Emit mint event
        env.events().publish(
            (symbol_short!("mint"), symbol_short!("token")),
            (next_id, minter, metadata_ipfs_cid)
        );
        
        Ok(next_id)
    }
    
    /// Transfer NFT from one address to another
    /// Only the current owner can transfer their NFT
    pub fn transfer(
        env: Env,
        from: Address,
        to: Address,
        token_id: u64,
    ) -> Result<(), String> {
        // Verify the sender is authorized
        from.require_auth();
        
        // Check if token exists
        let owner_key = (symbol_short!("owner"), token_id);
        let current_owner: Option<Address> = env.storage().instance().get(&owner_key);
        
        match current_owner {
            Some(owner) => {
                // Verify the sender is the current owner
                if owner != from {
                    return Err(String::from_str(&env, "Sender is not the owner of this token"));
                }
                
                // Transfer ownership
                env.storage().instance().set(&owner_key, &to);
                
                // Emit transfer event
                env.events().publish(
                    (symbol_short!("transfer"), symbol_short!("token")),
                    (token_id, from, to)
                );
                
                Ok(())
            }
            None => Err(String::from_str(&env, "Token does not exist"))
        }
    }
    
    /// Get token URI (IPFS metadata URL)
    pub fn token_uri(env: Env, token_id: u64) -> String {
        let base_uri: String = env.storage().instance().get(&"base_uri").unwrap();
        let cid_key = (symbol_short!("ipfs"), token_id);
        let cid: String = env.storage().instance().get(&cid_key).unwrap_or(String::from_str(&env, ""));
        
        if cid.is_empty() {
            String::from_str(&env, "")
        } else {
            String::from_str(&env, &format!("ipfs://{}/{}", base_uri, cid))
        }
    }
    
    /// Get royalty information for a token
    pub fn get_royalty_info(env: Env, token_id: u64) -> Option<RoyaltyInfo> {
        let royalty_key = (symbol_short!("royalty"), token_id);
        env.storage().instance().get(&royalty_key)
    }
    
    /// Get token owner
    pub fn owner_of(env: Env, token_id: u64) -> Option<Address> {
        let owner_key = (symbol_short!("owner"), token_id);
        env.storage().instance().get(&owner_key)
    }
}
