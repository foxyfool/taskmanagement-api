import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcryptjs';

interface UpdateUserDto {
  username?: string;
  email?: string;
  role?: string;
  password?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ['teams', 'assignedTasks'],
      select: ['id', 'username', 'email', 'role', 'createdAt'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['teams', 'assignedTasks'],
      select: ['id', 'username', 'email', 'role', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByUsername(username: string): Promise<User> {
    return this.usersRepository.findOne({
      where: { username },
    });
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.username || updateUserDto.email) {
      const existingUser = await this.usersRepository.findOne({
        where: [
          updateUserDto.username ? { username: updateUserDto.username } : {},
          updateUserDto.email ? { email: updateUserDto.email } : {},
        ].filter((condition) => Object.keys(condition).length > 0),
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(
          'User with this username or email already exists',
        );
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.usersRepository.save(user);

    const { password, ...result } = updatedUser;
    return result as User;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async getUserStats(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['assignedTasks', 'teams'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalTasks = user.assignedTasks.length;
    const completedTasks = user.assignedTasks.filter(
      (task) => task.status === 'done',
    ).length;
    const pendingTasks = totalTasks - completedTasks;

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        teamsCount: user.teams.length,
      },
    };
  }
}
