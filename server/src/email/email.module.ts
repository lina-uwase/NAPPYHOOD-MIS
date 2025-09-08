import { Global, Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { EmailService } from "./email.service";
import { TemplateService } from "./template.service";

@Global()
@Module({
    imports: [HttpModule],
    providers: [EmailService, TemplateService],
    exports: [EmailService, TemplateService]
})
export class EmailModule {

}