#![no_std]
use soroban_sdk::{contracttype, Address, String, Vec};

/// Royalty Information for Creators
/// Ensures 5-15% royalty on perpetuity for secondary sales
#[derive(Clone)]
#[contracttype]
pub struct RoyaltyInfo {
    /// Creator/Artist address (receives royalties)
    pub recipient: Address,
    
    /// Royalty percentage in basis points (100 = 1%, 500 = 5%, 1500 = 15%)
    /// Must be between 500 and 1500 (5% to 15%)
    pub basis_points: u32,
    
    /// Additional payees for splits (e.g., co-writers, producers)
    pub additional_payees: Vec<RoyaltySplit>,
    
    /// Whether royalty is fixed (cannot be changed) - for perpetuity
    pub is_fixed: bool,
}

/// Royalty split for multiple recipients
#[derive(Clone)]
#[contracttype]
pub struct RoyaltySplit {
    /// Payee address
    pub payee: Address,
    
    /// Percentage share (basis points)
    pub share: u32,
}

/// Simple validation for royalty percentage
/// Returns true if basis_points is between 500 and 1500 (5% to 15%)
pub fn is_valid_royalty_percentage(basis_points: u32) -> bool {
    basis_points >= 500 && basis_points <= 1500
}
