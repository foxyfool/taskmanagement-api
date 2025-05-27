import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Task, TaskPriority, TaskStatus } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { Team } from '../entities/team.entity';
import {
  AssignMultipleTasksDto,
  CreateBulkTasksDto,
  CreateTaskDto,
} from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = new Task();
    task.title = createTaskDto.title;
    task.description = createTaskDto.description;
    task.dueDate = createTaskDto.dueDate
      ? new Date(createTaskDto.dueDate)
      : null;
    task.status = createTaskDto.status;
    task.priority = createTaskDto.priority;

    if (createTaskDto.assigneeId) {
      const assignee = await this.usersRepository.findOne({
        where: { id: createTaskDto.assigneeId },

        select: ['id', 'username', 'email', 'role'],
      });
      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
      task.assignee = assignee;
    }

    if (createTaskDto.teamId) {
      const team = await this.teamsRepository.findOne({
        where: { id: createTaskDto.teamId },
      });
      if (!team) {
        throw new NotFoundException('Team not found');
      }
      task.team = team;
    }

    return this.tasksRepository.save(task);
  }

  async findAll(): Promise<Task[]> {
    return this.tasksRepository.find({
      relations: ['assignee', 'team'],
      select: {
        assignee: {
          id: true,
          username: true,
          email: true,
          role: true,
        },
      },
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['assignee', 'team'],
      select: {
        assignee: {
          id: true,
          username: true,
          email: true,
          role: true,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    if (updateTaskDto.title) task.title = updateTaskDto.title;
    if (updateTaskDto.description) task.description = updateTaskDto.description;
    if (updateTaskDto.dueDate) task.dueDate = new Date(updateTaskDto.dueDate);
    if (updateTaskDto.status) task.status = updateTaskDto.status;
    if (updateTaskDto.priority) task.priority = updateTaskDto.priority;

    if (updateTaskDto.assigneeId) {
      const assignee = await this.usersRepository.findOne({
        where: { id: updateTaskDto.assigneeId },
      });
      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
      task.assignee = assignee;
    }

    if (updateTaskDto.teamId) {
      const team = await this.teamsRepository.findOne({
        where: { id: updateTaskDto.teamId },
      });
      if (!team) {
        throw new NotFoundException('Team not found');
      }
      task.team = team;
    }

    task.updatedAt = new Date();
    return this.tasksRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.tasksRepository.remove(task);
  }

  async findByAssignee(assigneeId: string): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { assignee: { id: assigneeId } },
      relations: ['assignee', 'team'],
      select: {
        assignee: {
          id: true,
          username: true,
          email: true,
          role: true,
        },
      },
    });
  }

  async assignToUser(taskId: string, assigneeId: string): Promise<Task> {
    const task = await this.findOne(taskId);
    const assignee = await this.usersRepository.findOne({
      where: { id: assigneeId },
      select: ['id', 'username', 'email', 'role'],
    });

    if (!assignee) {
      throw new NotFoundException('Assignee not found');
    }

    task.assignee = assignee;
    task.updatedAt = new Date();
    return this.tasksRepository.save(task);
  }
  
  async createBulk(createBulkTasksDto: CreateBulkTasksDto): Promise<Task[]> {
    const tasks: Task[] = [];

    for (const taskDto of createBulkTasksDto.tasks) {
      const task = new Task();
      task.title = taskDto.title;
      task.description = taskDto.description;
      task.dueDate = taskDto.dueDate ? new Date(taskDto.dueDate) : null;
      task.status = taskDto.status;
      task.priority = taskDto.priority;

      if (taskDto.assigneeId) {
        const assignee = await this.usersRepository.findOne({
          where: { id: taskDto.assigneeId },
          select: ['id', 'username', 'email', 'role'],
        });
        if (!assignee) {
          throw new NotFoundException(
            `Assignee with ID ${taskDto.assigneeId} not found`,
          );
        }
        task.assignee = assignee;
      }

      if (taskDto.teamId) {
        const team = await this.teamsRepository.findOne({
          where: { id: taskDto.teamId },
        });
        if (!team) {
          throw new NotFoundException(
            `Team with ID ${taskDto.teamId} not found`,
          );
        }
        task.team = team;
      }

      tasks.push(task);
    }

    return this.tasksRepository.save(tasks);
  }

  async assignMultipleTasksToUser(
    assignMultipleTasksDto: AssignMultipleTasksDto,
  ): Promise<Task[]> {
    const { taskIds, assigneeId } = assignMultipleTasksDto;

    const assignee = await this.usersRepository.findOne({
      where: { id: assigneeId },
      select: ['id', 'username', 'email', 'role'],
    });

    if (!assignee) {
      throw new NotFoundException('Assignee not found');
    }

    const tasks = await this.tasksRepository.find({
      where: { id: In(taskIds) },
    });

    if (tasks.length !== taskIds.length) {
      throw new NotFoundException('Some tasks not found');
    }

    const updatedTasks = tasks.map((task) => {
      task.assignee = assignee;
      task.updatedAt = new Date();
      return task;
    });

    return this.tasksRepository.save(updatedTasks);
  }
}
