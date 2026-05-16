import { Task, TaskStatus } from '../types';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const projectService = {
  async getProjects() {
    return apiFetch('/projects');
  },

  async createProject(name: string, description: string, _creator: any) {
    const project = await apiFetch('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
    return project.id;
  },

  async getMembers(projectId: string) {
    return apiFetch(`/projects/${projectId}/members`);
  },

  async addMember(projectId: string, member: { uid: string; email: string; displayName: string; role: string }) {
    return apiFetch(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ uid: member.uid, role: member.role }),
    });
  },

  async removeMember(projectId: string, userId: string) {
    return apiFetch(`/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    });
  },

  async findUserByEmail(email: string) {
    return apiFetch(`/users/find?email=${encodeURIComponent(email)}`);
  },
};

let taskPollingIntervals: Record<string, ReturnType<typeof setInterval>> = {};

export const taskService = {
  async createTask(projectId: string, task: Partial<Task>, _creatorId: string) {
    return apiFetch(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(task),
    });
  },

  async updateTask(projectId: string, taskId: string, updates: Partial<Task>) {
    return apiFetch(`/projects/${projectId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteTask(projectId: string, taskId: string) {
    return apiFetch(`/projects/${projectId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },

  subscribeTasks(projectId: string, callback: (tasks: Task[]) => void) {
    // Initial fetch
    apiFetch(`/projects/${projectId}/tasks`)
      .then(callback)
      .catch(console.error);

    // Poll every 5 seconds for real-time-like updates
    const intervalId = setInterval(() => {
      apiFetch(`/projects/${projectId}/tasks`)
        .then(callback)
        .catch(console.error);
    }, 5000);

    taskPollingIntervals[projectId] = intervalId;

    // Return unsubscribe function
    return () => {
      clearInterval(taskPollingIntervals[projectId]);
      delete taskPollingIntervals[projectId];
    };
  },
};
