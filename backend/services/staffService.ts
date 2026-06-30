import { StaffRepository } from "../repositories/staffRepository";
import { StaffUser } from "../models";

export class StaffService {
  static async listStaff(tenantId: string): Promise<StaffUser[]> {
    return await StaffRepository.getAll(tenantId);
  }

  static async addStaff(tenantId: string, name: string, email: string, role: 'owner' | 'manager' | 'cashier'): Promise<StaffUser> {
    const user: StaffUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
      dateAdded: new Date().toISOString().split('T')[0],
      status: 'invited'
    };
    return await StaffRepository.save(tenantId, user);
  }
}
