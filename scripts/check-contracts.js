const StellarSdk = require('@stellar/stellar-sdk');

const CONTRACTS = {
  profiles: 'CDZOFXA2SH7MGETQZ55NSTABPGTFI3MBCQXZNIH5FWPFMPCNX3PVYEVS',
  nft: 'CDWCKCICMF2CQQ32V56BHBAMLXUAQYGOWYMY2UMUWCNNP5LVUPZS5O2H',
  marketplace: 'CB6CYMW3UUDM7BG4NYLAEZBKPVPZPVU3FRH7OMK4XPBK6LPN6RSBE2XZ',
};

async function checkContract(name, contractId) {
  try {
    const server = new StellarSdk.rpc.Server('https://soroban-testnet.stellar.org');
    
    console.log(`\nChecking ${name} contract: ${contractId}`);
    
    const contract = new StellarSdk.Contract(contractId);
    const randomKeypair = StellarSdk.Keypair.random();
    const sourceAccount = new StellarSdk.Account(randomKeypair.publicKey(), '0');
    
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: '100000',
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        contract.call('owner_of', StellarSdk.nativeToScVal(0, { type: 'u64' }))
      )
      .setTimeout(30)
      .build();
    
    transaction.sign(randomKeypair);
    const response = await server.simulateTransaction(transaction);
    
    if (response.error) {
      console.log(`❌ Status: Contract has ERROR`);
      console.log(`   Error: ${response.error}`);
      return false;
    } else {
      console.log(`✅ Status: Contract is ACTIVE and working`);
      return true;
    }
  } catch (error) {
    console.log(`❌ Error checking contract: ${error.message}`);
    return false;
  }
}

async function checkAllContracts() {
  console.log('='.repeat(60));
  console.log('STELLAR SOROBAN CONTRACT STATUS CHECK');
  console.log('Network: TESTNET');
  console.log('='.repeat(60));
  
  const results = {};
  
  for (const [name, contractId] of Object.entries(CONTRACTS)) {
    results[name] = await checkContract(name, contractId);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY:');
  console.log('='.repeat(60));
  
  for (const [name, isActive] of Object.entries(results)) {
    const status = isActive ? '✅ ACTIVE' : '❌ REVOKED/INACTIVE';
    console.log(`${name.padEnd(15)} : ${status}`);
  }
  
  console.log('='.repeat(60));
}

checkAllContracts().catch(console.error);