var port = 3000;
var socket = io.connect('http://localhost:' + port);
var crypto = window.crypto || window.msCrypto;
var encryptKey;
var algorytm = {
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
    hash: {name: "SHA-256"}
};
var vector = crypto.getRandomValues(new Uint8Array(16));
var private_key_object = null;
var public_key_object = null;

function convertStringToArrayBuffer(str) {
    var bytes = new Uint8Array(str.length);
    for (var iii = 0; iii < str.length; iii++)
    {
        bytes[iii] = str.charCodeAt(iii);
    }
    return bytes;
}

function convertArrayBufferViewtoString(buffer) {
    var str = "";
    for (var iii = 0; iii < buffer.byteLength; iii++)
    {
        str += String.fromCharCode(buffer[iii]);
    }
    return str;
}

function useKey(key) {
    encryptKey = key;
    document.getElementById('public_key').innerText=key;
}

if(crypto.subtle) {
    var promise_key = crypto.subtle.generateKey(algorytm, true, ['encrypt', 'decrypt']);
    promise_key.then(function (key) {
        private_key_object = key.privateKey;
        public_key_object = key.publicKey;
        crypto.subtle.exportKey("jwk", public_key_object).then(
            function(result){
                socket.emit('key', JSON.stringify(result));
            }, function(e){
                console.log("Error export public key: ", e.message);
            });
    });
    promise_key.catch = function(e){
        console.log("Error generate key chain: ", e.message);
    }
} else {
    alert("Cryptography API not Supported");
}

socket.on('userName', function(userName){
    myName = userName;
    let span = document.createElement("span");
    span.textContent = userName;
    document.querySelector('#basic-addon3').append(span);
    $('textarea').val($('textarea').val() + 'You\'r username => ' + userName + '\n');
});

socket.on('newUser', function(userName){
    $('textarea').val($('textarea').val() + userName + ' connected!\n');
});

socket.on('messageToClients', function(data, name){
    decrypt_promise = crypto.subtle.decrypt({name: "RSA-OAEP", iv: vector}, private_key_object, new Uint8Array(data));
    decrypt_promise.then(
        function(result){
            decrypted_data = new Uint8Array(result);
            $('textarea').val($('textarea').val() + name + ' : '+ convertArrayBufferViewtoString(decrypted_data) + '\n');
        },
        function(e){
            console.log("Error decrypt data: ", e.message);
            $('textarea').val($('textarea').val() + name + ' : Error decrypt data!\n');
        }
    );
});

socket.on('keyToClients', function(keys){
    $('.list-unstyled').empty();
    keys.forEach(function(key, i) {
        let li = document.createElement('li');
        li.setAttribute("id", i);
        li.setAttribute("class", "small");
        li.innerHTML=key.user + " ";
        document.querySelector('.list-unstyled').appendChild(li);
        let button = document.createElement('button');
        button.setAttribute("class", "button");
        button.addEventListener("click", function(){
            useKey(key.key);
        });
        button.innerHTML="use";
        document.getElementById(i).appendChild(button);
    });
});

$(document).on('click', '#send_msg', function(){
    var message = $('#msg_id').val();
    if (message.length && encryptKey){
        crypto.subtle.importKey("jwk", JSON.parse(encryptKey), algorytm, true, ["encrypt"]).then(
            function (key) {
                encrypt_promise = crypto.subtle.encrypt({
                    name: "RSA-OAEP",
                    iv: vector
                }, key, convertStringToArrayBuffer(message));
                encrypt_promise.then(
                    function (result) {
                        socket.emit('message', result);
                        }, function (e) {
                            console.log("Error encrypt data: ", e.message);
                        });
                }, function (e) {
                console.log("Error import key: ", e.message);
            });
        $('textarea').val($('textarea').val() + myName + ' : ' + message + '\n');
        $('#msg_id').val(null);
    }
});