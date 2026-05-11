const express = require('express');

const {
  parsePositiveInteger,
  validateCreateUserPayload,
  validatePatchUserPayload,
  normalizeCreateUserPayload,
  normalizePatchUserPayload
} = require('./validation');

const {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('./users.repository');

function buildUsersRouter(pool) {
  const router = express.Router();

  /**
   * @openapi
   * /api/users:
   *   post:
   *     summary: Создание нового пользователя
   *     tags:
   *       - Users
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateUserRequest'
   *     responses:
   *       '201':
   *         description: Пользователь создан
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       '400':
   *         description: Ошибка валидации
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationError'
   */
  router.post('/', async (req, res, next) => {
    try {
      const validation = validateCreateUserPayload(req.body);
      if (!validation.valid) {
        return res.status(400).json({ message: 'Validation failed', errors: validation.errors });
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const user = await createUser(pool, {
        ...normalizeCreateUserPayload(req.body),
        created_at: timestamp,
        updated_at: timestamp
      });
      return res.status(201).json(user);
    } catch (error) {
      return next(error);
    }
  });

  /**
   * @openapi
   * /api/users:
   *   get:
   *     summary: Получение списка пользователей
   *     tags:
   *       - Users
   *     responses:
   *       '200':
   *         description: Список пользователей
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/User'
   */
  router.get('/', async (req, res, next) => {
    try {
      const users = await listUsers(pool);
      return res.json(users);
    } catch (error) {
      return next(error);
    }
  });

  /**
   * @openapi
   * /api/users/{id}:
   *   get:
   *     summary: Получение конкретного пользователя
   *     tags:
   *       - Users
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Пользователь найден
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       '400':
   *         description: Некорректный id
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       '404':
   *         description: Пользователь не найден
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/:id', async (req, res, next) => {
    try {
      const parsed = parsePositiveInteger(req.params.id, 'id');
      if (!parsed.valid) {
        return res.status(400).json({ message: parsed.error });
      }

      const user = await getUserById(pool, parsed.value);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json(user);
    } catch (error) {
      return next(error);
    }
  });

  /**
   * @openapi
   * /api/users/{id}:
   *   patch:
   *     summary: Обновление информации пользователя
   *     tags:
   *       - Users
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PatchUserRequest'
   *     responses:
   *       '200':
   *         description: Пользователь обновлён
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       '400':
   *         description: Ошибка валидации
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationError'
   *       '404':
   *         description: Пользователь не найден
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.patch('/:id', async (req, res, next) => {
    try {
      const id = parsePositiveInteger(req.params.id, 'id');
      if (!id.valid) {
        return res.status(400).json({ message: id.error });
      }

      const validation = validatePatchUserPayload(req.body);
      if (!validation.valid) {
        return res.status(400).json({ message: 'Validation failed', errors: validation.errors });
      }

      const user = await updateUser(pool, id.value, normalizePatchUserPayload(req.body));
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json(user);
    } catch (error) {
      return next(error);
    }
  });

  /**
   * @openapi
   * /api/users/{id}:
   *   delete:
   *     summary: Удаление пользователя
   *     tags:
   *       - Users
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Пользователь удалён
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: User deleted
   *       '400':
   *         description: Некорректный id
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       '404':
   *         description: Пользователь не найден
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.delete('/:id', async (req, res, next) => {
    try {
      const id = parsePositiveInteger(req.params.id, 'id');
      if (!id.valid) {
        return res.status(400).json({ message: id.error });
      }

      const deleted = await deleteUser(pool, id.value);
      if (!deleted) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json({ message: 'User deleted' });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = {
  buildUsersRouter
};


