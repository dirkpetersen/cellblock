export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailProvider {
  /**
   * Send an email message
   */
  sendEmail(message: EmailMessage): Promise<EmailSendResult>;

  /**
   * Verify provider configuration
   */
  verifyConnection(): Promise<boolean>;

  /**
   * Get provider name
   */
  getProviderName(): string;
}
