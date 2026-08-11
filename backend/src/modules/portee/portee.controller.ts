import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PorteeService } from './portee.service';
import { CreatePorteeDto } from './dto/create-portee.dto';
import { ConfirmerSevrageDto } from './dto/confirmer-sevrage.dto';
import { FindPorteesQueryDto } from './dto/find-portees-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('portees')
export class PorteeController {
  constructor(private readonly porteeService: PorteeService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePorteeDto) {
    return this.porteeService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: FindPorteesQueryDto) {
    return this.porteeService.findAll(user.id, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.porteeService.findOne(user.id, id);
  }

  @Post(':id/sevrage')
  confirmerSevrage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ConfirmerSevrageDto,
  ) {
    return this.porteeService.confirmerSevrage(user.id, id, dto);
  }
}
