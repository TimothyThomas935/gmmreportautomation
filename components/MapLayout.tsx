"use client";

import Image from "next/image";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  imageSrc?: string;
};

const MapLayout = ({ children, imageSrc = "/img/MineMap.jpg" }: Props) => {
  return (
    <div className="relative w-screen max-w-screen overflow-x-hidden">
      <Image
        src={imageSrc}
        alt="Mine Map"
        width={1200}
        height={800}
        className="w-full h-auto"
        priority
      />
      <div className="absolute inset-0 z-10">{children}</div>
    </div>
  );
};

export default MapLayout;
