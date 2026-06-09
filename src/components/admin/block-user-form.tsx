"use client";

import { blockUserFormAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";

export function BlockUserForm({ userId }: { userId: string }) {
  return (
    <form action={blockUserFormAction}>
      <input type="hidden" name="userId" value={userId} />
      <Button type="submit" size="sm" variant="danger">
        Bloquear
      </Button>
    </form>
  );
}
