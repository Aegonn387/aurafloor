#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, Symbol, Vec};

const PLATFORM_FEE_BPS: i128 = 250; // 2.5%
const DEFAULT_ROYALTY_BPS: i128 = 500; // 5%

#[contracttype]
#[derive(Clone)]
pub struct Listing {
    pub seller: Address,
    pub nft_contract: Address,
    pub token_id: Symbol,
    pub price: i128,
    pub royalty_bps: i128,
    pub active: bool,
}

#[contracttype]
pub enum MarketplaceError {
    ListingNotFound = 1,
    ListingNotActive = 2,
    InsufficientPayment = 3,
    Unauthorized = 4,
    TransferFailed = 5,
}

#[contract]
pub struct MarketplaceContract;

#[contractimpl]
impl MarketplaceContract {
    pub fn list(
        env: Env,
        seller: Address,
        nft_contract: Address,
        token_id: Symbol,
        price: i128,
        royalty_bps: i128,
    ) -> Result<(), MarketplaceError> {
        seller.require_auth();
        let storage = env.storage().persistent();
        let listing_id = Self::make_listing_id(&seller, &nft_contract, &token_id);
        if storage.get::<Symbol, Listing>(&listing_id).is_some() {
            // Update existing listing
        }
        storage.set(&listing_id, &Listing {
            seller: seller.clone(),
            nft_contract,
            token_id: token_id.clone(),
            price,
            royalty_bps: if royalty_bps > 1500 { DEFAULT_ROYALTY_BPS } else { royalty_bps },
            active: true,
        });
        Ok(())
    }

    pub fn buy(env: Env, buyer: Address, listing_id: Symbol) -> Result<(), MarketplaceError> {
        buyer.require_auth();
        let storage = env.storage().persistent();
        let mut listing = storage.get::<Symbol, Listing>(&listing_id).ok_or(MarketplaceError::ListingNotFound)?;
        if !listing.active { return Err(MarketplaceError::ListingNotActive); }

        // Platform fee
        let platform_fee = listing.price * PLATFORM_FEE_BPS / 10000;
        // Creator royalty
        let royalty = listing.price * listing.royalty_bps / 10000;
        // Seller earnings
        let seller_payment = listing.price - platform_fee - royalty;

        // In a full implementation: transfer Pi from buyer to seller/treasury/creator via token contract.
        // Here we record the sale and deactivate the listing.
        listing.active = false;
        storage.set(&listing_id, &listing);

        // Emit event (log for now)
        env.events().publish((Symbol::short("sale"),), (buyer, listing_id, listing.price));
        Ok(())
    }

    pub fn cancel(env: Env, seller: Address, listing_id: Symbol) -> Result<(), MarketplaceError> {
        seller.require_auth();
        let storage = env.storage().persistent();
        let mut listing = storage.get::<Symbol, Listing>(&listing_id).ok_or(MarketplaceError::ListingNotFound)?;
        if listing.seller != seller { return Err(MarketplaceError::Unauthorized); }
        listing.active = false;
        storage.set(&listing_id, &listing);
        Ok(())
    }

    pub fn get_listing(env: Env, listing_id: Symbol) -> Option<Listing> {
        env.storage().persistent().get(&listing_id)
    }

    fn make_listing_id(seller: &Address, nft_contract: &Address, token_id: &Symbol) -> Symbol {
        let mut s = String::new();
        s.push_str(&seller.to_string());
        s.push('_');
        s.push_str(&nft_contract.to_string());
        s.push('_');
        s.push_str(&token_id.to_string());
        Symbol::short(&s[..32.min(s.len())])
    }
}
