const path = require('path');
const fs = require('fs');
const {downloadTSFiles, tsFilesArray} = require('./downloadTSFiles');
const {decryptVideo} = require('./decryptVideo');
const {getDecryptionParameters} = require('./getDecryptionParameters');
const {typeofFileAvailable, getDirNameFromCourse} = require('./utils');

/**
 * Download / make incomplete resources by checking JSON FILE.
 * @param {String} courseName Name Of the Course, this will also be the directory name where course is present.
 * @param {String} JSONFILE JSON FILE location for course.
 */
async function repairCourse(courseName, JSONFILE) {
  const JSONDATA = JSON.parse(fs.readFileSync(JSONFILE));
  for (const [topicIndex, topicObject] of JSONDATA.entries()) {
    const topicName = Object.keys(topicObject)[0];
    for (const [subTopicIndex, subTopicName] of topicObject[topicName].entries()) {
      const dirName = getDirNameFromCourse(courseName, (topicIndex+1) + ' ' + topicName, (subTopicIndex+1) + ' '+ subTopicName);
      if (!fs.existsSync(dirName)) {
        console.log('download '+[topicIndex, topicName, subTopicIndex, subTopicName].toLocaleString());
        return;
      }
      const fileTypes = typeofFileAvailable(dirName);
      if (fileTypes.pdfs.length) continue;
      if (fileTypes.mp4.length) continue;
      if (fileTypes.nops.length) continue;
      if (fileTypes.youtube.length) continue;
      if (fileTypes.m3u8Files.length && fileTypes.key.length) {
        const m3u8File = fileTypes.m3u8Files.filter(tsFilesArray)[0];
        const tsFiles = tsFilesArray(m3u8File);
        if (tsFiles.length == fileTypes.tsFiles.length) {
          const {m3u8File, IV, key} = getDecryptionParameters(dirName);
          decryptVideo(m3u8File, IV, key);
        } else if (fileTypes.baseURL.length) {
          await downloadTSFiles(dirName);
          const {m3u8File, IV, key} = getDecryptionParameters(dirName);
          decryptVideo(m3u8File, IV, key);
        }
      } else {
        console.log('download '+[topicIndex, topicName, subTopicIndex, subTopicName].toLocaleString());
      }
    }
  }
}

module.exports = {repairCourse};
