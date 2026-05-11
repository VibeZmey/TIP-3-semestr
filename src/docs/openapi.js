module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Практика №19',
    version: '1.0.0',
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1
          },
          first_name: {
            type: 'string',
            example: 'Иван'
          },
          last_name: {
            type: 'string',
            example: 'Иванов'
          },
          age: {
            type: 'integer',
            example: 25
          },
          created_at: {
            type: 'integer',
            description: 'Unix timestamp в секундах',
            example: 1715430000
          },
          updated_at: {
            type: 'integer',
            description: 'Unix timestamp в секундах',
            example: 1715430000
          }
        },
        required: ['id', 'first_name', 'last_name', 'age', 'created_at', 'updated_at']
      },
      CreateUserRequest: {
        type: 'object',
        properties: {
          first_name: {
            type: 'string',
            example: 'Иван'
          },
          last_name: {
            type: 'string',
            example: 'Иванов'
          },
          age: {
            type: 'integer',
            example: 25
          }
        },
        required: ['first_name', 'last_name', 'age']
      },
      PatchUserRequest: {
        type: 'object',
        properties: {
          first_name: {
            type: 'string',
            example: 'Пётр'
          },
          last_name: {
            type: 'string',
            example: 'Петров'
          },
          age: {
            type: 'integer',
            example: 30
          }
        }
      },
      ValidationError: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Validation failed'
          },
          errors: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'User not found'
          }
        }
      }
    }
  }
};

