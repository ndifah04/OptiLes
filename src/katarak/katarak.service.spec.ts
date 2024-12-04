import { Test, TestingModule } from '@nestjs/testing';
import { KatarakService } from './katarak.service';

describe('KatarakService', () => {
  let service: KatarakService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KatarakService],
    }).compile();

    service = module.get<KatarakService>(KatarakService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
