import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-image-picker',
  templateUrl: './image-picker.component.html',
  styleUrls: ['./image-picker.component.scss'],
})
export class ImagePickerComponent implements OnInit {

  @ViewChild('filePicker') filePicker!: ElementRef<HTMLInputElement>;
  @Output() imagePick = new EventEmitter<string | File>();
  selectedImage!: string;

  constructor() { }

  ngOnInit() {


  }

  onPickImage() {
    this.filePicker.nativeElement.click();
  }

  onFileChosen(event: Event) {
    const pickedFile = (event.target as HTMLInputElement).files![0];
    if (!pickedFile) {
      return;
    }
    const fr = new FileReader();
    
    fr.readAsDataURL(pickedFile);
    fr.onload = () => {
      const dataUrl = fr.result?.toString();
      this.selectedImage = dataUrl!;
      this.imagePick.emit(pickedFile);
    }
    console.log(event);
  }
}
