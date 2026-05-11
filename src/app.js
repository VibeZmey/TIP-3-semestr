const express = require('express');
const path = require('node:path');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const { buildUsersRouter } = require('./users.router');
const openapiDefinition = require('./docs/openapi');

function buildSwaggerSpec() {
  return swaggerJSDoc({
    definition: openapiDefinition,
    apis: [path.join(__dirname, 'users.router.js')]
  });
}

function createApp(pool) {
  const app = express();
  const swaggerSpec = buildSwaggerSpec();

  app.use(express.json());
  app.get('/api-docs.json', (req, res) => {
    res.json(swaggerSpec);
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api/users', buildUsersRouter(pool));

  app.use((req, res) => {
    res.status(404).json({ message: 'Not found' });
  });

  app.use((error, req, res, next) => {
    console.error(error);
    const status = Number.isInteger(error.status) ? error.status : 500;
    res.status(status).json({ message: error.message || 'Internal Server Error' });
  });

  return app;
}

module.exports = {
  createApp
};


