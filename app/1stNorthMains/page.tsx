import BackButton from '../../components/BackButton';
import type { NextPage } from 'next';

const FirstNorthMainsPage: NextPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Banner for Back Button and Title in a Row */}
      <div className="bg-white p-4 shadow-md">
        <div className="flex flex-row items-center space-x-4">
          <BackButton />
          <h1 className="text-3xl font-bold">1stNorthMains</h1>
        </div>
      </div>
      {/* Content Area with Background Image */}
      <div className="flex-1 flex items-center justify-center p-4"> {/* Added p-4 for outer margin */}
        <div className="w-[99%] h-[80%] min-h-[400px] border-2 border-gray-300 rounded-lg bg-[url('/img/1stNorthMains.png')] bg-cover bg-center">
          {/* Optional inner content div if needed */}
        </div>
      </div>
    </div>
  );
};

export default FirstNorthMainsPage;