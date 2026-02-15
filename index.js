const express = require('express');
const { v4 } = require('uuid');
const app = express();
const port = 3000;
let products = []

app.use(express.json());

app.post('/products', (req, res) => {
    const { name, cost } = req.body;
    const newProduct = {
      id: v4(),
      name,
      cost
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
  });

app.get('/products', (req, res) => {
    res.send(JSON.stringify(products));
  });

app.get('/products/:id', (req, res) => {
    let Product = products.find(p => p.id === req.params.id);
    res.send(JSON.stringify(Product));
  });

app.patch('/products/:id', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    const { name, cost } = req.body;
    if (name !== undefined) product.name = name;
    if (cost !== undefined) product.cost = cost;
    res.json(product);
  });

app.delete('/products/:id', (req, res) => {
    products = products.filter(p => p.id !== req.params.id);
    res.send('Ok');
  });

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});