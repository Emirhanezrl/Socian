import { Component, OnInit } from '@angular/core';
import { MessageService } from '../../services/message.service';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { forkJoin } from 'rxjs';
import { FollowService } from '../../services/follow.service';
import { NotificationService } from '../../services/notification.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {
  conversations: any[] = [];
  selectedConversation: any = null;
  messages: any[] = [];
  newMessage: string = '';
  currentUser: any = null;
  currentUserId: string = '';
  otherUser: any = null;
  searchTerm: string = '';
  searchResults: any[] = [];
  showNewMessageModal: boolean = false;
  followingList: any[] = [];

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private followService: FollowService,
    private notificationService: NotificationService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserId = user.uid;
        this.authService.getUserData(user.uid).subscribe(data => {
          this.currentUser = data;
        });
        this.messageService.getConversations(user.uid).subscribe(async convs => {
          // Her conversation için diğer kullanıcının bilgilerini çek
          const convsWithUsers = await Promise.all(convs.map(async conv => {
            const otherId = conv.users.find((id: string) => id !== this.currentUserId);
            const userData = await firstValueFrom(this.authService.getUserData(otherId));
            const otherUser = { ...userData, uid: otherId };
            return { ...conv, otherUser };
          }));
          this.conversations = convsWithUsers;

          // Bildirimden gelindiyse ilgili sohbeti aç
          this.route.queryParams.subscribe(params => {
            if (params['user']) {
              const targetConv = this.conversations.find(c => c.otherUser?.uid === params['user']);
              if (targetConv) {
                this.selectConversation(targetConv);
              }
            }
          });
        });
      }
    });
  }

  async selectConversation(conversation: any) {
    this.selectedConversation = conversation;
    this.otherUser = conversation.otherUser;
    // Mesajları çek
    this.messageService.getMessages(this.currentUserId, this.otherUser.uid).subscribe(msgs => {
      this.messages = msgs;
      setTimeout(() => {
        const el = document.getElementById('messages-end');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation) return;
    const otherId = this.selectedConversation.users.find((id: string) => id !== this.currentUserId);
    await this.messageService.sendMessage(this.currentUserId, otherId, this.newMessage);
    // Bildirim ekle (daha anlamlı içerik)
    await this.notificationService.addNotification(otherId, {
      type: 'message',
      fromUserId: this.currentUserId,
      fromUserName: this.currentUser?.firstName + ' ' + this.currentUser?.lastName,
      fromUserUsername: this.currentUser?.username,
      createdAt: new Date(),
      read: false,
      content: `${this.currentUser?.firstName} ${this.currentUser?.lastName} size yeni bir mesaj gönderdi: '${this.newMessage.slice(0, 40)}'`
    });
    this.newMessage = '';
  }

  async searchUsers() {
    if (!this.searchTerm.trim()) {
      this.searchResults = [];
      return;
    }
    this.authService.searchUsersByUsername(this.searchTerm.trim()).subscribe(users => {
      // Kendi hesabını ve zaten sohbet edilenleri çıkar
      this.searchResults = users.filter(u => u.uid !== this.currentUserId && !this.conversations.some(c => c.otherUser?.uid === u.uid));
    });
  }

  async startConversation(user: any) {
    if (!this.currentUserId || !user?.uid) {
      alert('Kullanıcı bilgisi eksik!');
      return;
    }
    let conv = this.conversations.find(c => c.otherUser?.uid === user.uid);
    if (!conv) {
      await this.messageService.createConversation(this.currentUserId, user.uid);
      setTimeout(() => {
        conv = this.conversations.find(c => c.otherUser?.uid === user.uid);
        if (conv) this.selectConversation(conv);
      }, 500);
    } else {
      this.selectConversation(conv);
    }
    this.searchTerm = '';
    this.searchResults = [];
  }

  openNewMessageModal() {
    this.showNewMessageModal = true;
    // Takip ettiklerini çek
    if (this.currentUserId) {
      this.followService.getFollowing(this.currentUserId).subscribe(users => {
        this.followingList = users;
      });
    }
  }

  closeNewMessageModal() {
    this.showNewMessageModal = false;
  }

  async startConversationWithFollowing(user: any) {
    await this.startConversation(user);
    this.closeNewMessageModal();
  }
}
