import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  IsArray,
  ValidateNested,
  Validate,
} from 'class-validator';
import { TaskStatus, TaskPriority } from '../../entities/task.entity';
import { Type } from 'class-transformer';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidDueDate', async: false })
export class IsValidDueDate implements ValidatorConstraintInterface {
  validate(dueDate: string, args: ValidationArguments) {
    if (!dueDate) return true;

    const date = new Date(dueDate);

    if (isNaN(date.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    return date >= today;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Due date cannot be in the past';
  }
}

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  @Validate(IsValidDueDate)
  dueDate?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;
}

export class CreateBulkTasksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskDto)
  tasks: CreateTaskDto[];
}

export class AssignMultipleTasksDto {
  @IsArray()
  @IsUUID('4', { each: true })
  taskIds: string[];

  @IsUUID()
  assigneeId: string;
}
