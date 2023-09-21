import { createContext } from "react";
import { AuthenticationContextProps, UserProps } from "../../types/Authentication";

export const anonymousUser: UserProps = {
  id: "",
  firstName: "",
  lastName: "",
  role: "anonymous",
  email: "",
};

export const AuthenticationContext = createContext<AuthenticationContextProps>({
  user: anonymousUser,
  isLoading: false,
  handleLoginAs: () => {},
  handleLogout: () => {},
});
