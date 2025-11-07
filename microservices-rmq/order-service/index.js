// const express = require("express");
// const app = express();
// const PORT = process.env.PORT_ONE || 9090;
// const mongoose = require("mongoose");
// const Order = require("./Order");
// const amqp = require("amqplib");
// const isAuthenticated = require("../isAuthenticated");
// const config = require("../config");

// var channel, connection;

// mongoose.connect(
//     config.mongoUri,
//     {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//     },
//     () => {
//         console.log(`Order-Service DB Connected`);
//     }
// );
// app.use(express.json());

// async function createOrder(products, userEmail) {
//     let total = 0;
//     for (let t = 0; t < products.length; ++t) {
//         total += products[t].price;
//     }
//     const newOrder = new Order({
//         products,
//         user: userEmail,
//         total_price: total,
//     });
//     await newOrder.save();
//     return newOrder;
// }

// async function connect() {
//     const amqpServer = config.amqpServer;
//     connection = await amqp.connect(amqpServer);
//     channel = await connection.createChannel();
//     await channel.assertQueue("ORDER");
// }
// connect().then(() => {
//     channel.consume("ORDER", async (data) => {
//         console.log("Consuming ORDER service");
//         const { products, userEmail } = JSON.parse(data.content);
//         const newOrder = await createOrder(products, userEmail);
//         console.log(newOrder);
//         channel.ack(data);
//         channel.sendToQueue(
//             "PRODUCT",
//             Buffer.from(JSON.stringify({ newOrder }))
//         );
//     });
// });

// app.listen(config.order_port, () => {
//     console.log(`Order-Service at ${config.order_port}`);
// });



const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Order = require("./Order");
const amqp = require("amqplib");
const isAuthenticated = require("../isAuthenticated");
const config = require("../config");

let channel, connection;

// Database connection
mongoose.connect(config.mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("Order-Service DB Connected"))
.catch(err => console.error("DB Connection Error:", err));

app.use(express.json());

// Function to create an order
async function createOrder(products, userEmail) {
    let total = products.reduce((acc, product) => acc + product.price, 0);

    const newOrder = new Order({
        products,
        user: userEmail,
        total_price: total,
    });

    await newOrder.save();
    return newOrder;
}

// AMQP Connection setup
async function connect() {
    try {
        connection = await amqp.connect(config.amqpServer);
        channel = await connection.createChannel();
        await channel.assertQueue("ORDER");

        channel.consume("ORDER", async (data) => {
            console.log("Consuming ORDER service");
            const { products, userEmail } = JSON.parse(data.content.toString());

            const newOrder = await createOrder(products, userEmail);
            console.log(newOrder);

            channel.ack(data);
            channel.sendToQueue(
                "PRODUCT",
                Buffer.from(JSON.stringify({ newOrder }))
            );
        });
    } catch (error) {
        console.error("AMQP Connection Error:", error);
    }
}

// Initialize connection to RabbitMQ
connect();

// Server listener
const port = config.order_port || 3003;
app.listen(port, () => {
    console.log(`Order-Service running at port ${port}`);
});
