const teamCode = document.getElementById('teamCode');

document.getElementById('joinTeamButton').addEventListener('click', () => {
    window.location = 'team/join/' + teamCode.value;
})