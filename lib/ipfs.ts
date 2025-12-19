import { PinataSDK } from "pinata-web3"

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud",
})

export async function pinToIPFS(file: File | Buffer): Promise<string> {
  const upload = await pinata.upload.file(file)
  return upload.IpfsHash
}

export async function pinJSONToIPFS(json: object): Promise<string> {
  const upload = await pinata.upload.json(json)
  return upload.IpfsHash
}

export async function getFromIPFS(hash: string): Promise<any> {
  const data = await pinata.gateways.get(hash)
  return data.data
}

export function getIPFSUrl(hash: string): string {
  return `https://${process.env.PINATA_GATEWAY || "gateway.pinata.cloud"}/ipfs/${hash}`
}
