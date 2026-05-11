function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function parsePositiveInteger(value, fieldName = 'id') {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    return {
      valid: false,
      error: `${fieldName} must be a positive integer`
    };
  }

  return {
    valid: true,
    value: number
  };
}

function validateCreateUserPayload(body) {
  const errors = [];

  if (!isPlainObject(body)) {
    errors.push('Request body must be a JSON object');
    return { valid: false, errors };
  }

  if (Object.keys(body).some(key => !['first_name', 'last_name', 'age'].includes(key))) {
    errors.push('Only first_name, last_name and age fields are allowed');
  }

  if (!isNonEmptyString(body.first_name)) {
    errors.push('first_name is required and must be a non-empty string');
  }

  if (!isNonEmptyString(body.last_name)) {
    errors.push('last_name is required and must be a non-empty string');
  }

  if (!isNonNegativeInteger(body.age)) {
    errors.push('age is required and must be a non-negative integer');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function validatePatchUserPayload(body) {
  const errors = [];

  if (!isPlainObject(body)) {
    errors.push('Request body must be a JSON object');
    return { valid: false, errors };
  }

  if (Object.keys(body).some(key => !['first_name', 'last_name', 'age'].includes(key))) {
    errors.push('Only first_name, last_name and age fields are allowed');
  }

  const hasUpdatableField = ['first_name', 'last_name', 'age'].some(key => Object.prototype.hasOwnProperty.call(body, key));

  if (!hasUpdatableField) {
    errors.push('At least one field must be provided for update');
  }

  if (Object.prototype.hasOwnProperty.call(body, 'first_name') && !isNonEmptyString(body.first_name)) {
    errors.push('first_name must be a non-empty string');
  }

  if (Object.prototype.hasOwnProperty.call(body, 'last_name') && !isNonEmptyString(body.last_name)) {
    errors.push('last_name must be a non-empty string');
  }

  if (Object.prototype.hasOwnProperty.call(body, 'age') && !isNonNegativeInteger(body.age)) {
    errors.push('age must be a non-negative integer');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function normalizeCreateUserPayload(body) {
  return {
    first_name: body.first_name.trim(),
    last_name: body.last_name.trim(),
    age: body.age
  };
}

function normalizePatchUserPayload(body) {
  const normalized = {};

  if (Object.prototype.hasOwnProperty.call(body, 'first_name')) {
    normalized.first_name = body.first_name.trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, 'last_name')) {
    normalized.last_name = body.last_name.trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, 'age')) {
    normalized.age = body.age;
  }

  return normalized;
}

module.exports = {
  isPlainObject,
  isNonEmptyString,
  isNonNegativeInteger,
  parsePositiveInteger,
  validateCreateUserPayload,
  validatePatchUserPayload,
  normalizeCreateUserPayload,
  normalizePatchUserPayload
};

