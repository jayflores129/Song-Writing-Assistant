"use client";

import { CircleUser } from "lucide-react";
import Image from "next/image";

export default function MainLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="flex bg-pink-50/50">
      <div className="w-[var(--sidebar-width)] h-screen bg-white">
        <div className="h-[var(--header-height)] w-full flex items-center justify-center">
          <Image src="/logo.svg" height={80} width={100} alt="Logo" />
        </div>

        <p className="font-bold text-center text-indigo-900">My Songs</p>
      </div>
      <div className="w-[calc(100%-var(--sidebar-width))]">
        <div className="h-[var(--header-height)] bg-indigo-900 w-full ps-3 pe-5">
          <ul className="flex items-center gap-3">
            <li>
              <a href="#" className="px-2 font-medium text-white">
                Home
              </a>
            </li>
            <li>
              <a href="#" className="px-2 font-medium text-white">
                Compose
              </a>
            </li>
            <li>
              <a href="#" className="px-2 font-medium text-white">
                Generate Chords
              </a>
            </li>
            <li className="ms-auto">
              <a href="#" className="px-2 text-white">
                What's New
              </a>
            </li>
            <li>
              <a href="#" className="px-2 text-white">
                Contact Us
              </a>
            </li>
            <li>
              <a href="#" className="px-2 text-white">
                How To
              </a>
            </li>
            <li>
              <a href="#" className="px-2 text-white">
                <CircleUser />
              </a>
            </li>
          </ul>
        </div>

        <main className="h-[calc(100vh-var(--header-height))]">{children}</main>
      </div>
    </div>
  );
}
