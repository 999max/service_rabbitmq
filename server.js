const express = require('express');
const amqp = require('amqplib');
const cities = require('./db/cities.json')
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5005;
const RABBIT_URL = process.env.RABBIT_URL;

function generateUuid() {
  return Math.random().toString()
}

app.get('/cities', (req, res) => {
  res.send(cities);
});

app.get('/cities/:city', async (req, res) => {
  const reqCity = req.params.city.toLowerCase();
  
  const city = cities.find((city) => {
    return city.name.toLowerCase() === reqCity;
  })

  if (!city) {
    res.status(404).send("Error: City not found.");
  } else{
    const weather = await requestWeather(city.lat, city.lon);
    res.send(weather);
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

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
