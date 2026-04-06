"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useData } from "@/mock-data/dataContext";
import { useSubscription } from "@/context/subscriptionContext";
import { useAuth } from "@/providers/auth-provider";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useNotification } from "@/providers/notification-provider";
import { getInitials } from "@/utils/get-initials";
import { ProfileFormCard } from "@/components/profile/profile-form-card";
import { ProfileHeaderCard } from "@/components/profile/profile-header-card";
import { ProfileStatsCard } from "@/components/profile/profile-stats-card";
import type { ProfileFormData } from "@/components/profile/profile-types";

function getDefaultFormData(
  user: ReturnType<typeof useAuth>["user"],
): ProfileFormData {
  return {
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: "",
    location: "",
    bio: "",
  };
}

export function ProfilePage() {
  const { user, appRole } = useAuth();
  const { dictionary } = useAppSettings();
  const { success: notifySuccess, info: notifyInfo } = useNotification();
  const { tier } = useSubscription();
  const { classes, students, assignments, calendarEvents } = useData();
  const profileDictionary = dictionary.profilePage;

  const isTeacher = appRole === "teacher";
  const [isEditing, setIsEditing] = useState(false);
  const [localProfile, setLocalProfile] = useState<ProfileFormData | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>(() =>
    getDefaultFormData(user),
  );
  const sourceProfile = localProfile ?? getDefaultFormData(user);

  const studentRecord = useMemo(() => {
    if (!user) {
      return undefined;
    }

    return students.find((student) => {
      const byId = user.id && student.id === user.id;
      const byEmail =
        user.email && student.email.toLowerCase() === user.email.toLowerCase();
      const byName =
        user.fullName && student.name.toLowerCase() === user.fullName.toLowerCase();
      return byId || byEmail || byName;
    });
  }, [students, user]);

  const averageProgress = useMemo(() => {
    if (students.length === 0) {
      return 0;
    }
    const total = students.reduce((sum, student) => sum + student.progress, 0);
    return Math.round(total / students.length);
  }, [students]);

  const enrolledClasses = studentRecord?.enrolledClasses.length ?? 0;
  const completedItems = studentRecord?.completedProjects ?? 0;
  const averageScorePercent = studentRecord?.progress ?? averageProgress;
  const streakDays =
    studentRecord?.progress !== undefined
      ? Math.max(1, Math.round(studentRecord.progress / 8))
      : 0;

  const currentProfile = isEditing ? formData : sourceProfile;
  const displayName =
    currentProfile.fullName ||
    user?.userName ||
    profileDictionary.fallbackUserName;
  const displayContact = currentProfile.email || user?.userName || "-";
  const initials = getInitials(displayName, isTeacher ? "T" : "S");
  const planName = dictionary.landing.pricing.plans[tier].name;
  const additionalBadges = isTeacher
    ? [profileDictionary.planBadge.replace("{plan}", planName)]
    : [
        profileDictionary.classesEnrolledBadge.replace(
          "{count}",
          String(enrolledClasses),
        ),
      ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalProfile(formData);
    notifySuccess(
      profileDictionary.profileUpdatedTitle,
      profileDictionary.profileUpdatedMessage,
    );
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(sourceProfile);
    setIsEditing(false);
  };

  const handleUploadPhoto = () => {
    notifyInfo(
      profileDictionary.photoUploadSoonTitle,
      profileDictionary.photoUploadSoonMessage,
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-app-text">{profileDictionary.title}</h1>
        <p className="mt-2 text-app-text-muted">{profileDictionary.description}</p>
      </div>

      <ProfileHeaderCard
        fullName={displayName}
        contact={displayContact}
        initials={initials}
        roleLabel={isTeacher ? profileDictionary.roleTeacher : profileDictionary.roleStudent}
        additionalBadges={additionalBadges}
        editLabel={profileDictionary.editProfile}
        isEditing={isEditing}
        onEdit={() => {
          setFormData(sourceProfile);
          setIsEditing(true);
        }}
        onUploadPhoto={handleUploadPhoto}
      />

      <ProfileFormCard
        dictionary={profileDictionary}
        isTeacher={isTeacher}
        isEditing={isEditing}
        formData={currentProfile}
        onChange={(patch) =>
          setFormData((previous) => ({
            ...previous,
            ...patch,
          }))
        }
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />

      <ProfileStatsCard
        dictionary={profileDictionary}
        isTeacher={isTeacher}
        values={{
          totalClasses: classes.length,
          totalStudents: students.length,
          totalAssignments: assignments.length,
          totalEvents: calendarEvents.length,
          enrolledClasses,
          completedItems,
          averageScorePercent,
          streakLabel: `${streakDays} ${profileDictionary.daysLabel}`,
        }}
      />
    </div>
  );
}
