var chrome;

try {
    importScripts('/scripts/util.js', '/plugin-env.js', '/scripts/process.js');
} catch (e) {
    console.log(e);
}


var mainData;
console.log('MAIN_ENV: ', MAIN_ENV);
const ENV = MAIN_ENV || 'DEV';
const envObj = {
    LOCAL: {
        consoleUrl: 'http://localhost:4205',
        serverBaseUrl: 'http://localhost:1333',
        serverUrl: 'http://localhost:1333/api/v1',
    },
    DEV: {
        consoleUrl: 'https://cloud.virtuousai.com',
        serverBaseUrl: 'https://cloud-api.virtuousai.com',
        serverUrl: 'https://cloud-api.virtuousai.com/api/v1',
    },
    PROD: {
        consoleUrl: 'https://ec.aakba.com',
        serverBaseUrl: 'https://ec-api.aakba.com',
        serverUrl: 'https://ec-api.aakba.com/api/v1',
    }
}
const consoleUrl = envObj[ENV].consoleUrl;
const serverBaseUrl = envObj[ENV].serverBaseUrl;
const serverUrl = envObj[ENV].serverUrl;

const sendMessageToHome = (type, skipOrUploadedImages = 0, isErrorMessage = false, message = null) => {
    const sendData = { success: true };
    if (type === "showRuntimeMessage") {
        sendData.message = message ? message : '';
    } else if (type === "imageUploadedVariableChange") {
        sendData.imageUploaded = (skipOrUploadedImages > 0) ? skipOrUploadedImages : 0;
    } else {
        sendData.data = (skipOrUploadedImages > 0) ? skipOrUploadedImages : 0;
        if (isErrorMessage) sendData.message = message ? message : '';
    }
    chrome.runtime.sendMessage({
        action: type,
        data: sendData
    });
}

chrome.runtime.onMessage.addListener(async (request, sender) => {
    if (request.action === "START_BACKGROUND") {
        console.log('START_BACKGROUND request: ', request);

        await chrome.storage.local.set({ 'isImageUploading': true });
        sendMessageToHome("localStorageVariableChange");

        const response = await startProcessForGetImages();
        console.log('startProcessForGetImages response: ', response);
        if (response.success) {
            finalSubmit(response.data);
        } else {
            sendMessageToHome("errorVariableChange", [], true, response.message);
        }
    } else if (request.action === "MAKE_WRAPPER") {

        mainData = request.data;

        chrome.storage.local.set({ 'isCycleStarted': true });
        sendMessageToHome("localStorageVariableChange");
        chrome.storage.local.set({ skipCount: request.data.skipCount });
        if (request.data.currentTab) {
            chrome.storage.local.set({ currentTab: request.data.currentTab });
        }
        const response = await startMakeWrapperDocument(request.data.skipCount);
        console.log('startMakeWrapperDocument response: ', response);
        if (response.success) {
            sendMessageToHome("localStorageVariableChange", response.data);
        } else {

        }
    }
})




const finalSubmit = async (imagesData) => {
    if (imagesData && imagesData.length) {
        console.log('imagesData: ', imagesData);
        const parentId = await getLocalStorage('parentPath');
        if (parentId) {
            await waitForTime(4000) // TODO comment this when real testing and uncomment below code
            for (let index = 0; index < imagesData.length; index++) {
                if (imagesData[index] && imagesData[index].img) {
                    if (getImageType(imagesData[index].img) === 'base64') {
                        let blobData = convertBase64ToBlobData(imagesData[index].img);
                        await uploadFile({ imageBlob: blobData, imageName: `${imagesData[index].name}.png`, parentId });
                    } else {
                        const blobData = await urlToRealBlob(imagesData[index].img)
                        await uploadFile({ imageBlob: blobData, imageName: `${imagesData[index].name}.png`, parentId });
                    }
                }
            }
            await chrome.storage.local.remove('isImageUploading');
            sendMessageToHome("imageUploadedVariableChange", imagesData.length);
        } else {
            sendMessageToHome("errorVariableChange", [], true, 'parentId Not Found');
        }
    } else {
        sendMessageToHome("errorVariableChange", [], true, 'Images Not Found');
    }
}

const uploadFile = (data) => {
    let blob = new Blob([data], { type: 'application/png' });
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, data.imageName);
    } else {
        let a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = data.imageName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    // return new Promise((resolve) => {
    //     const form = new FormData();
    //     var blob = data.imageBlob;
    //     form.append('metadata', new Blob([JSON.stringify({ name: data.imageName, parents: [data.parentId] })], { type: 'application/json' }));
    //     form.append('file', blob);
    //     apiCall({
    //         method: 'post',
    //         url: `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,
    //         payload: form
    //     }).then((res) => {
    //         resolve(res)
    //         console.log('res: ', res);
    //     }).catch((err) => {
    //         resolve(err)
    //         console.log('err: ', err);
    //     })
    // })
}

const startProcessForGetImages = () => {
    return new Promise(async (resolve) => {
        const currentTab = await getLocalStorage('currentTab');
        chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            files: ['scripts/get-images-src.js'],
        }, (data) => {
            if (!data) {
                resolve({ success: false, message: chrome.runtime.lastError ? chrome.runtime.lastError.message : 'Something wnt wrong when get image src' })
            }
        });
        chrome.runtime.onMessage.addListener(function getImageReturnData(request, sender) {
            if (request.action === "getImageArrayData") {
                chrome.runtime.onMessage.removeListener(getImageReturnData);
                resolve(request.data);
            }
        });
    })
}

const startMakeWrapperDocument = () => {
    return new Promise(async (resolve) => {
        const currentTab = await getLocalStorage('currentTab');
        chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            files: ['scripts/make-wrapper.js'],
        }, (data) => {
            if (!data) {
                resolve({ success: false, message: chrome.runtime.lastError ? chrome.runtime.lastError.message : 'Something wnt wrong when make wrapper' })
            }
        });
        chrome.runtime.onMessage.addListener(async function getQuestionDetailsData(request, sender) {
            if (request.action === "MakeWrapperData") {
                chrome.runtime.onMessage.removeListener(getQuestionDetailsData);
                resolve(request.data)
            }
        });

    })
}
