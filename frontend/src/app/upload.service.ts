import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable()
export class UploadService {

    constructor (private http: HttpClient) {}
    
    uploadData (uploadData : any) {

      console.log('>>upload',uploadData);
      return this.http.post('/api/share', uploadData)
        .toPromise()
    }
}
