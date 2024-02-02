const nameInput = document.getElementById('name');
const signupEmail = document.getElementById('signupEmail');
const signupForm = document.getElementById('signupForm');

nameInput.addEventListener('focusout', () => {
    nameInput.style.backgroundColor = nameInput.value.length > 0 ? 'lightgreen' : 'red';
})

if (window.PublicKeyCredential) {
    console.log('webAuth supported!');
} else {
    alert('Your browser does not support webAuth, please switch to a browser that does.');
    throw new Error('webAuth not supported');
}

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

    // Add input validation here

    // Get challenge string from server
    const response = await fetch('/challenge');
    const challenge = await response.text();

    const publicKeyCredentialCreationOptions = {
        challenge: Uint8Array.from(challenge, c => c.charCodeAt(0)),
        rp: {
            name: "Hockey",
        },
        user: {
            id: Uint8Array.from("HUEFRDFVHJFV", c => c.charCodeAt(0)),
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
        console.log(credentials);
    }).catch(error => {
        console.error(error);
        alert('Something went wrong, try again.');
    })
}

signupForm.addEventListener('submit', signup);