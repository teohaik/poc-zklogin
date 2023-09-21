import { ReactElement, useEffect, useState } from "react";
import { UserProps, UserRole } from "../../types/Authentication";
import { AuthenticationContext, anonymousUser } from "./AuthenticationContext";
import { useRouter } from "next/navigation";

interface AuthenticationProviderProps {
  children: ReactElement | ReactElement[];
}

export const AuthenticationProvider = ({
  children,
}: AuthenticationProviderProps) => {
  const router = useRouter();

  const [user, setUser] = useState<UserProps>(anonymousUser);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initialUser = localStorage.getItem("user");
    if (initialUser) {
      setUser(JSON.parse(initialUser));
    } else {
      setUser(anonymousUser);
    }
    setIsLoading(false);
  }, []);

  const handleLoginAs = (role: UserRole) => {
    const newUser = {
      id: "123",
      firstName: "John",
      lastName: "Doe",
      role,
      email: `john.${role}@gmail.com`,
    };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
    router.push(`/${role}`);
  };

  const handleLogout = () => {
    setUser(anonymousUser);
    localStorage.setItem("user", JSON.stringify(anonymousUser));
    router.push("/");
  };

  return (
    <AuthenticationContext.Provider
      value={{ user, isLoading, handleLoginAs, handleLogout }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
};
