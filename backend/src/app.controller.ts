// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('about')
@Controller('about')
export class AppController {
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Project + author metadata (§31.2 branding surface)',
  })
  about() {
    return {
      name: 'Email Campaign & Delivery Tracking Platform',
      author: 'Arsi India Info',
      website: 'https://arsiindiainfo.com',
      repository:
        'https://github.com/arsiindiainfo/email-campaign-delivery-tracker',
      license: 'MIT (code) + TRADEMARK.md (name & logo)',
      copyright: '© 2026 Arsi India Info. All rights reserved.',
    };
  }
}
