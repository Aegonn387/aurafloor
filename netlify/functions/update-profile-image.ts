import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { imageBase64, userPiAddress } = JSON.parse(event.body || '{}');
    if (!imageBase64 || !userPiAddress) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing image or user address' }) };
    }
    // In production, upload to IPFS/Arweave and pin. For now, return a mock URL.
    const mockUrl = `https://avatar.aurafloor.co/${userPiAddress.slice(0,8)}.png`;
    console.log('[UpdateProfileImage] Saved image for', userPiAddress);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, url: mockUrl }),
    };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
