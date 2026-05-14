#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Vec, token};
use soroban_token_sdk::TokenUtils;

const TOTAL_SUPPLY: i128 = 1_000_000_000_0000000;
const DECIMALS: u32 = 7;
const NAME: &str = "Aurafloor Token";
const SYMBOL: &str = "AURA";
const BURN_RATE_BPS: i128 = 2000;
const MIN_MODERATION_BOND: i128 = 500_0000000;
const MIN_DAO_STAKE: i128 = 100_0000000;
const MIN_WRITER_STAKE: i128 = 100_0000000;

#[contracttype]
#[derive(Clone)]
pub struct StakeEntry {
    pub amount: i128,
    pub lockup_end: u64,
    pub stake_type: Symbol,
}

#[contracttype]
pub enum TokenError {
    InsufficientBalance = 1,
    InsufficientAllowance = 2,
    TransferFailed = 3,
    StakeNotFound = 4,
    StillLocked = 5,
    InvalidStakeType = 6,
    BelowMinimumStake = 7,
}

#[contract]
pub struct AuraToken;

#[contractimpl]
impl AuraToken {
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();
        let storage = env.storage().instance();
        storage.set(&Symbol::short("admin"), &admin);
        storage.set(&Symbol::short("initialized"), &true);
        token::StellarAssetClient::new(&env, &env.current_contract_address())
            .mint(&admin, &TOTAL_SUPPLY);
    }

    pub fn name() -> Symbol { Symbol::short(NAME) }
    pub fn symbol() -> Symbol { Symbol::short(SYMBOL) }
    pub fn decimals() -> u32 { DECIMALS }
    pub fn total_supply(env: Env) -> i128 {
        token::TokenClient::new(&env, &env.current_contract_address()).total_supply()
    }

    pub fn stake(env: Env, staker: Address, amount: i128, stake_type: Symbol, lockup_seconds: u64) -> Result<(), TokenError> {
        staker.require_auth();
        let min = match stake_type {
            s if s == Symbol::short("moderation") => MIN_MODERATION_BOND,
            s if s == Symbol::short("dao") => MIN_DAO_STAKE,
            s if s == Symbol::short("writer") => MIN_WRITER_STAKE,
            _ => return Err(TokenError::InvalidStakeType),
        };
        if amount < min { return Err(TokenError::BelowMinimumStake); }
        let tok = token::TokenClient::new(&env, &env.current_contract_address());
        if tok.balance(&staker) < amount { return Err(TokenError::InsufficientBalance); }
        tok.transfer(&env.current_contract_address(), &staker, &amount);
        let storage = env.storage().persistent();
        let mut stakes: Vec<StakeEntry> = storage.get(&staker).unwrap_or(Vec::new(&env));
        stakes.push_back(StakeEntry { amount, lockup_end: env.ledger().timestamp() + lockup_seconds, stake_type });
        storage.set(&staker, &stakes);
        Ok(())
    }

    pub fn unstake(env: Env, staker: Address, index: u32) -> Result<(), TokenError> {
        staker.require_auth();
        let storage = env.storage().persistent();
        let mut stakes: Vec<StakeEntry> = storage.get(&staker).ok_or(TokenError::StakeNotFound)?;
        if index as usize >= stakes.len() { return Err(TokenError::StakeNotFound); }
        let entry = stakes.get(index as u32).unwrap();
        if env.ledger().timestamp() < entry.lockup_end { return Err(TokenError::StillLocked); }
        stakes.remove(index as u32);
        storage.set(&staker, &stakes);
        token::TokenClient::new(&env, &env.current_contract_address())
            .transfer(&staker, &env.current_contract_address(), &entry.amount);
        Ok(())
    }

    pub fn get_stakes(env: Env, staker: Address) -> Vec<StakeEntry> {
        env.storage().persistent().get(&staker).unwrap_or(Vec::new(&env))
    }

    pub fn burn(env: Env, burner: Address, amount: i128, burn_type: Symbol) -> Result<(), TokenError> {
        burner.require_auth();
        let tok = token::TokenClient::new(&env, &env.current_contract_address());
        if tok.balance(&burner) < amount { return Err(TokenError::InsufficientBalance); }
        let burn_amount = match burn_type {
            s if s == Symbol::short("subscription") => amount * BURN_RATE_BPS / 10000,
            s if s == Symbol::short("promotion") => amount,
            _ => amount,
        };
        let dead = Address::from_string_bytes(&env, &[0u8; 32]);
        tok.transfer(&burner, &dead, &burn_amount);
        if burn_type == Symbol::short("subscription") {
            let admin: Address = env.storage().instance().get(&Symbol::short("admin")).unwrap();
            tok.transfer(&burner, &admin, &(amount - burn_amount));
        }
        Ok(())
    }

    pub fn transfer_with_burn(env: Env, from: Address, to: Address, amount: i128, burn_bps: i128) -> Result<(), TokenError> {
        from.require_auth();
        let tok = token::TokenClient::new(&env, &env.current_contract_address());
        if tok.balance(&from) < amount { return Err(TokenError::InsufficientBalance); }
        let burn_amount = amount * burn_bps / 10000;
        let dead = Address::from_string_bytes(&env, &[0u8; 32]);
        if burn_amount > 0 { tok.transfer(&from, &dead, &burn_amount); }
        tok.transfer(&from, &to, &(amount - burn_amount));
        Ok(())
    }

    pub fn distribute_rewards(env: Env, admin: Address, recipients: Vec<(Address, i128)>) -> Result<(), TokenError> {
        admin.require_auth();
        let stored: Address = env.storage().instance().get(&Symbol::short("admin")).unwrap();
        if admin != stored { return Err(TokenError::TransferFailed); }
        let tok = token::TokenClient::new(&env, &env.current_contract_address());
        for (rec, amt) in recipients.iter() {
            tok.transfer(&admin, &rec, &amt);
        }
        Ok(())
    }

    pub fn admin_balance(env: Env) -> i128 {
        let admin: Address = env.storage().instance().get(&Symbol::short("admin")).unwrap();
        token::TokenClient::new(&env, &env.current_contract_address()).balance(&admin)
    }

#[contractimpl]
impl token::Interface for AuraToken {
    fn balance(env: Env, id: Address) -> i128 {
        token::TokenClient::new(&env, &env.current_contract_address()).balance(&id)
    }
    fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        token::TokenClient::new(&env, &env.current_contract_address()).transfer(&from, &to, &amount);
    }
    fn approve(env: Env, from: Address, spender: Address, amount: i128, expiration_ledger: u32) {
        from.require_auth();
        token::TokenClient::new(&env, &env.current_contract_address())
            .approve(&from, &spender, &amount, &expiration_ledger);
    }
    fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        token::TokenClient::new(&env, &env.current_contract_address()).allowance(&from, &spender)
    }
}
