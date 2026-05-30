"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { FormFieldWrapper } from "@/components/ui/form-field-wrapper";
import { ScrollArea } from "@/components/ui/scroll-area";

const applicationFormSchema = z.object({
  approach: z
    .string()
    .trim()
    .min(10, "Approach must be at least 10 characters"),
  estimatedTimeline: z.string().trim().min(2, "Estimated timeline is required"),
  relevantExperience: z
    .string()
    .trim()
    .min(10, "Relevant experience must be at least 10 characters"),
  portfolioUrl: z
    .string()
    .trim()
    .refine(
      (value) =>
        value.length === 0 ||
        (z.string().url().safeParse(value).success &&
          (value.startsWith("http://") || value.startsWith("https://"))),
      "Please enter a valid HTTP or HTTPS URL",
    ),
});

export type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

interface ApplicationDialogProps {
  bountyTitle: string;
  onApply: (data: ApplicationFormValues) => Promise<void>;
  trigger: ReactNode;
}

export function ApplicationDialog({
  bountyTitle,
  onApply,
  trigger,
}: ApplicationDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      approach: "",
      estimatedTimeline: "",
      relevantExperience: "",
      portfolioUrl: "",
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset();
      setIsPreview(false);
    }
  };

  const handleSubmit = async (values: ApplicationFormValues) => {
    if (!isPreview) {
      setIsPreview(true);
      return;
    }

    form.clearErrors("root");
    setLoading(true);

    try {
      await onApply(values);
      setOpen(false);
      form.reset();
      setIsPreview(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      form.setError("root", {
        message: `Failed to submit application: ${errorMessage}`,
      });
      setIsPreview(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        data-testid="application-dialog"
        className="sm:max-w-[600px] bg-background text-foreground border-border max-h-[90vh] flex flex-col"
      >
        <DialogHeader>
          <DialogTitle>Apply for Bounty</DialogTitle>
          <DialogDescription>
            {isPreview
              ? "Review your application before submitting."
              : `Submit your application for "${bountyTitle}".`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
            noValidate
          >
            <ScrollArea className="flex-1 pr-4">
              <div className="grid gap-4 py-4">
                {isPreview ? (
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-gray-300">Approach</h4>
                      <p className="whitespace-pre-wrap mt-1 text-gray-400">
                        {form.getValues().approach}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-300">
                        Estimated Timeline
                      </h4>
                      <p className="mt-1 text-gray-400">
                        {form.getValues().estimatedTimeline}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-300">
                        Relevant Experience
                      </h4>
                      <p className="whitespace-pre-wrap mt-1 text-gray-400">
                        {form.getValues().relevantExperience}
                      </p>
                    </div>
                    {form.getValues().portfolioUrl && (
                      <div>
                        <h4 className="font-semibold text-gray-300">
                          Portfolio URL
                        </h4>
                        <a
                          href={form.getValues().portfolioUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 text-primary hover:underline"
                        >
                          {form.getValues().portfolioUrl}
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <FormFieldWrapper
                      control={form.control}
                      name="approach"
                      label="Approach"
                      description="Explain how you plan to tackle this bounty."
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          data-testid="approach-input"
                          placeholder="Your approach..."
                          className="min-h-[100px]"
                        />
                      )}
                    />

                    <FormFieldWrapper
                      control={form.control}
                      name="estimatedTimeline"
                      label="Estimated Timeline"
                      description="How long do you estimate it will take?"
                      render={({ field }) => (
                        <Input
                          {...field}
                          data-testid="timeline-input"
                          placeholder="e.g., 2 weeks"
                        />
                      )}
                    />

                    <FormFieldWrapper
                      control={form.control}
                      name="relevantExperience"
                      label="Relevant Experience"
                      description="Highlight past work that makes you a good fit."
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          data-testid="experience-input"
                          placeholder="Your relevant experience..."
                          className="min-h-[100px]"
                        />
                      )}
                    />

                    <FormFieldWrapper
                      control={form.control}
                      name="portfolioUrl"
                      label="Portfolio URL (Optional)"
                      description="Include a project, profile, or repository link."
                      render={({ field }) => (
                        <Input
                          {...field}
                          data-testid="portfolio-url-input"
                          placeholder="https://..."
                          value={field.value ?? ""}
                        />
                      )}
                    />
                  </>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="mt-4 pt-4 border-t border-border">
              {form.formState.errors.root?.message ? (
                <p
                  data-testid="application-error"
                  className="text-destructive mr-auto text-sm self-center"
                >
                  {form.formState.errors.root.message}
                </p>
              ) : null}

              {isPreview ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsPreview(false)}
                >
                  Back to Edit
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  data-testid="application-cancel-btn"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                data-testid={
                  isPreview
                    ? "submit-application-btn"
                    : "preview-application-btn"
                }
                disabled={loading}
              >
                {loading
                  ? "Submitting..."
                  : isPreview
                    ? "Submit Application"
                    : "Review Application"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
