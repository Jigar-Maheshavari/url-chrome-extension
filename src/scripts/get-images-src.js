function waitForTime(millisecond) {
    return new Promise((resolve) => setTimeout(resolve, millisecond));
}

async function runProcess(document) {
    try {
        var imageArray = []
        const imageDivContainers = document.querySelectorAll(`[data-selected-image='YES']`)
        for (let index = 0; index < imageDivContainers.length; index++) {
            const element = imageDivContainers[index];
            console.log('element.querySelector(".custom-my-image-name"): ', element.querySelector(".custom-my-image-name"));
            const name = element.querySelector(".custom-my-image-name").getAttribute("value");
            const imageAlt = element.querySelector("img").getAttribute("alt")
            element.querySelector('#custom-wrapper-div-id').remove();
            element.removeAttribute(`data-selected-image`);

            const dataId = element.getAttribute('data-id')
            element.querySelector('a').click()
            await waitForTime(500)
            const mainContainerOfImg = document.querySelector(`[data-sid='${dataId}']`);
            const imageSrc = mainContainerOfImg.querySelector(`img[alt="${imageAlt}"]`).getAttribute('src');
            if (imageSrc) {
                imageArray.push({ img: imageSrc, name })
            }
        }

        const rightSidebar = document.querySelector(`[data-hp="imgrc"]`)
        const firstAnchor = rightSidebar.getElementsByTagName('a')[0];
        if (firstAnchor) {
            firstAnchor.click()
        }

        if (imageArray.length) {
            if (chrome && chrome.runtime) {
                chrome.runtime.sendMessage({
                    action: "getImageArrayData",
                    data: { success: true, data: imageArray }
                });
            }
        } else {
            if (chrome && chrome.runtime) {
                chrome.runtime.sendMessage({
                    action: "getImageArrayData",
                    data: { success: false, message: 'Images Data Not Found' }
                });
            }
        }
    } catch (error) {
        console.log('getImagesDataDocument error: ', error);
        if (chrome && chrome.runtime) {
            chrome.runtime.sendMessage({
                action: "getImageArrayData",
                data: { success: false, message: error }
            });
        }
    }
}

runProcess(document);