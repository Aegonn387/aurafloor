#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, String};

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
pub struct Subscription {
    pub subscriber: Address,
    pub service_id: Symbol,
    pub expires_at: u64,
    pub approved_periods_remaining: u32,
    pub last_charged_at: u64,
    pub trial_used: bool,
}

#[contract]
pub struct SubscriptionContract;

#[contractimpl]
impl SubscriptionContract {
    pub fn __constructor(e: &Env, admin: Address) {
        e.storage().instance().set(&Symbol::new(e, "admin"), &admin);
    }

    pub fn register_service(
        e: &Env,
        admin: Address,
        service_id: Symbol,
        price: i128,
        billing_period_days: u32,
        trial_period_days: u32,
        max_periods: u32,
    ) {
        admin.require_auth();
        let stored_admin: Address = e.storage().instance().get(&Symbol::new(e, "admin")).unwrap();
        if admin != stored_admin {
            panic!("unauthorized");
        }
        let config = ServiceConfig {
            price,
            billing_period_days,
            trial_period_days,
            max_periods,
            active: true,
        };
        e.storage().instance().set(&service_id, &config);
    }

    pub fn subscribe(
        e: &Env,
        subscriber: Address,
        service_id: Symbol,
        approve_periods: u32,
    ) {
        subscriber.require_auth();
        let config: ServiceConfig = e.storage().instance().get(&service_id).unwrap();
        if !config.active {
            panic!("service inactive");
        }
        if approve_periods == 0 || approve_periods > config.max_periods {
            panic!("invalid periods");
        }
        // Check if already subscribed (overwrite not allowed)
        let key = (subscriber.clone(), service_id.clone());
        if e.storage().instance().has(&key) {
            panic!("already subscribed");
        }
        let now = e.ledger().timestamp();
        let mut expires_at = now;
        let mut remaining = approve_periods;
        let mut trial_used = false;
        if config.trial_period_days > 0 {
            // Trial period: extend expiry without consuming periods
            expires_at = now + (config.trial_period_days as u64) * 86400;
            trial_used = true;
        } else {
            // Charge for first period (mock - just record)
            expires_at = now + (config.billing_period_days as u64) * 86400;
            remaining -= 1;
        }
        let subscription = Subscription {
            subscriber: subscriber.clone(),
            service_id: service_id.clone(),
            expires_at,
            approved_periods_remaining: remaining,
            last_charged_at: now,
            trial_used,
        };
        e.storage().instance().set(&key, &subscription);
    }

    pub fn renew(e: &Env, subscriber: Address, service_id: Symbol) {
        subscriber.require_auth();
        let key = (subscriber.clone(), service_id.clone());
        let mut sub: Subscription = e.storage().instance().get(&key).unwrap();
        let config: ServiceConfig = e.storage().instance().get(&service_id).unwrap();
        let now = e.ledger().timestamp();
        if now < sub.expires_at && sub.approved_periods_remaining > 0 {
            panic!("not yet due");
        }
        if sub.approved_periods_remaining > 0 {
            sub.approved_periods_remaining -= 1;
        } else {
            // In real contract, charge token here. For now we just update expiry.
            // We can add token transfer later.
        }
        sub.expires_at = now + (config.billing_period_days as u64) * 86400;
        sub.last_charged_at = now;
        e.storage().instance().set(&key, &sub);
    }

    pub fn cancel(e: &Env, subscriber: Address, service_id: Symbol) {
        subscriber.require_auth();
        let key = (subscriber, service_id);
        e.storage().instance().remove(&key);
    }

    pub fn get_subscription(e: &Env, subscriber: Address, service_id: Symbol) -> Option<Subscription> {
        let key = (subscriber, service_id);
        e.storage().instance().get(&key)
    }

    pub fn get_service(e: &Env, service_id: Symbol) -> Option<ServiceConfig> {
        e.storage().instance().get(&service_id)
    }

    pub fn set_service_active(e: &Env, admin: Address, service_id: Symbol, active: bool) {
        admin.require_auth();
        let stored_admin: Address = e.storage().instance().get(&Symbol::new(e, "admin")).unwrap();
        if admin != stored_admin {
            panic!("unauthorized");
        }
        let mut config: ServiceConfig = e.storage().instance().get(&service_id).unwrap();
        config.active = active;
        e.storage().instance().set(&service_id, &config);
    }
}
