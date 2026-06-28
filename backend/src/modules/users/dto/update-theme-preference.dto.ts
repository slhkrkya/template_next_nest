import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateThemePreferenceDto {
  @IsOptional()
  @IsString()
  themeFamily?: string;

  @IsOptional()
  @IsString()
  themeName?: string;

  @IsOptional()
  @IsIn(['light', 'dark'])
  colorScheme?: 'light' | 'dark';

  @IsOptional()
  @IsIn(['outlined', 'filled'])
  inputStyle?: 'outlined' | 'filled';

  @IsOptional()
  @IsBoolean()
  ripple?: boolean;

  @IsOptional()
  @IsInt()
  @Min(12)
  @Max(18)
  scale?: number;
}
