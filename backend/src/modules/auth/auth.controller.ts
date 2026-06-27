import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CsrfGuard, CsrfService } from '../../common/csrf';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly csrfService: CsrfService,
    private readonly configService: ConfigService,
  ) {}

  // ---------------------------------------------------------------------------
  // GET /auth/csrf-token
  // ---------------------------------------------------------------------------
  @Public()
  @Get('csrf-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtain a CSRF token for state-changing requests' })
  @ApiResponse({
    status: 200,
    description: 'Returns a CSRF token. Also sets a _csrf cookie (non-HttpOnly).',
  })
  getCsrfToken(@Res({ passthrough: true }) res: Response): { csrfToken: string } {
    const token = this.csrfService.generateToken();
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    res.cookie('_csrf', token, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
    });
    return { csrfToken: token };
  }

  // ---------------------------------------------------------------------------
  // POST /auth/login
  // ---------------------------------------------------------------------------
  @Public()
  @Throttle({ default: { ttl: 900000, limit: 5 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @AuditLog('Auth', 'LOGIN')
  @ApiOperation({ summary: 'Authenticate with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns access token and user profile.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; user: Record<string, unknown> }> {
    return this.authService.login(dto, res);
  }

  // ---------------------------------------------------------------------------
  // POST /auth/register
  // ---------------------------------------------------------------------------
  @Public()
  @Throttle({ default: { ttl: 3600000, limit: 5 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @AuditLog('Auth', 'REGISTER')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({
    status: 201,
    description: 'Registration successful.',
  })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async register(@Body() dto: RegisterDto): Promise<{ message: string }> {
    return this.authService.register(dto);
  }

  // ---------------------------------------------------------------------------
  // POST /auth/verify-email
  // ---------------------------------------------------------------------------
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email and activate a registered account' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ message: string }> {
    return this.authService.verifyEmail(dto);
  }

  // ---------------------------------------------------------------------------
  // POST /auth/refresh
  // ---------------------------------------------------------------------------
  @Public()
  @UseGuards(CsrfGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refreshToken')
  @ApiHeader({ name: 'x-csrf-token', description: 'CSRF token from GET /auth/csrf-token', required: true })
  @ApiOperation({ summary: 'Obtain a new access token using the refresh cookie' })
  @ApiResponse({ status: 200, description: 'New access token issued.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @ApiResponse({ status: 403, description: 'CSRF token missing or invalid' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const refreshToken = req.cookies?.['refreshToken'];
    return this.authService.refreshToken(refreshToken, res);
  }

  // ---------------------------------------------------------------------------
  // POST /auth/logout
  // ---------------------------------------------------------------------------
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @AuditLog('Auth', 'LOGOUT')
  @ApiOperation({ summary: 'Revoke session and clear the refresh token cookie' })
  @ApiResponse({ status: 200, description: 'Logged out successfully.' })
  async logout(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.logout(userId, res);
    return { message: 'Logged out successfully' };
  }

  // ---------------------------------------------------------------------------
  // POST /auth/forgot-password
  // ---------------------------------------------------------------------------
  @Public()
  @Throttle({ default: { ttl: 3600000, limit: 3 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @AuditLog('Auth', 'PASSWORD_RESET_REQUEST')
  @ApiOperation({ summary: 'Request a password reset link via email' })
  @ApiResponse({
    status: 200,
    description: 'Reset link sent if the email exists.',
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.forgotPassword(dto);
  }

  // ---------------------------------------------------------------------------
  // POST /auth/reset-password
  // ---------------------------------------------------------------------------
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @AuditLog('Auth', 'PASSWORD_RESET')
  @ApiOperation({ summary: 'Reset password using a valid reset token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(dto);
  }

  // ---------------------------------------------------------------------------
  // GET /auth/me
  // ---------------------------------------------------------------------------
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve the currently authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user profile.' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async getMe(
    @CurrentUser('id') userId: string,
  ): Promise<Record<string, unknown>> {
    return this.authService.getMe(userId);
  }
}
