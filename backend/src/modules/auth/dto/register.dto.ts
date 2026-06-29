import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/password.validator';

export class RegisterDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    example: 'Password1!',
    minLength: 8,
    maxLength: 128,
    description:
      'Must be 8-128 characters with uppercase, lowercase, number, and special character. No common patterns.',
  })
  @IsString()
  @IsStrongPassword({
    message:
      'Password must be 8-128 characters with uppercase, lowercase, number, and special character. No common patterns or repeated characters.',
  })
  password: string;

  @ApiProperty({ example: 'Acme Corp', description: 'Company or workspace name (used as tenant name)' })
  @IsString()
  @MinLength(2, { message: 'Company name must be at least 2 characters' })
  @MaxLength(100, { message: 'Company name must be at most 100 characters' })
  companyName: string;

  @ApiPropertyOptional({ description: 'reCAPTCHA token for bot protection' })
  @IsOptional()
  @IsString()
  captchaToken?: string;
}
