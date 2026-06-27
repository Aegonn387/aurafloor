#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, symbol_short, Address, Env, Symbol};

const PLATFORM_FEE_BPS: i128 = 250;
const DEFAULT_ROYALTY_BPS: i128 = 500;

#[contracttype]
#[derive(Clone)]
pub struct Listing {
    pub seller: Address,
    pub nft_contract: Address,
    pub token_id: u32,          // changed from Symbol
    pub price: i128,
    pub royalty_bps: i128,
    pub active: bool,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
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
    pub fn __constructor(e: &Env, admin: Address) {
        e.storage().instance().set(&Symbol::new(e, "admin"), &admin);
    }

    pub fn list(
        e: &Env,
        seller: Address,
        nft_contract: Address,
        token_id: u32,           // changed from Symbol
        price: i128,
        royalty_bps: i128,
    ) -> Result<Symbol, MarketplaceError> {
        seller.require_auth();
        let listing_id = symbol_short!("lst");
        let listing = Listing {
            seller: seller.clone(),
            nft_contract: nft_contract.clone(),
            token_id,
            price,
            royalty_bps: if royalty_bps > 1500 { DEFAULT_ROYALTY_BPS } else { royalty_bps },
            active: true,
        };
        e.storage().persistent().set(&listing_id, &listing);
        Ok(listing_id)
    }

    pub fn buy(e: &Env, buyer: Address, listing_id: Symbol) -> Result<(), MarketplaceError> {
        buyer.require_auth();
        let storage = e.storage().persistent();
        let mut listing = storage.get::<Symbol, Listing>(&listing_id).ok_or(MarketplaceError::ListingNotFound)?;
        if !listing.active {
            return Err(MarketplaceError::ListingNotActive);
        }
        let platform_fee = listing.price * PLATFORM_FEE_BPS / 10000;
        let royalty = listing.price * listing.royalty_bps / 10000;
        let _seller_payment = listing.price - platform_fee - royalty;
        listing.active = false;
        storage.set(&listing_id, &listing);
        e.events().publish((symbol_short!("sale"),), (buyer, listing_id, listing.price));
        Ok(())
    }

    pub fn cancel(e: &Env, seller: Address, listing_id: Symbol) -> Result<(), MarketplaceError> {
        seller.require_auth();
        let storage = e.storage().persistent();
        let mut listing = storage.get::<Symbol, Listing>(&listing_id).ok_or(MarketplaceError::ListingNotFound)?;
        if listing.seller != seller {
            return Err(MarketplaceError::Unauthorized);
        }
        listing.active = false;
        storage.set(&listing_id, &listing);
        Ok(())
    }

    pub fn get_listing(e: &Env, listing_id: Symbol) -> Option<Listing> {
        e.storage().persistent().get(&listing_id)
    }
}
