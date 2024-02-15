const newCodeDisplay = document.getElementById('newCodeDisplay');

async function newCode() {
    const response = await fetch('/new-user-code');
    if (response.status != 200) {
        alert('Unable to generate code')
        throw new Error('Unable to generate code');
    }
    const code = await response.text();
    newCodeDisplay.innerHTML = `Your code: ${code}`;
}

document.getElementById('newCodeButton').addEventListener('click', newCode);