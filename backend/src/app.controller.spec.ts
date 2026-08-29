// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('about', () => {
    it('returns Arsi India Info project + author metadata', () => {
      const result = appController.about();
      expect(result.author).toBe('Arsi India Info');
      expect(result.name).toContain('Email Campaign');
    });
  });
});
