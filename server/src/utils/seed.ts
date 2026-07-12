import bcrypt from 'bcrypt';
import User, { UserRole } from '../models/User';
import Department from '../models/Department';
import Category from '../models/Category';
import Asset, { AssetStatus } from '../models/Asset';

export const seedDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already has data. Skipping seed.');
      return;
    }

    console.log('Seeding initial demo data...');
    
    // 1. Departments
    const dept1 = await Department.create({ name: 'Engineering', status: 'Active' });
    const dept2 = await Department.create({ name: 'HR', status: 'Active' });
    const dept3 = await Department.create({ name: 'Operations', status: 'Active' });

    // 2. Users
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    const admin = await User.create({
      name: 'Super Admin', email: 'admin@assetflow.com', password, role: UserRole.ADMIN, status: 'Active'
    });

    const manager = await User.create({
      name: 'Asset Manager 1', email: 'manager@assetflow.com', password, role: UserRole.ASSET_MANAGER, department: dept3._id, status: 'Active'
    });

    const head = await User.create({
      name: 'Eng Head', email: 'head@assetflow.com', password, role: UserRole.DEPARTMENT_HEAD, department: dept1._id, status: 'Active'
    });
    dept1.head = head._id as any;
    await dept1.save();

    const emp1 = await User.create({
      name: 'Alice Employee', email: 'alice@assetflow.com', password, role: UserRole.EMPLOYEE, department: dept1._id, status: 'Active'
    });

    const emp2 = await User.create({
      name: 'Bob Employee', email: 'bob@assetflow.com', password, role: UserRole.EMPLOYEE, department: dept2._id, status: 'Active'
    });

    // 3. Categories
    const catElectronics = await Category.create({ name: 'Electronics', description: 'Laptops, Monitors, Phones' });
    const catFurniture = await Category.create({ name: 'Furniture', description: 'Desks, Chairs' });
    const catRooms = await Category.create({ name: 'Meeting Rooms', description: 'Shared spaces' });

    // 4. Assets
    await Asset.create([
      {
        name: 'MacBook Pro 16', category: catElectronics._id, assetTag: 'AF-0001', serialNumber: 'SN-MP16-001',
        condition: 'Good', location: 'HQ - Floor 2', status: AssetStatus.AVAILABLE, isSharedBookable: false
      },
      {
        name: 'MacBook Pro 16', category: catElectronics._id, assetTag: 'AF-0002', serialNumber: 'SN-MP16-002',
        condition: 'Good', location: 'HQ - Floor 2', status: AssetStatus.ALLOCATED, assignedTo: emp1._id, department: dept1._id, isSharedBookable: false
      },
      {
        name: 'Herman Miller Chair', category: catFurniture._id, assetTag: 'AF-0003', serialNumber: 'SN-HMC-001',
        condition: 'Excellent', location: 'HQ - Floor 1', status: AssetStatus.AVAILABLE, isSharedBookable: false
      },
      {
        name: 'Conference Room A', category: catRooms._id, assetTag: 'ROOM-A',
        condition: 'Good', location: 'HQ - Floor 1', status: AssetStatus.AVAILABLE, isSharedBookable: true
      },
      {
        name: 'Projector 4K', category: catElectronics._id, assetTag: 'AF-0004', serialNumber: 'SN-PRJ-001',
        condition: 'Needs Repair', location: 'HQ - Floor 2', status: AssetStatus.UNDER_MAINTENANCE, isSharedBookable: true
      }
    ]);

    console.log('Database Seeded Successfully!');
  } catch (error) {
    console.error('Error seeding DB:', error);
  }
};
