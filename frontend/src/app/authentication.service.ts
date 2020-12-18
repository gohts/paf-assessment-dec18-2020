import { HttpClient } from "@angular/common/http";
import {Injectable} from "@angular/core";
import { User } from "./models";

@Injectable()
export class AuthenticationService {

	userData: User  = null

	constructor (private http: HttpClient) {}

	authenticate(u: User) {
		return this.http.post('/api/login', u)
			.toPromise()
	}

	clear() {
		this.userData = null
	}
}
