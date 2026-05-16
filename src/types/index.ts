export type Role = 'Admin' | 'Member';
export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type Priority = 'Low' | 'Medium' | 'High';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  createdAt?: string;
}

export interface Member {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  joinedAt?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}
