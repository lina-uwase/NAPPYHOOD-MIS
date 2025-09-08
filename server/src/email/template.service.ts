import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface TemplateContext {
  [key: string]: any;
}

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private readonly templatesDir: string;
  private readonly compiledTemplates = new Map<string, HandlebarsTemplateDelegate>();

  constructor(private readonly configService: ConfigService) {
    this.templatesDir = join(__dirname, 'templates');
    this.registerHelpers();
  }

  private registerHelpers(): void {
    // Register any custom Handlebars helpers if needed
    // Currently using default helpers
  }

  private getTemplate(templateName: string): HandlebarsTemplateDelegate {
    if (this.compiledTemplates.has(templateName)) {
      return this.compiledTemplates.get(templateName)!;
    }

    try {
      const templatePath = join(this.templatesDir, `${templateName}.hbs`);
      const templateContent = readFileSync(templatePath, 'utf-8');
      const compiledTemplate = Handlebars.compile(templateContent);
      
      this.compiledTemplates.set(templateName, compiledTemplate);
      return compiledTemplate;
    } catch (error) {
      this.logger.error(`Failed to load template ${templateName}:`, error);
      throw new Error(`Template ${templateName} not found or could not be compiled`);
    }
  }



  private getBaseContext(): TemplateContext {
    return {
      year: new Date().getFullYear(),
      logoUrl: this.configService.get('LOGO_URL'),
      supportEmail: this.configService.get('SUPPORT_EMAIL'),
      supportPhone: this.configService.get('SUPPORT_PHONE'),
      frontendUrl: this.configService.get('FRONTEND_URL'),
      socialLinks: {
        twitter: this.configService.get('TWITTER_URL'),
        facebook: this.configService.get('FACEBOOK_URL'),
        linkedin: this.configService.get('LINKEDIN_URL')
      },
      unsubscribeUrl: `${this.configService.get('FRONTEND_URL')}`,
      preferencesUrl: `${this.configService.get('FRONTEND_URL')}`
    };
  }

  async renderTemplate(templateName: string, context: TemplateContext): Promise<string> {
    try {
      const template = this.getTemplate(templateName);

      const fullContext = {
        ...this.getBaseContext(),
        ...context
      };

      const renderedHtml = template(fullContext);

      this.logger.debug(`Template ${templateName} rendered successfully`);
      return renderedHtml;
    } catch (error) {
      this.logger.error(`Failed to render template ${templateName}:`, error);
      throw error;
    }
  }

  clearTemplateCache(): void {
    this.compiledTemplates.clear();
    this.logger.log('Template cache cleared');
  }
}
