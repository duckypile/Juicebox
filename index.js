const PORT = 3000;
const express = require('express');
const morgan = require('morgan'); // Add this line to import morgan
const server = express();

// Add these lines to use morgan and express.json middleware
server.use(morgan('dev'));
server.use(express.json());
const { client } = require('./db');
client.connect();

server.listen(PORT, () => {
    console.log('The server is up on port: ', PORT)
});

const apiRouter = require('./api');
server.use('/api', apiRouter);

server.use((req, res, next) => {
    console.log("<____Body Logger START____>");
    console.log(req.body);
    console.log("<_____Body Logger END_____>");
  
    next();
});
