"use client";

import * as React from "react";
// Remove radix-ui imports as they are no longer needed
import { Controller, ControllerProps, FieldPath, FieldValues, FormProvider, useFormContext, useForm, SubmitHandler } from "react-hook-form";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils/cn";
import { Label } from "@/components/ui/label";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/CheckBox";

// Form wrapper with validation support
interface FormWrapperProps<T extends FieldValues = FieldValues> {
  children: React.ReactNode;
  onSubmit: SubmitHandler<T>;
  initialValues?: Partial<T>;
  validationSchema?: Record<string, any>; // Simple validation schema
  className?: string;
}

const FormWrapper = <T extends FieldValues = FieldValues>({
  children,
  onSubmit,
  initialValues,
  validationSchema,
  className,
  ...props
}: FormWrapperProps<T>) => {
  const methods = useForm<T>({
    defaultValues: initialValues as any,
  });

  // Extract DOM-unsafe props  
  const { validationSchema: _, ...formProps } = props as any;

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className={className} {...formProps}>
        {children}
      </form>
    </FormProvider>
  );
};

// For backward compatibility, let Form be the wrapper by default
const Form = FormWrapper;

type FormFieldContextValue<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormField = <TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();
  const t = useTranslations();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error(t("form.validation.mustBeUsedWithinForm"));
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

type FormItemContextValue = {
  id: string;
};

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => {
    const { error, formItemId } = useFormField();

    return <Label ref={ref} className={cn(error && "text-destructive", className)} htmlFor={formItemId} {...props} />;
  }
);
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <div
      ref={ref}
      id={formItemId}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return <p ref={ref} id={formDescriptionId} className={cn("text-sm text-muted-foreground", className)} {...props} />;
});
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p ref={ref} id={formMessageId} className={cn("text-sm font-medium text-destructive", className)} {...props}>
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

// Additional form components for compatibility
const FormInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input> & { name: string }
>(({ name, ...props }, ref) => (
  <FormField
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormControl>
          <Input {...field} {...props} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
));
FormInput.displayName = "FormInput";

const FormCheckbox = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Checkbox> & { name: string }
>(({ name, ...props }, ref) => (
  <FormField
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormControl>
          <Checkbox 
            ref={ref} 
            checked={field.value}
            onChange={(e) => field.onChange(e.target.checked)}
            {...props}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
));
FormCheckbox.displayName = "FormCheckbox";

const FormActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex gap-2 justify-end", className)} {...props} />
));
FormActions.displayName = "FormActions";

const FormSubmitButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button> & { loading?: boolean }
>(({ children, loading, ...props }, ref) => (
  <Button ref={ref} type="submit" disabled={loading} {...props}>
    {children}
  </Button>
));
FormSubmitButton.displayName = "FormSubmitButton";

export { 
  useFormField, 
  Form, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormMessage,
  FormInput,
  FormCheckbox,
  FormActions,
  FormSubmitButton
};
