const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const minWidth = 100;
const minHeight = 100;


const kittenUrl = 'https://placekitten.com/';
// const openvisionUrl = 'https://api.openvisionapi.com/api/v1/detection';
const openvisionUrl = 'http://localhost:8000/api/v1/detection';

var foundCats = 0;
var minScore = 0;
var maxScore = 0;
var bestMatching = '';
var worstMatching = '';


function downloadFile(fileUrl, outputLocationPath) {

    axios({
        method: 'get',
        url: fileUrl,
        responseType: 'stream',
    }).then(response => {
        console.log('Downloaded ' + fileUrl)
        response.data.pipe(fs.createWriteStream(outputLocationPath).on('close', () => {
            checkCat(outputLocationPath);
        }));

    }).catch((error) => console.error(`Error downloading file : ${error}`));

}

async function checkCat(filePath) {
    var bodyFormData = new FormData();
    bodyFormData.append('model', 'yolov4');

    const image = fs.createReadStream(filePath);
    bodyFormData.append('image', image, filePath);

    try {
        const response = await axios.post(openvisionUrl, bodyFormData, {
            headers: bodyFormData.getHeaders(),
        });
        catStats(filePath, response.data);

    } catch (error) {
        console.error(`Error reaching openvision api : ${error}`);
    }
}

function catStats(fileName, data) {
    for (var i = 0; i < data.predictions.length; i++) {
        if (data.predictions[i].label === 'cat') {
            foundCats++;
            var score = data.predictions[i].score;
            if (!worstMatching) {
                minScore = score;
                worstMatching = fileName;
            }
            if (minScore > score) {
                minScore = score;
                worstMatching = fileName;
            }
            if (maxScore < score) {
                maxScore = score;
                bestMatching = fileName;
            }
            console.log(`OpenVision found cat on ${fileName} : ${data.predictions[i].score}`);
        }
    }
    console.log(`Found ${foundCats} cats`);
    console.log(`Best matching cat ${bestMatching} with ${maxScore}`);
    if (worstMatching) {
        console.log(`Worse matching cat ${worstMatching} with ${minScore}`);
    }
}

module.exports = function catretriever(catsNber) {

    for (var i = 0; i < catsNber; i++) {
        var name = 'cat_' + (minWidth + i) + '_' + (minHeight + i) + '.jpeg';

        downloadFile(kittenUrl + (minWidth + i) + '/' + (minHeight + i), 'download/' + name);
    }
}