import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { PrismaService } from '../../../prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { NOM_COOKIE_SESSION } from '../constants';

// la session voyage en cookie httpOnly plutôt qu'en header "Authorization:
// Bearer" — nécessaire notamment pour qu'un lien ouvert depuis une autre
// application (scan d'un QR code par l'appareil photo) retrouve la session
// sans que le JavaScript de la page n'ait à la relire lui-même
function extraireDuCookie(req: Request): string | null {
  const cookies = req.cookies as Record<string, string> | undefined;
  return cookies?.[NOM_COOKIE_SESSION] ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: extraireDuCookie,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: payload.sub },
      select: { id: true, nom: true, nomFerme: true, email: true },
    });

    if (!utilisateur) {
      throw new UnauthorizedException();
    }

    return utilisateur;
  }
}
