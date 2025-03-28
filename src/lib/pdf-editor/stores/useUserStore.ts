import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

export type UserType = "creator" | "signer"

interface UserState {
  userType: UserType
  setUserType: (type: UserType) => void
  toggleUserType: () => void
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        userType: "creator",

        setUserType: (type) => set({ userType: type }),

        toggleUserType: () =>
          set((state) => ({
            userType: state.userType === "creator" ? "signer" : "creator",
          })),
      }),
      {
        name: "user-storage",
      },
    ),
    { name: "user-store" },
  ),
)

