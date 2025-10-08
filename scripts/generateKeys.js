// File: scripts/generateKeys.js
// Generated: 2025-10-08 13:05:17 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_thyk9qdtzv6o


const crypto = require('crypto');


const fs = require('fs');


const path = require('path');

/**
 * Generate RSA key pairs for JWT signing
 * Creates keys directory and generates private/public key pairs
 */


const generateKeys = () => {
  try {
    // Create keys directory if it doesn't exist
    const keysDir = path.join(__dirname, '..', 'keys');
    if (!fs.existsSync(keysDir)) {
      fs.mkdirSync(keysDir, { recursive: true });
      console.log('Created keys directory');
    }

    // Generate RSA key pair for access tokens
    console.log('Generating RSA key pair for access tokens...');
    const { privateKey: accessPrivateKey, publicKey: accessPublicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    // Generate RSA key pair for refresh tokens
    console.log('Generating RSA key pair for refresh tokens...');
    const { privateKey: refreshPrivateKey, publicKey: refreshPublicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    // Write access token keys
    fs.writeFileSync(path.join(keysDir, 'access_private.key'), accessPrivateKey);
    fs.writeFileSync(path.join(keysDir, 'access_public.key'), accessPublicKey);
    console.log('Access token keys saved');

    // Write refresh token keys
    fs.writeFileSync(path.join(keysDir, 'refresh_private.key'), refreshPrivateKey);
    fs.writeFileSync(path.join(keysDir, 'refresh_public.key'), refreshPublicKey);
    console.log('Refresh token keys saved');

    // Set appropriate permissions (read-only for private keys)
    if (process.platform !== 'win32') {
      fs.chmodSync(path.join(keysDir, 'access_private.key'), 0o400);
      fs.chmodSync(path.join(keysDir, 'refresh_private.key'), 0o400);
      console.log('Set private key permissions to read-only');
    }

    console.log('\nRSA key pairs generated successfully!');
    console.log('Keys location:', keysDir);
    console.log('\nIMPORTANT: Add the keys directory to .gitignore to keep keys secure');
    console.log('IMPORTANT: Back up these keys securely - losing them will invalidate all tokens');

  } catch (error) {
    console.error('Error generating keys:', error.message);
    process.exit(1);
  }
};

// Run the script
generateKeys();
