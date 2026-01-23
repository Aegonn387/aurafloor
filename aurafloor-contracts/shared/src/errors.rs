#![no_std]
use soroban_sdk::{contracterror, String};

/// Contract errors for royalty validation and operations
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum RoyaltyError {
    /// Royalty percentage below minimum (5%)
    RoyaltyTooLow = 1001,
    
    /// Royalty percentage above maximum (15%)
    RoyaltyTooHigh = 1002,
    
    /// Invalid royalty configuration
    InvalidRoyaltyConfig = 1003,
    
    /// Royalty is fixed and cannot be changed
    RoyaltyFixed = 1004,
    
    /// Royalty payment failed
    PaymentFailed = 1005,
    
    /// Total shares exceed 100%
    SharesExceedLimit = 1006,
}

impl RoyaltyError {
    /// Convert error to human-readable string
    pub fn to_string(&self, env: &soroban_sdk::Env) -> String {
        match self {
            RoyaltyError::RoyaltyTooLow => 
                String::from_str(env, "Royalty must be at least 5% (500 basis points)"),
            RoyaltyError::RoyaltyTooHigh => 
                String::from_str(env, "Royalty cannot exceed 15% (1500 basis points)"),
            RoyaltyError::InvalidRoyaltyConfig => 
                String::from_str(env, "Invalid royalty configuration"),
            RoyaltyError::RoyaltyFixed => 
                String::from_str(env, "Royalty is fixed and cannot be changed"),
            RoyaltyError::PaymentFailed => 
                String::from_str(env, "Royalty payment failed"),
            RoyaltyError::SharesExceedLimit => 
                String::from_str(env, "Total royalty shares exceed 100%"),
        }
    }
}
