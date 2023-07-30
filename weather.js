const amqp = require('amqplib');
const axios = require('axios');
const logger = require('./logger');
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

  logger.info('[Weather] service started');
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
    logger.info(`[Weather] Success response ${response} for lat: ${lat}, lon: ${lon}`)
    return JSON.stringify(response.data.fact.temp);
  } catch (e) {
    logger.error(`[Weather] Error in fetching weather: ${e}`);
    return "Error";
  }
}

getWeather();
