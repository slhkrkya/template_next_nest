import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/password.validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    message:
      'Password must be 8-128 characters with uppercase, lowercase, number, and special character. No common patterns or repeated characters.',
  })
  password: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
