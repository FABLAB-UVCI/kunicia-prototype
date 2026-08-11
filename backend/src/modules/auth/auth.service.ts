import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const motDePasseHash = await bcrypt.hash(dto.motDePasse, SALT_ROUNDS);

    try {
      const utilisateur = await this.prisma.utilisateur.create({
        data: {
          nom: dto.nom,
          nomFerme: dto.nomFerme,
          email: dto.email,
          motDePasse: motDePasseHash,
        },
      });

      return this.buildAuthResponse(utilisateur);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Un compte existe déjà avec cet email');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
    });

    if (!utilisateur) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const motDePasseValide = await bcrypt.compare(
      dto.motDePasse,
      utilisateur.motDePasse,
    );

    if (!motDePasseValide) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    return this.buildAuthResponse(utilisateur);
  }

  private buildAuthResponse(utilisateur: {
    id: string;
    nom: string;
    nomFerme: string;
    email: string;
  }) {
    const payload: JwtPayload = {
      sub: utilisateur.id,
      email: utilisateur.email,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        nomFerme: utilisateur.nomFerme,
        email: utilisateur.email,
      },
    };
  }
}
