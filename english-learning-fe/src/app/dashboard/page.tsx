"use client";

import { useAppSettings } from "@/providers/app-settings-provider";
import { useData } from "../../data/dataContext";
import { useSubscription } from "@/context/subscriptionContext";
import { cn } from "@/utils/cn";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/dashboard/card";
import {
  Users,
  GraduationCap,
  FileText,
  TrendingUp,
  Plus,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/dashboard/badge";
import { Progress } from "@/components/dashboard/progress";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/dashboard/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/dashboard/label";
import { Textarea } from "@/components/dashboard/textarea";
import { DashboardHeader } from "@/components/dashboard/header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/dashboard/select";

const colors = [
  "#8B5CF6",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#14B8A6",
  "#6366F1",
];

export default function Dashboard() {
  const { dictionary } = useAppSettings();
  const { classes, students, projects, addClass } = useData();
  const { tier, maxClasses, upgradeTier } = useSubscription();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    schedule: "",
    level: "Beginner" as "Beginner" | "Intermediate" | "Advanced",
    status: "Active" as "Active" | "Draft" | "Completed",
    color: colors[0],
  });

  const activeClasses = classes.filter((c) => c.status === "Active").length;
  const totalStudents = students.length;
  const avgProgress =
    students.length > 0
      ? Math.round(
          students.reduce((sum, s) => sum + s.progress, 0) / students.length,
        )
      : 0;
  const pendingSubmissions = projects.reduce(
    (sum, p) => sum + (p.totalStudents - p.submittedCount),
    0,
  );

  const recentClasses = classes.slice(0, 3);
  const topStudents = [...students]
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 5);

  const stats = [
    {
      title: dictionary.dashboard.activeClasses,
      value: activeClasses,
      icon: GraduationCap,
      description: `${classes.length} ${dictionary.dashboard.activeClasses}`,
      color: "text-[var(--color-primary)]",
      bgColor: "bg-[var(--color-primary-soft)]",
    },
    {
      title: dictionary.dashboard.totalStudents,
      value: totalStudents,
      icon: Users,
      description: dictionary.myCourse.overview.statsStudents,
      color: "text-[var(--color-secondary)]",
      bgColor: "bg-[var(--color-secondary-soft)]",
    },
    {
      title: dictionary.dashboard.avgProgress,
      value: `${avgProgress}%`,
      icon: TrendingUp,
      description: dictionary.dashboard.pendingWork,
      color: "text-[var(--color-success)]",
      bgColor: "bg-[var(--color-success-soft)]",
    },
    {
      title: dictionary.dashboard.pendingWork,
      value: pendingSubmissions,
      icon: FileText,
      description: dictionary.dashboard.upcomingProjects,
      color: "text-[var(--color-warning)]",
      bgColor: "bg-[var(--color-warning-soft)]",
    },
  ];

  const handleCreateClass = () => {
    if (classes.length >= maxClasses) {
      setUpgradeDialogOpen(true);
    } else {
      setDialogOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addClass({
      ...formData,
      studentCount: 0,
    });
    handleCloseDialog();
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      name: "",
      description: "",
      schedule: "",
      level: "Beginner",
      status: "Active",
      color: colors[0],
    });
  };

  return (
    <div className="space-y-6">
      <DashboardHeader />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2 text-app-text">
              {dictionary.dashboard.title}
            </h1>
            <p className="text-app-text-muted">
              {dictionary.dashboard.greeting}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-sm">
              <Badge
                variant={tier === "free" ? "secondary" : "default"}
                className="mb-1"
              >
                {tier === "free"
                  ? "Free Plan"
                  : tier === "pro"
                    ? "Pro Plan"
                    : "Enterprise"}
              </Badge>
              <p className="text-app-text-muted">
                {classes.length} / {maxClasses === Infinity ? "∞" : maxClasses}{" "}
                {dictionary.dashboard.planLabel}
              </p>
            </div>
            <Button onClick={handleCreateClass}>
              <Plus className="w-4 h-4 mr-2" />
              {dictionary.dashboard.createClass}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                    <Icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{stat.value}</div>
                  <p className="text-xs text-app-text-muted mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Classes */}
          <Card>
            <CardHeader>
              <CardTitle>Active Classes</CardTitle>
              <CardDescription>Your current teaching schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentClasses.map((classItem) => (
                <Link key={classItem.id} href={`/class/${classItem.id}`}>
                  <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-app-surface-2 transition-colors cursor-pointer">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: classItem.color }}
                    >
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">
                          {classItem.name}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {classItem.level}
                        </Badge>
                      </div>
                      <p className="text-sm text-app-text-muted mb-1">
                        {classItem.schedule}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-app-text-muted">
                        <Users className="w-3 h-3" />
                        {classItem.studentCount}{" "}
                        {dictionary.myCourse.overview.statsStudents}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              <Link href="/classes">
                <button className="w-full text-sm text-(--color-primary) hover:text-(--color-primary-active) font-medium pt-2">
                  {dictionary.dashboard.viewAllClasses} →
                </button>
              </Link>
            </CardContent>
          </Card>

          {/* Top Students */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Students</CardTitle>
              <CardDescription>
                Based on progress and completion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topStudents.map((student, index) => (
                <div key={student.id} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 font-medium text-sm">
                    {index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-medium">
                    {student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{student.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress
                        value={student.progress}
                        className="flex-1 h-2"
                      />
                      <span className="text-sm text-app-text-muted font-medium">
                        {student.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <Link href="/students">
                <button className="w-full text-sm text-(--color-primary) hover:text-(--color-primary-active) font-medium pt-2">
                  {dictionary.dashboard.viewAllStudents} →
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Project Deadlines</CardTitle>
            <CardDescription>Projects due this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.map((project) => {
                const classItem = classes.find((c) => c.id === project.classId);
                const submissionRate = Math.round(
                  (project.submittedCount / project.totalStudents) * 100,
                );

                return (
                  <div
                    key={project.id}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: classItem?.color || "#8B5CF6" }}
                    >
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{project.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {classItem?.name}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">
                          Due:{" "}
                          {new Date(project.dueDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
                        <span className="text-gray-500">
                          {project.submittedCount}/{project.totalStudents}{" "}
                          submitted ({submissionRate}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={submissionRate} className="w-24 h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Create Class Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Add a new class to your curriculum
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Class Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Advanced Prototyping"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of the class"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="schedule">Schedule</Label>
                  <Input
                    id="schedule"
                    value={formData.schedule}
                    onChange={(e) =>
                      setFormData({ ...formData, schedule: e.target.value })
                    }
                    placeholder="e.g., Mon & Wed, 10:00 AM"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="level">Level</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value: string) =>
                        setFormData({
                          ...formData,
                          level: value as
                            | "Beginner"
                            | "Intermediate"
                            | "Advanced",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">
                          Intermediate
                        </SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: string) =>
                        setFormData({
                          ...formData,
                          status: value as "Active" | "Draft" | "Completed",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Color Theme</Label>
                  <div className="flex gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          "w-10 h-10 rounded-lg border-2 transition-all",
                          formData.color === color
                            ? "border-gray-900 scale-110"
                            : "border-transparent",
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Class</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Upgrade Dialog */}
        <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-500" />
                Upgrade Your Plan
              </DialogTitle>
              <DialogDescription>
                You have reached the limit of {maxClasses} classes on the free
                plan. Upgrade to create more!
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <Card className="border-2 border-purple-600">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Pro Plan</CardTitle>
                    <Badge>Most Popular</Badge>
                  </div>
                  <CardDescription className="text-2xl font-semibold mt-2">
                    $29
                    <span className="text-sm font-normal text-gray-600">
                      /month
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                    </div>
                    <span>Up to 10 classes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                    </div>
                    <span>Unlimited students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                    </div>
                    <span>Advanced analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                    </div>
                    <span>Priority support</span>
                  </div>
                  <Button
                    className="w-full mt-4"
                    onClick={() => {
                      upgradeTier("pro");
                      setUpgradeDialogOpen(false);
                    }}
                  >
                    Upgrade to Pro
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Enterprise Plan</CardTitle>
                  <CardDescription className="text-2xl font-semibold mt-2">
                    $99
                    <span className="text-sm font-normal text-gray-600">
                      /month
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                    </div>
                    <span>Unlimited classes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                    </div>
                    <span>Unlimited students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                    </div>
                    <span>Custom branding</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                    </div>
                    <span>Dedicated support</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => {
                      upgradeTier("enterprise");
                      setUpgradeDialogOpen(false);
                    }}
                  >
                    Upgrade to Enterprise
                  </Button>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
