"use client";

import React from 'react';
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {

  const { address: connectedAddress } = useAccount();

  return (
    <>
      <div
        className="hero min-h-screen"
        style={{
          backgroundImage: "url(https://insidestory.org.au/wp-content/uploads/booth.jpg)",
        }}>
        <div className="hero-overlay bg-opacity-60"></div>
        <div className="hero-content text-accent-content text-center">
          <div className="max-w-md text-accent" >
            <h1 className="mb-5 text-5xl font-bold text-primary">Super Secret Ballot</h1>
            <span></span>
            <span></span>

            <h2 className="mb-5 text-2xl text-accent" >I like my voting as i like my private keys...</h2><b className="mb-5 text-2xl text-accent"> Just to myself</b>
            <div></div>
            <h3 text-4xl my-0>
            </h3>
            <div></div>
            <Link href="/join" className="btn glass btn-lg btn-wide">Vote Privately</Link>
          </div>
        </div>
      </div>

    </>
  );
};

export default Home;
