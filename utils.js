const path = require('path');
const fs = require('fs');


/**
 * get type of files available in directory.
 * @param {String} dirName Directory Name.
 * @return {{pdfs: Array, baseURL: Array, m3u8Files: Array, tsFiles: Array, keys: Array}}
 */
function typeofFileAvailable(dirName) {
  const pdfs = [];
  const baseURL = [];
  const m3u8Files = [];
  const tsFiles = [];
  const key = [];
  const mp4 = [];
  const nops = [];
  const youtube = [];
  fs.readdirSync(dirName)
      .map((file) => path.join(dirName, file))
      .filter((file) => fs.lstatSync(file).isFile())
      .forEach((file)=>{
        if (file.endsWith('pdf')) {
          pdfs.push(file);
        }
        if (file.endsWith('baseURL')) {
          baseURL.push(file);
        }
        if (file.endsWith('m3u8')) {
          m3u8Files.push(file);
        }
        if (file.endsWith('ts')) {
          tsFiles.push(file);
        }
        if (file.endsWith('key')) {
          key.push(file);
        }
        if (file.endsWith('mp4')) {
          mp4.push(file);
        }
        if (file.endsWith('nop')) {
          nops.push(file);
        }
        if (file.endsWith('youtube')) {
          youtube.push(file);
        }
      });
  return {pdfs, baseURL, m3u8Files, tsFiles, key, mp4, nops, youtube};
}

/**
 * Get Name of file by checking url.
 * @param {string} url url.
 * @return {string} file Name.
 */
function getFileNameFromURL(url) {
  const result = url.match(/[a-zA-Z0-9-]+\.[a-zA-Z0-9]+[?&]/);
  if (result) {
    return result[0].slice(0, -1);
  } else {
    return 'abc';
  }
}

/**
 * Get Name of directory based on course name and topic name.
 * @param {string} courseName Name of course.
 * @param {string} topicName name of topic.
 * @param {int} subTopicName Name of subtopic.
 * @return {string} Directory Name.
 */
function getDirNameFromCourse(courseName, topicName, subTopicName) {
  let nth = 0;
  return dirName = path.join(__dirname, courseName, topicName, subTopicName).replace(/[<>"|?:*]/g, function(match, i, original){
    if (nth==0 && match==':') {
      nth++;
      return ':'; 
    } else return '_';
  });
}

module.exports = {typeofFileAvailable, getFileNameFromURL, getDirNameFromCourse};
