import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
declare var chrome: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  url: FormControl = new FormControl(null, [Validators.required])

  constructor(
  ) {

  }
  title = 'url-chrome-extension';


  getExtensions(filename: any) {
    return (filename.split('.').pop());
  }


  blobToFile(theBlob: Blob, fileName: string): File {
    var b: any = theBlob;
    b.lastModifiedDate = new Date();
    b.name = fileName;
    return <File>theBlob;
  }

  async uploadCsv(event: any) {
    console.log('event: ', event);
    if (event.target.files.length > 1) {
      event.target.value = '';
      alert("Only single file is allowed.")
    } else {
      if (this.getExtensions(event.target.files[0].type) === 'application/vnd.ms-excel' || this.getExtensions(event.target.files[0].type) === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || this.getExtensions(event.target.files[0].type.split('/')[1]) === "csv") {
        console.log('Valid file')
        let reader = new FileReader();
        reader.readAsText(event.target.files[0]);
        reader.onload = async function (ev) {
          let csvdata: any = ev.target.result;
          console.log('csvdata: ', csvdata);
          let rowData = csvdata.split("\n");
          rowData = rowData.map(a => a.replace("\r", ''))
          console.log('rowData: ', rowData);
          console.log('rowData[0] =: ', rowData[0]);

          const checkInStorage = (key) => {
            return new Promise((resolve) => {
              console.log('chrome.storage.local: ', chrome.storage.local);
              chrome.storage.local.get([key], (result) => {
                resolve(result[key]);
              });
            })
          }
          if (rowData[0] && (rowData[0] === 'Url' || rowData[0] === 'url')) {
            let finalData = ['url']
            let error = []
            rowData = rowData.slice(1, rowData.length)
            rowData.forEach((row) => {
              if (row.split(",").length === 1) {
                finalData.push(row)
              } else {
                error.push(true)
              }
            })
            if (error.length) {
              event.target.value = '';
              alert("Invalid file format.")
            } else {
              await chrome.storage.local.set({ 'urlsPath': JSON.stringify(finalData.slice(1, finalData.length)) });
              console.log('await checkInStorage ', await checkInStorage('urlsPath'));
              console.log('finalData: ', finalData);
              chrome.runtime.sendMessage({
                action: "URLS",
                data: finalData.slice(1, finalData.length)
              });
            }
          } else {
            event.target.value = '';
            alert("Invalid file.")
          }
        };
      } else {
        event.target.value = '';
        alert("Invalid file.")
      }
    }
  }

  tabChanges(url) {
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

  async getUrl() {
    if (this.url.value) {
      const tab: any = await this.tabChanges(this.url.value)
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['scripts/download-html.js'],
      }, (data) => {
        if (!data) {
          console.log('chrome.runtime.lastError: ', chrome.runtime.lastError);
          // resolve({ success: false, message: chrome.runtime.lastError ? chrome.runtime.lastError.message : 'Something wnt wrong when make wrapper' })
        }
      });
      chrome.runtime.onMessage.addListener(async function message(request, sender) {
        chrome.runtime.onMessage.removeListener(message);
        if (request.action === "MakeWrapperDataThird") {
          console.log('request.data: ', request.data);
          request.data = request.data.data
          request.data = request.data.replace(/<head[^>]*>([\s\S]*?)<\/head>/gi, '');
          request.data = request.data.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
          request.data = request.data.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
          // that.callListener(request.data)
          let a = document.createElement('a');
          a.href = URL.createObjectURL(new Blob([(request.data)], { type: 'html' }));
          a.download = (Math.random() * 1000).toFixed(0) + '.html';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      });
      // chrome.runtime.sendMessage({
      //   action: "URL",
      //   data: this.url.value
      // });
      // chrome.runtime.onMessage.addListener(async function message(request, sender) {
      //   if (request.action === "DOWNLOAD") {
      //     let a = document.createElement('a');
      //     a.href = URL.createObjectURL(new Blob([(request.data)], { type: 'html' }));
      //     a.download = (Math.random() * 1000).toFixed(0) + '.html';
      //     document.body.appendChild(a);
      //     a.click();
      //     document.body.removeChild(a);
      //   }
      // })
    }
  }

}