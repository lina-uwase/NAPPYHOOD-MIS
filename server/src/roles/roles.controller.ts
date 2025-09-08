import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'List roles' })
  @ApiResponse({ status: 200, description: 'List of roles' })
  @ApiResponse({ status: 500, description: 'Server error' })
  async list() {
    return this.rolesService.listRoles();
  }

  @Post()
  @ApiOperation({ summary: 'Create role with permissions' })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({ status: 201, description: 'Role created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 500, description: 'Server error' })
  async create(@Body() body: CreateRoleDto) {
    return this.rolesService.createRole(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update role and permissions' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 500, description: 'Server error' })
  async update(@Param('id') id: string, @Body() body: UpdateRoleDto) {
    return this.rolesService.updateRole(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role' })
  @ApiResponse({ status: 200, description: 'Role deleted' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 500, description: 'Server error' })
  async delete(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }
}


