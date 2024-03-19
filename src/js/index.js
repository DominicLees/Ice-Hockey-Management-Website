const nameInput = document.getElementById('name');
const signupEmail = document.getElementById('signupEmail');
const signupForm = document.getElementById('signupForm');
const loginEmail = document.getElementById('loginEmail');
const loginForm = document.getElementById('loginForm');
const newDeviceLoginToggle = document.getElementById('newDeviceLoginToggle');
const newDeviceLoginForm = document.getElementById('newDeviceLoginForm');
const authCode = document.getElementById('authCode');
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// This regular expression checks if emails provided match the format of a valid email
const emailRegEx = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Check if the user's web browser supports webauthn
if (window.PublicKeyCredential) {
    console.log('webAuth supported!');
} else {
    alert('Your browser does not support webAuth, please switch to a browser that does.');
    throw new Error('webAuth not supported');
}

function validateSignupEmail() {
    const valid = emailRegEx.test(signupEmail.value);
    signupEmail.style.backgroundColor = valid ? 'lightgreen' : 'lightcoral';
    return valid;
}
signupEmail.addEventListener('focusout', validateSignupEmail);

function validateName() {
    const valid = nameInput.value.length > 0;
    nameInput.style.backgroundColor = valid ? 'lightgreen' : 'lightcoral';
    return valid;
}
nameInput.addEventListener('focusout', validateName);

function validateLoginEmail() {
    const valid = emailRegEx.test(loginEmail.value);
    loginEmail.style.backgroundColor = valid ? 'lightgreen' : 'lightcoral';
    return valid;
}
loginEmail.addEventListener('focusout', validateLoginEmail);

function validateAuthCode() {
    const valid = authCode.value.length > 0;
    authCode.style.backgroundColor = valid ? 'lightgreen' : 'lightcoral';
    return valid;
}
authCode.addEventListener('focusout', validateAuthCode);

newDeviceLoginToggle.addEventListener('click', () => {
    const loginHidden = loginForm.classList.toggle('hidden');
    newDeviceLoginForm.classList.toggle('hidden');
    newDeviceLoginToggle.innerHTML = loginHidden ? 'Return to normal login' : 'Login on this device for the first time';
})

const pubKeyCredParams = [{
        "type": "public-key",
        "alg": -7
    }, {
        "type": "public-key",
        "alg": -8
    }, {
        "type": "public-key",
        "alg": -36
    }, {
        "type": "public-key",
        "alg": -37
    }, {
        "type": "public-key",
        "alg": -38
    }, {
        "type": "public-key",
        "alg": -39
    }, {
        "type": "public-key",
        "alg": -257
    }, {
        "type": "public-key",
        "alg": -258
    }, {
        "type": "public-key",
        "alg": -259
    }
]

async function signup(e) {
    e.preventDefault();

    // Input validation
    const validName = validateName();
    const validEmail = validateSignupEmail();
    if (validName == false || validEmail == false) {
        return;
    }

    // Get challenge string from server
    const response = await fetch('/challenge');
    const challenge = await response.text();
    
    const publicKeyCredentialCreationOptions = {
        challenge: textEncoder.encode(challenge),
        rp: {
            name: "Hockey",
        },
        user: {
            id: Uint8Array.from(Math.random().toString(20).substring(2, 20), c => c.charCodeAt(0)),
            name: signupEmail.value,
            displayName: nameInput.value,
        },
        pubKeyCredParams,
        authenticatorSelection: {
            authenticatorAttachment: "platform",
        },
        timeout: 60000,
        attestation: "direct"
    };

    navigator.credentials.create({publicKey: publicKeyCredentialCreationOptions}).then(credentials => {
        // Send credentials to the server
        return fetch('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: signupEmail.value,
                name: nameInput.value,
                clientData: JSON.parse(textDecoder.decode(credentials.response.clientDataJSON)),
                attestationObject: new Uint8Array(credentials.response.attestationObject)
            })
        })
    }).then(response => {
        if (response.status == 200) {
            window.location.reload();
        } else {
            alert(`Error code ${response.status}. Please ensure all details are complete.`);
        }
    }).catch(error => {
        console.error(error);
        alert('Something went wrong, try again.');
    })
}

signupForm.addEventListener('submit', signup);

async function login(e) {
    e.preventDefault();

    // Input validation
    if (validateLoginEmail() == false) {
        return;
    }

    // Get challenge string from server
    const challengeResponse = await fetch('/challenge');
    const challenge = await challengeResponse.text();
    // Get credential Ids from server
    const credentialIdResponse = await fetch(`/credentialId/${loginEmail.value}`);
    const credentailIds = JSON.parse(await credentialIdResponse.text());
    // Check the server returned at least one credential, otherwise the account does not exist
    if (credentailIds.length == 0) {
        return alert('Please check that the email provided is valid');
    }
    let allowCredentials = [];
    credentailIds.forEach(credential => {
        allowCredentials.push({
            id: new Uint8Array(Object.values(credential.data)),
            type: 'public-key'
        })
    });

    const publicKeyCredentialRequestOptions = {
        challenge: textEncoder.encode(challenge),
        allowCredentials,
        timeout: 60000
    }

    const assertion = await navigator.credentials.get({publicKey: publicKeyCredentialRequestOptions});
    const response = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: loginEmail.value,
            credentialId: assertion.id,
            clientData: JSON.parse(textDecoder.decode(assertion.response.clientDataJSON)),
            clientDataJSON: new Uint8Array(assertion.response.clientDataJSON),
            authenticatorData: new Uint8Array(assertion.response.authenticatorData),
            signature: new Uint8Array(assertion.response.signature)
        })
    })

    if (response.status == 200) {
        window.location = '/dashboard';
    } else {
        const text = await response.text();
        alert(`Error code ${response.status}. Error message: '${text}'. Please ensure all details are complete.`);
    }

}

loginForm.addEventListener('submit', login);

async function newDeviceLogin(e) {
    e.preventDefault();

    // Input validation
    const validEmail = validateLoginEmail();
    const validAuthCode = validateAuthCode();
    if (!validEmail || !validAuthCode) {
        return;
    }
    // Check that auth code is valid
    const authCodeCheckResponse = await fetch('/valid-auth-code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: loginEmail.value,
            authCode: authCode.value
        })
    })
    const authCodeCheck = await authCodeCheckResponse.text();
    if (!authCodeCheck) {
        return alert('Invalid code');
    }

    // Get challenge string from server
    const challengeResponse = await fetch('/challenge');
    const challenge = await challengeResponse.text();

    const publicKeyCredentialCreationOptions = {
        challenge: textEncoder.encode(challenge),
        rp: {
            name: "Hockey",
        },
        user: {
            id: Uint8Array.from(Math.random().toString(20).substring(2, 20), c => c.charCodeAt(0)),
            name: loginEmail.value,
            displayName: loginEmail.value,
        },
        pubKeyCredParams,
        authenticatorSelection: {
            authenticatorAttachment: "platform",
        },
        timeout: 60000,
        attestation: "direct"
    };

    navigator.credentials.create({publicKey: publicKeyCredentialCreationOptions}).then(credentials => {
        // Send credentials to the server
        return fetch('/new-credentials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: loginEmail.value,
                clientData: JSON.parse(textDecoder.decode(credentials.response.clientDataJSON)),
                attestationObject: new Uint8Array(credentials.response.attestationObject)
            })
        })
    }).then(response => {
        if (response.status == 200) {
            window.location.reload();
        } else {
            alert(`Error code ${response.status}. Please ensure all details are complete.`);
        }
    }).catch(error => {
        console.error(error);
        alert('Something went wrong, try again.');
    })
}

newDeviceLoginForm.addEventListener('submit', newDeviceLogin);