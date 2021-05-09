const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const http = require('http');
const unirest = require('unirest');
const host = 'https://nutritionix-api.p.mashape.com';
const wwoApiKey = 'Lp7us3BKWwmshq5cv5iyEI0rJk49p1eLo0hjsngmGJYvIeGwE4';
app.use(bodyParser.json())
app.set('port', (process.env.PORT || 3000))

app.get('/', function (req, res) {
  res.send('Use the /webhook endpoint.')
})
app.get('/webhook', function (req, res) {
  res.send('You must POST your request')
})

app.post('/webhook', function (req, res) {
  // Check the parameter
  //let food = req.body['item_name']; //JSON request from postman
  let food = req.body.result.parameters['any'] //JSON request from dialogflow
  console.log('==========', food)
  // Call the  API
  callNutritionApi(food).then((output) => {
    // Return the results of the API to Dialogflow
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
    res.status(200).end();
  }).catch((error) => {
    // If there is an error let the user know
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
    res.status(500).end()
  });
})

app.listen(app.get('port'), function () {
  console.log('* Webhook service is listening on port:' + app.get('port'))
})

function callNutritionApi(food) {
  return new Promise((resolve, reject) => {
    unirest.get(`https://nutritionix-api.p.mashape.com/v1_1/search/${encodeURIComponent(food)}?fields=item_name,item_id,brand_name,nf_calories,nf_total_fat`)
      .header("X-Mashape-Key", "PUU2P7v8gqmshKCydV3DjH4mewNTp1OEIyyjsnO5oehgfzRg1g")
      .header("Accept", "application/json")
      .end(function (result) {
        let response = result.body
        console.log(JSON.stringify(response, null, 2))
        // Generate output
        let output = `Here's the nutritional information of ${food}:\n\n`;
        // Check if there are any results
        if (response.hits.length == 0) {
          output = `Sorry, the food you entered is not on the list. Please enter other food items.`
          resolve(output);
        }
        // Display all the results
        response.hits.map(hit => {
          let { item_name, brand_name, nf_serving_size_qty, nf_serving_size_unit, nf_calories, nf_total_fat } = hit.fields;
          output += `item: ${item_name} \nbrand: ${brand_name} \ncalories: ${nf_calories} \ntotal fat: ${nf_total_fat} \nserving size: ${nf_serving_size_qty} ${nf_serving_size_unit}\n\n`
        });
        output += `\nWould you like to check on other food items?`
        console.log(output)
        resolve(output);
      });
  });
}
