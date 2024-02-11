const nameInput = document.getElementById('name');
const signupEmail = document.getElementById('signupEmail');
const signupForm = document.getElementById('signupForm');
const loginEmail = document.getElementById('loginEmail');
const loginForm = document.getElementById('loginForm');
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

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

async function login(e) {
    e.preventDefault();

    // Add input validation here

    // Get challenge string from server
    const challengeResponse = await fetch('/challenge');
    const challenge = await challengeResponse.text();
    // Get credential Id from server
    const credentialIdResponse = await fetch(`/credentialId/${loginEmail.value}`);
    const credentailId = await credentialIdResponse.arrayBuffer();

    const publicKeyCredentialRequestOptions = {
        challenge: textEncoder.encode(challenge),
        allowCredentials: [{
            id: credentailId,
            type: 'public-key',
        }],
        timeout: 60000,
    }

    const assertion = await navigator.credentials.get({publicKey: publicKeyCredentialRequestOptions});
    const response = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: loginEmail.value,
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

signupForm.addEventListener('submit', signup);
loginForm.addEventListener('submit', login);