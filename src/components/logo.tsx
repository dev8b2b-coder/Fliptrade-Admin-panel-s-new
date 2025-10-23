import logoImage from "figma:asset/d1700e4e269eeeb8238cc382474fe88528226c25.png";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className = "", width = 160, height = 40 }: LogoProps) {
  return (
    <img 
      src={logoImage} 
      alt="FlipTrade Group" 
      className={`object-contain ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}