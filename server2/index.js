const http = require('node:http');

const port = Number(process.env.PORT || 3001);
const serverName = process.env.SERVER_NAME || 'server2';

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ server: serverName, port }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ message: 'Not found', server: serverName }));
});

server.listen(port, () => {
  console.log(`${serverName} started on ${port}`);
});

