// const express = require("express");
// const app = express();
// const PORT = process.env.PORT_ONE || 8080;
// const mongoose = require("mongoose");
// const Product = require("./Product");
// const jwt = require("jsonwebtoken");
// const amqp = require("amqplib");
// const isAuthenticated = require("../isAuthenticated");

// const config = require("../config");    
// var order;

// var channel, connection;

// app.use(express.json());
// mongoose.connect(
//     config.mongoUri,
//     {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//     },
//     () => {
//         console.log(`Product-Service DB Connected`);
//     }
// );

// async function connect() {
//     const amqpServer = config.amqpServer;
//     connection = await amqp.connect(amqpServer);
//     channel = await connection.createChannel();
//     await channel.assertQueue("PRODUCT");
// }
// connect();

// app.post("/product/buy", isAuthenticated, async (req, res) => {
//     const { ids } = req.body;
//     const products = await Product.find({ _id: { $in: ids } });
//     channel.sendToQueue(
//         "ORDER",
//         Buffer.from(
//             JSON.stringify({
//                 products,
//                 userEmail: req.user.email,
//             })
//         )
//     );
//     channel.consume("PRODUCT", (data) => {
//         console.log("Consuming PRODUCT queue");
//         order = JSON.parse(data.content);
//         console.log(order);
//     });
//     return res.json({"Message": "Order Placed", "Order": order});
// });

// app.post("/product/create", isAuthenticated, async (req, res) => {
//     const { name, description, price } = req.body;
//     const newProduct = new Product({
//         name,
//         description,
//         price,
//     });
//     newProduct.save();
//     return res.json(newProduct);
// });


// app.listen(config.product_port, () => {
//     console.log(`Product-Service at ${config.product_port}`);
// });


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Product = require("./Product");
const amqp = require("amqplib");
const isAuthenticated = require("../isAuthenticated");
const config = require("../config");

let channel, connection;

app.use(express.json());

// Connect to MongoDB
mongoose.connect(config.mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("Product-Service DB Connected"))
.catch(err => console.error("DB Connection Error:", err));

// AMQP connection setup
async function connect() {
    try {
        connection = await amqp.connect(config.amqpServer);
        channel = await connection.createChannel();
        await channel.assertQueue("PRODUCT");
    } catch (error) {
        console.error("AMQP Connection Error:", error);
    }
}

connect();

// Endpoint to buy products
app.post("/product/buy", isAuthenticated, async (req, res) => {
    const { ids } = req.body;
    const products = await Product.find({ _id: { $in: ids } });

    // Send order to ORDER queue
    channel.sendToQueue(
        "ORDER",
        Buffer.from(
            JSON.stringify({
                products,
                userEmail: req.user.email,
            })
        )
    );

    // Set up listener for PRODUCT queue
    channel.consume("PRODUCT", (data) => {
        console.log("Consuming PRODUCT queue");
        const order = JSON.parse(data.content.toString());
        console.log(order);

        // Acknowledge and send response
        channel.ack(data);
        res.json({ "Message": "Order Placed", "Order": order });
    }, { noAck: false });
});

// Endpoint to create a product
app.post("/product/create", isAuthenticated, async (req, res) => {
    const { name, description, price } = req.body;

    try {
        const newProduct = new Product({
            name,
            description,
            price,
        });

        await newProduct.save();
        res.json(newProduct);
    } catch (error) {
        res.status(500).json({ error: "Product creation failed" });
    }
});

// Start server
const port = config.product_port || 3002;
app.listen(port, () => {
    console.log(`Product-Service running at port ${port}`);
});
