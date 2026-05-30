import React, { memo } from "react";

interface AvatarDisplayProps {
  avatar: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const AvatarDisplay = memo(function AvatarDisplay({ avatar, size = "md", className = "" }: AvatarDisplayProps) {
  const isCustomPhoto = avatar?.startsWith("data:") || avatar?.startsWith("http");

  let sizeClasses = "w-8 h-8 text-base";
  if (size === "sm") sizeClasses = "w-6 h-6 text-sm";
  if (size === "lg") sizeClasses = "w-12 h-12 text-2xl";
  if (size === "xl") sizeClasses = "w-20 h-20 text-3xl";

  return (
    <div className={`flex items-center justify-center shrink-0 overflow-hidden no-invert select-none ${sizeClasses} ${className}`}>
      {isCustomPhoto ? (
        <img src={avatar} alt="Avatar" className="w-full h-full object-cover no-invert" />
      ) : (
        <span className="no-invert">{avatar}</span>
      )}
    </div>
  );
});
