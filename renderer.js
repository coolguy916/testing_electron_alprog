const { ipcRenderer } = require('electron');

async function loadUsers() {
    const res = await ipcRenderer.invoke('get-users');
    if (res.success) {
        displayUsers(res.data);
    } else {
        console.error('Failed to load users:', res.error);
    }
}

function displayUsers(users) {
    const container = document.getElementById('user-list');
    container.innerHTML = '';

    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.innerHTML = `
            <h3>${user.name}</h3>
            <p>${user.email}</p>
        `;
        container.appendChild(userCard);
    });
}

window.onload = () => {
    loadUsers();
};
