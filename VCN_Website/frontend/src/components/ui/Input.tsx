import { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ label, id, className = "", ...props }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-vcn-heading" htmlFor={inputId}>
      {label}
      <input id={inputId} {...props} className={`ds-input ${className}`} />
    </label>
  );
}
