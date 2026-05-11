# Практика №22 — балансировка нагрузки

Готовый стенд для практики: два backend-сервера, Nginx как балансировщик и альтернативный пример на HAProxy.

## Структура

- `server1/` — первый backend
- `server2/` — второй backend
- `docker-compose.yml` — запуск backend, Nginx и HAProxy
- `nginx.conf` — конфигурация балансировки с `max_fails` и `fail_timeout`
- `haproxy.cfg` — альтернативная балансировка через HAProxy

## Запуск

```powershell
cd C:\Users\IDIotSUda\WebstormProjects\TIP1
docker compose up --build
```

## Проверка backend напрямую

```powershell
curl.exe http://localhost:3001/
curl.exe http://localhost:3002/
```

## Проверка Nginx

```powershell
1..6 | ForEach-Object { curl.exe http://localhost/; "" }
```

Nginx доступен на:

```text
http://localhost/
```

## Проверка HAProxy

```powershell
1..6 | ForEach-Object { curl.exe http://localhost:8080/; "" }
```

HAProxy доступен на:

```text
http://localhost:8080/
```

## Проверка отказоустойчивости

```powershell
docker compose stop server1
curl.exe http://localhost/
```

После остановки одного backend запросы должны продолжать обрабатываться вторым сервером.

