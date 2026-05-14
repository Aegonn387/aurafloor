import { Handler } from '@netlify/functions';

const followers: Record<string, string[]> = {}; // simple in‑memory store (replace with DB)

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'POST') {
    const { follower, following, action } = JSON.parse(event.body || '{}');
    if (!follower || !following || !action) return { statusCode: 400, body: 'Missing fields' };
    if (!followers[following]) followers[following] = [];
    if (action === 'follow') {
      if (!followers[following].includes(follower)) followers[following].push(follower);
    } else if (action === 'unfollow') {
      followers[following] = followers[following].filter(f => f !== follower);
    }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, count: followers[following].length }) };
  }
  if (event.httpMethod === 'GET') {
    const username = event.queryStringParameters?.username;
    if (!username) return { statusCode: 400, body: 'Missing username' };
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ followers: (followers[username] || []).length, following: 0 }) };
  }
  return { statusCode: 405, body: 'Method Not Allowed' };
};
