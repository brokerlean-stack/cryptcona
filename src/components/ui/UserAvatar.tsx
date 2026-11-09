"use client";
import { useState } from "react";
export default function UserAvatar({ name, photo, alt = "Profile photo" }: {
  name?: string | null; photo?: string | null; alt?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  return photo && photo !== failed
    ? <img src={photo} alt={alt} className="w-full h-full object-cover rounded-[inherit]" onError={() => setFailed(photo)} />
    : <span aria-hidden="true">{name?.trim().charAt(0).toUpperCase() || "U"}</span>;
}
