const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'my-super-secret-key-make-it-long-2025');

export async function signToken(payload: any) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const b64Payload = btoa(JSON.stringify(payload));
  const dataToSign = `${header}.${b64Payload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    SECRET_KEY,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(dataToSign));
  
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${header}.${b64Payload}.${signatureBase64}`;
}

export async function verifyToken(token: string) {
  try {
    const [header, payload, signature] = token.split('.');
    if (!signature) return null;

    const dataToVerify = `${header}.${payload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      SECRET_KEY,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    let sigBase64 = signature.replace(/-/g, '+').replace(/_/g, '/');
    while (sigBase64.length % 4) sigBase64 += '=';
    
    const binarySig = atob(sigBase64);
    const signatureBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
        signatureBytes[i] = binarySig.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, new TextEncoder().encode(dataToVerify));
    if (!isValid) return null;

    return JSON.parse(atob(payload));
  } catch (e) {
    return null;
  }
}
