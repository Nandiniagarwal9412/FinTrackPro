// FinTrack Pro - Personal Finance Tracker

const STORAGE_KEY = 'fintrackpro_transactions';
const PROFILE_KEY = 'fintrackpro_profile';
const THEME_KEY = 'fintrackpro_dark';
const SESSION_KEY = 'fintrackpro_session';

const symbols = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥'
};

let transactions = [];
let profile = {
    name: '',
    currency: 'INR'
};

let activeFilter = 'all';
let chart = null;


// Load Data from localStorage

function loadData() {
    try {
        transactions = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || '[]'
        );

        if (!Array.isArray(transactions)) {
            transactions = [];
        }

        profile = {
            ...profile,
            ...JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')
        };

    } catch (e) {
        transactions = [];
        profile = {
            name: '',
            currency: 'INR'
        };
    }

    if (!symbols[profile.currency]) {
        profile.currency = 'INR';
    }
}


// Save Transactions

function saveTransactions() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(transactions)
    );
}


// Save Profile

function saveProfileData() {
    localStorage.setItem(
        PROFILE_KEY,
        JSON.stringify(profile)
    );
}


// Format Currency

function money(value) {
    return (
        (symbols[profile.currency] || '₹') +
        Number(value || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })
    );
}


// Calculate Income and Expenses

function calculateTotals() {
    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
        if (t.type === 'income') {
            income += Number(t.amount);
        } else {
            expense += Number(t.amount);
        }
    });

    return {
        income,
        expense,
        balance: income - expense
    };
}


// Refresh Dashboard

function refresh() {
    updateCards();
    renderTable();
    renderChart();
}


// Update Summary Cards

function updateCards() {
    const totals = calculateTotals();

    document.getElementById('balance').textContent =
        money(totals.balance);

    document.getElementById('incomeTotal').textContent =
        money(totals.income);

    document.getElementById('expenseTotal').textContent =
        money(totals.expense);

    document.getElementById('transactionCount').textContent =
        transactions.length;

    document.getElementById('welcome').textContent =
        profile.name
            ? `Welcome back, ${profile.name} 👋`
            : 'Good day 👋';
}


// Render Transaction Table

function renderTable() {
    const tbody = document.getElementById('transactionRows');

    tbody.replaceChildren();

    const filtered = transactions
        .filter(t => activeFilter === 'all' || t.type === activeFilter)
        .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

    document.getElementById('emptyState').style.display =
        filtered.length ? 'none' : 'block';

    filtered.forEach(t => {

        const tr = document.createElement('tr');

        const cells = [
            t.date,
            t.description,
            t.category
        ];

        cells.forEach(value => {
            const td = document.createElement('td');

            td.textContent = value;

            tr.appendChild(td);
        });

        // Transaction Type

        const typeTd = document.createElement('td');

        const badge = document.createElement('span');

        badge.className = 'type-badge ' + t.type;
        badge.textContent = t.type;

        typeTd.appendChild(badge);

        tr.appendChild(typeTd);

        // Amount

        const amountTd = document.createElement('td');

        amountTd.className = 'amount ' + t.type;

        amountTd.textContent =
            (t.type === 'income' ? '+' : '−') + money(t.amount);

        tr.appendChild(amountTd);

        // Delete Button

        const actionTd = document.createElement('td');

        const del = document.createElement('button');

        del.className = 'btn danger';
        del.style.padding = '7px 10px';
        del.textContent = 'Delete';

        del.onclick = () => deleteTransaction(t.id);

        actionTd.appendChild(del);

        tr.appendChild(actionTd);

        tbody.appendChild(tr);

    });
}


// Render Cash Flow Chart

function renderChart() {

    const grouped = {};

    transactions.forEach(t => {

        if (!grouped[t.date]) {
            grouped[t.date] = {
                income: 0,
                expense: 0
            };
        }

        grouped[t.date][t.type] += Number(t.amount);

    });

    const labels = Object.keys(grouped).sort();

    if (chart) {
        chart.destroy();
    }

    const ctx = document
        .getElementById('cashFlowChart')
        .getContext('2d');

    chart = new Chart(ctx, {

        type: 'bar',

        data: {

            labels,

            datasets: [

                {
                    label: 'Income',

                    data: labels.map(d => grouped[d].income),

                    backgroundColor: '#16a36a',

                    borderRadius: 5
                },

                {
                    label: 'Expense',

                    data: labels.map(d => grouped[d].expense),

                    backgroundColor: '#e34b5f',

                    borderRadius: 5
                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            interaction: {
                mode: 'index',
                intersect: false
            },

            plugins: {

                legend: {
                    labels: {
                        color: getComputedStyle(document.body)
                            .getPropertyValue('--muted')
                    }
                }

            },

            scales: {

                x: {

                    ticks: {
                        color: getComputedStyle(document.body)
                            .getPropertyValue('--muted')
                    },

                    grid: {
                        color: getComputedStyle(document.body)
                            .getPropertyValue('--line')
                    }

                },

                y: {

                    beginAtZero: true,

                    ticks: {
                        color: getComputedStyle(document.body)
                            .getPropertyValue('--muted')
                    },

                    grid: {
                        color: getComputedStyle(document.body)
                            .getPropertyValue('--line')
                    }

                }

            }

        }

    });

}


// Transaction Filters

function setFilter(filter, button) {

    activeFilter = filter;

    document.querySelectorAll('.filters button')
        .forEach(b => {
            b.classList.toggle('active', b === button);
        });

    renderTable();

}


// Switch Dashboard and Settings

function showPage(page) {

    document.querySelectorAll('.page')
        .forEach(section => {
            section.classList.toggle(
                'active',
                section.id === page
            );
        });

    document.getElementById('navDashboard')
        .classList.toggle('active', page === 'dashboard');

    document.getElementById('navSettings')
        .classList.toggle('active', page === 'settings');

}


// Open Transaction Modal

function openModal() {

    document.getElementById('date').value =
        new Date().toISOString().slice(0, 10);

    document.getElementById('modalBackdrop')
        .classList.add('show');

    document.getElementById('description').focus();

}


// Close Modal

function closeModal() {

    document.getElementById('modalBackdrop')
        .classList.remove('show');

    document.getElementById('transactionForm').reset();

}


// Close Modal by Clicking Outside

function backdropClose(e) {

    if (e.target.id === 'modalBackdrop') {
        closeModal();
    }

}


// Add Transaction

document.getElementById('transactionForm')
    .addEventListener('submit', e => {

        e.preventDefault();

        const type =
            document.getElementById('type').value;

        const description =
            document.getElementById('description').value.trim();

        const amount =
            Number(document.getElementById('amount').value);

        const date =
            document.getElementById('date').value;

        const category =
            document.getElementById('category').value;


        // Validation

        if (
            !type ||
            !description ||
            !Number.isFinite(amount) ||
            amount <= 0 ||
            !date ||
            !category
        ) {

            showToast(
                'Please complete all fields with a valid amount.'
            );

            return;

        }


        // Create Transaction Object

        const transaction = {

            id: Date.now(),

            type,

            description,

            amount,

            date,

            category

        };


        // Add Transaction

        transactions.push(transaction);


        // Save Data

        saveTransactions();


        // Close Modal

        closeModal();


        // Refresh Dashboard

        refresh();


        showToast('Transaction saved successfully.');

    });


// Delete Transaction

function deleteTransaction(id) {

    if (!confirm('Delete this transaction?')) {
        return;
    }

    transactions = transactions.filter(
        t => t.id !== id
    );

    saveTransactions();

    refresh();

    showToast('Transaction deleted.');

}


// Save Profile Settings

function saveProfile() {

    const name =
        document.getElementById('displayName').value.trim();

    const currency =
        document.getElementById('currency').value;

    profile = {
        name,
        currency
    };

    saveProfileData();

    refresh();

    showToast('Preferences saved.');

}


// Apply Dark Mode

function applyTheme(dark) {

    document.body.classList.toggle('dark', dark);

    document.getElementById('themeToggle')
        .classList.toggle('on', dark);

    localStorage.setItem(
        THEME_KEY,
        dark ? '1' : '0'
    );

    if (chart) {
        renderChart();
    }

}


// Toggle Dark Mode

function toggleTheme() {

    applyTheme(
        !document.body.classList.contains('dark')
    );

}


// Reset All Data

function resetData() {

    if (!confirm(
        'This will permanently clear all FinTrack Pro transactions and preferences from this browser. Continue?'
    )) {
        return;
    }

    localStorage.removeItem(STORAGE_KEY);

    localStorage.removeItem(PROFILE_KEY);

    localStorage.removeItem(THEME_KEY);

    transactions = [];

    profile = {
        name: '',
        currency: 'INR'
    };

    document.getElementById('displayName').value = '';

    document.getElementById('currency').value = 'INR';

    applyTheme(false);

    activeFilter = 'all';

    document.querySelectorAll('.filters button')
        .forEach(b => {
            b.classList.toggle(
                'active',
                b.dataset.filter === 'all'
            );
        });

    refresh();

    showToast('All data has been reset.');

}


// Logout

function logout() {

    if (!confirm('Log out of this session?')) {
        return;
    }

    sessionStorage.removeItem(SESSION_KEY);

    showToast('You have been logged out.');

}


// Toast Message

function showToast(message) {

    const toast = document.getElementById('toast');

    toast.textContent = message;

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2600);

}


// Escape Key to Close Modal

document.addEventListener('keydown', e => {

    if (e.key === 'Escape') {
        closeModal();
    }

});


// Initialize Application

loadData();

document.getElementById('displayName').value =
    profile.name;

document.getElementById('currency').value =
    profile.currency;

applyTheme(
    localStorage.getItem(THEME_KEY) === '1'
);

refresh();