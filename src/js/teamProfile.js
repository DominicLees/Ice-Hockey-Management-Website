const deleteTeamButton = document.getElementById('delete-team');
const copyTeamLinkButton = document.getElementById('copyTeamLinkButton');
const teamCode = document.getElementById('teamCode');
const playerSort = document.getElementById('playerSort');

deleteTeamButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete this team?')) {
        window.location.href = window.location.href + "/delete";
    }
})

copyTeamLinkButton.addEventListener('click', () => {
    navigator.clipboard.writeText(teamCode.href);
    copyTeamLinkButton.innerHTML = 'Copied to clipboard';
})

playerSort.addEventListener('change', () => {
    window.location.href = window.location.href.split('?')[0] + '?playerSort=' + playerSort.value;
})