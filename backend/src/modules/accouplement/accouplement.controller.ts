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
import { AccouplementService } from './accouplement.service';
import { CreateAccouplementDto } from './dto/create-accouplement.dto';
import { ValiderMalgreAlerteDto } from './dto/valider-malgre-alerte.dto';
import { FindAccouplementsQueryDto } from './dto/find-accouplements-query.dto';
import { VerifierParenteQueryDto } from './dto/verifier-parente-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('accouplements')
export class AccouplementController {
  constructor(private readonly accouplementService: AccouplementService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAccouplementDto) {
    return this.accouplementService.create(user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: FindAccouplementsQueryDto,
  ) {
    return this.accouplementService.findAll(user.id, query);
  }

  // déclarée avant @Get(':id') : sinon "verifier-parente" serait interprété
  // comme une valeur de :id
  @Get('verifier-parente')
  verifierParente(
    @CurrentUser() user: AuthUser,
    @Query() query: VerifierParenteQueryDto,
  ) {
    return this.accouplementService.verifierParente(
      user.id,
      query.maleId,
      query.femelleId,
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.accouplementService.findOne(user.id, id);
  }

  @Patch(':id/valider')
  valider(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.accouplementService.valider(user.id, id);
  }

  @Patch(':id/valider-malgre-alerte')
  validerMalgreAlerte(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ValiderMalgreAlerteDto,
  ) {
    return this.accouplementService.validerMalgreAlerte(user.id, id, dto);
  }

  @Patch(':id/annuler')
  annuler(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.accouplementService.annuler(user.id, id);
  }
}
