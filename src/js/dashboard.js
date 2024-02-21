const teamCode = document.getElementById('teamCode');
const teamMenu = document.getElementById('teamMenu');
const teamMenuButton = document.getElementById('teamMenuButton');

function hideMenu() {
    teamMenu.classList.add('hidden');
    teamMenuButton.innerHTML = 'Show Menu';
}

function showMenu() {
    teamMenu.classList.remove('hidden');
    teamMenuButton.innerHTML = 'Hide Menu';
}

function windowResize() {
    if (window.innerWidth <= 722) {
        hideMenu();
    } else {
        showMenu();
    }
}

document.getElementById('joinTeamButton').addEventListener('click', () => {
    if (teamCode.value.length != 6) {
        teamCode.style.backgroundColor = 'lightcoral';
        return;
    }
    window.location = 'team/join/' + teamCode.value;
})

teamMenuButton.addEventListener('click', () => {
    if (teamMenu.classList.contains('hidden')) {
        showMenu();
    } else {
        hideMenu();
    }
})

window.addEventListener('resize', windowResize);
windowResize();