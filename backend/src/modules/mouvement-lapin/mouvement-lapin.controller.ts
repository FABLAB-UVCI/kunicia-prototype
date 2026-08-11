import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { MouvementLapinService } from './mouvement-lapin.service';
import { CreateMouvementDto } from './dto/create-mouvement.dto';
import { FindMouvementsQueryDto } from './dto/find-mouvements-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('mouvements')
export class MouvementLapinController {
  constructor(private readonly mouvementLapinService: MouvementLapinService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMouvementDto) {
    return this.mouvementLapinService.create(user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: FindMouvementsQueryDto,
  ) {
    return this.mouvementLapinService.findAll(user.id, query);
  }
}
