declare module "otp-input-react" {
  import { ComponentType } from "react";

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
    isInputNum?: boolean;
    placeholder?: string;
    separator?: React.ReactNode;
    containerStyle?: string | React.CSSProperties;
    focusStyle?: string | React.CSSProperties;
    disabledStyle?: string | React.CSSProperties;
    errorStyle?: string | React.CSSProperties;
  }

  const OTPInput: ComponentType<OTPInputProps>;
  export default OTPInput;
}
