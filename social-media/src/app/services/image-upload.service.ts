import { Injectable } from '@angular/core';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/compat/storage';
import { Observable, from } from 'rxjs';
import { last, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {

  constructor(private storage: AngularFireStorage) { }

  uploadImage(file: File, path: string): Observable<string | undefined> {
    const filePath = `${path}/${file.name}`;
    const storageRef = this.storage.ref(filePath);
    const uploadTask: AngularFireUploadTask = this.storage.upload(filePath, file);

    return uploadTask.snapshotChanges().pipe(
      last(), // Sadece son anlık görüntüyü (yükleme tamamlandığında) yay
      switchMap(snapshot => {
        if (snapshot && snapshot.state === 'success') { // Anlık görüntünün var olduğundan ve yüklemenin başarılı olduğundan emin ol
          return from(storageRef.getDownloadURL()); // Promise'i Observable'a dönüştür
        } else {
          // Yükleme başarısız olursa veya anlık görüntü yoksa
          return new Observable<string | undefined>(observer => observer.next(undefined));
        }
      })
    );
  }
} 