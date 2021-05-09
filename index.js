const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const http = require('http');
const host = 'api.worldweatheronline.com';
const wwoApiKey = '6dc80dbe74d2476ca5751646210905';
app.use(bodyParser.json())
app.set('port', (process.env.PORT || 5000))

app.get('/', function(req, res) {
    res.send('Use the /webhook endpoint.')
})
app.get('/webhook', function(req, res) {
    res.send('You must POST your request')
})

app.post('/webhook', function(req, res) {
    // Get the city and date from the request
    let city = req.body.queryResult.parameters['geo-city']; // city is a required param
    console.log('City: ' + city);
    // Get the date for the weather forecast (if present)
    let date = '';
    if (req.body.queryResult.parameters['date']) {
        date = req.body.queryResult.parameters['date'];
        console.log('Date: ' + date);
    }
    // Call the weather API
    callWeatherApi(city, date).then((output) => {
        // Return the results of the weather API to Dialogflow
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'speech': output, 'fulfillment_text': output }));
        res.status(200).end();
    }).catch((error) => {
        // If there is an error let the user know
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'speech': error, 'fulfillment_text': error }));
        res.status(500).end()
    });
})

app.listen(app.get('port'), function() {
    console.log('* Webhook service is listening on port:' + app.get('port'))
})

function callWeatherApi(city, date) {
    return new Promise((resolve, reject) => {
        // Create the path for the HTTP request to get the weather
        let path = '/premium/v1/weather.ashx?format=json&num_of_days=1' +
            '&q=' + encodeURIComponent(city) + '&key=' + wwoApiKey + '&date=' + date;
        console.log('API Request: ' + host + path);
        // Make the HTTP request to get the weather
        http.get({ host: host, path: path }, (res) => {
            let body = ''; // var to store the response chunks
            res.on('data', (d) => { body += d; }); // store each response chunk
            res.on('end', () => {
                // After all the data has been received parse the JSON for desired data
                //console.log(body);
                let response = JSON.parse(body);
                let forecast = response['data']['weather'][0];
                let location = response['data']['request'][0];
                let conditions = response['data']['current_condition'][0];
                let currentConditions = conditions['weatherDesc'][0]['value'];
                // Create response
                let output = `Current conditions in the ${location['type']} 
        ${location['query']} are ${currentConditions} with a projected high of
        ${forecast['maxtempC']}°C or ${forecast['maxtempF']}°F and a low of 
        ${forecast['mintempC']}°C or ${forecast['mintempF']}°F on 
        ${forecast['date']}.`;
                // Resolve the promise with the output text
                console.log(output);
                resolve(output);
            });
            res.on('error', (error) => {
                reject(error);
            });
        });
    });
}