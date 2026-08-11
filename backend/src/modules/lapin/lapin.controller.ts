import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LapinService } from './lapin.service';
import { CreateLapinDto } from './dto/create-lapin.dto';
import { UpdateLapinDto } from './dto/update-lapin.dto';
import { CreateLapinsLotDto } from './dto/create-lapins-lot.dto';
import { IdentifierLapinDto } from './dto/identifier-lapin.dto';
import { FindLapinsQueryDto } from './dto/find-lapins-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { creerStorageLapinPhoto } from './photo-lapin.storage';

// évite de dépendre de @types/multer (indisponible hors-ligne) : seul le nom
// du fichier écrit sur disque par le storage nous intéresse ici
interface FichierUploade {
  filename: string;
  mimetype: string;
}

@UseGuards(JwtAuthGuard)
@Controller('lapins')
export class LapinController {
  constructor(private readonly lapinService: LapinService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLapinDto) {
    return this.lapinService.createOrigineExterieure(user.id, dto);
  }

  @Post('lot')
  createLot(@CurrentUser() user: AuthUser, @Body() dto: CreateLapinsLotDto) {
    return this.lapinService.createLot(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: FindLapinsQueryDto) {
    return this.lapinService.findAll(
      user.id,
      query.statut,
      query.sexe,
      query.origineExterieure,
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.lapinService.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateLapinDto,
  ) {
    return this.lapinService.update(user.id, id, dto);
  }

  @Patch(':id/identifier')
  identifier(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: IdentifierLapinDto,
  ) {
    return this.lapinService.identifier(user.id, id, dto);
  }

  @Post(':id/photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: creerStorageLapinPhoto(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Le fichier doit être une image'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadPhoto(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFile() photo?: FichierUploade,
  ) {
    if (!photo) {
      throw new BadRequestException('Aucune photo reçue');
    }
    return this.lapinService.uploaderPhoto(user.id, id, photo.filename);
  }
}
