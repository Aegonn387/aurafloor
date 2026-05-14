#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol};

#[contracttype]
#[derive(Clone)]
pub struct ServiceConfig {
    pub price: i128,
    pub billing_period_days: u32,
    pub trial_period_days: u32,
    pub max_periods: u32,
    pub active: bool,
}

#[contracttype]
#[derive(Clone)]
pub struct SubscriptionState {
    pub subscriber: Address,
    pub service_id: Symbol,
    pub expires_at: u64,
    pub approved_periods_remaining: u32,
    pub last_charged_at: u64,
}

#[contracttype]
pub enum ContractError {
    ServiceAlreadyExists = 1,
    ServiceNotFound = 2,
    SubscriptionNotFound = 3,
    InsufficientAllowance = 4,
    NotDue = 5,
}

#[contract]
pub struct SubscriptionContract;

#[contractimpl]
impl SubscriptionContract {
    pub fn register_service(
        env: Env, admin: Address, service_id: Symbol,
        price: i128, billing_period_days: u32, trial_period_days: u32, max_periods: u32,
    ) -> Result<(), ContractError> {
        admin.require_auth();
        let existing = env.storage().instance().get::<Symbol, ServiceConfig>(&service_id);
        if existing.is_some() { return Err(ContractError::ServiceAlreadyExists); }
        env.storage().instance().set(&service_id, &ServiceConfig {
            price, billing_period_days, trial_period_days, max_periods, active: true
        });
        Ok(())
    }

    pub fn subscribe(
        env: Env, subscriber: Address, service_id: Symbol, approve_periods: u32,
    ) -> Result<(), ContractError> {
        subscriber.require_auth();
        let config = env.storage().instance().get::<Symbol, ServiceConfig>(&service_id)
            .ok_or(ContractError::ServiceNotFound)?;
        if approve_periods > config.max_periods || approve_periods == 0 {
            return Err(ContractError::InsufficientAllowance);
        }
        let now = env.ledger().timestamp();
        let expires_at = now + ((config.billing_period_days as u64) * 86400);
        env.storage().instance().set(&subscriber, &SubscriptionState {
            subscriber: subscriber.clone(), service_id: service_id.clone(),
            expires_at, approved_periods_remaining: approve_periods, last_charged_at: now,
        });
        Ok(())
    }

    pub fn process(env: Env, merchant: Address) -> Result<u32, ContractError> {
        merchant.require_auth();
        Ok(0)
    }

    pub fn cancel(env: Env, subscriber: Address) -> Result<(), ContractError> {
        subscriber.require_auth();
        let state = env.storage().instance().get::<Address, SubscriptionState>(&subscriber)
            .ok_or(ContractError::SubscriptionNotFound)?;
        env.storage().instance().remove(&subscriber);
        Ok(())
    }

    pub fn get_subscription(env: Env, subscriber: Address) -> Option<SubscriptionState> {
        env.storage().instance().get::<Address, SubscriptionState>(&subscriber)
    }
}
