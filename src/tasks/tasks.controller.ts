import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import {
  AssignMultipleTasksDto,
  CreateBulkTasksDto,
  CreateTaskDto,
} from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }

  @Get('assignee/:assigneeId')
  findByAssignee(@Param('assigneeId') assigneeId: string) {
    return this.tasksService.findByAssignee(assigneeId);
  }

  @Put(':id/assign/:assigneeId')
  assignToUser(
    @Param('id') taskId: string,
    @Param('assigneeId') assigneeId: string,
  ) {
    return this.tasksService.assignToUser(taskId, assigneeId);
  }

  @Post('bulk')
  createBulk(@Body() createBulkTasksDto: CreateBulkTasksDto) {
    return this.tasksService.createBulk(createBulkTasksDto);
  }

  @Post('assign-multiple')
  assignMultipleTasksToUser(
    @Body() assignMultipleTasksDto: AssignMultipleTasksDto,
  ) {
    return this.tasksService.assignMultipleTasksToUser(assignMultipleTasksDto);
  }
}
