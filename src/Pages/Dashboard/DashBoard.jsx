import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FolderKanban,
  ListTodo,
  Plus,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { apiRequest } from "../../../server/src/lib/api";
import "./DashBoard.css";
import "./DashBoard-live.css";

const COLORS = {
  todo: "#B6A0FF",
  in_progress: "#74a7ff",
  done: "#70d6a3",
  high: "#ff9999",
  medium: "#ffbd69",
  low: "#70d6a3",
};
const STATUS_LABELS = { todo: "To do", in_progress: "In progress", done: "Completed" };
const PRIORITY_LABELS = { high: "High", medium: "Medium", low: "Low" };
const statIcons = { projects: FolderKanban, tasks: ListTodo, completed: CheckCircle2, overdue: CircleAlert };

function dateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
function localISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function formatDate(value) {
  const date = dateOnly(value);
  if (!date) return "No due date";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function timeAgo(value) {
  const date = dateOnly(value);
  if (!date) return "Recently";
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function taskTimestamp(task) {
  return task.updatedAt || task.updated_at || task.createdAt || task.created_at || null;
}
function getTaskDate(task, key) {
  return task[key] || task[key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)] || null;
}

function DashboardStatCard({ stat }) {
  const Icon = statIcons[stat.icon] || ListTodo;
  const isOverdue = stat.id === "overdue";
  return (
    <article className="dashboard-stat-card">
      <div className="stat-card-top">
        <div className={`stat-icon ${stat.color}`}><Icon size={19} strokeWidth={1.8} /></div>
        <span className={`stat-change ${isOverdue ? "warning" : ""}`}>
          {isOverdue ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
          Live
        </span>
      </div>
      <div className="stat-value">{stat.value}</div>
      <div className="stat-label">{stat.label}</div>
      <div className="stat-footnote">{stat.changeLabel}</div>
    </article>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((item) => (
        <div className="tooltip-row" key={item.dataKey}>
          <span className="tooltip-dot" style={{ background: item.color }} />
          <span>{item.name}</span><strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function TaskActivityChart({ data }) {
  return (
    <section className="dashboard-panel activity-chart-panel">
      <div className="panel-header"><div><h2>Task activity</h2><p>Tasks created vs completed over the last 7 days</p></div></div>
      <div className="chart-legend">
        <span><i className="legend-dot created-dot" />Created</span>
        <span><i className="legend-dot completed-dot" />Completed</span>
      </div>
      <div className="activity-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#B6A0FF" stopOpacity={0.24} /><stop offset="100%" stopColor="#B6A0FF" stopOpacity={0} /></linearGradient>
              <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#70d6a3" stopOpacity={0.18} /><stop offset="100%" stopColor="#70d6a3" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid stroke="#292832" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#858592", fontSize: 11 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#858592", fontSize: 11 }} allowDecimals={false} domain={[0, "auto"]} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#55515f", strokeDasharray: "4 4" }} />
            <Area type="monotone" dataKey="created" name="Created" stroke="#B6A0FF" strokeWidth={2} fill="url(#createdGradient)" activeDot={{ r: 4, fill: "#B6A0FF", strokeWidth: 0 }} />
            <Area type="monotone" dataKey="completed" name="Completed" stroke="#70d6a3" strokeWidth={2} fill="url(#completedGradient)" activeDot={{ r: 4, fill: "#70d6a3", strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function TaskDistribution({ data, total }) {
  return (
    <section className="dashboard-panel distribution-panel">
      <div className="panel-header"><div><h2>Task distribution</h2><p>Current workflow breakdown</p></div></div>
      <div className="distribution-chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="66%" outerRadius="88%" paddingAngle={4} stroke="none">
              {data.map((item) => <Cell key={item.name} fill={item.color} />)}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value} tasks`, name]} contentStyle={{ background: "#191820", border: "1px solid #302e3b", borderRadius: "10px", color: "#eeedf5", fontSize: "12px" }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="distribution-center"><strong>{total}</strong><span>Total tasks</span></div>
      </div>
      <div className="distribution-legend">
        {data.map((item) => (
          <div className="distribution-item" key={item.name}>
            <span className="distribution-name"><i style={{ background: item.color }} />{item.name}</span>
            <strong>{item.value}</strong><span className="distribution-percent">{total ? Math.round((item.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProjectProgress({ projects, tasks, navigate }) {
  return (
    <section className="dashboard-panel project-progress-panel">
      <div className="panel-header"><div><h2>Project progress</h2><p>A quick look at your active projects</p></div><button className="text-action" type="button" onClick={() => navigate("/projects")}>View all <ArrowRight size={15} /></button></div>
      {projects.length === 0 ? <div className="dashboard-inline-empty">No projects yet. Create one to track its progress.</div> : (
        <div className="project-progress-list">
          {projects.slice(0, 5).map((project, index) => {
            const projectTasks = tasks.filter((task) => task.projectId === project.id || task.project_id === project.id);
            const completed = projectTasks.filter((task) => task.status === "done").length;
            const total = projectTasks.length;
            const percentage = total ? Math.round((completed / total) * 100) : 0;
            const color = ["#B6A0FF", "#74a7ff", "#70d6a3", "#ffbd69", "#e99ee8"][index % 5];
            return (
              <button type="button" className="project-progress-item dashboard-project-button" key={project.id} onClick={() => navigate(`/projects/${project.id}`)}>
                <div className="project-progress-top">
                  <div className="project-color-mark" style={{ background: color }} />
                  <div className="project-progress-info"><strong>{project.name}</strong><span>{total} task{total === 1 ? "" : "s"} · {project.status || "active"}</span></div>
                  <strong className="project-percentage">{percentage}%</strong>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${percentage}%`, background: color }} /></div>
                <div className="project-progress-meta"><span>{completed} of {total} tasks</span><span>{total - completed} remaining</span></div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function RecentActivity({ tasks, projects, navigate }) {
  const activities = useMemo(() => tasks
    .map((task) => {
      const timestamp = taskTimestamp(task);
      const created = getTaskDate(task, "createdAt");
      const isUpdated = timestamp && created && new Date(timestamp).getTime() > new Date(created).getTime() + 60_000;
      const projectId = task.projectId || task.project_id;
      const project = projects.find((item) => item.id === projectId);
      return {
        id: task.id,
        title: task.title,
        project: project?.name || task.projectName || task.project_name || "Independent task",
        timestamp,
        type: task.status === "done" ? "completed" : isUpdated ? "moved" : "created",
        action: task.status === "done" ? "completed a task" : isUpdated ? "updated a task" : "created a task",
      };
    })
    .sort((a, b) => (dateOnly(b.timestamp)?.getTime() || 0) - (dateOnly(a.timestamp)?.getTime() || 0))
    .slice(0, 5), [tasks, projects]);

  return (
    <section className="dashboard-panel recent-activity-panel">
      <div className="panel-header"><div><h2>Recent activity</h2><p>Latest task updates</p></div><button className="icon-action" type="button" aria-label="View tasks" onClick={() => navigate("/tasks")}><ArrowRight size={17} /></button></div>
      {activities.length === 0 ? <div className="dashboard-inline-empty">Your task activity will appear here.</div> : (
        <div className="activity-list">
          {activities.map((activity) => (
            <button type="button" className="activity-item dashboard-activity-button" key={activity.id} onClick={() => navigate("/tasks")}>
              <div className={`activity-avatar ${activity.type}`}>{activity.type === "completed" ? <Check size={15} /> : activity.type === "created" ? <Plus size={15} /> : <ArrowRight size={15} />}</div>
              <div className="activity-content"><p><strong>You</strong> {activity.action} <span className="activity-task">{activity.title}</span></p><span className="activity-project">{activity.project}</span></div>
              <span className="activity-time">{timeAgo(activity.timestamp)}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function UpcomingTasks({ tasks, projects, navigate }) {
  const upcoming = useMemo(() => {
    const today = localISO(new Date());
    return tasks
      .filter((task) => task.status !== "done" && (task.dueDate || task.due_date) && String(task.dueDate || task.due_date).slice(0, 10) >= today)
      .sort((a, b) => String(a.dueDate || a.due_date).localeCompare(String(b.dueDate || b.due_date)))
      .slice(0, 5);
  }, [tasks]);

  return (
    <section className="dashboard-panel upcoming-panel">
      <div className="panel-header"><div><h2>Upcoming deadlines</h2><p>Tasks that need your attention</p></div><button className="text-action" type="button" onClick={() => navigate("/tasks")}>All tasks <ArrowRight size={15} /></button></div>
      {upcoming.length === 0 ? <div className="dashboard-inline-empty">No upcoming deadlines. You're all caught up.</div> : (
        <div className="upcoming-list">
          {upcoming.map((task) => {
            const projectId = task.projectId || task.project_id;
            const project = projects.find((item) => item.id === projectId);
            const priority = String(task.priority || "medium").toLowerCase();
            return (
              <button type="button" className="upcoming-task dashboard-upcoming-button" key={task.id} onClick={() => navigate("/tasks")}>
                <div className="task-checkbox"><Check size={13} /></div>
                <div className="upcoming-task-info"><strong>{task.title}</strong><span>{project?.name || task.projectName || task.project_name || "Independent task"}</span></div>
                <div className="upcoming-task-meta"><span className={`priority-badge priority-${priority}`}>{PRIORITY_LABELS[priority] || "Medium"}</span><span className="due-date"><Clock3 size={12} />{formatDate(task.dueDate || task.due_date)}</span></div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function DashBoard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setError("");
      const [taskData, projectData] = await Promise.all([apiRequest("/tasks"), apiRequest("/projects")]);
      setTasks(taskData.tasks || []);
      setProjects(projectData.projects || []);
    } catch (err) {
      setError(err.message || "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const refreshOnFocus = () => loadDashboard();
    window.addEventListener("focus", refreshOnFocus);
    const interval = window.setInterval(loadDashboard, 60_000);
    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      window.clearInterval(interval);
    };
  }, [loadDashboard]);

  const stats = useMemo(() => {
    const today = localISO(new Date());
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "done").length;
    const overdue = tasks.filter((task) => task.status !== "done" && (task.dueDate || task.due_date) && String(task.dueDate || task.due_date).slice(0, 10) < today).length;
    return [
      { id: "projects", icon: "projects", color: "purple", value: projects.length, label: "Total projects", changeLabel: "Projects in your workspace" },
      { id: "tasks", icon: "tasks", color: "blue", value: total, label: "Total tasks", changeLabel: `${tasks.filter((task) => task.status !== "done").length} still open` },
      { id: "completed", icon: "completed", color: "green", value: completed, label: "Completed tasks", changeLabel: total ? `${Math.round((completed / total) * 100)}% of all tasks` : "No tasks created yet" },
      { id: "overdue", icon: "overdue", color: "orange", value: overdue, label: "Overdue tasks", changeLabel: overdue ? "Past due and not completed" : "No overdue tasks" },
    ];
  }, [tasks, projects]);

  const activityData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - index));
      const key = localISO(day);
      const created = tasks.filter((task) => {
        const date = dateOnly(getTaskDate(task, "createdAt"));
        return date && localISO(date) === key;
      }).length;
      // The current schema has no completed_at field, so updatedAt is used as a best-effort
      // completion date for tasks currently marked done.
      const completed = tasks.filter((task) => {
        if (task.status !== "done") return false;
        const date = dateOnly(taskTimestamp(task));
        return date && localISO(date) === key;
      }).length;
      return { day: day.toLocaleDateString("en-IN", { weekday: "short" }), created, completed };
    });
  }, [tasks]);

  const distributionData = useMemo(() => [
    { name: "To do", value: tasks.filter((task) => task.status === "todo").length, color: COLORS.todo },
    { name: "In progress", value: tasks.filter((task) => task.status === "in_progress").length, color: COLORS.in_progress },
    { name: "Completed", value: tasks.filter((task) => task.status === "done").length, color: COLORS.done },
  ], [tasks]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-welcome">
        <div>
          <div className="welcome-eyebrow"><span className="welcome-dot" />YOUR WORKSPACE AT A GLANCE</div>
          <h1>Good to see you again.</h1>
          <p>Here's what's happening with your projects today.</p>
        </div>
        <button className="dashboard-primary-button" type="button" onClick={() => navigate("/tasks")}><Plus size={17} />New task</button>
      </div>

      {error && <div className="dashboard-error" role="alert">{error} <button type="button" onClick={loadDashboard}>Retry</button></div>}
      {loading ? <div className="dashboard-loading">Loading your workspace…</div> : (
        <>
          <div className="dashboard-stats">{stats.map((stat) => <DashboardStatCard key={stat.id} stat={stat} />)}</div>
          <div className="dashboard-main-grid">
            <TaskActivityChart data={activityData} />
            <TaskDistribution data={distributionData} total={tasks.length} />
          </div>
          <div className="dashboard-secondary-grid">
            <ProjectProgress projects={projects} tasks={tasks} navigate={navigate} />
            <UpcomingTasks tasks={tasks} projects={projects} navigate={navigate} />
          </div>
          <div className="dashboard-bottom-grid"><RecentActivity tasks={tasks} projects={projects} navigate={navigate} /></div>
        </>
      )}
    </div>
  );
}
