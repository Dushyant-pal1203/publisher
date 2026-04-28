import { useState, useRef, useEffect } from "react";
import { Input } from "./input";
import React from "react";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  numInputs?: number;
  renderSeparator?: React.ReactNode;
  inputStyle?: string | React.CSSProperties;
  inputType?: "text" | "number" | "tel";
  isDisabled?: boolean;
  hasErrored?: boolean;
  shouldAutoFocus?: boolean;
  placeholder?: string;
}

export function OTPInput({
  value,
  onChange,
  numInputs = 6,
  renderSeparator,
  inputStyle,
  inputType = "number",
  isDisabled = false,
  placeholder = "",
}: OTPInputProps) {
  const [otpValues, setOtpValues] = useState<string[]>(
    Array(numInputs).fill(""),
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Sync external value with internal state
    const newValues = value.split("");
    setOtpValues(
      Array(numInputs)
        .fill("")
        .map((_, i) => newValues[i] || ""),
    );
  }, [value, numInputs]);

  const handleChange = (index: number, val: string) => {
    if (val.length > 1) return;

    const newValues = [...otpValues];
    newValues[index] = val;
    setOtpValues(newValues);

    // Update parent with full OTP
    const fullOtp = newValues.join("");
    onChange(fullOtp);

    // Auto-focus next input
    if (val && index < numInputs - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, numInputs);
    const pastedValues = pastedData.split("");

    const newValues = [...otpValues];
    for (let i = 0; i < numInputs && i < pastedValues.length; i++) {
      newValues[i] = pastedValues[i];
    }
    setOtpValues(newValues);
    onChange(newValues.join(""));

    // Focus last filled input
    const lastFilledIndex = Math.min(pastedValues.length - 1, numInputs - 1);
    if (lastFilledIndex >= 0) {
      inputRefs.current[lastFilledIndex]?.focus();
    }
  };

  const getInputClassName = () => {
    if (typeof inputStyle === "string") {
      return inputStyle;
    }
    return "w-10 h-10 text-center text-lg font-semibold rounded-sm border border-input bg-background";
  };

  return (
    <div
      className="flex gap-0 justify-center items-center"
      onPaste={handlePaste}
    >
      {otpValues.map((val, index) => (
        <React.Fragment key={index}>
          <Input
            ref={(el) => {
              if (el) inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={val}
            disabled={isDisabled}
            placeholder={placeholder}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={getInputClassName()}
            style={typeof inputStyle === "object" ? inputStyle : undefined}
          />
          {renderSeparator && index < numInputs - 1 && renderSeparator}
        </React.Fragment>
      ))}
    </div>
  );
}
