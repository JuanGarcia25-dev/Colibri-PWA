import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function Input({ label, type, name, placeholder, defaultValue, register, rules = {}, error, options = [], disabled, readOnly, prefix, min, max }) {
  const isNumber = type === "number";
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);

  const handleNumberInput = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (typeof max === "number" && value !== "") {
      value = Math.min(Number(value), max).toString();
    } else if (value.length > 10) {
      value = value.slice(0, 10);
    }
    e.target.value = value;
  };

  const handleNumberKeyDown = (e) => {
    if (["e", "E", "+", "-", "."].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="my-2">
      <h1 className="font-semibold">{label}</h1>
      {type === "select" ? (
        <select
          {...register(name, rules)}
          defaultValue={defaultValue}
          className="w-full inline-block bg-zinc-100 px-4 py-3 rounded-lg outline-none text-sm my-1"
          disabled={disabled}
        >
          <option value="">Selecciona...</option>
          {options.map((option, index) => {
            if (typeof option === "string") {
              return (
                <option key={index} value={option.toLowerCase()}>
                  {option}
                </option>
              );
            }
            return (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            );
          })}
        </select>
      ) : (
        <div className="flex items-stretch my-1">
          {prefix && (
            <div className="flex items-center px-3 bg-zinc-100 border-r border-zinc-200 rounded-l-lg text-sm text-zinc-600">
              {prefix}
            </div>
          )}
          <input
            {...register(name, rules)}
            type={isPassword ? (showPassword ? "text" : "password") : (type || "text")}
            placeholder={placeholder || label}
            className={`w-full bg-zinc-100 px-4 py-3 outline-none text-sm 
              ${disabled ? "cursor-not-allowed select-none text-zinc-400" : ""} 
              ${prefix ? "rounded-r-lg" : ""} 
              ${isPassword ? "rounded-l-lg" : !prefix ? "rounded-lg" : ""}`}
            disabled={disabled}
            readOnly={readOnly}
            defaultValue={defaultValue}
            inputMode={isNumber ? "numeric" : undefined}
            pattern={isNumber ? "[0-9]*" : undefined}
            min={isNumber ? (typeof min === "number" ? min : 0) : undefined}
            max={isNumber && typeof max === "number" ? max : undefined}
            step={isNumber ? 1 : undefined}
            onKeyDown={isNumber ? handleNumberKeyDown : undefined}
            onInput={isNumber ? handleNumberInput : undefined}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex items-center px-3 bg-zinc-100 rounded-r-lg text-zinc-400 hover:text-zinc-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error.message}</p>}
    </div>
  );
}

export default Input;