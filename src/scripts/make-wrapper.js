function waitNewForTime(millisecond) {
    return new Promise((resolve) => setTimeout(resolve, millisecond));
}

function checkAndGetSkipCount() {
    return new Promise((resolve) => {
        chrome.storage.local.get("skipCount", ({ skipCount }) => {
            if (skipCount) {
                resolve(skipCount);
            } else {
                resolve(0);
            }
        });
    });
}

async function domProcess(document) {
    try {
        var newskipCount = await checkAndGetSkipCount();
        console.log('newskipCount: ', newskipCount);

        var imageName = 'no name';
        if (window.location.href) {
            imageName = window.location.href.split('?q=').slice(1).join(' ').split('&')[0];
            imageName = decodeURI(imageName.split('+').join(' '));
            const googleCountryValue = window.location.href.split('&cr=').slice(1).join(' ').split('&')[0];
            if (googleCountryValue) {
                const countryCode = googleCountryValue.split('country')[1];
                imageName = `${countryCode ? countryCode.toLowerCase() : 'en'}-${imageName}`
            } else {
                imageName = `en-${imageName}`
            }
        }

        if (newskipCount > 0) {
            window.scrollTo(0, (newskipCount * 60));
            await waitNewForTime(2000);
        }

        const imagesProcessLength = 70;

        let mainContainer = document.getElementsByClassName(`isv-r PNCib MSM1fd BUooTd`)
        console.log('mainContainer.length: ', JSON.parse(JSON.stringify(mainContainer.length)));
        let allMainContainerArray = Array.prototype.slice.call(mainContainer);
        const processDivs = allMainContainerArray.splice(newskipCount, imagesProcessLength);
        console.log('processDivs.length: ', processDivs.length);

        if (processDivs.length) {
            for (let index = 0; index < processDivs.length; index++) {
                if (index === 0) {
                    processDivs[index].scrollIntoView({ behavior: "smooth", block: "center" });
                }
                const fileNumber = newskipCount + index + 1;
                processDivs[index].setAttribute("data-selected-image", "YES");
                var customDiv = document.createElement("div");
                customDiv.innerHTML = `
              <div id="custom-wrapper-div-id" class="checked custom-wrapper-div" style="
              position: absolute;
              left: 0;
              top: 0;
              z-index: 1;
              // background: #000;
              width: 100%;
              height: 100%;
            ">
            <div style="border: 2px solid #0095ff;position: relative;height: 100%;">
            <input style="width: 20px;height: 20px;position: relative;top: 7px;" type="checkbox" checked id="${index}_test" >
            <label class="custom-checkbox"
            style="position: absolute;
            height: 100%;
            width: 100%;
            left: 0;
            cursor: pointer;
            top: 0;" for="${index}_test" ></label>
            <div style="position: absolute;top: 3px;left: 37px;width: calc(100% - 37px);">
              <input type="text" placeholder="Enter name" class="custom-my-image-name" value="${imageName}-${fileNumber}" style="width: calc(100% - 25px);background: #fff;padding: 8px;
              border: 1px solid #e6ecf0;border-radius: 6px;font-size: 14px;color: #737d8c;outline: none;"/>
            </div>
            </div>
            </div>
          `;
                processDivs[index].appendChild(customDiv);
                const checkbox = document.getElementById(`${index}_test`)
                checkbox.addEventListener('change', (event) => {
                    // console.log('event.target.checked: ', event.target.checked);
                    processDivs[index].setAttribute("data-selected-image", event.target.checked ? "YES" : "NO");
                    // checkbox.setAttribute("data-value", event.target.checked ? "true" : "false");
                })
                const inputBox = document.getElementsByClassName(`custom-my-image-name`)[index]
                inputBox.addEventListener('change', (event) => {
                    inputBox.setAttribute("value", event.target.value);
                })
            }

            if (chrome && chrome.runtime) {
                chrome.runtime.sendMessage({
                    action: "MakeWrapperData",
                    data: { success: true, data: processDivs.length }
                });
            }
        } else {
            if (chrome && chrome.runtime) {
                chrome.runtime.sendMessage({
                    action: "MakeWrapperData",
                    data: { success: false, message: 'Further Images Not Found' }
                });
            }
        }
    } catch (error) {
        if (chrome && chrome.runtime) {
            chrome.runtime.sendMessage({
                action: "MakeWrapperData",
                data: { success: false, data: error, message: 'Catch Error' }
            });
        }
    }
}

domProcess(document);