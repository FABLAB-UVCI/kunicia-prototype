import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SanteService } from './sante.service';
import { CreateSanteDto } from './dto/create-sante.dto';
import { UpdateSanteDto } from './dto/update-sante.dto';
import { FindSanteQueryDto } from './dto/find-sante-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('sante')
export class SanteController {
  constructor(private readonly santeService: SanteService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSanteDto) {
    return this.santeService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: FindSanteQueryDto) {
    return this.santeService.findAll(user.id, query.lapinId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSanteDto,
  ) {
    return this.santeService.update(user.id, id, dto);
  }
}
