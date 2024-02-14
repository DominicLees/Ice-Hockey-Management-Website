const deleteTeamButton = document.getElementById('delete-team');
const copyTeamLinkButton = document.getElementById('copyTeamLinkButton');
const teamCode = document.getElementById('teamCode');

deleteTeamButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete this team?')) {
        window.location.href = window.location.href + "/delete";
    }
})

copyTeamLinkButton.addEventListener('click', () => {
    navigator.clipboard.writeText(teamCode.href);
    copyTeamLinkButton.innerHTML = 'Copied to clipboard';
})