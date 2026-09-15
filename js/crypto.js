const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function sha256Hex(text) {
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function deriveKey(phone, saltText, iterations) {
  const password = await crypto.subtle.importKey(
    'raw',
    encoder.encode(phone),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(saltText),
      iterations,
      hash: 'SHA-256'
    },
    password,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

function fromBase64(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

export async function decryptGroupLink(phone, record, securityConfig) {
  const key = await deriveKey(
    phone,
    securityConfig.deriveSalt,
    securityConfig.pbkdf2Iterations
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(record.iv) },
    key,
    fromBase64(record.ciphertext)
  );

  return decoder.decode(plaintext);
}
