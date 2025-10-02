// --- Keys
const TX_KEY = 'finapp_transactions_v1';
const REM_KEY = 'finapp_reminders_v1';

// --- Elementos
const balanceE1 = document.getElementById('balance');
const textForm = document.getElementById('tx-form');
const txList = document.getElementById('tx-list');
const txDesc = document.getElementById('tx-desc');
const txAmount = document.getElementById('tx-amount');
const txDate = document.getElementById('tx-date');

const calendarGrid = document.getElementById('calendar-grid');
const monthYear = document.getElementById('month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

const reminderDateE1 = document.getElementById('reminder-date');
const reminderList = document.getElementById('reminder-list');
const reminderForm = document.getElementById('reminder-form');
const reminderTitle = document.getElementById('reminder-title');
const reminderTime = document.getElementById('reminder-time');

const enableNotificationsBtn = document.getElementById('enable-notifications');

// --- Estado
let transactions = loadTransactions();
let reminders = loadReminders();
let current = new Date();
let selectedDate = formatDate(current);

// --- Inicialização
renderTransactions();
renderBalance();
renderCalendar();
openReminders(selectedDate);

// --- Checa lembretes a cada 20 segundos
setInterval(checkReminders, 20_000);

// --- Listeners

// Adicionar transação
textForm.addEventListener('submit', e => {
    e.preventDefault();
    const desc = txDesc.value.trim();
    const amount = parseFloat(txAmount.value);
    const date = txDate.value;
    if (!desc || isNaN(amount) || !date) return alert('Preencha todos os campos');

    const tx = { id: Date.now(), desc, amount: +amount, date };
    transactions.push(tx);
    saveTransactions();
    renderTransactions();
    renderBalance();
    renderCalendar();
    textForm.reset();
});

// Adicionar lembrete
reminderForm.addEventListener('submit', e => {
    e.preventDefault();
    const title = reminderTitle.value.trim();
    const time = reminderTime.value; // "HH:MM"
    if (!title || !time) return alert('Preencha título e hora');

    const rem = { id: Date.now(), date: selectedDate, time, title, notified: false };
    reminders.push(rem);
    saveReminders();
    openReminders(selectedDate);
    renderCalendar();
    reminderForm.reset();
});

// Navegação do calendário
prevMonthBtn.addEventListener('click', () => {
    current.setMonth(current.getMonth() - 1);
    renderCalendar();
});
nextMonthBtn.addEventListener('click', () => {
    current.setMonth(current.getMonth() + 1);
    renderCalendar();
});

// Notificações
enableNotificationsBtn.addEventListener('click', async () => {
    if (!('Notification' in window)) return alert('Seu navegador não suporta notificações');
    const perm = await Notification.requestPermission();
    alert(perm === 'granted' ? 'Notificações ativadas!' : 'Notificações negadas.');
});

// --- Storage
function loadTransactions() {
    try { return JSON.parse(localStorage.getItem(TX_KEY)) || []; } 
    catch { return []; }
}
function saveTransactions() {
    localStorage.setItem(TX_KEY, JSON.stringify(transactions));
}
function loadReminders() {
    try { return JSON.parse(localStorage.getItem(REM_KEY)) || []; } 
    catch { return []; }
}
function saveReminders() {
    localStorage.setItem(REM_KEY, JSON.stringify(reminders));
}

// --- Renderizações

// Transações
function renderTransactions() {
    txList.innerHTML = '';
    const tableBody = document.querySelector('#tx-table tbody');
    tableBody.innerHTML = '';

    const sorted = transactions.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

    for (const tx of sorted) {
        // Lista
        const li = document.createElement('li');
        li.className = 'tx-item';
        li.innerHTML = `
        <div><strong>${tx.desc}</strong><br><small>${tx.date}</small></div>
        <div><span class="tx-amount ${tx.amount>=0?'income':'expense'}">${formatCurrency(tx.amount)}</span>
        <button data-id="${tx.id}">x</button></div>`;
        txList.appendChild(li);

        li.querySelector('button').addEventListener('click', () => {
            if (!confirm('Remover?')) return;
            transactions = transactions.filter(t => t.id !== tx.id);
            saveTransactions();
            renderTransactions();
            renderBalance();
            renderCalendar();
        });

        // Tabela
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${tx.date}</td><td>${tx.desc}</td>
        <td class="${tx.amount>=0?'income':'expense'}">${formatCurrency(tx.amount)}</td>`;
        tableBody.appendChild(tr);
    }
}

// Saldo
function renderBalance() {
    const total = transactions.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    balanceE1.textContent = formatCurrency(total);
}

// --- Calendar

function renderCalendar() {
    calendarGrid.innerHTML = '';
    const year = current.getFullYear();
    const month = current.getMonth();
    monthYear.textContent = current.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weekdays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    for (let i = 0; i < 7; i++) {
        const w = document.createElement('div');
        w.className = 'calendar-cell';
        w.style.fontWeight = '600';
        w.textContent = weekdays[i];
        calendarGrid.appendChild(w);
    }

    for (let i = 0; i < firstDay; i++) {
        calendarGrid.appendChild(document.createElement('div'));
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        const date = new Date(year, month, d);
        const dateStr = formatDate(date);
        cell.textContent = d;

        if (reminders.some(r => r.date === dateStr)) cell.classList.add('has-reminder');

        cell.addEventListener('click', () => {
            selectedDate = dateStr;
            openReminders(dateStr);
            document.querySelectorAll('.calendar-cell').forEach(c => c.classList.remove('selected'));
            cell.classList.add('selected');
        });

        if (dateStr === selectedDate) cell.classList.add('selected');
        calendarGrid.appendChild(cell);
    }
}

function openReminders(dateStr) {
    reminderDateE1.textContent = dateStr;
    reminderList.innerHTML = '';

    const list = reminders.filter(r => r.date === dateStr).sort((a,b)=>a.time.localeCompare(b.time));

    if (!list.length) reminderList.innerHTML = '<li>Nenhum lembrete.</li>';

    for (const r of list) {
        const li = document.createElement('li');
        li.className = 'reminder-item';
        li.innerHTML = `<div><strong>${r.title}</strong><br><small>${r.time}</small></div>
                        <div><button data-id="${r.id}">♥</button></div>`;
        reminderList.appendChild(li);

        li.querySelector('button').addEventListener('click', () => {
            if (!confirm('Remover este lembrete?')) return;
            reminders = reminders.filter(x => x.id !== r.id);
            saveReminders();
            openReminders(dateStr);
            renderCalendar();
        });
    }
}

// --- Check reminders
function checkReminders() {
    const now = new Date();
    for (const r of reminders) {
        if (r.notified) continue;
        const dt = parseDateTime(r.date, r.time);
        if (now >= dt) {
            notifyUser(r);
            r.notified = true;
            saveReminders();
        }
    }
}

function notifyUser(r) {
    if (Notification.permission === 'granted') {
        new Notification('Lembrete', {body: `${r.title} - ${r.time}`});
    } else {
        alert(`Lembrete: ${r.title} às ${r.time}`);
    }
}

// --- Utils
function formatCurrency(v) {
    return (Number(v)||0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
}
function formatDate(d) {
    const dt = (d instanceof Date) ? d : new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}
function parseDateTime(dateStr,timeStr) {
    const [y,m,day] = dateStr.split('-').map(Number);
    const [hh,mm] = timeStr.split(':').map(Number);
    return new Date(y,m-1,day,hh||0,mm||0,0);
}