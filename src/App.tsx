import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  Users, 
  Plus, 
  LogOut,
  ChevronRight,
  Target,
  Trophy,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Project, Task, TaskStatus, Priority, Role } from './types';
import { projectService, taskService } from './services/projectService';
import { collectionGroup, query, where, onSnapshot, collection, doc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { handleFirestoreError } from './lib/firebase';
import { OperationType } from './types';
import { 
  ArrowRight, 
  Check, 
  MoreVertical, 
  Trash2, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';

function LoginScreen() {
  const { login } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-xl">
          <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-8">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 text-center mb-2 tracking-tight">
            SyncTeam
          </h1>
          <p className="text-slate-500 text-center mb-10">
            Professional project management for modern teams.
          </p>
          
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-4 bg-indigo-600 text-white py-3.5 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-lg active:scale-[0.98]"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5 shrink-0" alt="Google" />
            Sign in with Google
          </button>
          
          <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Trusted enterprise solution</p>
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Sidebar({ activeView, setActiveView, projects, currentProject, setCurrentProject }: any) {
  const { profile, logout } = useAuth();
  
  return (
    <div className="w-64 bg-slate-900 flex flex-col h-screen overflow-hidden">
      <div className="p-6 flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-3 mb-10 group cursor-pointer" onClick={() => setActiveView('dashboard')}>
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg transition-transform">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-xl text-white tracking-tight block leading-none">SyncTeam</span>
          </div>
        </div>

        <nav className="space-y-1 mb-12">
          <button
            onClick={() => setActiveView('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
              activeView === 'dashboard' 
                ? "bg-slate-800 text-white shadow-sm" 
                : "text-slate-400 hover:text-white hover:bg-white/10"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
        </nav>

        <div className="flex flex-col min-h-0 flex-1">
          <div className="flex items-center justify-between px-2 mb-4">
             <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Projects</span>
             <button 
               onClick={() => setActiveView('create-project')}
               className="p-1 text-slate-400 hover:text-white transition-all"
               title="New Project"
             >
               <Plus className="w-4 h-4" />
             </button>
          </div>
          <div className="space-y-1 overflow-y-auto px-1 flex-1 pb-4 scrollbar-hide">
            {projects.map((project: Project) => (
              <button
                key={project.id}
                onClick={() => {
                  setCurrentProject(project);
                  setActiveView('project');
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  currentProject?.id === project.id && activeView === 'project' 
                    ? "bg-indigo-600 text-white" 
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                )}
              >
                <span className="truncate">{project.name}</span>
                <ChevronRight className={cn(
                  "w-3 h-3 transition-opacity",
                  currentProject?.id === project.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <img src={profile?.photoURL} alt="" className="w-8 h-8 rounded-full ring-2 ring-slate-800" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{profile?.displayName}</p>
            <button 
              onClick={logout}
              className="text-[11px] font-medium text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
            >
              Logout
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className={cn("p-3 rounded-lg", color.replace('text-', 'bg-').replace('500', '100'), color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        </div>
      </div>
    </div>
  );
}

function DashboardView({ projects, tasks }: { projects: Project[], tasks: Task[] }) {
  const overdueTasks = tasks.filter(t => t.status !== 'Done' && new Date(t.dueDate) < new Date()).length;

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-screen">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-sm text-slate-500">Welcome back. Here is an overview of your organization.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Status</p>
          <p className="text-sm font-medium text-emerald-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Operational
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Projects" value={projects.length} icon={Briefcase} color="text-blue-600" />
        <StatCard title="Active Tasks" value={tasks.filter(t => t.status !== 'Done').length} icon={CheckCircle2} color="text-indigo-600" />
        <StatCard title="Overdue" value={overdueTasks} icon={AlertCircle} color="text-rose-600" />
        <StatCard title="Unassigned" value={tasks.filter(t => !t.assignedTo).length} icon={Users} color="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">High Priority Tasks</h3>
              <span className="text-xs font-medium text-slate-400">{tasks.filter(t => t.priority === 'High' && t.status !== 'Done').length} critical items</span>
            </div>
            <div className="divide-y divide-slate-50">
              {tasks.filter(t => t.priority === 'High' && t.status !== 'Done').slice(0, 5).map(task => (
                <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{task.title}</p>
                      <p className="text-xs text-slate-500">{projects.find(p => p.id === task.projectId)?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-900">{task.assignedToName || 'Unassigned'}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{task.status}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.priority === 'High' && t.status !== 'Done').length === 0 && (
                <div className="p-12 text-center text-slate-400 italic text-sm">
                  No high priority tasks at the moment.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Recent Activity</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {tasks.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)).slice(0, 5).map(task => (
                <div key={task.id} className="p-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      <span className="font-bold">{task.assignedToName || 'System'}</span> updated <span className="text-indigo-600 font-bold">{task.title}</span>
                    </p>
                    <p className="text-xs text-slate-500">Status changed to {task.status.toLowerCase()}</p>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">
                    {task.updatedAt?.toDate ? task.updatedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Task Status</h3>
            </div>
            <div className="p-6 space-y-6">
              {['To Do', 'In Progress', 'Done'].map((status) => {
                const count = tasks.filter(t => t.status === status).length;
                const percentage = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
                const colorClass = status === 'Done' ? 'bg-emerald-500' : status === 'In Progress' ? 'bg-indigo-500' : 'bg-slate-300';
                
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                      <span className="text-slate-500">{status}</span>
                      <span className="text-slate-900">{count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-1000", colorClass)} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <h4 className="font-bold mb-2 relative z-10">Pro Tip</h4>
            <p className="text-sm text-indigo-50 relative z-10 leading-relaxed">
              Use the sidebar to quickly switch between your different projects and workspaces.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-white border-t border-slate-200 text-[10px]">
        <div className="flex items-center gap-2 px-3">
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="font-semibold text-slate-500 uppercase tracking-wider">SyncTeam v2.0.4 - Enterprise Edition</span>
        </div>
        <div className="flex items-center gap-2 px-3">
          <div className="w-1 h-1 rounded-full bg-emerald-500" />
          <span className="font-semibold text-slate-500 uppercase tracking-wider">All systems online</span>
        </div>
      </div>
    </div>
  );
}

function ProjectView({ project }: { project: Project }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isManagingTeam, setIsManagingTeam] = useState(false);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'Admin' | 'Member'>('Member');
  const [memberActionLoading, setMemberActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [newTask, setNewTask] = useState({ title: '', status: 'To Do', priority: 'Medium', assignedTo: '', assignedToName: '', description: '', dueDate: '', projectId: '' });
  const { profile } = useAuth();

  const fetchMembers = async () => {
    const m = await projectService.getMembers(project.id);
    setMembers(m || []);
    if (profile) {
      const me = m?.find((member: any) => member.uid === profile.uid);
      setUserRole(me?.role || 'Member');
    }
  };

  useEffect(() => {
    if (!project) return;
    const unsubTasks = taskService.subscribeTasks(project.id, setTasks);
    fetchMembers();
    return () => unsubTasks();
  }, [project, profile]);

  const isAdmin = userRole === 'Admin';

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setMemberActionLoading(true);
    setError('');
    
    try {
      const userToInvite: any = await projectService.findUserByEmail(memberEmail);
      if (!userToInvite) {
        setError('User not found. Ask them to sign in to SyncTeam first!');
        return;
      }
      
      if (members.find(m => m.uid === userToInvite.uid)) {
        setError('User is already a member of this project.');
        return;
      }

      await projectService.addMember(project.id, {
        uid: userToInvite.uid,
        email: userToInvite.email,
        displayName: userToInvite.displayName,
        role: memberRole
      });
      
      setMemberEmail('');
      fetchMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setMemberActionLoading(false);
    }
  };

  const handleRemoveMember = async (uid: string) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await projectService.removeMember(project.id, uid);
      fetchMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    await taskService.createTask(project.id, { ...newTask, projectId: project.id }, profile.uid);
    setIsAddingTask(false);
    setNewTask({ title: '', status: 'To Do', priority: 'Medium', assignedTo: '', assignedToName: '', description: '', dueDate: '', projectId: project.id });
  };

  const updateStatus = async (taskId: string, status: TaskStatus) => {
    await taskService.updateTask(project.id, taskId, { status });
  };

  const columns: TaskStatus[] = ['To Do', 'In Progress', 'Done'];

  return (
    <div className="p-8 h-screen flex flex-col bg-slate-50">
      <div className="flex items-center justify-between pb-8 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{project.name}</h2>
             <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-wider">
               {userRole}
             </span>
          </div>
          <p className="text-sm text-slate-500 max-w-2xl">{project.description}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors" onClick={() => isAdmin && setIsManagingTeam(true)}>
            {members.map(m => (
              <img 
                key={m.uid}
                src={`https://ui-avatars.com/api/?name=${m.displayName}&background=random`} 
                className="w-8 h-8 rounded-full border-2 border-white"
                alt={m.displayName}
                title={m.displayName}
              />
            ))}
            {isAdmin && (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsManagingTeam(true); }}
                className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          {isAdmin && (
            <button 
              onClick={() => setIsAddingTask(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden py-6">
        {columns.map(status => (
          <div key={status} className="flex flex-col gap-4 min-w-[300px]">
             <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-2">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{status}</h3>
                 <span className="text-xs font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-full">{tasks.filter(t => t.status === status).length}</span>
               </div>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide pb-10">
               <AnimatePresence mode="popLayout">
                 {tasks.filter(t => t.status === status).map((task) => (
                   <motion.div
                    layout
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 group relative hover:shadow-md transition-all"
                   >
                     <div className="flex items-start justify-between mb-3">
                       <span className={cn(
                         "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                         task.priority === 'High' ? "bg-rose-50 text-rose-600" :
                         task.priority === 'Medium' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                       )}>
                         {task.priority}
                       </span>
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         {(isAdmin || (task.assignedTo === profile?.uid)) && (
                           <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-md border border-slate-200">
                             {columns.map(col => col !== status && (
                               <button 
                                 key={col}
                                 onClick={() => updateStatus(task.id, col)}
                                 className={cn(
                                   "w-6 h-6 rounded transition-all flex items-center justify-center text-[9px] font-bold uppercase",
                                   col === 'To Do' ? "hover:bg-slate-200 text-slate-400" :
                                   col === 'In Progress' ? "hover:bg-indigo-600 hover:text-white text-indigo-400" : "hover:bg-emerald-600 hover:text-white text-emerald-400"
                                 )}
                                 title={`Move to ${col}`}
                               >
                                 {col === 'To Do' ? 'TD' : col === 'In Progress' ? 'IP' : 'DN'}
                               </button>
                             ))}
                           </div>
                         )}
                         {isAdmin && (
                            <button 
                              onClick={() => {
                                if(confirm('Delete this task?')) taskService.deleteTask(project.id, task.id);
                              }}
                              className="w-8 h-8 bg-white text-slate-400 hover:text-rose-600 rounded-md transition-all flex items-center justify-center border border-slate-200"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                         )}
                       </div>
                     </div>

                     <h4 className="text-sm font-bold text-slate-900 mb-1 leading-tight">{task.title}</h4>
                     <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">{task.description}</p>
                     
                     <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          {task.assignedTo ? (
                            <img 
                              src={`https://ui-avatars.com/api/?name=${task.assignedToName}&background=random`} 
                              className="w-6 h-6 rounded-full"
                              alt=""
                              title={task.assignedToName}
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200">
                               <Users className="w-3 h-3 text-slate-300" />
                            </div>
                          )}
                          <span className="text-[10px] font-medium text-slate-500 truncate max-w-[80px]">
                            {task.assignedTo === profile?.uid ? 'Me' : task.assignedToName || 'Unassigned'}
                          </span>
                        </div>
                        <div className={cn(
                          "flex items-center gap-1 text-[10px] font-medium",
                          status !== 'Done' && new Date(task.dueDate) < new Date() ? "text-rose-500" : "text-slate-400"
                        )}>
                          <Clock className="w-3 h-3" />
                          <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                        </div>
                     </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
               {tasks.filter(t => t.status === status).length === 0 && (
                 <div className="h-20 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">No tasks</p>
                 </div>
               )}
             </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isManagingTeam && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Manage Team</h3>
                <button 
                  onClick={() => setIsManagingTeam(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="mb-8 space-y-4">
                <form onSubmit={handleAddMember} className="space-y-4 bg-slate-50 p-4 rounded-xl">
                  <h4 className="text-sm font-semibold text-slate-700">Add New Member</h4>
                  {error && <div className="text-xs text-rose-600 font-medium">{error}</div>}
                  <div className="flex gap-2">
                    <input 
                      type="email"
                      placeholder="User's email..."
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm transition-all focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={memberEmail}
                      onChange={e => setMemberEmail(e.target.value)}
                      required
                    />
                    <select 
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                      value={memberRole}
                      onChange={e => setMemberRole(e.target.value as any)}
                    >
                      <option value="Member">Member</option>
                      <option value="Admin">Admin</option>
                    </select>
                    <button 
                      type="submit"
                      disabled={memberActionLoading}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {memberActionLoading ? '...' : 'Add'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">User must have logged into SyncTeam at least once.</p>
                </form>

                <button
                  onClick={async () => {
                    const demoMembers = [
                      { uid: 'demo-1', email: 'alex@example.com', displayName: 'Alex Rivera', role: 'Member' as Role },
                      { uid: 'demo-2', email: 'sarah@example.com', displayName: 'Sarah Chen', role: 'Member' as Role },
                      { uid: 'demo-3', email: 'jordan@example.com', displayName: 'Jordan Smith', role: 'Admin' as Role },
                      { uid: 'demo-4', email: 'taylor@example.com', displayName: 'Taylor Wong', role: 'Member' as Role },
                      { uid: 'demo-5', email: 'morgan@example.com', displayName: 'Morgan Lee', role: 'Member' as Role },
                      { uid: 'demo-6', email: 'casey@example.com', displayName: 'Casey Jones', role: 'Member' as Role },
                      { uid: 'demo-7', email: 'riley@example.com', displayName: 'Riley Davis', role: 'Member' as Role },
                      { uid: 'demo-8', email: 'quinn@example.com', displayName: 'Quinn Miller', role: 'Member' as Role },
                      { uid: 'demo-9', email: 'skyler@example.com', displayName: 'Skyler White', role: 'Member' as Role },
                      { uid: 'demo-10', email: 'parker@example.com', displayName: 'Parker Poe', role: 'Member' as Role },
                    ];
                    setMemberActionLoading(true);
                    for (const m of demoMembers) {
                      await projectService.addMember(project.id, m);
                    }
                    setMemberActionLoading(false);
                    fetchMembers();
                  }}
                  disabled={memberActionLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-indigo-200 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-all uppercase tracking-wider"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  Seed 10 Demo Members
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Current Members</h4>
                {members.map(member => (
                  <div key={member.uid} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${member.displayName}&background=random`} 
                        className="w-10 h-10 rounded-full"
                        alt={member.displayName}
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{member.displayName}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded",
                        member.role === 'Admin' ? "bg-indigo-50 text-indigo-700" : "bg-slate-50 text-slate-600"
                      )}>
                        {member.role}
                      </span>
                      {member.uid !== profile?.uid && (
                        <button 
                          onClick={() => handleRemoveMember(member.uid)}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddingTask && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Create New Task</h3>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Task Title</label>
                  <input 
                    required
                    placeholder="What needs to be done?"
                    className="w-full bg-white border border-slate-200 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    value={newTask.title}
                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Description</label>
                  <textarea 
                    placeholder="Enter details..."
                    className="w-full bg-white border border-slate-200 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all h-24 resize-none font-medium"
                    value={newTask.description}
                    onChange={e => setNewTask({...newTask, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Priority</label>
                    <select 
                      className="w-full bg-white border border-slate-200 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer font-medium"
                      value={newTask.priority}
                      onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Due Date</label>
                    <input 
                      type="date"
                      className="w-full bg-white border border-slate-200 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer font-medium"
                      value={newTask.dueDate}
                      onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Assignee</label>
                  <select 
                    className="w-full bg-white border border-slate-200 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer font-medium"
                    value={newTask.assignedTo}
                    onChange={e => {
                      const member = members.find(m => m.uid === e.target.value);
                      setNewTask({...newTask, assignedTo: e.target.value, assignedToName: member?.displayName || ''})
                    }}
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.uid} value={m.uid}>{m.displayName}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-6">
                  <button 
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateProjectView({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    const id = await projectService.createProject(name, description, {
      uid: profile.uid,
      email: profile.email,
      displayName: profile.displayName
    });
    setLoading(false);
    if (id) onCreated(id);
  };

  return (
    <div className="p-16 flex items-center justify-center min-h-screen bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full bg-white p-8 rounded-xl border border-slate-200 shadow-xl"
      >
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Create New Project</h2>
          <p className="text-slate-500">Set up your workspace and start collaborating.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Project Name</label>
            <input 
              required
              placeholder="e.g. Website Redesign"
              className="w-full bg-white border border-slate-200 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea 
              rows={4}
              placeholder="What is this project about?"
              className="w-full bg-white border border-slate-200 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? 'Creating...' : (
              <>
                Create Project
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function MainApp() {
  const [activeView, setActiveView] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile) return;
    
    // Subscribe to all projects user is part of
    const q = query(collectionGroup(db, 'members'), where('uid', '==', profile.uid));
    const unsubMemberships = onSnapshot(q, async (snapshot) => {
      const projectIds = snapshot.docs.map(doc => doc.ref.parent.parent?.id);
      const uniqueIds = Array.from(new Set(projectIds)).filter(Boolean) as string[];
      
      for (const id of uniqueIds) {
        // Individual project listener
        onSnapshot(doc(db, 'projects', id), (docSnap) => {
          if (docSnap.exists()) {
            const p = { id: docSnap.id, ...docSnap.data() } as Project;
            setProjects(prev => {
              const filtered = prev.filter(p1 => p1.id !== id);
              return [...filtered, p];
            });
          }
        }, (error) => {
          // Gracefully handle if access is lost
          console.warn(`Lost access to project ${id}`);
        });

        // Tasks for this project listener
        onSnapshot(collection(db, 'projects', id, 'tasks'), (snap) => {
           const projectTasks = snap.docs.map(d => ({ id: d.id, ...d.data() } as Task));
           setAllTasks(prev => {
             const filtered = prev.filter(t => t.projectId !== id);
             return [...filtered, ...projectTasks];
           });
        }, (error) => {
          console.warn(`Error fetching tasks for project ${id}:`, error);
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'collectionGroup(members)');
    });

    return () => unsubMemberships();
  }, [profile]);

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        projects={projects}
        currentProject={currentProject}
        setCurrentProject={setCurrentProject}
      />
      <main className="flex-1 max-h-screen overflow-hidden">
        <AnimatePresence mode="wait">
          {activeView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <DashboardView projects={projects} tasks={allTasks} />
            </motion.div>
          )}
          {activeView === 'create-project' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <CreateProjectView onCreated={(id) => {
                setActiveView('dashboard');
              }} />
            </motion.div>
          )}
          {activeView === 'project' && currentProject && (
            <motion.div
              key={currentProject.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <ProjectView project={currentProject} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return user ? <MainApp /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
