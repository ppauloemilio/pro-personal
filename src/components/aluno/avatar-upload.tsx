"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { updateAvatarAction } from "@/lib/actions";

export function StudentAvatarUpload({ currentAvatar }: { currentAvatar: string | null }) {
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={async (formData) => {
        await updateAvatarAction(formData);
        ref.current?.reset();
      }}
      className="flex items-center gap-4"
    >
      {currentAvatar ? (
        <img
          src={currentAvatar}
          alt="Avatar"
          className="h-16 w-16 rounded-full object-cover border-2 border-brand-500/40"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated border-2 border-surface-border text-2xl text-slate-500">
          👤
        </div>
      )}
      <div>
        <label htmlFor="student-avatar-input" className="cursor-pointer">
          <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("student-avatar-input")?.click()}>
            Alterar foto
          </Button>
        </label>
        <input
          id="student-avatar-input"
          name="avatar"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={() => ref.current?.requestSubmit()}
        />
      </div>
    </form>
  );
}
