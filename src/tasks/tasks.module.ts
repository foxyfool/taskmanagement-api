import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { Team } from '../entities/team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, User, Team])],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
