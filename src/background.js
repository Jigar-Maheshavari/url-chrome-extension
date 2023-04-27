var chrome;

try {
    importScripts('/scripts/util.js', '/plugin-env.js', '/scripts/process.js');
} catch (e) {
    console.log(e);
}


chrome.runtime.onMessage.addListener(async (request, sender) => {
    console.log('request: ', request);
    if (request.action === "URLS") {
        console.log('START_BACKGROUND request: ', request);
        for (let index = 0; index < request.data.length; index++) {
            console.log('request.data[index]: ', request.data[index]);
            
            await getThroughTab(request.data[index])
        }
    }
})


const getThroughTab = async (newTab) => {
    await chrome.tabs.update(null, { url: newTab });
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