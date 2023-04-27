import { Component } from '@angular/core';
declare var chrome: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {


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
              await chrome.storage.local.set({ 'isImageUploading': true });
              console.log('await checkInStorage ', await checkInStorage('isImageUploading'));
              console.log('finalData: ', finalData);
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


}