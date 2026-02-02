import React from "react";

const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  options = [],
  className = "",
  placeholder = "",
  step,
}) => {
  return (
    <div className="flex flex-col">
      {label && (
        <label className="text-sm font-semibold text-gray-700 mb-1">
          {label}
        </label>
      )}

      {type === "select" ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full border px-4 py-3 rounded-md text-sm bg-white focus:outline-none shadow-sm ${
            error
              ? "border-red-500 focus:ring-red-300"
              : "border-gray-300 focus:ring-lime-400"
          } focus:ring-2 ${className}`}
        >
          <option value="">Select {label}</option>
          {options.map((option, index) => {
  const value = typeof option === "string" ? option : option.value;
  const label = typeof option === "string" ? option : option.label;
  return (
    <option key={value} value={value}>
      {label}
    </option>
  );
})}


        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          step={step}
          className={`w-full border px-4 py-3 rounded-md text-sm focus:outline-none shadow-sm ${
            error
              ? "border-red-500 focus:ring-red-300"
              : "border-gray-300 focus:ring-lime-400"
          } focus:ring-2 ${className}`}
        />
      )}

      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
};

export default InputField;
