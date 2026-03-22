import {Eye, EyeOff} from "lucide-react";
import React, {forwardRef, useState} from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  togglePassword?: boolean;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      icon,
      togglePassword,
      type = "text",
      className = "",
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputType =
      togglePassword && type === "password"
        ? showPassword
          ? "text"
          : "password"
        : type;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-700">{label}</label>
        )}
        <div className="relative flex-col items-center">
          {icon && (
            <div className="absolute left-3 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm shadow-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 
          ${icon ? "pl-10" : ""}
          ${togglePassword ? "pr-10" : ""}
          ${error ? "border-red-500 focus:ring-red-500" : "border-gray-200"}
          ${className}
          `}
            {...props}
          />

          {togglePassword && type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
