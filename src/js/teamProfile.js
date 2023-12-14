const deleteTeamButton = document.getElementById('delete-team');

deleteTeamButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete this team?')) {
        window.location.href = window.location.href + "/delete";
    }
})