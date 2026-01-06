const settingsToggle = document.getElementById('settingsToggle');
const settingsForm = document.getElementById('settingsForm');

settingsToggle.addEventListener('click', () => {
    const state = settingsForm.classList.toggle('hidden');
    settingsToggle.innerHTML = 'Settings ' + (state ? '+' : '-');
})