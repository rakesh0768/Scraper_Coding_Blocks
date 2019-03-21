const axios = require('axios');
const path = require('path');
const fs = require('fs');
const {getDecryptionParameters} = require('./getDecryptionParameters');

/**
 * download video to folder provided all the m3u8 and key file and url of all the files.
 * @param {String} dirName Directory which contain m3u8 and key file.
 * @param {String} url url of m3u8 file. If url is not provided then it search for baseURL file.
 */
async function downloadTSFiles(dirName, url) {
  url = (url && url.toString())|| fs.readFileSync(path.join(dirName, 'baseURL')).toString();
  const {m3u8File} = getDecryptionParameters(dirName);
  if (m3u8File==null || url==null) return;
  const index = url.indexOf('index.m3u8');
  const TSFiles = tsFilesArray(m3u8File);
  const frontURL = url.substring(0, index);
  const endURL = url.substring(index+'index.m3u8'.length);
  for (let ts of TSFiles) {
    ts = path.basename(ts);
    url = frontURL + path.basename(ts) + endURL;
    const fileName = path.join(dirName, ts);
    await axios.request({url: url.toString(), responseType: 'stream'})
        .then(
            (response)=>{
              const output = fs.createWriteStream(fileName);
              response.data.pipe(output);
              return new Promise((resolve, reject)=>{
                output.on('finish', ()=>{
                  console.log('downloaded ' + output.path);
                  resolve();
                });
                output.on('error', (err)=>{
                  reject(err);
                });
              });
            });
  }
  console.log('Transport Streams Downloaded');
  return true;
}

/**
 * get list of tsFiles from m3u8 file present.
 * @param {String} m3u8File m3u8 file location.
 * @return {Array | null}
 */
function tsFilesArray(m3u8File) {
  const match = fs.readFileSync(m3u8File).toString().match(/\w*\.ts/g);
  return match && match.map(
      (file)=>path.join(path.dirname(m3u8File), file)
  );
}

module.exports = {downloadTSFiles, tsFilesArray};
