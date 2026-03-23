/* eslint-disable @typescript-eslint/no-explicit-any */
import {zodResolver} from "@hookform/resolvers/zod";
import {useEffect} from "react";
import {DefaultValues, useForm} from "react-hook-form";
import {z} from "zod";
import Modal from "./modal";
import Input from "./input";
import Button from "./button";

export interface FormFieldConfig {
  name: string;
  label: string;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute | "checkbox-group" | "select";
  options?: {label: string; value: string}[];
}

interface GenericFormModalProps<T extends z.ZodType<any, any, any>> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  schema: T;
  fields: FormFieldConfig[];
  defaultValues: DefaultValues<z.infer<T>>;
  onSubmit: (data: z.infer<T>) => void;
  isLoading?: boolean;
  submitText?: string;
}

export default function GenericFormModal<T extends z.ZodType<any, any, any>>({
  isOpen,
  onClose,
  title,
  description,
  schema,
  fields,
  defaultValues,
  onSubmit,
  isLoading = false,
  submitText = "save",
}: GenericFormModalProps<T>) {
  type FormData = z.infer<T>;

  const {
    register,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues);
    }
  }, [isOpen, defaultValues, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      description={description}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {fields.map((field) => (
          <div key={field.name} className="space-y-1.5">
            <label
              htmlFor={field.name}
              className="text-sm font-medium text-gray-700"
            >
              {field.label}
            </label>
            {field.type === "checkbox-group" && field.options ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 p-3 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                {field.options.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      value={opt.value}
                      {...register(field.name as any)}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-600">{opt.label}</span>
                  </label>
                ))}
              </div>
            ) : field.type === "select" && field.options ? (
              <select
                id={field.name}
                {...register(field.name as any)}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Choose a role...</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={field.name}
                type={field.type || "text"}
                placeholder={field.placeholder}
                {...register(field.name as any)}
                error={
                  (errors[field.name as keyof FormData]?.message as string) ||
                  undefined
                }
                className="w-full"
              />
            )}

            {field.type === "checkbox-group" ||
              (field.type === "select" &&
                errors[field.name as keyof FormData] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[field.name as keyof FormData]?.message as string}
                  </p>
                ))}
          </div>
        ))}

        <div className="pt-4 flex gap-3">
          <Button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            variant="danger"
            className="w-full py-2.5 text-gray-700 font-medium rounded-lg"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            variant="primary"
            className="w-full py-2.5 text-white font-medium rounded-lg flex justify-center items-center"
          >
            {isLoading ? "Saving..." : submitText}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
