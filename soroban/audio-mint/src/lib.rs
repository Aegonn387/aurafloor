#![no_std]

extern crate alloc;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Symbol};

#[contracttype]
#[derive(Clone)]
pub struct Token {
    pub owner: Address,
    pub uri: String,
    pub audio_url: String,
    pub royalty_receiver: Address,
    pub royalty_bps: u32,
}

#[contract]
pub struct AudioMint;

#[contractimpl]
impl AudioMint {
    pub fn __constructor(e: &Env, admin: Address) {
        e.storage().instance().set(&Symbol::new(e, "admin"), &admin);
        e.storage().instance().set(&Symbol::new(e, "next_id"), &0u32);
    }

    pub fn mint(
        e: &Env,
        to: Address,
        metadata_cid: String,
        audio_url: String,
        royalty_receiver: Address,
        royalty_bps: u32,
    ) -> u32 {
        let admin: Address = e.storage().instance().get(&Symbol::new(e, "admin")).unwrap();
        admin.require_auth();

        let capped_bps = if royalty_bps > 1500 { 1500 } else { royalty_bps };

        let mut next_id: u32 = e.storage().instance().get(&Symbol::new(e, "next_id")).unwrap_or(0);
        let token_id = next_id;
        next_id += 1;
        e.storage().instance().set(&Symbol::new(e, "next_id"), &next_id);

        // Store metadata_cid directly as the URI (no conversion needed)
        let token = Token {
            owner: to.clone(),
            uri: metadata_cid,
            audio_url,
            royalty_receiver,
            royalty_bps: capped_bps,
        };
        let token_key = (Symbol::new(e, "token"), token_id);
        e.storage().persistent().set(&token_key, &token);
        e.storage().persistent().set(&(Symbol::new(e, "owner"), token_id), &to);
        token_id
    }

    pub fn transfer(e: &Env, from: Address, to: Address, token_id: u32) {
        from.require_auth();
        let token_key = (Symbol::new(e, "token"), token_id);
        let mut token: Token = e.storage().persistent().get(&token_key).unwrap();
        if token.owner != from {
            panic!("not owner");
        }
        token.owner = to.clone();
        e.storage().persistent().set(&token_key, &token);
        e.storage().persistent().set(&(Symbol::new(e, "owner"), token_id), &to);
    }

    pub fn owner_of(e: &Env, token_id: u32) -> Option<Address> {
        e.storage().persistent().get(&(Symbol::new(e, "owner"), token_id))
    }

    pub fn token_uri(e: &Env, token_id: u32) -> Option<String> {
        let token: Option<Token> = e.storage().persistent().get(&(Symbol::new(e, "token"), token_id));
        token.map(|t| t.uri)
    }

    pub fn audio_url(e: &Env, token_id: u32) -> Option<String> {
        let token: Option<Token> = e.storage().persistent().get(&(Symbol::new(e, "token"), token_id));
        token.map(|t| t.audio_url)
    }

    pub fn royalty_info(e: &Env, token_id: u32) -> Option<(Address, u32)> {
        let token: Option<Token> = e.storage().persistent().get(&(Symbol::new(e, "token"), token_id));
        token.map(|t| (t.royalty_receiver, t.royalty_bps))
    }

    pub fn set_royalty(e: &Env, admin: Address, token_id: u32, receiver: Address, bps: u32) {
        admin.require_auth();
        let stored_admin: Address = e.storage().instance().get(&Symbol::new(e, "admin")).unwrap();
        if admin != stored_admin {
            panic!("unauthorized");
        }
        let capped_bps = if bps > 1500 { 1500 } else { bps };
        let token_key = (Symbol::new(e, "token"), token_id);
        let mut token: Token = e.storage().persistent().get(&token_key).unwrap();
        token.royalty_receiver = receiver;
        token.royalty_bps = capped_bps;
        e.storage().persistent().set(&token_key, &token);
    }
}
