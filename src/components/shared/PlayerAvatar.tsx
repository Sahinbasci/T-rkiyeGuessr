import { PLAYER_COLORS } from "@/constants/playerColors";

interface PlayerAvatarProps {
  name: string;
  colorIndex: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-7 h-7 sm:w-8 sm:h-8 text-[10px] sm:text-xs",
  md: "w-10 h-10 text-lg",
  lg: "w-9 h-9 sm:w-10 sm:h-10 text-base sm:text-lg",
};

export function PlayerAvatar({ name, colorIndex, size = "md", className = "" }: PlayerAvatarProps) {
  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold shadow-lg ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: PLAYER_COLORS[colorIndex] || PLAYER_COLORS[0] }}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}
