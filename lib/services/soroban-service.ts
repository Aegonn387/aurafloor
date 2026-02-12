// lib/services/soroban-service.ts - DATABASE ONLY (No Contract Calls)
import { sql } from '@/lib/db/neon';

export interface SorobanNFT {
    id: string;
    owner: string;
    token_uri?: string;
    royalty_info?: any;
}

export class SorobanService {
    async getNFTsByIds(tokenIds: string[]): Promise<SorobanNFT[]> {
        try {
            if (tokenIds.length === 0) return [];

            // Create parameter placeholders
            const placeholders = tokenIds.map((_, i) => `$${i + 1}`).join(',');
            const query = `SELECT bnid as id, ownerid as owner, aipfs as token_uri FROM n WHERE bnid IN (${placeholders})`;
            
            console.log('[SorobanService] Query:', query);
            console.log('[SorobanService] Token IDs:', tokenIds);
            
            // Execute query with parameters - using string call
            const results = await sql(query, ...tokenIds);
            
            console.log('[SorobanService] Found records:', results.length);

            return results.map((row: any) => ({
                id: row.id,
                owner: row.owner,
                token_uri: row.token_uri,
                royalty_info: undefined
            }));
        } catch (error) {
            console.error('[SorobanService] Database error:', error);
            return [];
        }
    }

    async getNFTById(tokenId: string): Promise<SorobanNFT | null> {
        const results = await this.getNFTsByIds([tokenId]);
        return results[0] || null;
    }
}

export const sorobanService = new SorobanService();