"use client";

export const Navbar = () => {
  return (
    <div className="grid grid-cols-12 w-full items-center p-[8px] h-[80px] border-b-gray-400 border-b-[1px] sticky top-0">
      <div className="col-span-3 flex space-x-3 items-center">
        <div className="text-xl font-bold">ZK Login Demo</div>
      </div>

      {/*<div className="col-span-3 flex justify-end">*/}
      {/*  <ConnectButton />*/}
      {/*</div>*/}
    </div>
  );
};
