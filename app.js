const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');

const socket = io('http://localhost:3001');
const VAPID_PUBLIC_KEY = 'BFoCOkSMk9dedU4Mydxmxhc9zDAgrNDtGhFKhrSro47SM09O3NwTTwEK6jzgFKG2mWk5-x7sWT5t-QsjXUxHTIQ';

function setActiveButton(activeId) {
    [homeBtn, aboutBtn].forEach(btn => btn.classList.remove('active'));
    document.getElementById(activeId).classList.add('active');
}

async function loadContent(page) {
    try {
        const response = await fetch(`./content/${page}.html`);
        const html = await response.text();
        contentDiv.innerHTML = html;

        if (page === 'home') {
            initNotes();
        }
    } catch (err) {
        contentDiv.innerHTML = `<p class="is-center text-error">Ошибка загрузки страницы.</p>`;
        console.error(err);
    }
}

homeBtn.addEventListener('click', () => {
    setActiveButton('home-btn');
    loadContent('home');
});

aboutBtn.addEventListener('click', () => {
    setActiveButton('about-btn');
    loadContent('about');
});

loadContent('home');

function readNotes() {
    const raw = JSON.parse(localStorage.getItem('notes') || '[]');

    const normalized = raw.map((note, index) => {
        if (typeof note === 'string') {
            return {
                id: Date.now() + index,
                text: note,
                reminder: null
            };
        }
        return {
            id: note.id ?? (Date.now() + index),
            text: note.text ?? '',
            reminder: note.reminder ?? null
        };
    });

    const wasNormalized = raw.some(note => typeof note === 'string' || !note || typeof note !== 'object');
    if (wasNormalized) {
        localStorage.setItem('notes', JSON.stringify(normalized));
    }

    return normalized;
}

function saveNotes(notes) {
    localStorage.setItem('notes', JSON.stringify(notes));
}

function initNotes() {
    const form = document.getElementById('note-form');
    const input = document.getElementById('note-input');
    const reminderForm = document.getElementById('reminder-form');
    const reminderText = document.getElementById('reminder-text');
    const reminderTime = document.getElementById('reminder-time');
    const list = document.getElementById('notes-list');

    function loadNotes() {
        const notes = readNotes();

        list.innerHTML = notes.map(note => {
            let reminderInfo = '';
            if (note.reminder) {
                const date = new Date(note.reminder);
                reminderInfo = `<br><small>!!! Напоминание: ${date.toLocaleString()}</small>`;
            }

            return `<li class="card" style="margin-bottom: 0.5rem; padding: 0.5rem;">
                ${note.text}${reminderInfo}
            </li>`;
        }).join('');
    }

    function addNote(text, reminderTimestamp = null) {
        const notes = readNotes();
        const newNote = {
            id: Date.now(),
            text,
            reminder: reminderTimestamp
        };

        notes.push(newNote);
        saveNotes(notes);
        loadNotes();

        if (reminderTimestamp) {
            socket.emit('newReminder', {
                id: newNote.id,
                text,
                reminderTime: reminderTimestamp
            });
        } else {
            socket.emit('newTask', { text, timestamp: Date.now() });
        }
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text) {
            addNote(text);
            input.value = '';
        }
    });

    reminderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = reminderText.value.trim();
        const datetime = reminderTime.value;

        if (!text || !datetime) return;

        const timestamp = new Date(datetime).getTime();
        if (timestamp > Date.now()) {
            addNote(text, timestamp);
            reminderText.value = '';
            reminderTime.value = '';
        } else {
            alert('Дата напоминания должна быть в будущем');
        }
    });

    loadNotes();
}

socket.on('taskAdded', (task) => {
    alert('Новая задача: ' + task.text);
});

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

async function subscribeToPush() {
    const reg = await navigator.serviceWorker.ready;

    const existing = await reg.pushManager.getSubscription();
    if (existing) {
        console.log('Push уже включён');
        return;
    }

    const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    await fetch('http://localhost:3001/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
    });

    console.log('Push-подписка создана');
}

async function unsubscribeFromPush() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();

    if (!sub) {
        console.log('Подписки нет');
        return;
    }

    await fetch('http://localhost:3001/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint })
    });

    await sub.unsubscribe();
    console.log('Push-подписка удалена');
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const reg = await navigator.serviceWorker.register('./sw.js');
            console.log('SW registered:', reg.scope);

            const enableBtn = document.getElementById('enable-push');
            const disableBtn = document.getElementById('disable-push');

            if (enableBtn && disableBtn) {
                const subscription = await reg.pushManager.getSubscription();

                if (subscription) {
                    enableBtn.style.display = 'none';
                    disableBtn.style.display = 'inline-block';
                } else {
                    enableBtn.style.display = 'inline-block';
                    disableBtn.style.display = 'none';
                }

                enableBtn.onclick = async () => {
                    try {
                        if (Notification.permission === 'denied') {
                            alert('Уведомления запрещены. Разрешите их в настройках браузера.');
                            return;
                        }

                        if (Notification.permission === 'default') {
                            const permission = await Notification.requestPermission();
                            if (permission !== 'granted') {
                                alert('Необходимо разрешить уведомления.');
                                return;
                            }
                        }

                        await subscribeToPush();
                        enableBtn.style.display = 'none';
                        disableBtn.style.display = 'inline-block';
                    } catch (err) {
                        console.error('Ошибка включения уведомлений:', err);
                        alert('Не удалось включить уведомления. Смотри консоль.');
                    }
                };

                disableBtn.onclick = async () => {
                    try {
                        await unsubscribeFromPush();
                        disableBtn.style.display = 'none';
                        enableBtn.style.display = 'inline-block';
                    } catch (err) {
                        console.error('Ошибка отключения уведомлений:', err);
                        alert('Не удалось отключить уведомления. Смотри консоль.');
                    }
                };
            }
        } catch (err) {
            console.log('SW registration failed:', err);
        }
    });
}