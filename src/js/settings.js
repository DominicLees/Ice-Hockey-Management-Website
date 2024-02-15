const newCodeDisplay = document.getElementById('newCodeDisplay');

async function newCode() {
    const response = await fetch('/new-user-code');
    if (response.status != 200) {
        alert('Unable to generate code')
        throw new Error('Unable to generate code');
    }
    const code = await response.text();
    newCodeDisplay.innerHTML = `Your code: <strong>${code}</strong><br>This code is valid for the next 5 minutes.`;

    setTimeout(() => {
        newCodeDisplay.innerHTML = 'You code has expired. Please generate a new one.';
    }, 300000);
}

document.getElementById('newCodeButton').addEventListener('click', newCode);