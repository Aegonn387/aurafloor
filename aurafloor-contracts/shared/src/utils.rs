#![no_std]
use soroban_sdk::{Address, Env, String, Vec};
use crate::{RoyaltyInfo, RoyaltySplit, RoyaltyError};

/// Validates a RoyaltyInfo struct to ensure it meets all requirements
/// - Basis points must be between 500 and 1500 (5% to 15%)
/// - If fixed, it cannot be changed later
/// - Total shares (main + additional) cannot exceed 10000 (100%)
pub fn validate_royalty_info(env: &Env, royalty_info: &RoyaltyInfo) -> Result<(), RoyaltyError> {
    // Check basis points range (5% to 15%)
    if royalty_info.basis_points < 500 {
        return Err(RoyaltyError::RoyaltyTooLow);
    }
    
    if royalty_info.basis_points > 1500 {
        return Err(RoyaltyError::RoyaltyTooHigh);
    }
    
    // Calculate total shares
    let mut total_shares = royalty_info.basis_points;
    
    for split in royalty_info.additional_payees.iter() {
        total_shares = total_shares.checked_add(split.share)
            .ok_or(RoyaltyError::SharesExceedLimit)?;
    }
    
    // Check total shares don't exceed 100%
    if total_shares > 10000 {
        return Err(RoyaltyError::SharesExceedLimit);
    }
    
    Ok(())
}

/// Calculates royalty amount for a given sale price and basis points
/// Formula: sale_amount * basis_points / 10000
pub fn calculate_royalty_amount(sale_amount: i128, basis_points: u32) -> i128 {
    // Use checked arithmetic to avoid overflow
    let basis_points_i128 = basis_points as i128;
    let numerator = sale_amount.checked_mul(basis_points_i128).unwrap_or(0);
    numerator.checked_div(10000).unwrap_or(0)
}

/// Distributes royalty payment among recipients
/// Returns a vector of (recipient_address, amount) pairs
pub fn distribute_royalty_payment(
    env: &Env,
    total_royalty_amount: i128,
    main_recipient: &Address,
    main_basis_points: u32,
    additional_payees: &Vec<RoyaltySplit>,
) -> Vec<(Address, i128)> {
    let mut distributions = Vec::new(env);
    
    // Calculate main recipient's share
    let main_amount = calculate_royalty_amount(total_royalty_amount, main_basis_points);
    distributions.push_back((main_recipient.clone(), main_amount));
    
    // Calculate remaining amount for additional payees
    let remaining_amount = total_royalty_amount.checked_sub(main_amount).unwrap_or(0);
    
    // Distribute to additional payees based on their shares
    for payee in additional_payees.iter() {
        let amount = calculate_royalty_amount(remaining_amount, payee.share);
        distributions.push_back((payee.payee.clone(), amount));
    }
    
    distributions
}

/// Validates that a royalty can be modified
/// Returns error if royalty is fixed and cannot be changed
pub fn can_modify_royalty(royalty_info: &RoyaltyInfo) -> Result<(), RoyaltyError> {
    if royalty_info.is_fixed {
        Err(RoyaltyError::RoyaltyFixed)
    } else {
        Ok(())
    }
}
