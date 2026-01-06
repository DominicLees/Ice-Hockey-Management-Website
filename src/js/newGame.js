const locationForm = document.getElementById('locationForm');
const home = document.getElementById('home');
const away = document.getElementById('away');

home.addEventListener('change', () => {
    if (home.checked) {
        locationForm.classList.add('hidden')
    }
})

away.addEventListener('change', () => {
    if (away.checked) {
        locationForm.classList.remove('hidden')
    }
})