const express = require('express');
const amqp = require('amqplib');
const logger = require('./logger');
const cities = require('./db/cities.json')
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5005;
const RABBIT_URL = process.env.RABBIT_URL;


app.get('/cities', (req, res) => {
  res.send(cities);
});

app.get('/cities/:city', async (req, res) => {
  const reqCity = req.params.city;
  
  const city = cities.find((city) => {
    return city.name.toLowerCase() === reqCity.toLowerCase();
  })

  if (!city) {
    res.status(404).send("Error: City not found.");
    logger.error(`Requested city '${reqCity}' not found in db`);
  } else{
    try {
      const weather = await requestWeather(city.lat, city.lon);
        if (weather != 'Error') {
          res.send(weather);
          logger.info(`Success response '${weather}' for lat: ${city.lat}, lon: ${city.log}`);
        } else {
          res.send('Error during handling request. Try again later.');
          logger.error(`Internal error for lat: ${city.lat}, lon: ${city.lon}`);
        }

    } catch (e) {
      res.status(500).send("Internal error. Try again later");
      logger.error(`Error in weather service. city: ${city.name}, lat: ${city.lat}, lon: ${city.lon}`);
    }
  }

});

async function requestWeather(lat, lon) {
  const connection = await amqp.connect(RABBIT_URL);
  const channel = await connection.createChannel();
  const queue = 'weather_queue';
  const correlationId = generateUuid();

  // handle answer
  const response = new Promise((resolve) => {
    channel.consume(
      queue,
      (msg) => {
        if (msg.properties.correlationId === correlationId) {
          console.log(msg.content.toString());
          resolve(msg.content.toString());
        }
      },
      { noAck: true }
    );
  });

  // send request
  const request = `{ "lat": "${lat}", "lon": "${lon}" }`;
  channel.sendToQueue('weather_queue', Buffer.from(request), {
    correlationId,
    replyTo: queue,
  });

  const result = await response;
  channel.close();
  connection.close();
  return result;
}

function generateUuid() {
  return Math.random().toString()
}

app.listen(PORT, () => logger.info(`Server started on port ${PORT}`));
