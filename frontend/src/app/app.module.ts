import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WebcamModule } from 'ngx-webcam'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { HttpClientModule } from '@angular/common/http'

import { AppComponent } from './app.component';
import { MainComponent } from './components/main.component';
import { CaptureComponent } from './components/capture.component';
import { CameraService } from './camera.service';
import { LoginComponent } from './components/login.component';
import { AuthenticationService } from './authentication.service';
import { UploadService } from './upload.service';

const ROUTES: Routes = [
	{ path: '', component: LoginComponent },
	{ path: 'main', component: MainComponent },
	{ path: 'capture', component: CaptureComponent },
	{ path: '**', redirectTo: '/', pathMatch: 'full' }
]

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent, MainComponent, CaptureComponent,
  ],
  imports: [
		BrowserModule, 
		RouterModule.forRoot(ROUTES),
		WebcamModule,
    FormsModule, ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [ CameraService, AuthenticationService, UploadService ],
  bootstrap: [AppComponent]
})
export class AppModule { }
