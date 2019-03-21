'use strict';
const crypto =require('crypto');
const path = require('path');
const fs = require('fs');
const {tsFilesArray} = require('./downloadTSFiles');
const {getDecryptionParameters} = require('./getDecryptionParameters');


/**
 * decrypt the video by pointing to directory with IV and key.
 * @param {String} m3u8File file location of m3u8.
 * @param {String} IV initial vector in hexadecimaal string.
 * @param {Buffer} key key for AES 128 CBC.
 */
async function decryptVideo(m3u8File, IV, key) {
  const algorithm = 'aes-128-cbc';
  const iv = new Buffer.from(IV, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const output = fs.createWriteStream(
      path.join(path.dirname(m3u8File), 'index.mp4')
  );
  const tsFiles = tsFilesArray(m3u8File);
  decipher.on('end', ()=>console.log('video decryption complete for '+m3u8File));
  let index = 0;
  if (!tsFiles.length) return;
  output.on('error', (err)=>{
    fs.appendFileSync('error.txt', output.path+'\n');
    output.emit('finish');
    fs.unlinkSync(output.path);
  });
  output.on('start', ()=>{
    const tsFile = tsFiles[index];
    const input = fs.createReadStream(tsFile);
    input.on('error',(e)=>console.log(e+'asdasdasd'));
    input.pipe(decipher, {end: index===tsFiles.length-1}).pipe(output);
    if (index!==tsFiles.length-1) {
      input.on('end', ()=>{
        index+=1;
        decipher.unpipe();
        output.emit('start');
      });
    }
  });
  output.emit('start');
  decipher.on('error', ((e)=>{
    fs.appendFileSync('error.txt', m3u8File+'\n');
    console.log(e);
    console.log(m3u8File);
    console.log(IV);
    console.log(key);
  }));
}

module.exports = {decryptVideo, getDecryptionParameters};
