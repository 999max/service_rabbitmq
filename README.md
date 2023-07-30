# Weather service  
The project allows to get the current temperature in the requested city.

This is a simple project that demonstrates how to use RabbitMQ. 
To simplify, a file with cities and their coordinates was used instead of a database.


## How to run

0. Clone repo and run  
```sh
npm i
```

1. Create .env file (like '.env example'). You also need [yandex_weather_api_key](https://developer.tech.yandex.ru/services/18)

2. Run docker with RabbitMQ:  
```sh
docker run -d -p 5672:5672 rabbitmq
```  

3. Run server:  
```sh
node server.js
```  

4. Run service:  
```sh
node weather.js
```

## Testing
Now we can test it by sending request  
```
$ curl http://localhost:{PORT}/cities/astana
```


#### Todo
- [ ] Move logic from server.js to controller.
