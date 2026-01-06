const deleteTeamButton = document.getElementById('delete-team');
const leaveTeamButton = document.getElementById('leave-team');
const removePlayerButtons = [].slice.call(document.getElementsByClassName('removePlayer'))
const copyTeamLinkButton = document.getElementById('copyTeamLinkButton');
const teamCode = document.getElementById('teamCode');
const playerSort = document.getElementById('playerSort');
const playerFilter = document.getElementById('playerFilter');

deleteTeamButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete this team?')) {
        window.location.href = `${window.location.href}/delete`;
    }
})

leaveTeamButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to leave this team?')) {
        window.location.href = `${window.location.href}/leave`;
    }
})

removePlayerButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (confirm('Are you sure you want to remove this player?')) {
            window.location.href = `${window.location.href}/remove/${button.dataset.id}`;
        }
    })
})

copyTeamLinkButton.addEventListener('click', () => {
    navigator.clipboard.writeText(teamCode.href);
    copyTeamLinkButton.innerHTML = 'Copied to clipboard';
})

function refresh() {
    window.location.href = `${window.location.href.split('?')[0]}?playerSort=${playerSort.value}&playerFilter=${playerFilter.value}`;
}

playerSort.addEventListener('change', refresh);
playerFilter.addEventListener('change', refresh);