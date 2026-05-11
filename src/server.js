const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');

const PORT = Number(process.env.PORT || 3000);
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/tip1_practice20';

const app = express();
app.use(express.json());

const userSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    age: { type: Number, required: true },
    created_at: { type: Number, required: true },
    updated_at: { type: Number, required: true }
  },
  {
    versionKey: false,
    toJSON: {
      transform: (_, ret) => {
        delete ret._id;
        return ret;
      }
    },
    toObject: {
      transform: (_, ret) => {
        delete ret._id;
        return ret;
      }
    }
  }
);

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 }
  },
  { versionKey: false }
);

const User = mongoose.model('User', userSchema);
const Counter = mongoose.model('Counter', counterSchema);

function unixNow() {
  return Math.floor(Date.now() / 1000);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function parseId(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    return null;
  }
  return number;
}

function validateCreateUser(body) {
  const errors = [];
  if (!isPlainObject(body)) {
    errors.push('Request body must be a JSON object');
    return errors;
  }
  const allowed = ['first_name', 'last_name', 'age'];
  const keys = Object.keys(body);
  if (keys.some(key => !allowed.includes(key))) {
    errors.push('Only first_name, last_name and age fields are allowed');
  }
  if (!isNonEmptyString(body.first_name)) {
    errors.push('first_name is required and must be a non-empty string');
  }
  if (!isNonEmptyString(body.last_name)) {
    errors.push('last_name is required and must be a non-empty string');
  }
  if (!isInteger(body.age)) {
    errors.push('age is required and must be a non-negative integer');
  }
  return errors;
}

function validatePatchUser(body) {
  const errors = [];
  if (!isPlainObject(body)) {
    errors.push('Request body must be a JSON object');
    return errors;
  }
  const allowed = ['first_name', 'last_name', 'age'];
  const keys = Object.keys(body);
  if (keys.some(key => !allowed.includes(key))) {
    errors.push('Only first_name, last_name and age fields are allowed');
  }
  if (keys.length === 0) {
    errors.push('At least one field must be provided for update');
  }
  if (Object.prototype.hasOwnProperty.call(body, 'first_name') && !isNonEmptyString(body.first_name)) {
    errors.push('first_name must be a non-empty string');
  }
  if (Object.prototype.hasOwnProperty.call(body, 'last_name') && !isNonEmptyString(body.last_name)) {
    errors.push('last_name must be a non-empty string');
  }
  if (Object.prototype.hasOwnProperty.call(body, 'age') && !isInteger(body.age)) {
    errors.push('age must be a non-negative integer');
  }
  return errors;
}

async function nextUserId() {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'users' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

function toUserPayload(doc) {
  return {
    id: doc.id,
    first_name: doc.first_name,
    last_name: doc.last_name,
    age: doc.age,
    created_at: doc.created_at,
    updated_at: doc.updated_at
  };
}

const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Практика №20',
    version: '1.0.0',
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local server' }
  ],
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          first_name: { type: 'string', example: 'Иван' },
          last_name: { type: 'string', example: 'Иванов' },
          age: { type: 'integer', example: 25 },
          created_at: { type: 'integer', example: 1715430000 },
          updated_at: { type: 'integer', example: 1715430000 }
        }
      },
      CreateUserRequest: {
        type: 'object',
        properties: {
          first_name: { type: 'string', example: 'Иван' },
          last_name: { type: 'string', example: 'Иванов' },
          age: { type: 'integer', example: 25 }
        },
        required: ['first_name', 'last_name', 'age']
      },
      PatchUserRequest: {
        type: 'object',
        properties: {
          first_name: { type: 'string', example: 'Пётр' },
          last_name: { type: 'string', example: 'Петров' },
          age: { type: 'integer', example: 30 }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'User not found' },
          errors: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  },
  paths: {
    '/api/users': {
      post: {
        summary: 'Создание нового пользователя',
        tags: ['Users'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateUserRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Пользователь создан',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          },
          '400': {
            description: 'Ошибка валидации',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      get: {
        summary: 'Получение списка пользователей',
        tags: ['Users'],
        responses: {
          '200': {
            description: 'Список пользователей',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/User' }
                }
              }
            }
          }
        }
      }
    },
    '/api/users/{id}': {
      get: {
        summary: 'Получение конкретного пользователя',
        tags: ['Users'],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': {
            description: 'Пользователь найден',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          },
          '400': {
            description: 'Некорректный id',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          '404': {
            description: 'Пользователь не найден',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      patch: {
        summary: 'Обновление информации пользователя',
        tags: ['Users'],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PatchUserRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Пользователь обновлён',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          },
          '400': {
            description: 'Ошибка валидации',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          '404': {
            description: 'Пользователь не найден',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Удаление пользователя',
        tags: ['Users'],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': {
            description: 'Пользователь удалён',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'User deleted' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Некорректный id',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          '404': {
            description: 'Пользователь не найден',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    }
  }
};

app.get('/api-docs.json', (req, res) => {
  res.json(swaggerSpec);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api/users', async (req, res) => {
  const users = await User.find().sort({ id: 1 }).lean();
  res.json(users.map(toUserPayload));
});

app.post('/api/users', async (req, res) => {
  const errors = validateCreateUser(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  const doc = await User.create({
    id: await nextUserId(),
    first_name: req.body.first_name.trim(),
    last_name: req.body.last_name.trim(),
    age: req.body.age,
    created_at: unixNow(),
    updated_at: unixNow()
  });

  return res.status(201).json(toUserPayload(doc.toObject()));
});

app.get('/api/users/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'id must be a positive integer' });
  }

  const user = await User.findOne({ id }).lean();
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json(toUserPayload(user));
});

app.patch('/api/users/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'id must be a positive integer' });
  }

  const errors = validatePatchUser(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  const update = { updated_at: unixNow() };
  if (Object.prototype.hasOwnProperty.call(req.body, 'first_name')) {
    update.first_name = req.body.first_name.trim();
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'last_name')) {
    update.last_name = req.body.last_name.trim();
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'age')) {
    update.age = req.body.age;
  }

  const user = await User.findOneAndUpdate({ id }, { $set: update }, { new: true }).lean();
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json(toUserPayload(user));
});

app.delete('/api/users/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'id must be a positive integer' });
  }

  const user = await User.findOneAndDelete({ id }).lean();
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ message: 'User deleted' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((error, req, res, next) => {
  const status = error && error.name === 'ValidationError' ? 400 : 500;
  res.status(status).json({ message: error.message || 'Internal Server Error' });
});

async function start() {
  await mongoose.connect(MONGODB_URL);
  await Counter.findOneAndUpdate({ _id: 'users' }, { $setOnInsert: { seq: 0 } }, { upsert: true, new: true });
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

start().catch(error => {
  console.error('Startup error', error.message || error);
  process.exitCode = 1;
});

