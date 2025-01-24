"use client";

import { createContext, useEffect, useContext, useState } from "react";

import { generateUUID } from "@/lib/utils/uuid";

const UserContext = createContext<string>("");

const getUserId = () => {
  const key = "user_id";
  const existingId = localStorage.getItem(key);

  if (existingId) return existingId;

  const newId = generateUUID();
  localStorage.setItem(key, newId);
  return newId;
};

export const useUserId = () => useContext(UserContext);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  return <UserContext.Provider value={userId}>{children}</UserContext.Provider>;
}
