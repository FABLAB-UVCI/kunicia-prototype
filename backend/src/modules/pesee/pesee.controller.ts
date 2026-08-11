import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PeseeService } from './pesee.service';
import { CreatePeseeDto } from './dto/create-pesee.dto';
import { FindPeseesQueryDto } from './dto/find-pesees-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('pesees')
export class PeseeController {
  constructor(private readonly peseeService: PeseeService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePeseeDto) {
    return this.peseeService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: FindPeseesQueryDto) {
    return this.peseeService.findAll(user.id, query.lapinId);
  }
}
