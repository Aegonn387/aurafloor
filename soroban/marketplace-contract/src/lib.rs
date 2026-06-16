#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol};

#[contracttype]
#[derive(Clone)]
pub struct Service {
    pub price: i128,
    pub period_days: u32,
    pub active: bool,
}

#[contracttype]
#[derive(Clone)]
pub struct Subscription {
    pub subscriber: Address,
    pub service_id: Symbol,
    pub expires_at: u64,
    pub periods_paid: u32,
}

#[contract]
pub struct SubscriptionContract;

#[contractimpl]
impl SubscriptionContract {
    pub fn __constructor(e: &Env, admin: Address) {
        e.storage().instance().set(&Symbol::new(e, "admin"), &admin);
    }

    pub fn create_service(e: &Env, admin: Address, service_id: Symbol, price: i128, period_days: u32) {
        admin.require_auth();
        let stored_admin: Address = e.storage().instance().get(&Symbol::new(e, "admin")).unwrap();
        if admin != stored_admin { panic!("unauthorized"); }
        let service = Service { price, period_days, active: true };
        e.storage().instance().set(&service_id, &service);
    }

    pub fn subscribe(e: &Env, subscriber: Address, service_id: Symbol, periods: u32) {
        subscriber.require_auth();
        let service: Service = e.storage().instance().get(&service_id).unwrap();
        if !service.active { panic!("service inactive"); }
        if periods == 0 { panic!("invalid periods"); }
        let key = (subscriber.clone(), service_id.clone());
        if e.storage().instance().has(&key) { panic!("already subscribed"); }
        let now = e.ledger().timestamp();
        let expires_at = now + (service.period_days as u64) * 86400 * periods as u64;
        let sub = Subscription {
            subscriber: subscriber.clone(),
            service_id: service_id.clone(),
            expires_at,
            periods_paid: periods,
        };
        e.storage().instance().set(&key, &sub);
    }

    pub fn renew(e: &Env, subscriber: Address, service_id: Symbol) {
        subscriber.require_auth();
        let key = (subscriber.clone(), service_id.clone());
        let mut sub: Subscription = e.storage().instance().get(&key).unwrap();
        let service: Service = e.storage().instance().get(&service_id).unwrap();
        if !service.active { panic!("service inactive"); }
        let now = e.ledger().timestamp();
        if now < sub.expires_at { panic!("not expired yet"); }
        sub.expires_at = now + (service.period_days as u64) * 86400;
        sub.periods_paid += 1;
        e.storage().instance().set(&key, &sub);
    }

    pub fn cancel(e: &Env, subscriber: Address, service_id: Symbol) {
        subscriber.require_auth();
        let key = (subscriber, service_id);
        e.storage().instance().remove(&key);
    }

    pub fn get_subscription(e: &Env, subscriber: Address, service_id: Symbol) -> Option<Subscription> {
        e.storage().instance().get(&(subscriber, service_id))
    }

    pub fn get_service(e: &Env, service_id: Symbol) -> Option<Service> {
        e.storage().instance().get(&service_id)
    }

    pub fn set_service_active(e: &Env, admin: Address, service_id: Symbol, active: bool) {
        admin.require_auth();
        let stored_admin: Address = e.storage().instance().get(&Symbol::new(e, "admin")).unwrap();
        if admin != stored_admin { panic!("unauthorized"); }
        let mut service: Service = e.storage().instance().get(&service_id).unwrap();
        service.active = active;
        e.storage().instance().set(&service_id, &service);
    }
}
