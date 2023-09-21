"use client";

import { useContext } from 'react';
import { AuthenticationContext } from '../contexts/Authentication/AuthenticationContext';

export const useAuthentication = () => {
    const context = useContext(AuthenticationContext);
    return context;
};
