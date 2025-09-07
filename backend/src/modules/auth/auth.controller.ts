import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import type { Response, Request } from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './cookies';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Player register' })
  @ApiCreatedResponse({ description: 'Creates player, sets cookies, returns {role,user}' })
  register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    return this.auth.register(dto.email, dto.password, res);
  }

  @Post('login')
  @ApiOperation({ summary: 'Player login' })
  @ApiOkResponse({ description: 'Sets cookies, returns {role,user}' })
  playerLogin(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.auth.playerLogin(dto.email, dto.password, res);
  }

  @Post('/../operator/login') // => POST /operator/login  (isti kao što imaš u swaggeru)
  @ApiOperation({ summary: 'Operator login' })
  operatorLogin(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.auth.operatorLogin(dto.email, dto.password, res);
  }

  @Get('me')
  @ApiOperation({ summary: 'Current session from access cookie' })
  async me(@Req() req: Request) {
    const access = req.cookies?.[ACCESS_COOKIE];
    return this.auth.parseMe(access);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh cookie' })
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refresh = req.cookies?.[REFRESH_COOKIE];
    return this.auth.refreshFromCookie(res, refresh);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and clear cookies' })
  logout(@Res({ passthrough: true }) res: Response) {
    this.auth.clearCookies(res);
    return { ok: true };
  }
}
