import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp,
  orderBy,
  onSnapshot,
  collectionGroup,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { Project, Member, OperationType, Role, Task, TaskStatus, Priority } from '../types';

const PROJECTS_COLLECTION = 'projects';

export const projectService = {
  async createProject(name: string, description: string, creator: { uid: string, email: string, displayName: string }) {
    const projectRef = doc(collection(db, PROJECTS_COLLECTION));
    const projectId = projectRef.id;

    try {
      const projectData = {
        name,
        description,
        creatorId: creator.uid,
        createdAt: serverTimestamp(),
      };

      await setDoc(projectRef, projectData);
      
      const memberRef = doc(db, PROJECTS_COLLECTION, projectId, 'members', creator.uid);
      await setDoc(memberRef, {
        uid: creator.uid,
        email: creator.email,
        displayName: creator.displayName,
        role: 'Admin' as Role,
        joinedAt: serverTimestamp(),
      });

      return projectId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, PROJECTS_COLLECTION);
    }
  },

  async addMember(projectId: string, member: { uid: string, email: string, displayName: string, role: Role }) {
    try {
      const memberRef = doc(db, PROJECTS_COLLECTION, projectId, 'members', member.uid);
      await setDoc(memberRef, {
        ...member,
        joinedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `projects/${projectId}/members`);
    }
  },

  async removeMember(projectId: string, userId: string) {
    try {
      const memberRef = doc(db, PROJECTS_COLLECTION, projectId, 'members', userId);
      await deleteDoc(memberRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}/members/${userId}`);
    }
  },

  async getMembers(projectId: string) {
    try {
      const membersRef = collection(db, PROJECTS_COLLECTION, projectId, 'members');
      const snapshot = await getDocs(membersRef);
      return snapshot.docs.map(doc => doc.data() as Member);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `projects/${projectId}/members`);
    }
  },

  async findUserByEmail(email: string) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase().trim()), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return snapshot.docs[0].data();
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
  }
};

export const taskService = {
  async createTask(projectId: string, task: Partial<Task>, creatorId: string) {
    try {
      const taskRef = doc(collection(db, PROJECTS_COLLECTION, projectId, 'tasks'));
      const taskData = {
        ...task,
        projectId,
        createdBy: creatorId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(taskRef, taskData);
      return taskRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `projects/${projectId}/tasks`);
    }
  },

  async updateTask(projectId: string, taskId: string, updates: Partial<Task>) {
    try {
      const taskRef = doc(db, PROJECTS_COLLECTION, projectId, 'tasks', taskId);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}/tasks/${taskId}`);
    }
  },

  async deleteTask(projectId: string, taskId: string) {
    try {
      const taskRef = doc(db, PROJECTS_COLLECTION, projectId, 'tasks', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}/tasks/${taskId}`);
    }
  },

  subscribeTasks(projectId: string, callback: (tasks: Task[]) => void) {
    const tasksRef = collection(db, PROJECTS_COLLECTION, projectId, 'tasks');
    const q = query(tasksRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `projects/${projectId}/tasks`);
    });
  }
};

