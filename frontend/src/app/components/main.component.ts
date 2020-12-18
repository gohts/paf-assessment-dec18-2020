import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../authentication.service';
import {CameraService} from '../camera.service';
import { UploadService } from '../upload.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

	imagePath = '/assets/cactus.png'
	img = this.cameraSvc.getImage()

	mainForm: FormGroup

	constructor(private cameraSvc: CameraService, private fb: FormBuilder, 
		private uploadSvc: UploadService, private authSvc:AuthenticationService,
		private router: Router) { }

	ngOnInit(): void {
	  if (this.cameraSvc.hasImage()) {
		  const img = this.cameraSvc.getImage()
		  this.imagePath = img.imageAsDataUrl
	  }

	  this.mainForm = this.fb.group({
		  img: this.fb.control(this.img,[Validators.required]),
		  title: this.fb.control('',[Validators.required]),
		  comments: this.fb.control('', [Validators.required]),	  
	  })

	}

	clear() {
		this.mainForm.reset();
		this.imagePath = '/assets/cactus.png';
	}

	share() {

		const user = this.authSvc.userData
		const value = this.mainForm.value

		if (this.authSvc.userData == null) {
			// navigate back to login page
			this.router.navigate(['/']);
		} else {

			let formData = new FormData();
			formData.set('imageData',this.img.imageData)
			formData.set('comments',value.comments)
			formData.set('title',value.title)
			formData.set('user_id',user.user_id)
			formData.set('password',user.password)

			this.uploadSvc.uploadData(formData)
				.then(res => {
					console.log('>>>Upload result: ', res)
					this.clear();
				})
				.catch(e => {
					if (e['status'] == 401)
						this.router.navigate(['/']);
					console.error('>>Upload error',e)
				});	
		}
	}
	
}