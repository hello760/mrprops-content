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
    // 2026-04-29: default to full-width with primary accent — the previous default
    // shrank to native widget width (~140px) which looked broken at edge of card.
    className={`w-full h-2 cursor-pointer accent-primary ${className ?? ""}`}
  />
));
Slider.displayName = "Slider";

export { Slider };
