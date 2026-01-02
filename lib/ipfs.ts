import { PinataSDK } from "pinata";

// Initialize with JWT (NOT API key/secret anymore)
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL,
});

// Accept either Node Buffer or browser File
export async function pinToIPFS(file: File | Buffer, filename?: string): Promise<string> {
  let upload;
  const options = filename ? { metadata: { name: filename } } : undefined;

  // Handle File (Browser) or Buffer (Node) appropriately
  if (file instanceof File) {
    // Browser environment
    upload = await pinata.upload.public.file(file, options);
  } else {
    // Node.js environment - convert Buffer to stream
    const { Readable } = require('stream');
    const stream = Readable.from(file);
    upload = await pinata.upload.public.file(stream, options);
  }

  // Return the CID (not IpfsHash anymore)
  return upload.cid;
}
