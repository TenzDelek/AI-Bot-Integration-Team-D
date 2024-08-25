import Image from "next/image";
import emo1 from "../../public/emoji1.jpg";
import emo2 from "../../public/emoji2.jpg";
import { GoArrowUpRight } from "react-icons/go";
import Link from "next/link";

export default function Home() {
  const data = [
    {
      name: "Tenzin Delek",
      profile: emo1,
    },
    {
      name: "Tommy Chen",
      profile: emo2,
    },
  ];
  return (
    <main className="flex  flex-col  p-10 md:p-24">
      <div className="relative z-[40]  flex place-items-center  before:absolute before:h-[300px] before:w-full before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-green-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#01c321] after:dark:opacity-40 sm:before:w-[480px] sm:after:w-[240px] before:lg:h-[360px]" />

      <p className=" z-50 text-xs mb-2 flex gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
        </span>
        Gdrive | Nucleo
      </p>
      <h3 className=" z-50 text-3xl">RAG Implementation with Gdrive</h3>
      <div className="flex z-50 items-center mt-3 gap-x-7">
        <p className="flex items-center gap-2">
          Nucleo Research{" "}
          {/* <Image
          src={image}
          placeholder="blur"
          alt="logo"
          width={30}
          height={30}
        /> */}
        </p>
        <Link href="/chat">
          <div className="group border flex items-center gap-2  text-black rounded-md px-4 py-2 text-xs bg-white">
            Chat
            <span className=" relative overflow-hidden h-fit w-fit">
              <GoArrowUpRight className="group-hover:-translate-y-5 group-hover:translate-x-5 duration-500 transition-transform ease-in-out-circ fill-light-gray stroke-[0.2]" />
              <GoArrowUpRight className="absolute top-0 group-hover:translate-x-0 duration-500 group-hover:translate-y-0 transition-all ease-in-out-circ translate-y-5 -translate-x-5 fill-light-gray stroke-[0.2]" />
            </span>
          </div>
        </Link>
      </div>

      <div className=" z-50 flex space-x-4 mt-4">
        {data.map((data, index) => (
          <p className="flex text-xs items-center gap-2 " key={index}>
            <Image
              src={data.profile}
              className=" rounded-full"
              placeholder="blur"
              alt="logo"
              width={30}
              height={30}
            />
            {data.name}
          </p>
        ))}
      </div>
    </main>
  );
}
