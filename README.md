# Практика №22 — балансировка нагрузки

Актуальный стенд в корне `TIP1` теперь состоит из двух backend-серверов, `nginx` и `haproxy`.

Краткая инструкция по запуску и проверке находится в `README-practice22.md`.

# Практика №19 — PostgreSQL API пользователей

Готовое приложение для практического задания: сервер на Node.js/Express с обязательным подключением к PostgreSQL и CRUD-маршрутами для сущности `users`.

## Структура

- `src/` — исходники приложения
- `docker-compose.yml` — запуск приложения и PostgreSQL в контейнерах
- `Dockerfile` — сборка backend-контейнера
- `test/` — минимальные автопроверки логики валидации и SQL

## Требования практики, которые реализованы

- таблица `users` в PostgreSQL
- поля:
  - `id` — Integer
  - `first_name` — Varchar
  - `last_name` — Varchar
  - `age` — Integer
  - `created_at` — Unix time
  - `updated_at` — Unix time
- маршруты:
  - `POST /api/users`
  - `GET /api/users`
  - `GET /api/users/:id`
  - `PATCH /api/users/:id`
  - `DELETE /api/users/:id`
- логика каждого маршрута связана с PostgreSQL

## Запуск через Docker

Из корня `TIP1`:

```powershell
cd C:\Users\IDIotSUda\WebstormProjects\TIP1
docker compose up --build
```

Приложение будет доступно на:

```text
http://localhost:3000
```

Swagger UI:

```text
http://localhost:3000/api-docs
```

JSON-спека:

```text
http://localhost:3000/api-docs.json
```

## Проверка API

Создать пользователя:

```powershell
curl.exe -X POST http://localhost:3000/api/users `
  -H "Content-Type: application/json" `
  -d "{\"first_name\":\"Иван\",\"last_name\":\"Иванов\",\"age\":25}"
```

Получить список:

```powershell
curl.exe http://localhost:3000/api/users
```

Получить по id:

```powershell
curl.exe http://localhost:3000/api/users/1
```

Обновить:

```powershell
curl.exe -X PATCH http://localhost:3000/api/users/1 `
  -H "Content-Type: application/json" `
  -d "{\"age\":26}"
```

Удалить:

```powershell
curl.exe -X DELETE http://localhost:3000/api/users/1
```

## Локальный запуск без Docker

```powershell
npm install
npm start
```

По умолчанию используется строка подключения:

```text
postgresql://postgres:postgres@localhost:5432/postgres
```

Если нужно изменить параметры, задайте переменную окружения `DATABASE_URL`.

