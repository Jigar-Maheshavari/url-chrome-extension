
async function domProcessForPdf(document) {
    try {
        // const linksDiv = document.getElementsByClassName("button-wrapper")
        // console.log('linksDiv[0].children[0].href: ************', linksDiv[0].children[0].href);
        // linksDiv[0].children[0].click()
        chrome.runtime.sendMessage({
            action: "MakeWrapperDataThird",
            data: { success: true, data: document.documentElement.outerHTML, message: null }
        });
    } catch (error) {
        if (chrome && chrome.runtime) {
            chrome.runtime.sendMessage({
                action: "MakeWrapperDataThird",
                data: { success: false, data: error, message: 'Catch Error' }
            });
        }
    }
}

domProcessForPdf(document);