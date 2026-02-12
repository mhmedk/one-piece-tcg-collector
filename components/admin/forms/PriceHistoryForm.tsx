"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  priceHistorySchema,
  type PriceHistoryFormData,
} from "@/lib/schemas/admin/price-history";
import {
  createPriceHistory,
  updatePriceHistory,
} from "@/lib/admin/actions/price-history";
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
import type { PriceHistory } from "@/types/database";

interface PriceHistoryFormProps {
  entry?: PriceHistory;
  onSuccess?: () => void;
}

export function PriceHistoryForm({ entry, onSuccess }: PriceHistoryFormProps) {
  const router = useRouter();
  const isEditing = !!entry;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const form = useForm<PriceHistoryFormData>({
    resolver: zodResolver(priceHistorySchema),
    defaultValues: entry
      ? {
          card_id: entry.card_id,
          market_price: entry.market_price,
          recorded_at: entry.recorded_at.slice(0, 16),
        }
      : {
          card_id: "",
          market_price: null,
          recorded_at: new Date().toISOString().slice(0, 16),
        },
  });

  async function onSubmit(data: PriceHistoryFormData) {
    const result = isEditing
      ? await updatePriceHistory(entry!.id, data)
      : await createPriceHistory(data);

    if ("error" in result && result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Validation failed");
      return;
    }

    toast.success(isEditing ? "Price entry updated" : "Price entry created");
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/admin/price-history");
    }
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
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

        <FormField
          control={form.control}
          name="market_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Market Price</FormLabel>
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
          name="recorded_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recorded At</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
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
                      Are you sure you want to update this price entry?
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
              onClick={() => router.push("/admin/price-history")}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
