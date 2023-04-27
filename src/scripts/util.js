const waitForTime = (millisecond) => {
    return new Promise((resolve) => setTimeout(resolve, millisecond));
}

const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

const generateRandomString = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let result = '';
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


const getImageType = (path) => {
    if (path.startsWith("data:")) {
        return 'base64';
    } else if (path.startsWith("http:") || path.startsWith("https:")) {
        return 'link'
    }
    return null;
}

const convertBase64ToBlobData = (base64Data, contentType = 'image/png', sliceSize = 512) => {
    const byteCharacters = atob(base64Data.replace(/^data:image\/(png|jpeg|jpg);base64,/, ''));
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
}

const urlToBlob = (url) => {
    return new Promise((resolve) => {
        fetch(url, { mode: 'no-cors' }).then(res => res.blob()).then(blob => { resolve(blob) });
        // fetch(url).then(res => res.blob()).then(blob => { resolve(blob) });
    })
}

const urlToRealBlob = async (url) => {
    const response = await fetch('http://localhost:1333/get-image?url=' + url);
    return response.blob();
}

const getLocalStorage = (key) => {
    return new Promise((resolve) => {
        chrome.storage.local.get(key, (data) => {
            resolve(data[key])
        });
    })
}

const apiCall = async (config) => {
    console.log('config: ', config);
    let token = await getLocalStorage('credentialsKey');
    if (token) {
        token = token.token
    }
    console.log('token: ', token);
    const response = await fetch(config.url, {
        method: config.method ? config.method : 'GET', // *GET, POST, PUT, DELETE, etc.
        // mode: 'cors', // no-cors, *cors, same-origin
        // cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        // credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            // 'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        // redirect: 'follow', // manual, *follow, error
        // referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: config.payload // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
}