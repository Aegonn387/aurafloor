import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import * as StellarSdk from '@stellar/stellar-sdk';

const sql = neon(process.env.DATABASE_URL!);
const PI_RPC_URL = process.env.PI_RPC_URL || 'https://api.testnet.minepi.com';
const NETWORK_PASSPHRASE = process.env.PI_NETWORK_PASSPHRASE || 'Pi Testnet';
const AURA_TOKEN_CONTRACT = process.env.AURA_TOKEN_CONTRACT || '';
const BURNER_SECRET_KEY = process.env.BURNER_SECRET_KEY || '';

interface CompleteSubscriptionRequest {
  paymentId: string;
  planId: string;
  userPiAddress: string;
  role: 'collector' | 'creator';
  price: number;
  durationDays: number;
  token?: 'pi' | 'aura';
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
  }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const body = JSON.parse(event.body || '{}') as CompleteSubscriptionRequest;
    const { paymentId, planId, userPiAddress, role, price, durationDays, token } = body;
    if (!paymentId || !planId || !userPiAddress || !role) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const plans = await sql`SELECT id, tier FROM subscription_plans WHERE id = ${planId} AND plan_type = ${role} AND is_active = true LIMIT 1`;
    if (plans.length === 0) return { statusCode: 404, body: JSON.stringify({ error: 'Plan not found' }) };

    const plan = plans[0];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (durationDays || 30));

    const existing = await sql`SELECT id FROM user_subscriptions WHERE user_pi_address = ${userPiAddress}`;
    if (existing.length > 0) {
      await sql`UPDATE user_subscriptions SET plan_id = ${plan.id}, tier = ${plan.tier}, plan_type = ${role}, status = 'active', expires_at = ${expiresAt.toISOString()}, last_payment_amount = ${price}, last_payment_date = NOW(), total_paid = total_paid + ${price}, updated_at = NOW() WHERE user_pi_address = ${userPiAddress}`;
    } else {
      await sql`INSERT INTO user_subscriptions (user_pi_address, plan_id, tier, plan_type, status, expires_at, last_payment_amount, last_payment_date, total_paid, created_at, updated_at) VALUES (${userPiAddress}, ${plan.id}, ${plan.tier}, ${role}, 'active', ${expiresAt.toISOString()}, ${price}, NOW(), ${price}, NOW(), NOW())`;
    }

    // AURA burn
    if (token === 'aura' && AURA_TOKEN_CONTRACT && BURNER_SECRET_KEY) {
      try {
        const server = new StellarSdk.SorobanRpc.Server(PI_RPC_URL);
        const burnerKeypair = StellarSdk.Keypair.fromSecret(BURNER_SECRET_KEY);
        const burnerAccount = await server.getAccount(burnerKeypair.publicKey());
        const contract = new StellarSdk.Contract(AURA_TOKEN_CONTRACT);
        const burnAmount = BigInt(Math.round(price * 1e7)); // convert Pi to stroops
        const tx = new StellarSdk.TransactionBuilder(burnerAccount, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: NETWORK_PASSPHRASE,
        })
          .addOperation(contract.call('burn',
            new StellarSdk.Address(burnerKeypair.publicKey()),
            StellarSdk.nativeToScVal(burnAmount, { type: 'i128' }),
            StellarSdk.nativeToScVal('subscription', { type: 'symbol' }),
          ))
          .setTimeout(180)
          .build();
        const sim = await server.simulateTransaction(tx);
        if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(sim)) {
          const prepared = StellarSdk.SorobanRpc.assembleTransaction(tx, sim);
          prepared.sign(burnerKeypair);
          await server.sendTransaction(prepared);
          console.log('AURA burn tx sent');
        }
      } catch (burnErr) {
        console.error('AURA burn failed:', burnErr);
        // non-fatal: subscription still activated
      }
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, tier: plan.tier, expires_at: expiresAt.toISOString() }) };
  } catch (error: any) {
    console.error('[Complete Subscription] Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
