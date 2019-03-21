'use strict';
const {downloadPDF} = require('./downloadPDF');
const {downloadTSFiles} = require('./downloadTSFiles');
const {decryptVideo} = require('./decryptVideo');
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const {ensureDirSync} = require('fs-extra');
const {getDecryptionParameters} = require('./getDecryptionParameters');
const {typeofFileAvailable, getFileNameFromURL, getDirNameFromCourse} = require('./utils');
const {EventEmitter} = require('events');


/**
 * Scrape Coding Blocks using courseLink and the put the gile n courseName.
 * @param {string} courseName Name of the course/Folder.
 * @param {string} courseLink The url for course link.
 * @return {Promise}
 */
async function scrapeCodingBlocks(courseName, courseLink) {
  const config = JSON.parse(fs.readFileSync('config.json'));
  const browser = await puppeteer.launch({
    headless: config.headless || false,
    executablePath: config.executablePath || 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    userDataDir: config.userDataDir,
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(config.timeout || 20000);
  const jsonPATH = path.join(courseName+'.json');
  let JSONDATA;
  if (fs.existsSync(jsonPATH)) {
    JSONDATA = JSON.parse(fs.readFileSync(jsonPATH));
  } else {
    JSONDATA = await getContentsJSON(courseLink, page);
    fs.writeFileSync(jsonPATH, JSON.stringify(JSONDATA));
  }
  await require('./repairCourse').repairCourse(courseName, jsonPATH);
  for (const [topicIndex, topicObject] of JSONDATA.entries()) {
    const topicName = Object.keys(topicObject)[0];
    for (const [subTopicIndex, subTopicName] of topicObject[topicName].entries()) {
      console.log(topicName+' > '+subTopicName);
      const dirName = getDirNameFromCourse(courseName, (topicIndex+1) + ' ' + topicName, (subTopicIndex+1) + ' '+ subTopicName);
      ensureDirSync(dirName);
      const fileTypes = typeofFileAvailable(dirName);
      if (fileTypes.pdfs.length);
      else if (fileTypes.mp4.length);
      else if (fileTypes.nops.length);
      else if (fileTypes.youtube.length);
      else {
        const element = await getElementHandleOfIndex(
            courseLink, page, topicIndex, subTopicIndex
        );
        await getResources(page, element, dirName);
        await page.goto(courseLink, {waitUntil: ['networkidle0', 'networkidle2', 'load', 'domcontentloaded']});
      }
    }
  }
}


/**
 * Get Course Content of the page.
 * @param {string} courseLink The url for course link.
 * @param {Page} page Object which can create page.
 * @return {Array} JSON DATA with course name and link.
 */
async function getContentsJSON(courseLink, page) {
  const JSONDATA = [];
  await page.goto(courseLink, {waitUntil: ['networkidle0', 'networkidle2', 'load', 'domcontentloaded']});
  const topics = await page.$$(
      'body > div > div > div > div > div > div > div > div.ember-view'
  );
  for (const topic of topics.slice()) {
    let topicName = await topic.$eval('div > div:nth-child(2)', (node) => {
      node.click();
      return node.textContent;
    });
    topicName = topicName.trim();
    const topicObject = {};
    topicObject[topicName] = [];
    const subTopics = await topic.$$('div.col-10 > div+div');
    for (const subTopic of subTopics) {
      let subTopicName = await page.evaluate(
          (node) => node.textContent
          , subTopic);
      subTopicName = subTopicName.trim();
      topicObject[topicName].push(subTopicName);
    }
    JSONDATA.push(topicObject);
  }
  return JSONDATA;
}


/**
 * Get Element Handle of subtopic given their indexes using course content page.
 * @param {string} courseLink The url of course content page.
 * @param {Page} page Page object.
 * @param {int} topicIndex index of topic.
 * @param {int} subTopicIndex index of subtopic.
 * @return {Element} returns element handle of the DOM.
 */
async function getElementHandleOfIndex(
    courseLink, page, topicIndex, subTopicIndex
) {
  await page.goto(courseLink, {waitUntil: ['networkidle0', 'networkidle2', 'load', 'domcontentloaded']});
  const topic = await page.$(
      'body > div > div > div > div > div > div > div > div.ember-view:nth-child('+(topicIndex+1)+')'
  );
  await topic.$eval('div > div:nth-child(2)', (node) => {
    node.click();
  });
  const subTopic = await page.$(
      'body > div > div > div > div > div > div > div > div.ember-view:nth-child('+(topicIndex+1)+') > div ~ div:nth-child(2) > div > div > div:nth-child('+(subTopicIndex+1)+')'
  );
  page.evaluateHandle((e)=>console.log(e), subTopic);
  return subTopic;
}

/**
 * Get resource after clicking on element handle.
 * @param {page} page Page Object from Browser.
 * @param {Element} element Handle which lead to resource page.
 * @param {string} dirName Direcotry where resources will be put.
 * @return {Array} Downloaded object Name.
 */
async function getResources(page, element, dirName) {
  let flagError = false;
  let results = await Promise.all([
    page.waitForRequest((request) => request.url().match(/index\.m3u8\?Key-Pair-Id/) !== null).catch(()=>false),
    page.waitForRequest((request) => request.url().match(/video\.m3u8\?Key-Pair-Id/) !== null).catch(()=>false),
    page.waitForRequest((request) => request.url().match(/\.key/) !== null).catch(()=>false),
    page.waitForRequest((request) => request.url().match(/pdf/) !== null).catch(()=>false),
    page.waitForRequest((request) => request.url().match(/www\.youtube\.com\/get_video_info\?/) !== null).catch(()=>false),
    page.evaluateHandle((e)=>e.click(), element).then((e)=>false).catch(()=>false),
    page.waitForNavigation({waitUntil: ['networkidle0', 'networkidle2', 'load', 'domcontentloaded']}),
  ]).catch((e)=>{
    console.log(e);
    fs.appendFileSync('error.txt', dirName +'\n');
    flagError = true;
  });
  if (flagError) {
    await page.goto(courseLink, {waitUntil: ['networkidle0', 'networkidle2', 'load', 'domcontentloaded']});
    return;
  }
  results = results.filter((e)=>e);
  if (!results.length) {
    fs.writeFileSync(path.join(dirName, 'nop'), 'nop');
  } else if (results[0].url().toString().includes('www.youtube.com/get_video_info?')) {
    const id = (new URL(results[0].url())).searchParams.get('video_id');
    fs.writeFileSync(path.join(dirName, 'youtube'), id);
  }
  const videoDownloader = new EventEmitter();
  videoDownloader.on('video.m3u8',async (dirName, url)=>{
      await downloadTSFiles(dirName, url);
      videoDownloader.emit('completed_video.m3u8');
  });
  videoDownloader.on('key', (dirName)=>{
      const {m3u8File, IV, key} = getDecryptionParameters(dirName);
      decryptVideo(m3u8File, IV, key);
  });
  for (const request of results) {
    const fileName = path.join(dirName, getFileNameFromURL(request.url()));
    if (fileName.endsWith('pdf')) {
      const url = (new URL(request.url())).searchParams.get('url');
      downloadPDF(url, fileName);
    } else if (fileName.endsWith('m3u8') || fileName.endsWith('key')) {
      const buffer = await request.response().buffer();
      console.log('downloading '+fileName);
      fs.writeFileSync(fileName, buffer);
      if (fileName.endsWith('index.m3u8')) {
        fs.writeFileSync(path.join(dirName, 'baseURL'), results[0]._url.toString());
      }
      if (fileName.endsWith('video.m3u8')) {
          videoDownloader.emit('video.m3u8', dirName, results[0]._url.toString());
      }
      if (fileName.endsWith('key')) {
          videoDownloader.on('completed_video.m3u8',()=>videoDownloader.emit('key', dirName));
      }
    }
  }
}

const argumentLength = process.argv.length;
if (argumentLength >= 3) {
  scrapeCodingBlocks(process.argv[argumentLength - 2], process.argv[argumentLength - 1]);
}

module.exports.default = scrapeCodingBlocks;
