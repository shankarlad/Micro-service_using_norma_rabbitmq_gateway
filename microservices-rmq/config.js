const config = {
    jwtSecret: "qwertyuiop",
    auth_port: 3001,
    product_port: 3002,
    order_port: 3003, 
    mongoUri: "mongodb+srv://shankar:shankar@microservices.tmyyk.mongodb.net/?retryWrites=true&w=majority&appName=Microservices",
    amqpServer: "amqp://guest:guest@localhost:5672"
  };

  module.exports = config;

  