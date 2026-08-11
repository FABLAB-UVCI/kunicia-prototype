import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AlimentationService } from './alimentation.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('stocks')
export class StockController {
  constructor(private readonly alimentationService: AlimentationService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateStockDto) {
    return this.alimentationService.createStock(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.alimentationService.findAllStocks(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.alimentationService.findOneStock(user.id, id);
  }
}
