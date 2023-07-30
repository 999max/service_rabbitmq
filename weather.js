const amqp = require('amqplib');
const axios = require('axios');
require('dotenv').config();

const RABBIT_URL = process.env.RABBIT_URL;
const YANDEX_API_KEY = process.env.YANDEX_API_KEY;
console.log(YANDEX_API_KEY)


async function getWeather() {
  const connection = await amqp.connect(RABBIT_URL);
  const channel = await connection.createChannel();
  const queue = 'weather_queue';

  channel.assertQueue(queue, { durable: false });

  channel.consume(queue, async (msg) => {
    const { lat, lon } = JSON.parse(msg.content.toString());
    const weather = await fetchWeather(lat, lon);

    channel.sendToQueue(
      msg.properties.replyTo,
      Buffer.from(weather),
      {
        correlationId: msg.properties.correlationId,
      }
    );

    // confirm msg to avoid repeat on restart 
    channel.ack(msg);
  });

  console.log('Weather service ready for requests...');
}

async function fetchWeather(lat, lon) {
  const config = {
    headers: {
      'X-Yandex-API-Key': YANDEX_API_KEY,
    },
  };
  const url = `https://api.weather.yandex.ru/v2/informers?lat=${lat}&lon=${lon}`
  
  try {
    const response = await axios.get(url, config);
    return JSON.stringify(response.data.fact.temp);
  } catch (e) {
    console.log("ERROR");
    return "Error ocurred. Check API key or try again later";
  }
}

getWeather();
