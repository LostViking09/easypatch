export async function compressData(data: any): Promise<string> {
  if (typeof CompressionStream === 'undefined') {
    throw new Error('Your browser does not support CompressionStream.');
  }

  const jsonStr = JSON.stringify(data);
  const textEncoder = new TextEncoder();
  const binaryData = textEncoder.encode(jsonStr);

  const cs = new CompressionStream('deflate-raw');
  const writer = cs.writable.getWriter();
  writer.write(binaryData);
  writer.close();

  const compressedArrayBuffer = await new Response(cs.readable).arrayBuffer();
  const compressedBytes = new Uint8Array(compressedArrayBuffer);
  
  // Convert to Base64
  let binaryStr = '';
  // process in chunks if large, but patches are small enough
  for (let i = 0; i < compressedBytes.byteLength; i++) {
    binaryStr += String.fromCharCode(compressedBytes[i]);
  }
  const base64 = btoa(binaryStr);
  
  // Convert to Base64 URL Safe
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function decompressData(base64url: string): Promise<any> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Your browser does not support DecompressionStream.');
  }

  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }

  const binaryStr = atob(base64);
  const compressedBytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    compressedBytes[i] = binaryStr.charCodeAt(i);
  }

  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(compressedBytes);
  writer.close();

  const decompressedArrayBuffer = await new Response(ds.readable).arrayBuffer();
  const textDecoder = new TextDecoder();
  const jsonStr = textDecoder.decode(decompressedArrayBuffer);
  
  return JSON.parse(jsonStr);
}
