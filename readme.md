# CodingBlocks Scrapper
## Install
1. `git clone https://github.com/upendra1997/Scraper_Coding_Blocks.git`
2. `npm install`
## Configure
1. Go to `config.json` 
```
    {
      "headless": false,
      "executablePath": "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
      "userDataDir": "C:/Users/Upendra Updhyay/AppData/local/Google/Chrome SxS/User Data",
      "timeout": 20000
    }
```
2. Change setting as you see fit.
## Run
1. `npm run start {CourseName} {CourseLink}` or `node index.js {CourseName} {CourseLink}`
2. Login with your username and password so that it is saved in chrome's user data.
3. Run the script again and let it download, if some error occur or it get stuck, just restart the script it will do all the bookKeeping.
## Structure
1. `nop` Files mean that folder is empty i.e. it was a quiz section or some other section which was not being tracked.
2. `youtube` File have a string which is id for your youtube url.
3. `m3u8` These files have metadata of streams.
4. `ts` Transport Stream from HLS.
5. `key` Key for AES-128.