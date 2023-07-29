const express = require('express');
const cities = require('./db/cities.json')

const app = express();
const PORT = process.env.PORT || 5005;


app.get('/cities', (req, res) => {
  res.send(cities);
});

app.get('/:city', (req, res) => {
  const reqCity = req.params.city.toLowerCase();
  
  const city = cities.find((city) => {
    return city.name.toLowerCase() === reqCity;
  })

  if (!city) {
    res.status(404).send("Error: City not found.");
  } else{
    // @todo send to service
    res.send(`lat ${city.lat}, lon ${city.lon}`);
  }
});



app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
