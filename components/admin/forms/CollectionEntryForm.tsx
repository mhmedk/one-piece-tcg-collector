"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  collectionEntrySchema,
  type CollectionEntryFormData,
} from "@/lib/schemas/admin/collection-entries";
import {
  createCollectionEntry,
  updateCollectionEntry,
} from "@/lib/admin/actions/collection-entries";
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
import { Textarea } from "@/components/ui/textarea";
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
import type { CollectionEntry } from "@/types/database";

interface CollectionEntryFormProps {
  entry?: CollectionEntry;
  onSuccess?: () => void;
}

export function CollectionEntryForm({ entry, onSuccess }: CollectionEntryFormProps) {
  const router = useRouter();
  const isEditing = !!entry;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const form = useForm<CollectionEntryFormData>({
    resolver: zodResolver(collectionEntrySchema),
    defaultValues: entry ?? {
      user_id: "",
      card_id: "",
      quantity: 1,
      condition: "Near Mint",
      purchase_price: null,
      notes: null,
    },
  });

  async function onSubmit(data: CollectionEntryFormData) {
    const result = isEditing
      ? await updateCollectionEntry(entry!.id, data)
      : await createCollectionEntry(data);

    if ("error" in result && result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Validation failed");
      return;
    }

    toast.success(isEditing ? "Entry updated" : "Entry created");
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/admin/collection-entries");
    }
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
        <FormField
          control={form.control}
          name="user_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User ID</FormLabel>
              <FormControl>
                <Input {...field} placeholder="UUID of the user" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="card_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Card ID</FormLabel>
              <FormControl>
                <Input {...field} placeholder="ST01-001" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="condition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condition</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Near Mint" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="purchase_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purchase Price</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
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
                {form.formState.isSubmitting ? "Saving..." : "Update Entry"}
              </Button>
              <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm update</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to update this collection entry?
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
              {form.formState.isSubmitting ? "Saving..." : "Create Entry"}
            </Button>
          )}
          {!onSuccess && (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/collection-entries")}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
