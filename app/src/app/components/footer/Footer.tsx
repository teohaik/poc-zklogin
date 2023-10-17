'use client';

import React from 'react';

import { name, version } from '../../../../package.json';

const buildCommit = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
const Footer = () => (
    <footer className="sticky bottom-0 w-full p-4">
        <hr/>
        {name!} - Ver: {version!} {buildCommit ? `- Build created from : ${buildCommit}` : null}
    </footer>
);

export default Footer;