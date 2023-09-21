import React from "react";
import { NavigationLink } from "../types/NavigationLink";
import { useAuthentication } from "./useAuthentication";
import { USER_ROLES } from "../constants/USER_ROLES";

const globalNavigations: NavigationLink[] = [
  {
    title: "About",
    href: "/about",
  },
  {
    title: "API Health Check",
    href: "/api/health",
  },
  {
    title: "API Visits",
    href: "/api/visits",
  },
];

export const useGetNavigations = () => {
  const { user } = useAuthentication();
  const navigations = React.useMemo<NavigationLink[]>(() => {
    let userNavigations: NavigationLink[] = [];
    const userRoleName =
      user.role.slice(0, 1).toUpperCase() + user.role.slice(1);
    if (user.role === USER_ROLES.ROLE_4) {
      userNavigations = [
        {
          title: "Home",
          href: "/",
        },
      ];
    } else if (user.role === USER_ROLES.ROLE_3) {
      userNavigations = [
        {
          title: "Home",
          href: `/${USER_ROLES.ROLE_3}`,
        },
        {
          title: "Account",
          href: "/account",
        },
        {
          title: `${userRoleName} test page`,
          href: `/${USER_ROLES.ROLE_3}/test`,
        },
      ];
    } else if (user.role === USER_ROLES.ROLE_2) {
      userNavigations = [
        {
          title: "Home",
          href: `/${USER_ROLES.ROLE_2}`,
        },
        {
          title: "Account",
          href: "/account",
        },
        {
          title: `${userRoleName} Test Page`,
          href: `/${USER_ROLES.ROLE_2}/test`,
        },
      ];
    } else if (user.role === USER_ROLES.ROLE_1) {
      userNavigations = [
        {
          title: "Home",
          href: `/${USER_ROLES.ROLE_1}`,
        },
        {
          title: "Account",
          href: "/account",
        },
        {
          title: `${userRoleName} Test Page`,
          href: `/${USER_ROLES.ROLE_1}/test`,
        },
      ];
    }
    return [...userNavigations, ...globalNavigations];
  }, [user.role]);

  return { navigations };
};
