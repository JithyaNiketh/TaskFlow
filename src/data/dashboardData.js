export const dashboardStats = [
  {
    id: "projects",
    label: "Total Projects",
    value: 12,
    change: "+2",
    changeLabel: "this month",
    icon: "projects",
    color: "purple",
  },
  {
    id: "tasks",
    label: "Total Tasks",
    value: 148,
    change: "+18",
    changeLabel: "this week",
    icon: "tasks",
    color: "blue",
  },
  {
    id: "completed",
    label: "Completed Tasks",
    value: 96,
    change: "65%",
    changeLabel: "completion rate",
    icon: "completed",
    color: "green",
  },
  {
    id: "overdue",
    label: "Overdue Tasks",
    value: 8,
    change: "3",
    changeLabel: "due this week",
    icon: "overdue",
    color: "orange",
  },
];

export const taskActivityData = [
  { day: "Mon", created: 12, completed: 8 },
  { day: "Tue", created: 9, completed: 11 },
  { day: "Wed", created: 15, completed: 10 },
  { day: "Thu", created: 8, completed: 14 },
  { day: "Fri", created: 17, completed: 12 },
  { day: "Sat", created: 6, completed: 9 },
  { day: "Sun", created: 10, completed: 13 },
];

export const taskDistributionData = [
  { name: "To Do", value: 24, color: "#8b83a8" },
  { name: "In Progress", value: 18, color: "#b6a0ff" },
  { name: "In Review", value: 10, color: "#74a7ff" },
  { name: "Done", value: 96, color: "#70d6a3" },
];

export const projectProgressData = [
  {
    id: 1,
    name: "Website Redesign",
    description: "Design & Development",
    completed: 24,
    total: 30,
    color: "#b6a0ff",
  },
  {
    id: 2,
    name: "Mobile App",
    description: "Product Development",
    completed: 18,
    total: 40,
    color: "#74a7ff",
  },
  {
    id: 3,
    name: "Marketing Campaign",
    description: "Marketing",
    completed: 15,
    total: 20,
    color: "#70d6a3",
  },
  {
    id: 4,
    name: "Dashboard UI",
    description: "Design & Development",
    completed: 12,
    total: 25,
    color: "#ffbd69",
  },
];

export const recentActivityData = [
  {
    id: 1,
    user: "Alex Morgan",
    initials: "AM",
    action: "completed",
    task: "Design landing page",
    project: "Website Redesign",
    time: "10 min ago",
    type: "completed",
  },
  {
    id: 2,
    user: "Sarah Chen",
    initials: "SC",
    action: "created",
    task: "Implement login flow",
    project: "Mobile App",
    time: "35 min ago",
    type: "created",
  },
  {
    id: 3,
    user: "You",
    initials: "JA",
    action: "moved",
    task: "Update navigation",
    project: "Website Redesign",
    time: "1 hour ago",
    type: "moved",
  },
  {
    id: 4,
    user: "Daniel Lee",
    initials: "DL",
    action: "completed",
    task: "Prepare campaign assets",
    project: "Marketing Campaign",
    time: "2 hours ago",
    type: "completed",
  },
];

export const upcomingTasksData = [
  {
    id: 1,
    title: "Finalize homepage design",
    project: "Website Redesign",
    dueDate: "Today",
    priority: "High",
  },
  {
    id: 2,
    title: "Review API integration",
    project: "Mobile App",
    dueDate: "Tomorrow",
    priority: "Medium",
  },
  {
    id: 3,
    title: "Prepare launch checklist",
    project: "Marketing Campaign",
    dueDate: "Oct 23",
    priority: "High",
  },
  {
    id: 4,
    title: "Fix responsive layout",
    project: "Dashboard UI",
    dueDate: "Oct 25",
    priority: "Low",
  },
];