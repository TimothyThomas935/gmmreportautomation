import BackButton from '../../components/BackButton';
import type { NextPage } from 'next';

const EastMainsWestMainWestMainsAPage: NextPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Banner for Back Button and Title in a Row */}
      <div className="bg-white p-4 shadow-md">
        <div className="flex flex-row items-center space-x-4">
          <BackButton />
          <h1 className="text-3xl font-bold">EastMainsWestMainWestMainsA</h1>
        </div>
      </div>
      {/* Content Area with Background Image */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-[99%] h-[90%] min-h-[400px] border-2 border-gray-300 rounded-lg bg-[url('/img/EastMainsWestMainWestMainsA.png')] bg-contain bg-no-repeat bg-center">
          {/* Optional inner content */}
        </div>
      </div>
    </div>
  );
};

export default EastMainsWestMainWestMainsAPage;
