import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { VenteService } from './vente.service';
import { CreateVenteDto } from './dto/create-vente.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('ventes')
export class VenteController {
  constructor(private readonly venteService: VenteService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateVenteDto) {
    return this.venteService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.venteService.findAll(user.id);
  }
}
