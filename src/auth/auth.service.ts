import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDTO } from './dto/user-login.dto';
import { User } from '@prisma/client';
import { CatchPrismaError } from 'src/error-catch.decorator';
import { JwtService } from '@nestjs/jwt';
import { RegisterDTO } from './dto/register.dto';
import { ResetPasswordDTO } from './dto/reset-password.dto';

@Injectable()
@CatchPrismaError()
export class AuthService {

  userCache = new Map<string, Omit<User, "password">>()

  constructor(private readonly prisma : PrismaService, private readonly jwtService : JwtService) {}


  async login({ email, password } : LoginDTO ) {
    const user = await this.prisma.user.findFirst({
      where : {
        email : email
      }
    });
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;

      const token = await this.jwtService.signAsync({ uuid : user.uuid });

      return {
        access_token : token,
        user : result
      };
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async register(data : RegisterDTO) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data : {
        ...data
        ,password : hashedPassword,
        role : "USER"
      }
    });

    const { password, ...result } = user;

    const token = await this.jwtService.signAsync({ uuid : user.uuid });

    return {
      access_token : token,
      user : result
    }
  }

  async resetPassword(user_id : string, {new_password, password} : ResetPasswordDTO) {
    const user = await this.prisma.user.findFirst({
      where : {
        uuid : user_id
      }
    });

    if(user == null) throw new UnauthorizedException("User not found");

    if(!await bcrypt.compare(password, user.password)) throw new UnauthorizedException("Invalid password");

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await this.prisma.user.update({
      where : {
        uuid : user_id
      },
      data : {
        password : hashedPassword
      }
    });

    return {
      message : "Password reset"
    }
  }

  async validateUser(userId : string) {
    if(this.userCache.has(userId)) {
      return this.userCache.get(userId);
    }

    const user = await this.prisma.user.findFirst({
      where : {
        uuid : userId
      }
    });

    if(user == null) throw new UnauthorizedException("User not found");

    this.userCache.set(userId, user);

    return user

  }


}
