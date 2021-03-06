import { BaseModel } from '@/models/BaseModel';
import { userPermission, userPermissionMap, actionEntityArray } from '@/utils/config';
import { isObject } from 'util';

export interface IUser {
  id?: string
  name?: string
  username?: string
  password?: string
  hash?: string
  token?: string
  permissions?: string[]
}

export class UserPermission extends BaseModel {
  static entity = 'userPermission'

  static state() {
    return {
      userPermission,
      userPermissionMap,
      actionEntityArray,
    };
  }

  static fields() {
    return {
      id: this.increment(),
      action: this.attr(''),
      describe: this.attr(''),
      defaultCheck: this.boolean(0),
    };
  }
}

export default class User extends BaseModel {
  static entity = 'user'

  static meta = {
    section: 'core',
  }

  // Fix: this functions cause webpack compile fail
  static generatePermissionRoles({ user }) {
    let roleId = '';
    let currentUser = null;
    console.log('Original userMap', user);
    if (Array.isArray(user)) {
      currentUser = user[0];
    }
    console.log('Validated userMap', user);
    const userName = currentUser.name || 'guest';
    switch (currentUser.permissions.length) {
      case 3:
        roleId = 'develop';
        break;
      case 8:
        roleId = 'admin';
        break;
      default:
        roleId = 'default';
        break;
    }
    const permissionDetails = currentUser.permissions.reduce((result, value) => {
      result.push({
        roleId,
        permissionId: userPermissionMap[value],
        permissionName: userPermissionMap[value],
        actionEntitySet: actionEntityArray,
      });
      return result;
    }, []);
    this.commit((state: any) => {
      const users = state.permissionRoles.filter(p => p.user === userName);
      if (users.length === 0) {
        state.permissionRoles.push({
          user: userName,
          permissionDetails,
        });
        console.log('Committed permission Details ', state.permissionRoles);
      } else {
        console.log('Permission Details exists ', state.permissionRoles);
      }
    });
  }

  static fields() {
    return {
      id: this.increment(),
      name: this.string('test'),
      userid: this.string('Emacser'),
      username: this.string('test'),
      password: this.string('123456'),
      email: this.string('test@qq.com'),
      telephone: this.string(''),
      address: this.string(''),
      status: this.number('active'),
      hash: this.string(''),
      token: this.string('qqyzkzldrx'),
      role: this.attr(null),
      avatarUrl: this.string('/avatar/man_1.jpg'),
      permissions: this.attr([]),
    };
  }
}
