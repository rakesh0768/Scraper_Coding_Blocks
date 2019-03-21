const axios = require('axios');
const fs = require('fs');


/**
 * download pdf from request.
 * @param {Request} url url of pdf.
 * @param {string} fileName name of file to be saved.
 */
async function downloadPDF(url, fileName) {
  axios.request({url: url.toString(), responseType: 'stream'})
      .then(
          (response)=>{
            response.data.pipe(fs.createWriteStream(fileName));
          }
      );
  console.log('downloaded pdf');
}


module.exports = {downloadPDF};
