import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../authentication.service';
import { User } from '../models';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  // user id not found? password incorrect?
  errorMessage = ''
  form: FormGroup

	constructor(private fb: FormBuilder, private authSvc: AuthenticationService, private router: Router) { }

	ngOnInit(): void {
    this.form = this.fb.group({
      user_id: this.fb.control('',[Validators.required]),
      password: this.fb.control('',[Validators.required]),
    })

    this.authSvc.clear()
  }

  onSubmit() {
    const user = this.form.value;

    this.authSvc.authenticate(user)
			.then(res => {
        console.log('>>>Authentication result: ', res)

        this.authSvc.userData = {
          user_id: this.form.value['user_id'],
          password: this.form.value['password']
        } as User
        
        this.router.navigate(['/main']);
      })
			.catch(e => {
        console.error('>>>Authentication error: ',e)
        this.errorMessage = e['error']['message']
      });
    
  }

}
