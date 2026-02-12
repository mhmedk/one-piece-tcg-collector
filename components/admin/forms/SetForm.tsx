"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { setSchema, type SetFormData } from "@/lib/schemas/admin/sets";
import { createSet, updateSet } from "@/lib/admin/actions/sets";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Set } from "@/types/database";

interface SetFormProps {
  set?: Set;
  onSuccess?: () => void;
}

export function SetForm({ set, onSuccess }: SetFormProps) {
  const router = useRouter();
  const isEditing = !!set;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const form = useForm<SetFormData>({
    resolver: zodResolver(setSchema),
    defaultValues: set ?? {
      id: "",
      label: "",
      name: "",
      prefix: "",
      raw_title: "",
    },
  });

  async function onSubmit(data: SetFormData) {
    const result = isEditing
      ? await updateSet(set!.id, data)
      : await createSet(data);

    if ("error" in result && result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Validation failed");
      return;
    }

    toast.success(isEditing ? "Set updated" : "Set created");
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/admin/sets");
    }
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID</FormLabel>
              <FormControl>
                <Input {...field} disabled={isEditing} placeholder="569001" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  placeholder="OP-01"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Romance Dawn" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="prefix"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prefix</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  placeholder="BOOSTER PACK"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="raw_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Raw Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                type="button"
                disabled={form.formState.isSubmitting || !form.formState.isDirty}
                onClick={() => setConfirmOpen(true)}
              >
                {form.formState.isSubmitting ? "Saving..." : "Update Set"}
              </Button>
              <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm update</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to update this set?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={form.handleSubmit(onSubmit)}>
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Create Set"}
            </Button>
          )}
          {!onSuccess && (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/sets")}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
