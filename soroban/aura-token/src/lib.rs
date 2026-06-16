#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Vec, String};
use soroban_token_sdk::TokenUtils;

const TOTAL_SUPPLY: i128 = 1_000_000_000_0000000;
const DECIMALS: u32 = 7;
const NAME: &str = "AuraToken";
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
    NotAuthorized = 8,
}

#[contract]
pub struct AuraToken;

#[contractimpl]
impl AuraToken {
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();
        let utils = TokenUtils::new(&env);
        utils.mint(&admin, &TOTAL_SUPPLY);
        env.storage().instance().set(&Symbol::new(&env, "admin"), &admin);
        env.storage().instance().set(&Symbol::new(&env, "initialized"), &true);
    }

    pub fn name(env: Env) -> String {
        String::from_str(&env, NAME)
    }

    pub fn symbol(env: Env) -> String {
        String::from_str(&env, SYMBOL)
    }

    pub fn decimals(env: Env) -> u32 {
        DECIMALS
    }

    pub fn total_supply(env: Env) -> i128 {
        TokenUtils::new(&env).total_supply()
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        TokenUtils::new(&env).balance(&id)
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        TokenUtils::new(&env).transfer(&from, &to, &amount);
    }

    pub fn approve(env: Env, from: Address, spender: Address, amount: i128, expiration_ledger: u32) {
        from.require_auth();
        TokenUtils::new(&env).approve(&from, &spender, &amount, &expiration_ledger);
    }

    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        TokenUtils::new(&env).allowance(&from, &spender)
    }

    pub fn stake(
        env: Env,
        staker: Address,
        amount: i128,
        stake_type: Symbol,
        lockup_seconds: u64,
    ) -> Result<(), TokenError> {
        staker.require_auth();
        let min = match stake_type {
            s if s == Symbol::new(&env, "moderation") => MIN_MODERATION_BOND,
            s if s == Symbol::new(&env, "dao") => MIN_DAO_STAKE,
            s if s == Symbol::new(&env, "writer") => MIN_WRITER_STAKE,
            _ => return Err(TokenError::InvalidStakeType),
        };
        if amount < min {
            return Err(TokenError::BelowMinimumStake);
        }
        let balance = TokenUtils::new(&env).balance(&staker);
        if balance < amount {
            return Err(TokenError::InsufficientBalance);
        }
        TokenUtils::new(&env).transfer(&staker, &env.current_contract_address(), &amount);
        let storage = env.storage().persistent();
        let mut stakes: Vec<StakeEntry> = storage
            .get(&staker)
            .unwrap_or_else(|| Vec::new(&env));
        stakes.push_back(StakeEntry {
            amount,
            lockup_end: env.ledger().timestamp() + lockup_seconds,
            stake_type,
        });
        storage.set(&staker, &stakes);
        Ok(())
    }

    pub fn unstake(env: Env, staker: Address, index: u32) -> Result<(), TokenError> {
        staker.require_auth();
        let storage = env.storage().persistent();
        let mut stakes: Vec<StakeEntry> = storage
            .get(&staker)
            .ok_or(TokenError::StakeNotFound)?;
        let idx = index as usize;
        if idx >= stakes.len() {
            return Err(TokenError::StakeNotFound);
        }
        let entry = stakes.get(index).unwrap();
        if env.ledger().timestamp() < entry.lockup_end {
            return Err(TokenError::StillLocked);
        }
        stakes.remove(index);
        storage.set(&staker, &stakes);
        TokenUtils::new(&env).transfer(&env.current_contract_address(), &staker, &entry.amount);
        Ok(())
    }

    pub fn get_stakes(env: Env, staker: Address) -> Vec<StakeEntry> {
        env.storage()
            .persistent()
            .get(&staker)
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn burn(env: Env, burner: Address, amount: i128, burn_type: Symbol) -> Result<(), TokenError> {
        burner.require_auth();
        let balance = TokenUtils::new(&env).balance(&burner);
        if balance < amount {
            return Err(TokenError::InsufficientBalance);
        }
        let burn_amount = if burn_type == Symbol::new(&env, "subscription") {
            amount * BURN_RATE_BPS / 10000
        } else {
            amount
        };
        let dead = Address::from_string(&env, "dead");
        TokenUtils::new(&env).transfer(&burner, &dead, &burn_amount);
        if burn_type == Symbol::new(&env, "subscription") {
            let admin: Address = env.storage().instance().get(&Symbol::new(&env, "admin")).unwrap();
            TokenUtils::new(&env).transfer(&burner, &admin, &(amount - burn_amount));
        }
        Ok(())
    }

    pub fn transfer_with_burn(
        env: Env,
        from: Address,
        to: Address,
        amount: i128,
        burn_bps: i128,
    ) -> Result<(), TokenError> {
        from.require_auth();
        let balance = TokenUtils::new(&env).balance(&from);
        if balance < amount {
            return Err(TokenError::InsufficientBalance);
        }
        let burn_amount = amount * burn_bps / 10000;
        let dead = Address::from_string(&env, "dead");
        if burn_amount > 0 {
            TokenUtils::new(&env).transfer(&from, &dead, &burn_amount);
        }
        TokenUtils::new(&env).transfer(&from, &to, &(amount - burn_amount));
        Ok(())
    }

    pub fn distribute_rewards(
        env: Env,
        admin: Address,
        recipients: Vec<(Address, i128)>,
    ) -> Result<(), TokenError> {
        admin.require_auth();
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&Symbol::new(&env, "admin"))
            .unwrap();
        if admin != stored_admin {
            return Err(TokenError::NotAuthorized);
        }
        for (rec, amt) in recipients.iter() {
            TokenUtils::new(&env).transfer(&admin, &rec, &amt);
        }
        Ok(())
    }

    pub fn admin_balance(env: Env) -> i128 {
        let admin: Address = env
            .storage()
            .instance()
            .get(&Symbol::new(&env, "admin"))
            .unwrap();
        TokenUtils::new(&env).balance(&admin)
    }
}
