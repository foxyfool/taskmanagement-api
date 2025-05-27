import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Put,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { AddMultipleMembersDto, CreateTeamDto } from './dto/create-team.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  create(@Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(createTeamDto);
  }

  @Get()
  findAll() {
    return this.teamsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Put(':id/members/:userId')
  addMember(@Param('id') teamId: string, @Param('userId') userId: string) {
    return this.teamsService.addMember(teamId, userId);
  }

  @Delete(':id/members/:userId')
  removeMember(@Param('id') teamId: string, @Param('userId') userId: string) {
    return this.teamsService.removeMember(teamId, userId);
  }

  @Put(':id/members')
  addMultipleMembers(
    @Param('id') teamId: string,
    @Body() addMultipleMembersDto: AddMultipleMembersDto,
  ) {
    return this.teamsService.addMultipleMembers(
      teamId,
      addMultipleMembersDto.userIds,
    );
  }

  @Delete(':id/members')
  removeMultipleMembers(
    @Param('id') teamId: string,
    @Body() addMultipleMembersDto: AddMultipleMembersDto,
  ) {
    return this.teamsService.removeMultipleMembers(
      teamId,
      addMultipleMembersDto.userIds,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teamsService.remove(id);
  }
}
