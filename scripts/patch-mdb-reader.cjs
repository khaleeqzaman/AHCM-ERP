const fs = require('fs');
const path = require('path');

const browserBlockDecrypt = path.join(__dirname, '../node_modules/mdb-reader/lib/browser/crypto/blockDecrypt.js');
const nodeBlockDecrypt = path.join(__dirname, '../node_modules/mdb-reader/lib/node/crypto/blockDecrypt.js');
const browserDescriptor = path.join(__dirname, '../node_modules/mdb-reader/lib/browser/codec-handler/handlers/office/agile/EncryptionDescriptor.js');
const nodeDescriptor = path.join(__dirname, '../node_modules/mdb-reader/lib/node/codec-handler/handlers/office/agile/EncryptionDescriptor.js');

const safeBlockDecryptContent = `import { createDecipheriv } from "../environment/index.js";
export function blockDecrypt(cipher, key, iv, data) {
    const cipherAlgorithm = (cipher?.algorithm || "AES").toLowerCase();
    const rawChaining = cipher?.chaining || "ChainingModeCBC";
    const chaining = typeof rawChaining === "string" ? rawChaining.slice(-3).toLowerCase() : "cbc";
    const keyBits = key && key.length ? key.length * 8 : 128;
    const algorithm = \`\${cipherAlgorithm}-\${keyBits}-\${chaining}\`;
    const decipher = createDecipheriv(algorithm, key, iv);
    decipher.setAutoPadding(false);
    return decipher.update(data);
}
`;

function patchBlockDecrypt(filePath) {
  if (fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, safeBlockDecryptContent, 'utf8');
    console.log('[patch-mdb-reader] Patched blockDecrypt at', filePath);
  }
}

function patchDescriptor(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('keyData.cipherChaining || "ChainingModeCBC"')) {
    return; // Already patched
  }
  content = content.replace(
    'const keyData = parsedXML.encryption.keyData;',
    `const keyData = parsedXML?.encryption?.keyData || {};
    let rawEncryptor = parsedXML?.encryption?.keyEncryptors?.keyEncryptor;
    if (Array.isArray(rawEncryptor)) {
        rawEncryptor = rawEncryptor[0];
    }
    const keyEncryptor = rawEncryptor?.["p:encryptedKey"] || rawEncryptor?.["encryptedKey"] || rawEncryptor || {};`
  );
  content = content.replace(
    'const keyEncryptor = parsedXML.encryption.keyEncryptors.keyEncryptor["p:encryptedKey"];',
    ''
  );
  content = content.replace('chaining: keyData.cipherChaining,', 'chaining: keyData.cipherChaining || "ChainingModeCBC",');
  content = content.replace('chaining: keyEncryptor.cipherChaining,', 'chaining: keyEncryptor.cipherChaining || "ChainingModeCBC",');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[patch-mdb-reader] Patched EncryptionDescriptor at', filePath);
}

patchBlockDecrypt(browserBlockDecrypt);
patchBlockDecrypt(nodeBlockDecrypt);
patchDescriptor(browserDescriptor);
patchDescriptor(nodeDescriptor);
