const path = require('path');
const fs = require('fs');


/**
 * Get Decryption Parameter from the directory having m3u8 and key files
 * @param {String} dirName name of directory containing m3u8 file and key file.
 * @return {{m3u8File: File, IV: String, key: Buffer}}
 */
function getDecryptionParameters(dirName) {
  let m3u8File = null; let IV = null; let key = null;
  fs.readdirSync(dirName, {}).map((file)=>path.join(dirName, file)).forEach(
      (fileName) => {
        if (!fs.lstatSync(fileName).isFile()) return;
        if (fileName.endsWith('.m3u8')) {
          const data = fs.readFileSync(fileName, {encoding: 'utf8'}).toString();
          if (data.includes('.ts')) {
            m3u8File = fileName;
            IV = data.match(/[A-Fa-f0-9]{32}/)[0];
          }
        } else if (fileName.endsWith('.key')) {
          key = fs.readFileSync(fileName);
        }
      });
  return {m3u8File, IV, key};
}

module.exports = {getDecryptionParameters};
