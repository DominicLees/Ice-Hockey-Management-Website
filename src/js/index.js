const nameInput = document.getElementById('name');
nameInput.addEventListener('focusout', () => {
    nameInput.style.backgroundColor = nameInput.value.length > 0 ? 'lightgreen' : 'red';
})

const emailRegEx = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
function validateEmail(input) {
    if (emailRegEx.test(input.value)) {
        input.style.backgroundColor = 'lightgreen';
    } else {
        input.style.backgroundColor = 'red';
    }
}

const loginEmail = document.getElementById('loginEmail');
loginEmail.addEventListener('focusout', () => validateEmail(loginEmail));
const signupEmail = document.getElementById('signupEmail');
signupEmail.addEventListener('focusout', () => validateEmail(signupEmail));