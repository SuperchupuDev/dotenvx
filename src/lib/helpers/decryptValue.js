const { decrypt } = require('eciesjs')

const PREFIX = 'encrypted:'

function decryptValue (value, privateKey) {
  if (!value.startsWith(PREFIX)) {
    return value
  }

  const privateKeys = privateKey.split(',')

  let decryptedValue
  let decryptionError
  for (const key of privateKeys) {
    const secret = Buffer.from(key, 'hex')
    const encoded = value.substring(PREFIX.length)
    const ciphertext = Buffer.from(encoded, 'base64')

    try {
      decryptedValue = decrypt(secret, ciphertext).toString()
      decryptionError = null // reset to null error (scenario for multiple private keys)
      break
    } catch (e) {
      if (e.message === 'Invalid private key') {
        decryptionError = new Error('private key looks invalid')
      } else if (e.message === 'Unsupported state or unable to authenticate data') {
        decryptionError = new Error('private key looks wrong')
      } else if (e.message === 'Point of length 65 was invalid. Expected 33 compressed bytes or 65 uncompressed bytes') {
        decryptionError = new Error('encrypted data looks malformed')
      } else {
        decryptionError = new Error(`${e.message}`)
      }

      decryptionError.code = 'DECRYPTION_FAILED'
    }
  }

  if (decryptionError) {
    throw decryptionError
  }

  return decryptedValue
}

module.exports = decryptValue
