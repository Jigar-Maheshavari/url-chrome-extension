var chrome;
var window;
try {
    importScripts('/scripts/util.js', '/scripts/process.js');
} catch (e) {
}


chrome.runtime.onMessage.addListener(async (request, sender) => {
    if (request.action === "URLS") {
        for (let index = 0; index < request.data.length; index++) {
            await getThroughTab(request.data[index])
        }
    } else {
        const tab = await getThroughTab(request.data)
        await clickOnPdf(tab, request.data)
    }
})

const clickOnPdf = async (tab, url) => {
    return new Promise(async (resolve) => {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['scripts/download-html.js'],
        }, (data) => {
            if (!data) {
                resolve({ success: false, message: chrome.runtime.lastError ? chrome.runtime.lastError.message : 'Something wnt wrong when make wrapper' })
            }
        });
        chrome.runtime.onMessage.addListener(async function message(request, sender) {
            chrome.runtime.onMessage.removeListener(message);
            if (request.action === "MakeWrapperDataThird") {
                resolve(request.data)
            }
        });
    });
}


const addFile = async (name, file, url) => {
    const response = await fetch(`http://localhost:1333/api/v1/store-html-file-aws`, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name, url: url, file: file
        })
    },
    )
    const result = await response.json();
    chrome.tabs.create({
        url: result.path
    })
}

const getThroughTab = async (newTab) => {
    return await tabChanges(newTab)
}

const tabChanges = async (url) => {
    return new Promise(async (resolve) => {
        await chrome.tabs.update(null, { url: url });
        chrome.tabs.onUpdated.addListener(async function getTab(tabId, info, tab) {
            chrome.runtime.onMessage.removeListener(getTab);
            if (tab && tab.status === 'complete') {
                resolve(tab)
            }
        });
    })
}