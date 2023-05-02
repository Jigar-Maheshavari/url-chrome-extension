
async function domProcessForPdf(document) {
    try {
        // const linksDiv = document.getElementsByClassName("button-wrapper")
        // console.log('linksDiv[0].children[0].href: ************', linksDiv[0].children[0].href);
        // linksDiv[0].children[0].click()
        let data = document.documentElement.outerHTML
        data = data.replace(/<head[^>]*>([\s\S]*?)<\/head>/gi, '');
        data = data.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
        data = data.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
        let a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([(data)], { type: 'html' }));
        a.download = (Math.random() * 1000).toFixed(0) + '.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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