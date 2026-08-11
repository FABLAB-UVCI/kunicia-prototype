import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { DUREE_COOKIE_MS, NOM_COOKIE_SESSION } from './constants';

// le jeton n'est jamais renvoyé dans le corps JSON (uniquement posé en
// cookie httpOnly, cf. constants.ts) : un script qui pourrait lire la
// réponse JSON pourrait tout aussi bien lire un jeton dans le localStorage,
// alors que l'intérêt du httpOnly est justement de le rendre inaccessible
// au JavaScript de la page
const OPTIONS_COOKIE = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, utilisateur } = await this.authService.register(dto);
    res.cookie(NOM_COOKIE_SESSION, accessToken, {
      ...OPTIONS_COOKIE,
      maxAge: DUREE_COOKIE_MS,
    });
    return { utilisateur };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, utilisateur } = await this.authService.login(dto);
    res.cookie(NOM_COOKIE_SESSION, accessToken, {
      ...OPTIONS_COOKIE,
      maxAge: DUREE_COOKIE_MS,
    });
    return { utilisateur };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(NOM_COOKIE_SESSION, OPTIONS_COOKIE);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() utilisateur: AuthUser) {
    return utilisateur;
  }
}
