const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');

const app = express();
const port = 3000;

let products = [];

app.use(cors(
{
      origin: 'http://localhost:3001',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type']
  }));

app.use(express.json());

app.get('/api/products', (req, res) => res.json(products));

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);

  res.json(product);
});

app.post('/api/products', (req, res) => {
  const { name, category, description, price, quantity } = req.body;
  const newProduct = { id: nanoid(6), name, category, description, price: Number(price), quantity: Number(quantity) };
  products.push(newProduct);
  res.json(newProduct);
});

app.patch('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);

  Object.assign(product, req.body);
  res.json(product);
});

app.delete('/api/products/:id', (req, res) => {
  products = products.filter(p => p.id !== req.params.id);
  res.send();
});

app.listen(port, () => console.log(`Server on http://localhost:${port}`));