import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface TemplateData {
  [key: string]: any;
}

@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name);
  private templateCache: Map<string, string> = new Map();
  private readonly templatesDir: string;

  constructor() {
    this.templatesDir = path.join(__dirname, 'templates');
  }

  /**
   * Render an email template with data
   */
  async renderTemplate(templateName: string, data: TemplateData): Promise<string> {
    try {
      // Load template (with caching)
      let template = this.templateCache.get(templateName);

      if (!template) {
        const templatePath = path.join(this.templatesDir, `${templateName}.html`);
        template = fs.readFileSync(templatePath, 'utf-8');
        this.templateCache.set(templateName, template);
      }

      // Add common data available to all templates
      const commonData = {
        frontendUrl: this.configService.get('FRONTEND_URL') || 'http://localhost:3001',
        currentYear: new Date().getFullYear(),
        appName: 'CellBlock',
        supportEmail: 'support@cellblock.app',
        ...data,
      };

      // Simple template variable replacement
      // Supports {{variable}} syntax
      let rendered = template;

      for (const [key, value] of Object.entries(commonData)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        rendered = rendered.replace(regex, String(value));
      }

      // Handle conditional blocks: {{#if variable}}...{{/if}}
      rendered = this.processConditionals(rendered, commonData);

      // Handle loops: {{#each items}}...{{/each}}
      rendered = this.processLoops(rendered, commonData);

      return rendered;
    } catch (error) {
      this.logger.error(`Failed to render template ${templateName}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Clear template cache (useful in development)
   */
  clearCache(): void {
    this.templateCache.clear();
    this.logger.log('Template cache cleared');
  }

  /**
   * Process conditional blocks in template
   */
  private processConditionals(template: string, data: TemplateData): string {
    const conditionalRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;

    return template.replace(conditionalRegex, (_match, variable, content) => {
      const value = data[variable];
      // Check if value is truthy
      if (value && value !== 'false' && value !== '0') {
        return content;
      }
      return '';
    });
  }

  /**
   * Process loop blocks in template
   */
  private processLoops(template: string, data: TemplateData): string {
    const loopRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;

    return template.replace(loopRegex, (_match, variable, content) => {
      const items = data[variable];

      if (!Array.isArray(items) || items.length === 0) {
        return '';
      }

      return items
        .map((item, index) => {
          let itemContent = content;

          // Replace item properties: {{this.property}}
          if (typeof item === 'object') {
            for (const [key, value] of Object.entries(item)) {
              const regex = new RegExp(`{{\\s*this\\.${key}\\s*}}`, 'g');
              itemContent = itemContent.replace(regex, String(value));
            }
          } else {
            // Replace {{this}} for primitive values
            itemContent = itemContent.replace(/{{\\s*this\\s*}}/g, String(item));
          }

          // Replace {{@index}}
          itemContent = itemContent.replace(/{{\\s*@index\\s*}}/g, String(index));

          return itemContent;
        })
        .join('');
    });
  }
}
