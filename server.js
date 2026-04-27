const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const reminders = new Map();

const vapidKeys = {
    publicKey: 'BFoCOkSMk9dedU4Mydxmxhc9zDAgrNDtGhFKhrSro47SM09O3NwTTwEK6jzgFKG2mWk5-x7sWT5t-QsjXUxHTIQ',
    privateKey: '4Cn8su2W4L1Tsu0Py8xRgQIvcXnzyoCKR4sFjfkfvGo'
};

webpush.setVapidDetails(
    'mailto:test@test.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..')));

let subscriptions = [];

const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: '*' }
});

io.on('connection', (socket) => {
    socket.on('newTask', (task) => {
        io.emit('taskAdded', task);

        const payload = JSON.stringify({
            title: 'Новая задача',
            body: task.text
        });

        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(console.error);
        });
    });

    socket.on('newReminder', (reminder) => {
        const { id, text, reminderTime } = reminder;
        const delay = reminderTime - Date.now();

        if (delay <= 0) return;

        if (reminders.has(id) && reminders.get(id).timeoutId) {
            clearTimeout(reminders.get(id).timeoutId);
        }

        const timeoutId = setTimeout(() => {
            const payload = JSON.stringify({
                title: 'Напоминание',
                body: text,
                reminderId: id
            });

            subscriptions.forEach(sub => {
                webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
            });

            reminders.set(id, {
                timeoutId: null,
                text,
                reminderTime: Date.now(),
                fired: true
            });
        }, delay);

        reminders.set(id, {
            timeoutId,
            text,
            reminderTime,
            fired: false
        });
    });
});

app.post('/subscribe', (req, res) => {
    const sub = req.body;
    const exists = subscriptions.some(s => s.endpoint === sub.endpoint);

    if (!exists) {
        subscriptions.push(sub);
    }

    res.sendStatus(201);
});

app.post('/unsubscribe', (req, res) => {
    subscriptions = subscriptions.filter(s => s.endpoint !== req.body.endpoint);
    res.sendStatus(200);
});

app.post('/snooze', (req, res) => {
    const reminderId = Number(req.query.reminderId || req.body?.reminderId);

    if (!reminderId || !reminders.has(reminderId)) {
        return res.status(404).json({ error: 'Reminder not found' });
    }

    const reminder = reminders.get(reminderId);

    if (reminder.timeoutId) {
        clearTimeout(reminder.timeoutId);
    }

    const newDelay = 5 * 60 * 1000;

    const newTimeoutId = setTimeout(() => {
        const payload = JSON.stringify({
            title: 'Напоминание отложено',
            body: reminder.text,
            reminderId
        });

        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
        });

        reminders.set(reminderId, {
            timeoutId: null,
            text: reminder.text,
            reminderTime: Date.now(),
            fired: true
        });
    }, newDelay);

    reminders.set(reminderId, {
        timeoutId: newTimeoutId,
        text: reminder.text,
        reminderTime: Date.now() + newDelay,
        fired: false
    });

    res.status(200).json({ message: 'Reminder snoozed for 5 minutes' });
});

server.listen(3001, () => {
    console.log('Server running http://localhost:3001');
});