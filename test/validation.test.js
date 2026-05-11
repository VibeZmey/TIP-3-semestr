const test = require('node:test');
const assert = require('node:assert/strict');

const path = require('node:path');

const {
  validateCreateUserPayload,
  validatePatchUserPayload,
  parsePositiveInteger
} = require(path.join(__dirname, '..', 'src', 'validation.js'));

const { buildUpdateUserQuery } = require(path.join(__dirname, '..', 'src', 'users.repository.js'));

test('validateCreateUserPayload accepts valid payload', () => {
  const result = validateCreateUserPayload({
    first_name: '  Иван ',
    last_name: ' Иванов ',
    age: 25
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('validateCreateUserPayload rejects invalid payload', () => {
  const result = validateCreateUserPayload({
    first_name: '',
    last_name: '  ',
    age: -1
  });

  assert.equal(result.valid, false);
  assert.match(result.errors.join(' | '), /first_name/);
  assert.match(result.errors.join(' | '), /last_name/);
  assert.match(result.errors.join(' | '), /age/);
});

test('validatePatchUserPayload accepts at least one valid field', () => {
  const result = validatePatchUserPayload({ age: 30 });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('validatePatchUserPayload rejects empty payload', () => {
  const result = validatePatchUserPayload({});

  assert.equal(result.valid, false);
  assert.match(result.errors.join(' | '), /at least one field/i);
});

test('parsePositiveInteger validates positive integers', () => {
  assert.deepEqual(parsePositiveInteger('5', 'id'), { valid: true, value: 5 });
  assert.equal(parsePositiveInteger('0', 'id').valid, false);
  assert.equal(parsePositiveInteger('abc', 'id').valid, false);
});

test('buildUpdateUserQuery generates update SQL with unix timestamp update', () => {
  const result = buildUpdateUserQuery(7, { first_name: 'Пётр', age: 31 });

  assert.match(result.text, /UPDATE\s+users\s+SET/i);
  assert.match(result.text, /updated_at = EXTRACT\(EPOCH FROM NOW\(\)\)::BIGINT/);
  assert.deepEqual(result.values, ['Пётр', 31, 7]);
});



