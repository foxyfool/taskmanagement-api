import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { User } from '../entities/user.entity';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createTeamDto: CreateTeamDto): Promise<Team> {
    const team = new Team();
    team.name = createTeamDto.name;
    team.description = createTeamDto.description;

    if (createTeamDto.memberIds && createTeamDto.memberIds.length > 0) {
      const members = await this.usersRepository.find({
        where: { id: In(createTeamDto.memberIds) },
      });

      if (members.length !== createTeamDto.memberIds.length) {
        const foundIds = members.map((member) => member.id);
        const missingIds = createTeamDto.memberIds.filter(
          (id) => !foundIds.includes(id),
        );
        throw new NotFoundException(
          `Users not found: ${missingIds.join(', ')}`,
        );
      }

      team.members = members;
    }

    return this.teamsRepository.save(team);
  }

  async addMultipleMembers(teamId: string, userIds: string[]): Promise<Team> {
    const team = await this.teamsRepository.findOne({
      where: { id: teamId },
      relations: ['members'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const users = await this.usersRepository.find({
      where: { id: In(userIds) },
    });

    if (users.length !== userIds.length) {
      const foundIds = users.map((user) => user.id);
      const missingIds = userIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(`Users not found: ${missingIds.join(', ')}`);
    }

    const currentMemberIds = team.members.map((member) => member.id);

    const newMembers = users.filter(
      (user) => !currentMemberIds.includes(user.id),
    );

    team.members.push(...newMembers);

    return this.teamsRepository.save(team);
  }

  async findAll(): Promise<Team[]> {
    return this.teamsRepository.find({
      relations: ['members', 'tasks'],
    });
  }

  async findOne(id: string): Promise<Team> {
    const team = await this.teamsRepository.findOne({
      where: { id },
      relations: ['members', 'tasks', 'tasks.assignee'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team;
  }

  async addMember(teamId: string, userId: string): Promise<Team> {
    const team = await this.teamsRepository.findOne({
      where: { id: teamId },
      relations: ['members'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!team.members.some((member) => member.id === userId)) {
      team.members.push(user);
      return this.teamsRepository.save(team);
    }

    return team;
  }

  async removeMember(teamId: string, userId: string): Promise<Team> {
    const team = await this.teamsRepository.findOne({
      where: { id: teamId },
      relations: ['members'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    team.members = team.members.filter((member) => member.id !== userId);
    return this.teamsRepository.save(team);
  }

  async removeMultipleMembers(
    teamId: string,
    userIds: string[],
  ): Promise<Team> {
    const team = await this.teamsRepository.findOne({
      where: { id: teamId },
      relations: ['members'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    team.members = team.members.filter(
      (member) => !userIds.includes(member.id),
    );
    return this.teamsRepository.save(team);
  }

  async remove(id: string): Promise<void> {
    const team = await this.findOne(id);
    await this.teamsRepository.remove(team);
  }
}
