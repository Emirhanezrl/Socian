import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class MessageService {
  constructor(private afs: AngularFirestore) {}

  // ConversationId: iki userId'yi alfabetik sıralayıp birleştir
  getConversationId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_');
  }

  // Mesaj gönder
  async sendMessage(fromId: string, toId: string, content: string): Promise<void> {
    const conversationId = this.getConversationId(fromId, toId);
    const message = {
      senderId: fromId,
      content,
      createdAt: new Date()
    };
    console.log('SEND MESSAGE conversationId:', conversationId);
    console.log('SEND MESSAGE message:', message);
    // Sohbet dokümanını oluştur/güncelle
    await this.afs.collection('messages').doc(conversationId).set({
      users: [fromId, toId],
      lastMessage: content,
      lastMessageAt: new Date()
    }, { merge: true });
    // Mesajı ekle
    await this.afs.collection('messages').doc(conversationId).collection('messages').add(message);
  }

  // Mesajları çek (tarihe göre sıralı)
  getMessages(userId1: string, userId2: string): Observable<any[]> {
    const conversationId = this.getConversationId(userId1, userId2);
    return this.afs.collection('messages').doc(conversationId).collection('messages', ref => ref.orderBy('createdAt', 'asc'))
      .snapshotChanges().pipe(
        map(snaps => snaps.map(snap => {
          const data = snap.payload.doc.data() as any;
          return { id: snap.payload.doc.id, ...data };
        }))
      );
  }

  // Kullanıcının dahil olduğu sohbetler
  getConversations(userId: string): Observable<any[]> {
    return this.afs.collection('messages', ref => ref.where('users', 'array-contains', userId).orderBy('lastMessageAt', 'desc'))
      .snapshotChanges().pipe(
        map(snaps => snaps.map(snap => {
          const data = snap.payload.doc.data() as any;
          return { id: snap.payload.doc.id, ...data };
        }))
      );
  }

  // Yeni bir conversation başlat (boş mesaj eklemeden)
  async createConversation(userId1: string, userId2: string): Promise<void> {
    const conversationId = this.getConversationId(userId1, userId2);
    await this.afs.collection('messages').doc(conversationId).set({
      users: [userId1, userId2],
      lastMessage: '',
      lastMessageAt: new Date()
    }, { merge: true });
  }
} 