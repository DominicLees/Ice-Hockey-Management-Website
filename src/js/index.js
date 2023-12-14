const nameInput = document.getElementById('name');
nameInput.addEventListener('focusout', () => {
    nameInput.style.backgroundColor = nameInput.value.length > 0 ? 'lightgreen' : 'red';
})

function validateEmail(input) {
    if (input.value.length == 0) {
        input.style.backgroundColor = 'red';
    } else {
        input.style.backgroundColor = 'lightgreen';
    }
}

const loginEmail = document.getElementById('loginEmail');
loginEmail.addEventListener('focusout', () => validateEmail(loginEmail));
const signupEmail = document.getElementById('signupEmail');
document.getElementById('signupEmail').addEventListener('focusout', () => validateEmail(signupEmail));