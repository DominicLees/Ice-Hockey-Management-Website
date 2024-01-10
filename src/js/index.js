const nameInput = document.getElementById('name');
nameInput.addEventListener('focusout', () => {
    nameInput.style.backgroundColor = nameInput.value.length > 0 ? 'lightgreen' : 'red';
})

if (window.PublicKeyCredential) {
    console.log('webAuth supported!');
} else {
    console.log('webAuth not supported :(')
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
}]

const publicKeyCredentialCreationOptions = {
    challenge: Uint8Array.from("UZSL85T9AFC", c => c.charCodeAt(0)),
    rp: {
        name: "Hockey",
    },
    user: {
        id: Uint8Array.from("HUEFRDFVHJFV", c => c.charCodeAt(0)),
        name: "lee@webauthn.guide",
        displayName: "Lee",
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
});