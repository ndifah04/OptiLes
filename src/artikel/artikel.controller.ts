import { Controller } from '@nestjs/common';
import { ArtikelService } from './artikel.service';

@Controller('artikel')
export class ArtikelController {
  constructor(private readonly artikelService: ArtikelService) {}
}
