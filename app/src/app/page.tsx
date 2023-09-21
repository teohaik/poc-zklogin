"use client";

import { USER_ROLES } from "./constants/USER_ROLES";
import { useAuthentication } from "./hooks/useAuthentication";

export default function Home() {
  const { handleLoginAs } = useAuthentication();

  return (
    <div className="space-y-5">
      <h3 className="text-center">This is the home page</h3>
      <h3 className="text-center">Login as</h3>
      <div className="flex justify-center items-center space-x-2">
        {Object.values(USER_ROLES)
          .filter((role) => role !== "anonymous")
          .map((role) => (
            <button
              key={role}
              onClick={() => handleLoginAs(role)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              {role.slice(0, 1).toUpperCase().concat(role.slice(1))}
            </button>
          ))}
      </div>
    </div>
  );
}
