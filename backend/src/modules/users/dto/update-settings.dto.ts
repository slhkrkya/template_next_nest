import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  themePreset?: string;

  @IsOptional()
  @IsString()
  colorScheme?: string;

  @IsOptional()
  @IsInt()
  timezoneOffset?: number;
}
