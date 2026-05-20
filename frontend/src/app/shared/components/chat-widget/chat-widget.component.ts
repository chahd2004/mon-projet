import { Component, ElementRef, ViewChild, AfterViewChecked, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../core/services/chat.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface Message {
  text: string;
  isUser: boolean;
  time: Date;
}

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.scss']
})
export class ChatWidgetComponent implements AfterViewChecked {
  private chatService = inject(ChatService);
  private translate = inject(TranslateService);

  isOpen = false;
  isLoading = false;
  newMessage = '';
  messages: Message[] = [];

  constructor() {
    this.translate.get('CHATBOT.WELCOME').subscribe((res: string) => {
      this.messages = [
        {
          text: res,
          isUser: false,
          time: new Date()
        }
      ];
    });

    this.translate.onLangChange.subscribe(() => {
      if (this.messages.length > 0 && !this.messages[0].isUser) {
        this.messages[0].text = this.translate.instant('CHATBOT.WELCOME');
      }
    });
  }

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  sendMessage() {
    if (!this.newMessage.trim() || this.isLoading) return;

    // Ajouter le message utilisateur
    const userMsg = this.newMessage;
    this.messages.push({
      text: userMsg,
      isUser: true,
      time: new Date()
    });

    this.newMessage = '';
    this.isLoading = true;

    // Envoyer au service
    this.chatService.sendMessage(userMsg).subscribe({
      next: (response: string) => {
        this.messages.push({
          text: response,
          isUser: false,
          time: new Date()
        });
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erreur Chatbot:', err);
        this.messages.push({
          text: this.translate.instant('CHATBOT.ERROR'),
          isUser: false,
          time: new Date()
        });
        this.isLoading = false;
      }
    });
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err: any) {}
  }
}
