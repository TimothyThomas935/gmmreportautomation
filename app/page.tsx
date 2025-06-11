import Image from 'next/image';
import type { NextPage } from 'next';
import Link from 'next/link';
import './globals.css';

const buttonPaddingClasses =
  'text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl ' +
  'px-1 sm:px-2 md:px-2 lg:px-2 xl:px-2 ' +
  'py-0.5 sm:py-1 md:py-1 lg:py-1 xl:py-1';
const Home: NextPage = () => {
  return (
    <div className="m-0 overflow-auto">
      <div className="image-container inline-block relative">
        <Image
          src="/img/MineMap.jpg"
          alt="Mine Map"
          className="block w-auto h-auto min-w-full min-h-full"
          width={1200} // Adjust to your image's actual width
          height={800} // Adjust to your image's actual height
        />
        <Link
          href="/1stNorthMains"
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-500 text-white rounded hover:bg-purple-600 ${buttonPaddingClasses}`}>
            1stNorthMains
        </Link>
        <Link
          href="/2ndRightPanel1" 
          className={`absolute top-1/4 right-3/16 bg-green-500 text-white rounded hover:bg-green-600 ${buttonPaddingClasses}`}>
          2ndRightPanel1
        </Link>
        <Link
          href="/5thWest"
          className={`absolute top-1/8 left-1/3 bg-red-500 text-white rounded hover:bg-red-600 ${buttonPaddingClasses}`}>
          5thWest
        </Link>
        <Link
          href="/EastMains"
          className={`absolute bottom-1/3 left-1/6 bg-yellow-500 text-white rounded hover:bg-yellow-600 ${buttonPaddingClasses}`}>
          EastMains
        </Link>
        <Link
          href="/SouthEastMains"
          className={`absolute bottom-1/16 left-1/4 bg-purple-500 text-white rounded hover:bg-purple-600 ${buttonPaddingClasses}`}>
          South East Mains
        </Link>
      </div>
    </div>
  );
};

export default Home;