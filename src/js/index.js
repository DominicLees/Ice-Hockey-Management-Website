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
    const textEncoder = new TextEncoder();
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
        const textDecoder = new TextDecoder();
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
            console.log('success')
            //window.location.reload();
        } else {
            alert(`Error code ${response.status}. Please ensure all details are complete.`);
        }
    }).catch(error => {
        console.error(error);
        alert('Something went wrong, try again.');
    })
}

signupForm.addEventListener('submit', signup);