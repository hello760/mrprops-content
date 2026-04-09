import * as React from "react";

type SliderProps = {
  value?: number[];
  onValueChange?: (vals: number[]) => void;
  max?: number;
  min?: number;
  step?: number;
  className?: string;
};

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(({ value = [0], onValueChange, max = 100, min = 0, step = 1, className }, ref) => (
  <input
    ref={ref}
    type="range"
    min={min}
    max={max}
    step={step}
    value={value[0]}
    onChange={(e) => onValueChange?.([Number(e.target.value)])}
    className={className}
  />
));
Slider.displayName = "Slider";

export { Slider };
