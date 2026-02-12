import { useState, useEffect, useCallback } from 'react'

export function useNFTData() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNFTByTokenId = useCallback(async (identifier: string): Promise<any | null> => {
    setLoading(true)
    setError(null)

    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)
      const param = isUUID ? 'nftId' : 'tokenId'

      const response = await fetch(
        `/.netlify/functions/get-nft-data?${param}=${encodeURIComponent(identifier)}`
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error ${response.status}: ${errorText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch NFT')
      }

      return result.data
    } catch (err) {
      console.error('❌ [useNFTData] Fetch failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMultipleNFTs = useCallback(async (identifiers: string[]): Promise<any[]> => {
    const promises = identifiers.map(id => fetchNFTByTokenId(id))
    const results = await Promise.all(promises)
    return results.filter((nft): nft is any => nft !== null)
  }, [fetchNFTByTokenId])

  const preloadNFT = useCallback(async (identifier: string) => {
    const cacheKey = `nft_${identifier}`
    const cached = sessionStorage.getItem(cacheKey)

    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {
        // Cache corrupted, fetch fresh
      }
    }

    const nft = await fetchNFTByTokenId(identifier)
    if (nft) {
      sessionStorage.setItem(cacheKey, JSON.stringify(nft))
    }
    return nft
  }, [fetchNFTByTokenId])

  return {
    fetchNFTByTokenId,
    fetchMultipleNFTs,
    preloadNFT,
    loading,
    error,
    clearError: () => setError(null),
  }
}

export function usePlayerNFTData(trackId?: string) {
  const { fetchNFTByTokenId, loading, error } = useNFTData()
  const [nftData, setNftData] = useState<any | null>(null)
  const [audioTrack, setAudioTrack] = useState<any>(null)

  useEffect(() => {
    if (!trackId) return

    const currentTrackId = trackId
    
    async function load() {
      const data = await fetchNFTByTokenId(currentTrackId)
      if (data) {
        setNftData(data)
        // Just use the data directly as audioTrack
        setAudioTrack({
          id: data.id || data.blockchain_token_id,
          title: data.title,
          artist: data.creator_display_name,
          coverUrl: data.cover_ipfs_cid ? `https://ipfs.io/ipfs/${data.cover_ipfs_cid}` : '',
          audioUrl: data.standard_audio_url || data.preview_audio_url || '',
          duration: data.duration || 180,
          price: data.price || 0,
          owned: false,
        })
      }
    }

    load()
  }, [trackId, fetchNFTByTokenId])

  const getBlockchainInfo = useCallback(() => {
    if (!nftData) return null

    return {
      tokenId: nftData.blockchain_token_id,
      title: nftData.title,
      creator: nftData.creator_display_name,
      creatorWallet: nftData.creator_pi_address,
      owner: nftData.owner_display_name,
      transactionHash: nftData.mint_transaction_hash,
      mintDate: nftData.transaction_date,
      status: nftData.nft_status,
      royalty: nftData.royalty,
      price: nftData.price,
      explorerUrl: nftData.mint_transaction_hash
        ? `https://testnet.piscan.io/transaction/${nftData.mint_transaction_hash}`
        : null,
      audioUrls: {
        preview: nftData.preview_audio_url,
        standard: nftData.standard_audio_url,
        hq: nftData.high_quality_audio_url,
      },
      ipfs: {
        audio: nftData.audio_ipfs_cid ? `https://ipfs.io/ipfs/${nftData.audio_ipfs_cid}` : null,
        cover: nftData.cover_ipfs_cid ? `https://ipfs.io/ipfs/${nftData.cover_ipfs_cid}` : null,
      },
    }
  }, [nftData])

  return {
    nftData,
    audioTrack,
    blockchainInfo: getBlockchainInfo(),
    loading,
    error,
    hasBlockchainData: !!nftData?.blockchain_token_id,
    hasTransaction: !!nftData?.mint_transaction_hash,
  }
}
